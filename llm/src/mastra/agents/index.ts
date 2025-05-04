import {openai} from "@ai-sdk/openai";
import {google} from "@ai-sdk/google";
import {Agent} from "@mastra/core/agent";
import {Memory} from "@mastra/memory";
import {MCPConfiguration} from "@mastra/mcp";
import {weatherTool} from "../tools";
import {cafeMenuTool} from "../tools/cafe_menu_tool";
import {cafeCreateOrderTool} from "../tools/cafe_create_order_tool";
import {cafeCreateConfirmOrderTool} from "../tools/cafe_create_confirm_order_tool";

import {PostgresStore, PgVector} from "@mastra/pg";

const mcp = new MCPConfiguration({
    servers: {
        // zapier: {
        //   url: new URL(process.env.ZAPIER_MCP_URL || ""),
        // },
    },
});

const DB_URL = process.env.DB_URL;
const connectionString = DB_URL!


const templateMemory = `<user>
         <name></name>
         <address></address>
         <preferences></preferences>
         <interests></interests>
         <conversation_style></conversation_style>
         <default_language></default_language>
       </user>`


export const personalAssistantAgent = new Agent({
    name: "Personal Assistant",
    instructions: `
      You are a helpful personal waiters for the cafe
      user can change any language per profile
      
      You have access to the following tools:
      
      
      Weather:
         - Use this tool for getting weather information for specific locations
         - It can provide details like temperature, humidity, wind conditions, and weather conditions
         - Always ask for the location or if it's not provided try to use your working memory 
           to get the user's last requested location

      Cafe Menu:
         - Use this tool to get the menu of the cafe
         - It will return the menu items with their prices and descriptions
         - FoodCode is the unique identifier for each menu item
         
      Cafe Create Order:
        - Use this tool to create an order for the cafe
        - It will ask the user for the items they want to order, their name, and address
        - It will also show the order summary and total price
        - Make sure to ask for the customer's name and address before confirming the order
        - Tool will return the order summary and total price
        - If the user wants to change anything, ask them to provide the updated details
        - If the user wants to cancel the order, let them know that the order has been canceled
        - If the user wants to proceed with the order, ask them to confirm
        - If user confirm, then use the Cafe Create Confirm Order tool to confirm the order
        - Validation on food code, must be in the menu on field foodCode
        - Total is never zero
        
      Cafe Create Confirm Order:
        - Use this tool to confirm the order
        - It will show the order summary and ask for confirmation
        - If the user confirms, proceed with the order

   
      Keep your responses concise and friendly.

      You have access to conversation memory and can remember details about users.
      When you learn something about a user, update their working memory using the appropriate tool.
      This includes:
      - Their name
      - Their address
      - Their interests
      - Their preferences
      - Their conversation style (formal, casual, etc.)
      - Any other relevant information that would help personalize the conversation

      Always maintain a helpful and professional tone.
      Use the stored information to provide more personalized responses.
      
      
      NOTE:
      Total Forecast Price is the sum of all items in the order
      Total Forecast Price is always in IDR
      Total Forecast Price is always rounded to the nearest whole number
      Total Forecast Price is always show to the user
      Before take any order, always show the cafe menu
      Make sure to validate the food code to the menu
      Menu often change, so always get the latest menu
      Cafe location is in Jakarta, Indonesia
      Cafe open at 08:00 AM and close at 10:00 PM
      Cafe open 7 days a week
      Cafe Name is "Orange Cafe"
      
      Rule: 
      food items must always be round. Half portions are not allowed.
      never show FoodCode to the user
      delivery address must be in the same city as the cafe
      delivery only available in Jakarta, Indonesia
  `,
    // model: openai("gpt-4o"),
    // model: openai("gpt-4o-mini"),
    // model: google("gemini-2.0-pro-exp-02-05"),
    model: google("gemini-2.0-flash-lite-preview-02-05"),
    tools: {weatherTool, cafeMenuTool, cafeCreateOrderTool, cafeCreateConfirmOrderTool},
    // memory: getLocalMemory()
    memory: getPgMemory()
});


const mcpTools = await mcp.getTools();


function getPgMemory() {
    const memoryPostgree = new Memory({
        storage: new PostgresStore({
            connectionString
        }),
        // vector: new PgVector(connectionString),
        options: {
            // Keep last 20 messages in context
            lastMessages: 20,
            // Enable semantic search to find relevant past conversations
            semanticRecall: {
                topK: 3,
                messageRange: {
                    before: 3,
                    after: 2,
                },
            },
            // Enable working memory to remember user information
            workingMemory: {
                enabled: true,
                template: templateMemory,
                use: "tool-call",
            },
        },
    });
    return memoryPostgree;
}

// function getLocalMemory() {
//     const memory = new Memory({
//         options: {
//             // Keep last 20 messages in context
//             lastMessages: 20,
//             // Enable semantic search to find relevant past conversations
//             semanticRecall: {
//                 topK: 3,
//                 messageRange: {
//                     before: 2,
//                     after: 1,
//                 },
//             },
//             // Enable working memory to remember user information
//             workingMemory: {
//                 enabled: true,
//                 template: templateMemory,
//
//                 use: "tool-call",
//             },
//         },
//     });
//     return memory;
// }

