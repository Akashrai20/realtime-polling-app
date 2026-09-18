package models

import "time"

// VotePayload represents an incoming vote request payload submitted by a client
type VotePayload struct {
	PollID           string    `json:"poll_id" binding:"required"`
	OptionID         string    `json:"option_id" binding:"required"`
	VoterFingerprint string    `json:"voter_fingerprint" binding:"required"`
	IPAddress        string    `json:"ip_address,omitempty"`
	UserAgent        string    `json:"user_agent,omitempty"`
	VotedAt          time.Time `json:"voted_at,omitempty"`
}

// VoteRecord represents an audit log entry stored in MongoDB for duplicate checking & historical records
type VoteRecord struct {
	ID               string    `bson:"_id,omitempty" json:"id"`
	PollID           string    `bson:"poll_id" json:"poll_id"`
	OptionID         string    `bson:"option_id" json:"option_id"`
	VoterFingerprint string    `bson:"voter_fingerprint" json:"voter_fingerprint"`
	IPAddress        string    `bson:"ip_address" json:"ip_address"`
	VotedAt          time.Time `bson:"voted_at" json:"voted_at"`
}
