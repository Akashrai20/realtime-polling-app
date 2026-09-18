package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"hcl-live-polling/backend/config"
	"hcl-live-polling/backend/models"
)

type CreatePollInput struct {
	Question            string   `json:"question" binding:"required,min=5"`
	Description         string   `json:"description"`
	Options             []string `json:"options" binding:"required,min=2"`
	DurationMinutes     int      `json:"duration_minutes"`
	RestrictFingerprint bool     `json:"restrict_fingerprint"`
	RestrictIP          bool     `json:"restrict_ip"`
}

// CreatePoll handles POST /api/polls (Protected)
func CreatePoll(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized access"})
		return
	}

	var req CreatePollInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: Question >= 5 chars, minimum 2 options required"})
		return
	}

	validOptions := make([]models.Option, 0)
	for i, opt := range req.Options {
		trimmed := strings.TrimSpace(opt)
		if trimmed != "" {
			validOptions = append(validOptions, models.Option{
				ID:    fmt.Sprintf("opt-%d", i+1),
				Text:  trimmed,
				Votes: 0,
			})
		}
	}

	if len(validOptions) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 non-empty options required"})
		return
	}

	duration := req.DurationMinutes
	if duration <= 0 {
		duration = 1440 // Default 24 hours
	}

	now := time.Now()
	expiresAt := now.Add(time.Duration(duration) * time.Minute)

	pollID := primitive.NewObjectID()
	poll := models.Poll{
		ID:                  pollID,
		CreatorID:           userID,
		Question:            strings.TrimSpace(req.Question),
		Description:         strings.TrimSpace(req.Description),
		Options:             validOptions,
		TotalVotes:          0,
		RestrictFingerprint: req.RestrictFingerprint,
		RestrictIP:          req.RestrictIP,
		ExpiresAt:           expiresAt,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database unavailable"})
		return
	}

	// Save to MongoDB
	_, err := config.DB.MongoDB.Collection("polls").InsertOne(ctx, poll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create poll in MongoDB: " + err.Error()})
		return
	}

	// Initialize Redis vote counters
	if config.DB.RedisClient != nil {
		redisPollKey := fmt.Sprintf("poll:%s:votes", pollID.Hex())
		pipe := config.DB.RedisClient.Pipeline()
		for _, opt := range validOptions {
			pipe.HSet(ctx, redisPollKey, opt.ID, 0)
		}
		pipe.Expire(ctx, redisPollKey, time.Until(expiresAt))
		_, _ = pipe.Exec(ctx)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Poll created successfully",
		"poll":    poll,
	})
}

// GetPoll handles GET /api/polls/:id (Public)
func GetPoll(c *gin.Context) {
	idStr := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Poll ID format"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database unavailable"})
		return
	}

	var poll models.Poll
	err = config.DB.MongoDB.Collection("polls").FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// Sync Redis live vote totals
	if config.DB.RedisClient != nil {
		redisPollKey := fmt.Sprintf("poll:%s:votes", poll.ID.Hex())
		redisVotes, err := config.DB.RedisClient.HGetAll(ctx, redisPollKey).Result()
		if err == nil && len(redisVotes) > 0 {
			var totalVotes int64 = 0
			for i, opt := range poll.Options {
				if countStr, exists := redisVotes[opt.ID]; exists {
					if count, parseErr := strconv.ParseInt(countStr, 10, 64); parseErr == nil {
						poll.Options[i].Votes = count
						totalVotes += count
					}
				} else {
					totalVotes += opt.Votes
				}
			}
			poll.TotalVotes = totalVotes
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"poll": poll,
	})
}

// ListPolls handles GET /api/polls (Public)
func ListPolls(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database unavailable"})
		return
	}

	pollsColl := config.DB.MongoDB.Collection("polls")
	cursor, err := pollsColl.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls: " + err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err = cursor.All(ctx, &polls); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode polls: " + err.Error()})
		return
	}

	if polls == nil {
		polls = make([]models.Poll, 0)
	}

	c.JSON(http.StatusOK, gin.H{
		"polls": polls,
		"total": len(polls),
	})
}
