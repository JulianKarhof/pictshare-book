import env from "@api/env.js";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import projectRoute from "@routes/project/project.routes.js";
import { Elysia, t } from "elysia";
import elementRoute from "./routes/element/element.routes.js";
import { logger } from "@grotto/logysia";

const port = 4000;

const app = new Elysia({
  websocket: {
    backpressureLimit: 1024,
  },
})

  .use(projectRoute)
  .use(elementRoute)

  .ws("/ws", {
    body: t.Object({
      type: t.String(),
      timestamp: t.Number(),
      payload: t.Any(),
    }),
    open(ws) {
      console.log("A WebSocket connected!");
      ws.subscribe("id");
    },
    message(ws, message) {
      console.log("message:", message);
      console.log("message from:", ws.id);

      if (message.type === "FRAME_UPDATE") {
        const now = Date.now();
        if (now - message.timestamp > 1000) {
          return;
        }
      }

      const success = ws.publish("id", message);
      console.log("success:", success);
    },
    close() {
      console.log("A websocket closed!");
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

  .use(logger())
  .use(cors({ origin: env.FRONTEND_URL }))
  .listen(port);

console.log(`Server is running on http://localhost:${port}`);

export type App = typeof app;
