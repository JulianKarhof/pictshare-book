import env from "@api/env.js";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import projectRoute from "@routes/project/project.routes.js";
import { Elysia, t } from "elysia";
import elementRoute from "./routes/element/element.routes.js";
import { createPinoLogger } from "@bogeychan/elysia-logger";

const log = createPinoLogger({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const port = 4000;

const app = new Elysia({
  websocket: {
    backpressureLimit: 1024,
  },
})

  .use(log.into())
  .use(projectRoute)
  .use(elementRoute)

  .state("canvasId", undefined as string | undefined)
  .ws("/ws", {
    body: t.Object({
      type: t.String(),
      timestamp: t.Number(),
      payload: t.Any(),
    }),
    open(ws) {
      log.debug(`A websocket opened! ID: ${ws.id}`);
    },
    error(error) {
      log.error(error);
    },
    message(ws, message) {
      const logData = {
        type: message.type,
        userId: ws.id,
        payload: message.payload,
      };

      if (message.type !== "FRAME_UPDATE") log.info(logData);
      else log.debug(logData);

      if (message.type === "INIT") {
        const canvasId = message.payload.id as string;
        ws.data.store.canvasId = canvasId;
        ws.subscribe(canvasId);
        console.log(`Subscribed user ${ws.id} to ${canvasId}`);
        return;
      }

      if (message.type === "FRAME_UPDATE") {
        const now = Date.now();
        if (now - message.timestamp > 1000) {
          return;
        }
      }

      if (ws.data.store.canvasId) ws.publish(ws.data.store.canvasId, message);
    },
    close(ws) {
      log.debug(`A websocket closed! ID: ${ws.id}`);
    },
  })

  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Pictshare Book Documentation",
          version: "1.0.0",
        },
      },
    }),
  )

  .use(cors({ origin: env.FRONTEND_URL }))
  .listen(port);

console.log(`Server is running on http://localhost:${port}`);

export type App = typeof app;
