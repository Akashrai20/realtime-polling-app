package websocket

import (
	"context"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"hcl-live-polling/backend/config"
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all CORS origins for WebSockets
	},
}

// Hub manages active WebSocket connections grouped by Poll ID
type Hub struct {
	mu             sync.RWMutex
	pollClients    map[string]map[*websocket.Conn]bool
	redisSubscriptions map[string]*redis.PubSub
}

var GlobalHub = NewHub()

func NewHub() *Hub {
	return &Hub{
		pollClients:        make(map[string]map[*websocket.Conn]bool),
		redisSubscriptions: make(map[string]*redis.PubSub),
	}
}

// Register adds a new client WebSocket connection to a Poll group
func (h *Hub) Register(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.pollClients[pollID] == nil {
		h.pollClients[pollID] = make(map[*websocket.Conn]bool)
		// Ensure Redis Pub/Sub subscription is running for this poll ID
		go h.ensureRedisSubscription(pollID)
	}

	h.pollClients[pollID][conn] = true
	log.Printf("[WebSocket Hub] Client connected to Poll [%s]. Total clients: %d", pollID, len(h.pollClients[pollID]))
}

// Unregister removes a client WebSocket connection from a Poll group
func (h *Hub) Unregister(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, exists := h.pollClients[pollID]; exists {
		if _, ok := clients[conn]; ok {
			delete(clients, conn)
			conn.Close()
			log.Printf("[WebSocket Hub] Client disconnected from Poll [%s]. Remaining clients: %d", pollID, len(clients))
		}

		// If no clients left for this poll, close Redis subscription
		if len(clients) == 0 {
			delete(h.pollClients, pollID)
			if pubsub, hasPubSub := h.redisSubscriptions[pollID]; hasPubSub {
				pubsub.Close()
				delete(h.redisSubscriptions, pollID)
				log.Printf("[WebSocket Hub] Closed Redis Pub/Sub subscription for empty Poll [%s]", pollID)
			}
		}
	}
}

// BroadcastToPoll sends a message to all active WebSocket clients subscribed to a Poll ID
func (h *Hub) BroadcastToPoll(pollID string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients, exists := h.pollClients[pollID]
	if !exists || len(clients) == 0 {
		return
	}

	for conn := range clients {
		go func(c *websocket.Conn) {
			c.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := c.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("[WebSocket Error] Failed to write message to client: %v", err)
				h.Unregister(pollID, c)
			}
		}(conn)
	}
}

// ensureRedisSubscription listens to Redis channel 'poll:<id>' and broadcasts payload to clients
func (h *Hub) ensureRedisSubscription(pollID string) {
	if config.DB == nil || config.DB.RedisClient == nil {
		log.Println("[WebSocket Warning] Redis client not connected, WebSocket running in standalone mode")
		return
	}

	redisClient := config.DB.RedisClient
	channelName := "poll:" + pollID

	ctx := context.Background()
	pubsub := redisClient.Subscribe(ctx, channelName)

	h.mu.Lock()
	h.redisSubscriptions[pollID] = pubsub
	h.mu.Unlock()

	log.Printf("[Redis Pub/Sub] Subscribed to channel [%s]", channelName)

	ch := pubsub.Channel()
	for msg := range ch {
		h.BroadcastToPoll(pollID, []byte(msg.Payload))
	}
}
