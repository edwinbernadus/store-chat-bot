import {createTool} from "@mastra/core/tools";
import {z} from "zod";

export const cafeMenuTool = createTool({
    id: "cafe-get-menu",
    description: "Get cafe menu",
    outputSchema: z.array(z.object({
            foodCode: z.string(),
            displayName: z.string(),
            price: z.number(),
        }
    )),
    execute: async () => {
        const menu = getMenu();
        return menu;
    },
});


export function getMenu() {
    return [
        {
            foodCode: "nasi_goreng",
            displayName: "Nasi Goreng",
            price: 20000,
        },
        {
            foodCode: "sate",
            displayName: "Sate",
            price: 15000,
        },
        {
            foodCode: "soto",
            displayName: "Soto",
            price: 25000,
        },
        {
            foodCode: "bakso",
            displayName: "Bakso",
            price: 30000,
        },
        {
            foodCode: "mie_goreng",
            displayName: "Mie Goreng",
            price: 20000,

        }
    ]
}

