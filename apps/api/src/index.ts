import env from "@api/env";
import { createPinoLogger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import projectRoute from "@routes/project/project.routes";
import { Elysia, t } from "elysia";
import authRoute from "./routes/auth/auth.routes";
import elementRoute from "./routes/element/element.routes";

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
  .use(authRoute)
  .use(projectRoute)
  .use(elementRoute)

  .state("canvasId", undefined as string | undefined)
  .ws("/canvas/:id", {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      type: t.String(),
      timestamp: t.Number(),
      payload: t.Any(),
    }),
    open(ws) {
      log.debug(`A websocket opened! ID: ${ws.id}`);
      ws.subscribe(ws.data.params.id);
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

      if (message.type === "FRAME_UPDATE") {
        const now = Date.now();
        if (now - message.timestamp > 1000) {
          return;
        }
      }

      ws.publish(ws.data.params.id, message);
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
