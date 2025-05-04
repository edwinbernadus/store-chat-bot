package main

import "time"

// Message represents a chat message for our client
type Message struct {
	Time     time.Time
	Sender   string
	Content  string
	IsFromMe bool
}

// SendMessageResponse represents the response for the send message API
type SendMessageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// SendMessageRequest represents the request body for the send message API
type SendMessageRequest struct {
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
}

type SendMessageReplyRequest struct {
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
	StanzaID  string `json:"stanza_id"`
}

type SendItem struct {
	StanzaID *string
	Sender   string
	Content  string
	ChatJID  string
	Name     string
	IsFromMe bool
	IsGroup  bool
}

type GetDetailInfoResponse struct {
	IsHasData bool
	IsGroup   bool
	IsTagMe   bool
}
