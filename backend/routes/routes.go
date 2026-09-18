package routes

import (
	"github.com/gin-gonic/gin"
	"hcl-live-polling/backend/handlers"
	"hcl-live-polling/backend/middleware"
)

// SetupRoutes registers all authentication, poll CRUD, vote, and WebSocket HTTP endpoints
func SetupRoutes(r *gin.Engine) {
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
			polls.GET("/:id", handlers.GetPollByID)
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
