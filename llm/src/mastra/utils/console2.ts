import pino from "pino";



const pinoConsole = {
    target: "pino/file",
    options: { destination: 1 }, // this writes to STDOUT
};

export const logger = pino(
    {
        formatters: {
            level(label) {
                return { level: label };
            },
        },
        base: { service: "service1" },
        // level: "debug",
    },
    pino.transport({
        targets: [
            pinoConsole,
        ],
    })
);

export class Logger {
    moduleName: string;

    constructor(module: string) {
        this.moduleName = module;
    }

    info(items: object, desc: string) {
        logger.info({ ...items, module: this.moduleName }, desc);
    }

    debug(items: object, desc: string) {
        logger.debug({ ...items, module: this.moduleName }, desc);
    }

    error(items: object, desc: string) {
        logger.error({ ...items, module: this.moduleName }, desc);
    }

    warn(items: object, desc: string) {
        logger.warn({ ...items, module: this.moduleName }, desc);
    }
}
