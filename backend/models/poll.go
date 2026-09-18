package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Option represents an individual choice within a poll
type Option struct {
	ID    string `bson:"id" json:"id"`
	Text  string `bson:"text" json:"text" binding:"required"`
	Votes int64  `bson:"votes" json:"votes"`
}

// Poll represents a live poll document stored in MongoDB
type Poll struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID           string             `bson:"creator_id,omitempty" json:"creator_id,omitempty"`
	Question            string             `bson:"question" json:"question" binding:"required"`
	Description         string             `bson:"description,omitempty" json:"description,omitempty"`
	Options             []Option           `bson:"options" json:"options" binding:"required,min=2"`
	TotalVotes          int64              `bson:"total_votes" json:"total_votes"`
	AllowMultiple       bool               `bson:"allow_multiple" json:"allow_multiple"`
	RestrictFingerprint bool               `bson:"restrict_fingerprint" json:"restrict_fingerprint"`
	RestrictIP          bool               `bson:"restrict_ip" json:"restrict_ip"`
	ExpiresAt           time.Time          `bson:"expires_at" json:"expires_at"`
	CreatedAt           time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt           time.Time          `bson:"updated_at" json:"updated_at"`
}
