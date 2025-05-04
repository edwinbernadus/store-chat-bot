import {personalAssistantAgent} from "../agents";
import {Bot, Context, NextFunction} from "grammy";
import * as timers from "node:timers";
import {TELEGRAM_BOT_TOKEN} from "../config_env";

const bot: Bot = new Bot(TELEGRAM_BOT_TOKEN ?? "");

export class TelegramIntegration {

    private readonly MAX_MESSAGE_LENGTH = 4096; // Telegram's message length limit
    private readonly MAX_RESULT_LENGTH = 500; // Maximum length for tool results

    constructor() {
        // Create a bot instance


        // Handle incoming messages
        this.getBot().on("message:text", async (ctx) => {
            await this.handleMessage(ctx);
        })
        console.log("Bot is running");
        this.getBot().use(ignoreOld());
        this.getBot().start();
    }

    private getBot() {
        return bot;
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

    private async updateOrSplitMessage(
        chatId: number,
        messageId: number | undefined,
        text: string
    ): Promise<number> {
        // If text is within limits, try to update existing message
        if (text.length <= this.MAX_MESSAGE_LENGTH && messageId) {
            try {
                await this.editMessageMarkdown(text, chatId, messageId)
                return messageId;
            } catch (error) {
                console.error("Error updating message:", error);
            }
        }

        // If text is too long or update failed, send as new message
        try {
            const sentMessageId = await this.sendMessageMarkdown(chatId, text);
            return sentMessageId
        } catch (error) {
            console.error("Error sending message:", error);
            // If the message is still too long, truncate it
            const truncated =
                text.substring(0, this.MAX_MESSAGE_LENGTH - 100) +
                "\n\n... [Message truncated due to length]";

            const sentMessageId = await this.sendMessageMarkdown(chatId, truncated);
            return sentMessageId;
        }
    }

    private async handleMessage(ctx: Context) {
        // stopwatch start

        const performanceStart = "handle-message-start"
        performance.mark(performanceStart);

        const msg = ctx.message;
        if (msg == null || msg.text == null) {
            throw new Error("Invalid message");
        }
        const chatId = msg.chat.id;
        const text = msg.text;
        const username = msg.from?.username || "unknown";
        const firstName = msg.from?.first_name || "unknown";
        const userId = msg.from?.id.toString() || `anonymous-${chatId}`;

        if (!text) {
            await this.sendMessage(chatId, "Sorry, I can only process text messages.");
            return;
        }

        try {
            // Send initial message
            const sentMessageId = await this.sendMessage(chatId, "Thinking...");
            let currentResponse = "";
            let lastUpdate = Date.now();
            let currentMessageId = sentMessageId
            const UPDATE_INTERVAL = 500; // Update every 500ms to avoid rate limits

            const threadId = `telegram-${chatId}-${userId}`;

            console.log("threadId: ", threadId);
            console.log("userId: ", userId);

            // Stream response using the agent
            const stream = await personalAssistantAgent.stream(text, {
                threadId: threadId, // Use chat ID as thread ID
                resourceId: userId, // Use user ID as resource ID
                context: [
                    {
                        role: "system",
                        content: `Current user: ${firstName} (${username})`,
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
                        const formattedArgs = JSON.stringify(chunk.args, null, 2);
                        chunkText = `\n🛠️ Using tool: ${this.escapeMarkdown(
                            chunk.toolName
                        )}\nArguments:\n\`\`\`\n${this.escapeMarkdown(
                            formattedArgs
                        )}\n\`\`\`\n`;
                        console.log(`Tool call: ${chunk.toolName}`, chunk.args);
                        shouldUpdate = true;
                        break;

                    case "tool-result":
                        const formattedResult = this.formatToolResult(chunk.result);
                        chunkText = `✨ Result:\n\`\`\`\n${formattedResult}\n\`\`\`\n`;
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

            const performanceEnd = "handle-message-end"
            performance.mark(performanceEnd);

            console.log("performance measure: ", performance.measure("handle", performanceStart, performanceEnd));

            // Final update
            await this.updateOrSplitMessage(
                chatId,
                currentMessageId,
                currentResponse
            );
        } catch (error) {
            console.error("Error processing message:", error);
            await this.sendMessage(chatId, "Sorry, I encountered an error processing your message. Please try again.");
        }
    }

    private async editMessageMarkdown(text: string, chatId: number, messageId: number) {
        await this.getBot().api.editMessageText(chatId, messageId, text,
            {
                parse_mode: "MarkdownV2",
            });

    }

    private async sendMessage(chatId: number, content: string) {
        const newMessage = await this.getBot().api.sendMessage(chatId, content)
        return newMessage.message_id;
    }

    private async sendMessageMarkdown(chatId: number, content: string) {
        const newMessage = await this.getBot().api.sendMessage(chatId, content, {
            parse_mode: "MarkdownV2",
        });
        return newMessage.message_id;
    }

}


export const ignoreOld =
    <T extends Context>(threshold = 5 * 60) =>
        (ctx: T, next: NextFunction) => {
            if (
                ctx.msg?.date &&
                new Date().getTime() / 1000 - ctx.msg.date > threshold
            ) {
                console.log(
                    `Ignoring message from user ${ctx.from?.id} at chat ${ctx.chat?.id} (${
                        new Date().getTime() / 1000
                    }:${ctx.msg.date})`
                );
                return;
            }
            return next();
        };
