const TELEGRAM_MODE = process.env.TELEGRAM_MODE;
export function IsTelegramMode() {
    return TELEGRAM_MODE === "1";
}

const WHATSAPP_MODE = process.env.WHATSAPP_MODE;
export function IsWhatsappMode() {
    return WHATSAPP_MODE === "1";
}

const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables");
    process.exit(1);
}

export const DB_URL = process.env.DB_URL;
if (!DB_URL) {
    console.error("DB_URL is not set in environment variables");
    process.exit(1);
}

// telegram config
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (IsTelegramMode() && !TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
    process.exit(1);
}

// whatsapp config
export const REDIS = process.env.REDIS!;
export const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL!;

if (IsWhatsappMode() && !WHATSAPP_SERVER_URL) {
    console.error("WHATSAPP_SERVER_URL is not set in environment variables");
    process.exit(1);
}

if (IsWhatsappMode() && !REDIS) {
    console.error("REDIS is not set in environment variables");
    process.exit(1);
}

