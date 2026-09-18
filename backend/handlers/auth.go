package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"hcl-live-polling/backend/config"
	"hcl-live-polling/backend/models"
	"hcl-live-polling/backend/utils"
)

type AuthRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=6"`
}

// Register handles POST /api/auth/register
func Register(c *gin.Context) {
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: Username >= 3 chars, Password >= 6 chars"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database service unavailable"})
		return
	}

	usersColl := config.DB.MongoDB.Collection("users")

	// Check if username already exists
	var existingUser models.User
	err := usersColl.FindOne(ctx, bson.M{"username": req.Username}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		return
	} else if err != mongo.ErrNoDocuments {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query error: " + err.Error()})
		return
	}

	// Hash password using bcrypt
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	newUser := models.User{
		ID:           primitive.NewObjectID(),
		Username:     req.Username,
		PasswordHash: hashedPassword,
		CreatedAt:    time.Now(),
	}

	_, err = usersColl.InsertOne(ctx, newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	token, err := utils.GenerateJWT(newUser.ID.Hex(), newUser.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"token":   token,
		"user": gin.H{
			"id":       newUser.ID.Hex(),
			"username": newUser.Username,
		},
	})
}

// Login handles POST /api/auth/login
func Login(c *gin.Context) {
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and Password are required"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if config.DB == nil || config.DB.MongoDB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database service unavailable"})
		return
	}

	usersColl := config.DB.MongoDB.Collection("users")

	var user models.User
	err := usersColl.FindOne(ctx, bson.M{"username": req.Username}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// Compare bcrypt password hash
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	token, err := utils.GenerateJWT(user.ID.Hex(), user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":       user.ID.Hex(),
			"username": user.Username,
		},
	})
}
