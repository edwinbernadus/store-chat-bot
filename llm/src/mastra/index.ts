import {Mastra} from "@mastra/core/mastra";
import {createLogger} from "@mastra/core/logger";
import {TelegramIntegration} from "./integrations/telegram";
import {personalAssistantAgent} from "./agents";
import {WhatsappIntegration, WhatsappIntegrationInterface} from "./integrations/whatsapp";
import {pubSubWhatsappListener} from "./integrations/pubSubWhatsappListener";
import {IsTelegramMode, IsWhatsappMode} from "./config_env";


export const mastra: Mastra = new Mastra({
    server: {
        port: 3000, // Defaults to 4111
        timeout: 10000, // Defaults to 30000 (30s)
    },
    agents: {
        personalAssistantAgent,
    },
    workflows: {
        // dailyWorkflow,
    },
    logger: createLogger({
        name: "Mastra",
        level: "info",
    }),
});


if (IsTelegramMode()) {
    console.log("Telegram mode is enabled");
    const telegramBot = new TelegramIntegration();
}

export let whatsappBot: WhatsappIntegrationInterface;
if (IsWhatsappMode()) {
    console.log("Whatsapp mode is enabled");
    whatsappBot = new WhatsappIntegration()
    pubSubWhatsappListener()
}
