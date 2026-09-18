package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"hcl-live-polling/backend/config"
	"hcl-live-polling/backend/handlers"
	"hcl-live-polling/backend/middleware"
)

func main() {
	log.Println("[Server] Starting HCL Real-Time Polling Engine Backend...")

	// Initialize MongoDB and Redis connection
	dbContainer, err := config.InitDB()
	if err != nil {
		log.Printf("[Server Warning] Database initialization warning: %v", err)
	} else {
		defer config.CloseDB()
	}

	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Register API Routes under /api
	api := r.Group("/api")
	{
		// Authentication Public Endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Poll Public Endpoints
		polls := api.Group("/polls")
		{
			polls.GET("", handlers.ListPolls)
			polls.GET("/:id", handlers.GetPoll)
			polls.POST("/:id/vote", handlers.CastVote)
			polls.GET("/:id/ws", handlers.ServeWebSocket)
		}

		// Protected Endpoints (Requires valid JWT Token)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("/polls", handlers.CreatePoll)
		}
	}

	// System Health Check Endpoint
	r.GET("/api/health", func(c *gin.Context) {
		mongoPing := "disconnected"
		redisPing := "disconnected"

		if dbContainer != nil && dbContainer.MongoClient != nil {
			if err := dbContainer.MongoClient.Ping(c, nil); err == nil {
				mongoPing = "connected"
			}
		}

		if dbContainer != nil && dbContainer.RedisClient != nil {
			if err := dbContainer.RedisClient.Ping(c).Err(); err == nil {
				redisPing = "connected"
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "online",
			"engine":   "HCL Real-Time Polling Engine (Gin + Redis INCR + Mongo)",
			"mongo_db": mongoPing,
			"redis":    redisPing,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[Server] Gin HTTP Server listening on port :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[Server Fatal] Failed to start server: %v", err)
	}
}
