package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DatabaseContainer holds active database clients for MongoDB & Redis
type DatabaseContainer struct {
	MongoClient *mongo.Client
	MongoDB     *mongo.Database
	RedisClient *redis.Client
}

// DB is the global database instance pointer
var DB *DatabaseContainer

// InitDB initializes MongoDB and Redis client connections with context timeouts & health pings
func InitDB() (*DatabaseContainer, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Fetch Environment Variables with Fallbacks
	mongoURI := getEnv("MONGO_URI", "mongodb://localhost:27017")
	mongoDBName := getEnv("MONGO_DB_NAME", "live_polling_db")
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")
	redisDB := 0

	// 2. Initialize MongoDB Client
	log.Printf("[Database] Connecting to MongoDB at: %s...", mongoURI)
	clientOptions := options.Client().
		ApplyURI(mongoURI).
		SetMaxPoolSize(100).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(30 * time.Second)

	mongoClient, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Verify MongoDB Ping
	if err := mongoClient.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("MongoDB ping failed: %w", err)
	}
	log.Printf("[Database] Successfully connected to MongoDB (%s)", mongoDBName)

	mongoDB := mongoClient.Database(mongoDBName)

	// 3. Initialize Redis Client
	log.Printf("[Database] Connecting to Redis at: %s...", redisAddr)
	redisClient := redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		Password:     redisPassword,
		DB:           redisDB,
		PoolSize:     50,
		MinIdleConns: 10,
	})

	// Verify Redis Ping
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("[Database Warning] Redis ping failed (%v). Ensure Redis server is running.", err)
	} else {
		log.Println("[Database] Successfully connected to Redis engine!")
	}

	container := &DatabaseContainer{
		MongoClient: mongoClient,
		MongoDB:     mongoDB,
		RedisClient: redisClient,
	}

	DB = container
	return container, nil
}

// CloseDB gracefully shuts down MongoDB and Redis connections
func CloseDB() {
	if DB == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if DB.MongoClient != nil {
		if err := DB.MongoClient.Disconnect(ctx); err != nil {
			log.Printf("[Database Error] Error disconnecting MongoDB: %v", err)
		} else {
			log.Println("[Database] MongoDB connection closed gracefully.")
		}
	}

	if DB.RedisClient != nil {
		if err := DB.RedisClient.Close(); err != nil {
			log.Printf("[Database Error] Error closing Redis client: %v", err)
		} else {
			log.Println("[Database] Redis connection closed gracefully.")
		}
	}
}

// getEnv retrieves environment variables or returns default fallback value
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
