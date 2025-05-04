import {personalAssistantAgent} from "../agents";
import {WhatsappContext} from "../types/whatsappContext";
import {WHATSAPP_SERVER_URL} from "../config_env";

export interface WhatsappIntegrationInterface {
    listener: (content: WhatsappContext) => Promise<void>;
}

export class WhatsappIntegration implements WhatsappIntegrationInterface {

    private readonly MAX_RESULT_LENGTH = 500; // Maximum length for tool results

    constructor() {

    }

    public async listener(content: WhatsappContext) {
        await this.handleMessage(content)
    }

    private escapeMarkdown(text: string): string {
        // Escape special Markdown characters
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
    }

    private truncateString(str: string, maxLength: number): string {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + "... [truncated]";
    }

    private formatToolResult(result: any): string {
        try {
            const jsonString = JSON.stringify(result, null, 2);
            return this.escapeMarkdown(
                this.truncateString(jsonString, this.MAX_RESULT_LENGTH)
            );
        } catch (error) {
            return `[Complex data structure - ${typeof result}]`;
        }
    }


    async handleMessage(ctx: WhatsappContext) {
        const msg = ctx.message;
        if (msg == null || msg.text == null) {
            throw new Error("Invalid message");
        }


        const chatId = msg.chat.id;
        const text = msg.text;
        const userId = msg.from?.id.toString() || `anonymous-${chatId}`;

        if (!text) {
            await this.sendMessage(chatId, "Sorry, I can only process text messages.");
            return;
        }

        try {
            // Send initial message
            // const sentMessageId = await this.sendMessage(chatId, "Thinking...");
            let currentResponse = "";
            let lastUpdate = Date.now();
            const UPDATE_INTERVAL = 500; // Update every 500ms to avoid rate limits

            const threadId = `whatsapp-${chatId}-${userId}`;

            // Stream response using the agent
            const stream = await personalAssistantAgent.stream(text, {
                threadId: threadId, // Use chat ID as thread ID
                resourceId: userId, // Use user ID as resource ID
                context: [
                    {
                        role: "system",
                        content: `Current user: ${userId}`,
                    },
                ],
            });

            // Process the full stream
            for await (const chunk of stream.fullStream) {
                let shouldUpdate = false;
                let chunkText = "";

                switch (chunk.type) {
                    case "text-delta":
                        chunkText = this.escapeMarkdown(chunk.textDelta);
                        shouldUpdate = true;
                        break;

                    case "tool-call":
                        console.log(`Tool call: ${chunk.toolName}`, chunk.args);
                        shouldUpdate = true;
                        break;

                    case "tool-result":
                        console.log("Tool result:", chunk.result);
                        shouldUpdate = true;
                        break;

                    case "error":
                        chunkText = `\n❌ Error: ${this.escapeMarkdown(
                            String(chunk.error)
                        )}\n`;
                        console.error("Error:", chunk.error);
                        shouldUpdate = true;
                        break;

                    case "reasoning":
                        chunkText = `\n💭 ${this.escapeMarkdown(chunk.textDelta)}\n`;
                        console.log("Reasoning:", chunk.textDelta);
                        shouldUpdate = true;
                        break;
                }

                if (shouldUpdate) {
                    currentResponse += chunkText;
                    const now = Date.now();
                    if (now - lastUpdate >= UPDATE_INTERVAL) {
                        try {
                            lastUpdate = now;
                        } catch (error) {
                            console.error("Error updating/splitting message:", error);
                        }
                    }
                }
            }

            await this.sendMessageMarkdown(
                chatId,
                currentResponse
            )
        } catch (error) {
            console.error("Error processing message:", error);
            await this.sendMessage(chatId, "Sorry, I encountered an error processing your message. Please try again.");
        }
    }

    private async sendMessage(chatId: string, content: string): Promise<number> {
        return await this.sendMessageLogic(chatId, content);
    }

    private async sendMessageMarkdown(chatId: string, content: string): Promise<number> {
        return await this.sendMessageLogic(chatId, content);
    }

    private async sendMessageLogic(chatId: string, inputContent: string): Promise<number> {
        console.log("inputContent: ", inputContent);
        const content = formatter(inputContent)
        console.log("newContent: ", content);
        const url = WHATSAPP_SERVER_URL + "/api/send";

        // fetch post body
        const body = {
            recipient: chatId,
            message: content,
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.text();
        console.log("Response: ", data);
        return parseInt(data)
    }

}


function formatter(inputContent: string) {
    return inputContent
        // replace all symbol \ with nothing
        .replace(/\\/g, "")
        // replace all symbol ** with *
        .replace(/\*\*/g, "*")
}

