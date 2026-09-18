package routes

import (
	"net/http"

	"hcl-live-polling/backend/handlers"
	"hcl-live-polling/backend/middleware"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware enables Cross-Origin requests and instantly handles Preflight OPTIONS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// SetupRoutes registers all authentication, poll CRUD, vote, and WebSocket HTTP endpoints
func SetupRoutes(r *gin.Engine) {
	// CORS Middleware sabse pehle lagna zaroori hai
	r.Use(CORSMiddleware())

	api := r.Group("/api")
	{
		// 1. Authentication Public Endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// 2. Poll Public & Real-Time Endpoints
		polls := api.Group("/polls")
		{
			polls.GET("", handlers.ListPolls)
			polls.GET("/:id", handlers.GetPoll)
			polls.POST("/:id/vote", handlers.CastVote)      // Public voting endpoint (IP & Fingerprint protected)
			polls.GET("/:id/ws", handlers.ServeWebSocket)  // WebSocket upgrade endpoint for live updates
		}

		// 3. Protected Endpoints (Requires valid JWT Token)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("/polls", handlers.CreatePoll)
		}
	}
}