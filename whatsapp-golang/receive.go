package main

import (
	"encoding/json"
	"fmt"
	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"golang.org/x/net/context"
	"google.golang.org/protobuf/proto"
)

// Handle regular incoming messages
func handleMessage(client *whatsmeow.Client, messageStore *MessageStore, msg *events.Message, logger waLog.Logger) {
	// Extract text content
	content := extractTextContent(msg.Message)
	if content == "" {
		return // Skip non-text messages
	}

	// Save message to database
	chatJID := msg.Info.Chat.String()
	sender := msg.Info.Sender.User

	// Get appropriate chat name (pass nil for conversation since we don't have one for regular messages)
	name := GetChatName(client, messageStore, msg.Info.Chat, chatJID, nil, sender, logger)

	logger.Infof("Chat name: %s, JID: %s, Sender: %s, InfoChat: %s, Content: %s", name, chatJID, sender, msg.Info.ID, content)
	logger.Infof("Is group: %v, Is from me: %v", msg.Info.IsGroup, msg.Info.IsFromMe)
	logger.Infof("my id: %s", client.Store.ID.User)

	logger.Infof("msg.Info.MessageSource.SourceString(): %s", msg.Info.MessageSource.SourceString())
	logger.Infof("msg.Info.MessageSource.Sender: %s", msg.Info.MessageSource.Sender)
	logger.Infof("msg.Info.PushName: %s", msg.Info.PushName)
	logger.Infof("msg.Info.Type: %s", msg.Info.Type)

	//extendedMessage := msg.Message.ExtendedTextMessage
	//logger.Infof("extendedMessage: %s", extendedMessage.String())

	detailInfo := getDetailExtendedMessage(msg, client, logger)

	// Update chat in database with the message timestamp (keeps last message time updated)
	err := messageStore.StoreChat(chatJID, name, msg.Info.Timestamp)
	if err != nil {
		logger.Warnf("Failed to store chat: %v", err)
	}

	// Store message in database
	err = messageStore.StoreMessage(
		msg.Info.ID,
		chatJID,
		sender,
		content,
		msg.Info.Timestamp,
		msg.Info.IsFromMe,
	)
	if err != nil {
		logger.Warnf("Failed to store message: %v", err)
	} else {
		// Log message reception
		timestamp := msg.Info.Timestamp.Format("2006-01-02 15:04:05")
		direction := "←"
		if msg.Info.IsFromMe {
			direction = "→"
		}
		fmt.Printf("[%s] %s %s: %s\n", timestamp, direction, sender, content)
	}

	if msg.Info.IsGroup {
		fmt.Printf("detail info-> hasData: %s isGroup: %s isTagMe: %s", detailInfo.IsHasData, detailInfo.IsGroup, detailInfo.IsTagMe)
		isGroupEnableBroadcast := detailInfo.IsHasData && detailInfo.IsGroup && detailInfo.IsTagMe
		if isGroupEnableBroadcast == false {

			isValid := isBotMention(client.Store.ID.User+"@s.whatsapp.net", msg.Message.ExtendedTextMessage)
			if isValid == false {
				logger.Infof("Group mode - skip sending message to redis")
				return
			}

			logger.Infof("Group mode - mention_me - send message to redis")

		}

	}

	//sendEcho(content, client, msg)

	// publish to redis
	fmt.Println("Before create redis")
	rdb := getRedis()

	sendItem := SendItem{
		StanzaID: proto.String(msg.Info.ID),
		Sender:   sender,
		Content:  content,
		ChatJID:  chatJID,
		Name:     name,
		IsGroup:  msg.Info.IsGroup,
		IsFromMe: msg.Info.IsFromMe,
	}

	sendItemMarshaled, err := json.Marshal(sendItem)

	fmt.Println("Before publish")
	errPublish := rdb.Publish(context.Background(), "channel1", sendItemMarshaled).Err()
	if errPublish != nil {
		logger.Errorf("Failed to publish message to Redis: %v", errPublish)
	} else {
		fmt.Println("Message published to Redis")
	}

	if err != nil {
		println("error sending message: ", err)
	}

}

func getDetailExtendedMessage(msg *events.Message, client *whatsmeow.Client, logger waLog.Logger) GetDetailInfoResponse {
	extendedMessage := msg.Message.ExtendedTextMessage
	logger.Infof("extendedMessage: %s", extendedMessage.String())

	quote := getQuotedMessage(extendedMessage.GetContextInfo())
	if extendedMessage != nil && quote != nil {
		quoteContent := extractTextContent(quote)
		logger.Infof("quoteContent: %s", quoteContent)

		mentions := extendedMessage.GetContextInfo().MentionedJID
		logger.Infof("mentions: %v", mentions)

		participant := msg.Message.ExtendedTextMessage.GetContextInfo().GetParticipant()
		logger.Infof("participant: %s", participant)

		_, errMarshal := json.Marshal(msg.Message)
		if errMarshal != nil {
			fmt.Println("Error marshalling sourceWebMsg: ", errMarshal)
		}

		contextInfo := msg.Message.ExtendedTextMessage.ContextInfo
		logger.Infof("contextInfo: %v", contextInfo.String())

		if msg.Info.IsGroup {
			me := client.Store.ID.User + "@s.whatsapp.net"
			isGroupReplyValid := isGroupReaction(me, participant, mentions)
			if isGroupReplyValid == false {
				fmt.Println("Group mode - Not my tag")
				result := GetDetailInfoResponse{}
				result.IsHasData = true
				result.IsGroup = true
				result.IsTagMe = false
				return result
			}
			fmt.Println("Group mode - My tag")
			result := GetDetailInfoResponse{}
			result.IsHasData = true
			result.IsGroup = true
			result.IsTagMe = true
			return result
		}
	} else {
		logger.Infof("Extended message is nil")
	}
	result := GetDetailInfoResponse{}
	result.IsHasData = false
	result.IsGroup = false
	result.IsTagMe = false
	return result
}

func getQuotedMessage(contextInfo *waE2E.ContextInfo) *waE2E.Message {
	if contextInfo == nil || contextInfo.QuotedMessage == nil {
		return nil // Return nil if no quoted message exists
	}
	return contextInfo.QuotedMessage
}

func sendEcho(content string, client *whatsmeow.Client, msg *events.Message) {
	echo := "echo - " + content
	fmt.Println("Before send reply echo")
	_, err := client.SendMessage(context.Background(), msg.Info.Chat,
		&waProto.Message{
			ExtendedTextMessage: &waProto.ExtendedTextMessage{
				Text: proto.String(echo),
				ContextInfo: &waProto.ContextInfo{
					StanzaID: proto.String(msg.Info.ID),
					//Participant: proto.String(msg.Info.Sender.User),
				},
			},
		},
		whatsmeow.SendRequestExtra{
			ID: msg.Info.ID,
		},
	)
	if err != nil {
		fmt.Println("Error sending reply echo: ", err)
		return
	}
	fmt.Println("Message sent - echo:", echo)
}
func isGroupReaction(me string, participant string, mentions []string) bool {
	if participant != "" {
		// Check if the sender is the participant
		if me == participant {
			fmt.Println("Participant is me")
			return true
		} else {
			fmt.Println("Participant is not me")
		}
	} else {
		fmt.Println("Participant is empty")
	}

	if mentions != nil {
		// Check if the sender is mentioned
		for _, mention := range mentions {
			if mention == me {
				fmt.Println("Sender is mentioned")
				return true
			}
		}
	} else {
		fmt.Println("Mentions are empty")
	}
	return false
}

func isBotMention(me string, message *waE2E.ExtendedTextMessage) bool {

	if message.GetContextInfo() == nil {
		fmt.Println("ContextInfo is nil")
		return false
	}

	mentions := message.GetContextInfo().MentionedJID
	if mentions != nil {
		// Check if the sender is mentioned
		for _, mention := range mentions {
			if mention == me {
				fmt.Println("Sender is mentioned")
				return true
			}
		}
	} else {
		fmt.Println("Mentions are empty")
	}
	return false
}
