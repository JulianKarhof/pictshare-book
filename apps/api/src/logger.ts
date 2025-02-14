import { createPinoLogger } from "@bogeychan/elysia-logger";

export const log = createPinoLogger({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
