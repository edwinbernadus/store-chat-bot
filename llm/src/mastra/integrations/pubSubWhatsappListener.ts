import {logger} from "../utils/console2";
import {WhatsappContext, WhatsappMessage} from "../types/whatsappContext";
import redis from "ioredis";
import {REDIS} from "../config_env";
import {whatsappBot} from "../index";


export function pubSubWhatsappListener() {
    const CONST_REDIS_CHANNEL = "channel1";
    const redisClient = new redis(REDIS);
    redisClient.subscribe(
        CONST_REDIS_CHANNEL,
        (err: unknown, count: unknown) => {
            if (err) {
                logger.error({module: "pubSubListener", err});

                // @ts-ignore
                const msg = err.message;
                logger.error(
                    {module: "pubSubListener", err},
                    `[pubSubListener] Failed to subscribe: ${msg}`
                );
            } else {
                logger.info(
                    {module: "pubSubListener"},
                    `[pubSubListener] Subscribed successfully! ${count} - start listening`
                );
            }
        }
    );

    redisClient.on("message", async (channel: string, message: string) => {
        if (channel !== CONST_REDIS_CHANNEL) {
            logger.warn(
                {module: "pubSubListener"},
                "[pubSubListener] channel not match"
            );
            return;
        }

        logger.info({message : message},
            `receive message - ${message}`
        )
        try {
            const content: WhatsappMessage = JSON.parse(message);
            logger.info(
                {module: "pubSubListener", content},
                "[pubSubListener] receive new data"
            );

            const content2 : WhatsappContext = {
                message: {
                    chat: {
                        id: content.ChatJID,
                    },
                    text: content.Content,
                    from: {
                        username: content.Name,
                        first_name: content.Name,
                        id: content.Sender,
                    },
                },
            }
            await whatsappBot.listener(content2)
        } catch (e) {
            logger.error(
                {module: "pubSubListener", e},
                "[pubSubListener] Failed to parse message"
            );
        }
    });
}