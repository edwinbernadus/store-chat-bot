package main

import (
	"encoding/json"
	"fmt"
	"go.mau.fi/whatsmeow"
	"net/http"
)

// Start a REST API server to expose the WhatsApp client functionality
func startRESTServer(client *whatsmeow.Client, port int) {

	// Handler for sending messages
	http.HandleFunc("/api/sendReply", func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		fmt.Println("Received request to send message")
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body
		var req SendMessageReplyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request format", http.StatusBadRequest)
			return
		}

		// Validate request
		if req.Recipient == "" || req.Message == "" || req.StanzaID == "" {
			http.Error(w, "Recipient and message and StanzaID are required", http.StatusBadRequest)
			return
		}

		// Send the message
		success, message := sendWhatsAppMessageWithReply(client, req.Recipient, req.Message, req.StanzaID)
		fmt.Println("Message sent", success, message)
		// Set response headers
		w.Header().Set("Content-Type", "application/json")

		// Set appropriate status code
		if !success {
			w.WriteHeader(http.StatusInternalServerError)
		}

		// Send response
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: success,
			Message: message,
		})
	})

	// Handler for sending messages
	http.HandleFunc("/api/send", func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		fmt.Println("Received request to send message")
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body
		var req SendMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request format", http.StatusBadRequest)
			return
		}

		// Validate request
		if req.Recipient == "" || req.Message == "" {
			http.Error(w, "Recipient and message are required", http.StatusBadRequest)
			return
		}

		// Send the message
		success, message := sendWhatsAppMessage(client, req.Recipient, req.Message)
		fmt.Println("Message sent", success, message)
		// Set response headers
		w.Header().Set("Content-Type", "application/json")

		// Set appropriate status code
		if !success {
			w.WriteHeader(http.StatusInternalServerError)
		}

		// Send response
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: success,
			Message: message,
		})
	})

	// Start the server
	serverAddr := fmt.Sprintf(":%d", port)
	fmt.Printf("Starting REST API server on %s...\n", serverAddr)

	// Run server in a goroutine so it doesn't block
	go func() {
		if err := http.ListenAndServe(serverAddr, nil); err != nil {
			fmt.Printf("REST API server error: %v\n", err)
		}
	}()
}
