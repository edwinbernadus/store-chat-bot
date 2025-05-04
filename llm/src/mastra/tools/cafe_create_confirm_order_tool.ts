import {createTool} from "@mastra/core/tools";
import {z} from "zod";

export const cafeCreateConfirmOrderTool = createTool({
    id: "cafe-create-confirm-order",
    description:
        `Confirm cafe order`,
    inputSchema: z.object({
        orderId: z.string(),
    }),
    outputSchema: z.object({
        status: z.string()
    }),
    execute: async ({context}) => {
        const orderId = context.orderId
        if (orderId === "unknown") {
            return  {
                status: "failed",
            }
        }
        await delayInSeconds(1)
        const response = {
            status: "confirmed",
        }
        return response
    },
})

function delayInSeconds(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}