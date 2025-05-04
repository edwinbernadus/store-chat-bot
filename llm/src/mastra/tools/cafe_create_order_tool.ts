import {createTool} from "@mastra/core/tools";
import {z} from "zod";
import {getMenu} from "./cafe_menu_tool";


export const cafeCreateOrderTool = createTool({
    id: "cafe-create-order",
    description:
        `Create cafe order
notes:
- this is the workflow to create order
- this only create order draft only
- need confirmation to create order by using other tool
- work in sequence

sequence:
- make sure foodCode is in the menu
- ask for the items and total per item
- ask for the customer name
- ask for the customer address
- confirmation by using other tool
- show the order summary
`,
    inputSchema: z.object({
        orderItems: z.array(
            z.object({
                foodCode: z.string().describe("food code input from menu"),
                quantity: z.number().min(1),
            }),
        ),
        name: z.string(),
        address: z.string(),
    }),
    outputSchema: z.object({
        name: z.string(),
        address: z.string(),
        orderItems: z.array(
            z.object({
                foodCode: z.string(),
                quantity: z.number().min(1),
            }),
        ),
        total: z.number(),
        orderId: z.string(),
        status: z.string()
    }),
    execute: async ({context}) => {
        const orderItems = context.orderItems;
        const name = context.name;
        const address = context.address;
        const total = getTotal(orderItems)
        const orderId = createUuid()
        const response = {
            name: name,
            address: address,
            orderItems: orderItems,
            total: total,
            orderId: orderId,
            status: "draft",
        }
        return response
    },
})


export type OrderItemType = {
    foodCode: string;
    quantity: number;
}

function getTotal(orderItems: OrderItemType[]) {
    const menu = getMenu();
    let total = 0;
    for (const orderItem of orderItems) {
        const foodItem = menu.find(item => item.foodCode === orderItem.foodCode);
        if (foodItem) {
            total += foodItem.price * orderItem.quantity;
        }
    }
    return total;
}

function createUuid() {
    const uuid = crypto.randomUUID();
    return uuid;
}