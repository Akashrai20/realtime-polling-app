package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"hcl-live-polling/backend/config"
	"hcl-live-polling/backend/models"
	wsHub "hcl-live-polling/backend/websocket"
)

// CastVote handles POST /api/polls/:id/vote
func CastVote(c *gin.Context) {
	pollIDStr := c.Param("id")
	if pollIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID parameter is required"})
		return
	}

	objID, err := primitive.ObjectIDFromHex(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Poll ID format"})
		return
	}

	var req models.VotePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Validation failed: option_id and voter_fingerprint are required",
			"details": err.Error(),
		})
		return
	}

	clientIP := c.ClientIP()
	voterFingerprint := strings.TrimSpace(req.VoterFingerprint)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database service unavailable"})
		return
	}

	// 1. Fetch Poll Metadata from MongoDB to verify existence & expiry
	pollsColl := config.DB.MongoDB.Collection("polls")
	var poll models.Poll
	err = pollsColl.FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database lookup error: " + err.Error()})
		return
	}

	// Check if poll has expired
	if time.Now().After(poll.ExpiresAt) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Voting closed: This poll has expired"})
		return
	}

	// Verify target option exists in poll
	var validOption *models.Option
	for _, opt := range poll.Options {
		if opt.ID == req.OptionID {
			validOption = &opt
			break
		}
	}

	if validOption == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option_id specified for this poll"})
		return
	}

	// 2. Duplicate Vote Check via Redis SADD
	var newOptionVotes int64 = 0
	var newTotalVotes int64 = 0

	if config.DB.RedisClient != nil {
		redisClient := config.DB.RedisClient
		fpVotersKey := fmt.Sprintf("poll:%s:voters:fp", pollIDStr)
		ipVotersKey := fmt.Sprintf("poll:%s:voters:ip", pollIDStr)
		redisPollKey := fmt.Sprintf("poll:%s:votes", pollIDStr)

		// 2a. Check Fingerprint restriction if enabled
		if poll.RestrictFingerprint && voterFingerprint != "" {
			isMember, err := redisClient.SIsMember(ctx, fpVotersKey, voterFingerprint).Result()
			if err == nil && isMember {
				c.JSON(http.StatusConflict, gin.H{
					"error": "Duplicate Vote Blocked: This device/browser has already voted on this poll",
				})
				return
			}
		}

		// 2b. Check IP restriction if enabled
		if poll.RestrictIP && clientIP != "" {
			isMember, err := redisClient.SIsMember(ctx, ipVotersKey, clientIP).Result()
			if err == nil && isMember {
				c.JSON(http.StatusConflict, gin.H{
					"error": "Duplicate Vote Blocked: A vote has already been submitted from this IP / network",
				})
				return
			}
		}

		// Register voter in Redis Sets & set expiration to match poll duration
		ttl := time.Until(poll.ExpiresAt)
		if ttl <= 0 {
			ttl = 24 * time.Hour
		}

		if voterFingerprint != "" {
			redisClient.SAdd(ctx, fpVotersKey, voterFingerprint)
			redisClient.Expire(ctx, fpVotersKey, ttl)
		}
		if clientIP != "" {
			redisClient.SAdd(ctx, ipVotersKey, clientIP)
			redisClient.Expire(ctx, ipVotersKey, ttl)
		}

		// 3. Atomic Vote Count Increment via Redis HINCRBY
		newCount, err := redisClient.HIncrBy(ctx, redisPollKey, req.OptionID, 1).Result()
		if err == nil {
			newOptionVotes = newCount
		}

		// Calculate total votes across all options from Redis
		redisVotesMap, err := redisClient.HGetAll(ctx, redisPollKey).Result()
		if err == nil {
			for _, countStr := range redisVotesMap {
				if cnt, pErr := strconv.ParseInt(countStr, 10, 64); pErr == nil {
					newTotalVotes += cnt
				}
			}
		}
	} else {
		// Redis offline fallback
		newOptionVotes = validOption.Votes + 1
		newTotalVotes = poll.TotalVotes + 1
	}

	// Build updated poll options array for broadcast
	updatedOptions := make([]models.Option, len(poll.Options))
	for i, opt := range poll.Options {
		if opt.ID == req.OptionID {
			updatedOptions[i] = models.Option{
				ID:    opt.ID,
				Text:  opt.Text,
				Votes: newOptionVotes,
			}
		} else {
			updatedOptions[i] = opt
		}
	}

	updatedPoll := poll
	updatedPoll.Options = updatedOptions
	updatedPoll.TotalVotes = newTotalVotes
	updatedPoll.UpdatedAt = time.Now()

	// 4. Publish Real-Time Event to Redis Pub/Sub Channel 'poll:<id>'
	eventPayload := gin.H{
		"type":             "VOTE_UPDATE",
		"poll_id":          pollIDStr,
		"option_id":        req.OptionID,
		"new_option_votes": newOptionVotes,
		"total_votes":      newTotalVotes,
		"poll":             updatedPoll,
		"timestamp":        time.Now().Format(time.RFC3339),
	}

	if config.DB.RedisClient != nil {
		jsonBytes, err := json.Marshal(eventPayload)
		if err == nil {
			config.DB.RedisClient.Publish(context.Background(), "poll:"+pollIDStr, jsonBytes)
		}
	} else {
		// Broadcast directly through local WebSocket hub if Redis is offline
		jsonBytes, _ := json.Marshal(eventPayload)
		wsHub.GlobalHub.BroadcastToPoll(pollIDStr, jsonBytes)
	}

	// 5. Asynchronous Background Persistence to MongoDB
	go syncVoteToMongoDB(objID, req.OptionID, voterFingerprint, clientIP)

	c.JSON(http.StatusOK, gin.H{
		"message":          "Vote recorded successfully",
		"poll_id":          pollIDStr,
		"option_id":        req.OptionID,
		"new_option_votes": newOptionVotes,
		"total_votes":      newTotalVotes,
	})
}

// syncVoteToMongoDB asynchronously persists vote logs & increments Mongo counts in background
func syncVoteToMongoDB(pollID primitive.ObjectID, optionID, fingerprint, clientIP string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		return
	}

	mongoDB := config.DB.MongoDB

	// 1. Insert Vote Audit Record
	voteRecordsColl := mongoDB.Collection("vote_records")
	voteRecord := models.VoteRecord{
		PollID:           pollID.Hex(),
		OptionID:         optionID,
		VoterFingerprint: fingerprint,
		IPAddress:        clientIP,
		VotedAt:          time.Now(),
	}
	_, err := voteRecordsColl.InsertOne(ctx, voteRecord)
	if err != nil {
		log.Printf("[Async Mongo Sync Error] Failed to insert vote audit log: %v", err)
	}

	// 2. Increment Option Votes & Total Votes in MongoDB Poll Document
	pollsColl := mongoDB.Collection("polls")
	filter := bson.M{
		"_id":        pollID,
		"options.id": optionID,
	}
	update := bson.M{
		"$inc": bson.M{
			"options.$.votes": 1,
			"total_votes":     1,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	_, err = pollsColl.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("[Async Mongo Sync Error] Failed to increment MongoDB poll vote count: %v", err)
	}
}

// ServeWebSocket handles GET /api/polls/:id/ws
func ServeWebSocket(c *gin.Context) {
	pollIDStr := c.Param("id")
	if pollIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID parameter is required"})
		return
	}

	// Upgrade HTTP Connection to WebSocket
	conn, err := wsHub.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WebSocket Upgrade Error] Failed to upgrade HTTP connection: %v", err)
		return
	}

	// Register Connection with Global WebSocket Hub
	wsHub.GlobalHub.Register(pollIDStr, conn)

	// Ensure cleanup on disconnect
	defer func() {
		wsHub.GlobalHub.Unregister(pollIDStr, conn)
	}()

	// Keep-Alive & Read Pump
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket Error] Client read error: %v", err)
			}
			break
		}
	}
}
