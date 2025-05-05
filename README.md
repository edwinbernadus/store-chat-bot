# Store Chat Bot

A chatbot agent to assist users with orders in store or a cafe environment.

A smart receptionist bot built with [**Mastra**](https://github.com/mastra-ai/mastra) 
to automate order-taking and improve customer interaction via Telegram and WhatsApp.

---

## 🧑‍🍳 Who Is This For?

This project is designed for café and restaurant owners looking to automate their customer service. It's ideal for:

- Cafés & Restaurants
- Food Trucks / Catering Services
- Event Venues
- Food Delivery Services
- Pop-up Shops
- Storefronts

---

## ✨ Features

This virtual assistant can help with:

- **Show Menu** – Presents the café menu to customers
- **Take Orders** – Records and confirms customer orders
- **Telegram Integration** – Accepts orders via Telegram bot
- **WhatsApp Integration** – Accepts orders via WhatsApp

---

## ⚙️ How It Works

At the core of this application is a `mastra` agent, which:

- Uses **Gemini** as the LLM
- Supports a variety of custom tools
- Maintains persistent memory of user conversations
- Executes multi-step workflows to complete complex tasks

---

### 🧠 Agent Architecture

- **Model**: Gemini
- **Memory**: Persistent, user-specific memory
- **Tools**: Modular and extendable toolset

---

### 🧰 Built-in Tools

- **Weather Tool** – Fetches real-time weather using Open-Meteo API

---

## 📦 Requirements

### For Telegram Bot

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Node.js](https://nodejs.org/en/) (v18 or later)
- PostgreSQL

### For WhatsApp Bot

- WhatsApp account
- [Node.js](https://nodejs.org/en/) (v18 or later)
- PostgreSQL
- [Redis](https://redis.io/)
- Golang (v1.20 or later)

---

## 💬 Integrations

### Telegram Bot

- **Code**: `llm/src/mastra/integrations/telegram.ts`
- **Usage**: Integrated in `llm/src/mastra/index.ts`
- **Setup**: Obtain your bot token from [BotFather](https://t.me/BotFather)

### WhatsApp Bot

- **Code**: `llm/src/mastra/integrations/whatsapp.ts`
- **Usage**: Integrated in `llm/src/mastra/index.ts`
- **Setup**: Retrieves incoming messages from Redis

---

## 🚀 Getting Started – Telegram

Navigate to: `llm/src/`

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Setup environment variables:
   ```bash
   cp .env.example .env
   # In .env, set:
   TELEGRAM_MODE=1
   ```
3. Run in development mode:
   ```bash
   pnpm dev
   ```
4. Run in production:
   ```bash
   pnpm build && pnpm start
   ```

---

## 🚀 Getting Started – WhatsApp

Navigate to: `llm/src/`

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Setup environment variables:
   ```bash
   cp env1.example .env
   # In .env, set:
   WHATSAPP_MODE=1
   ```
3. Run in development mode:
   ```bash
   pnpm dev
   ```
4. Run in production:
   ```bash
   pnpm start
   ```

Navigate to: `whatsapp-golang/`

1. Install Go dependencies:
   ```bash
   go build
   ```
2. Setup environment variables:
   ```bash
   cp env1.example .env
   ```
3. Start the Go WhatsApp service:
   ```bash
   go run .
   ```

---

## 🪄 Credits & Attribution

This project is based on:

- [Mastra Telegram Example](https://github.com/mastra-ai/personal-assistant-example)
- [MCP WhatsApp Integration](https://github.com/lharries/whatsapp-mcp)  

## Contribution Guidelines

Contributions are encouraged! Feel free to open issues or submit pull requests.

## License
This project is distributed under MIT.