import env from "@api/env";
import websocketRoute from "@api/routes/ws/ws.routes";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import authRoute from "@routes/auth/auth.routes";
import elementRoute from "@routes/element/element.routes";
import projectRoute from "@routes/project/project.routes";
import { Elysia } from "elysia";
import { createClient } from "redis";
import { PORT, SHORT_SERVER_ID } from "./config";
import { log } from "./logger";
import imageRoute from "./routes/image/image.routes";
import { WebSocketSyncService } from "./routes/ws/ws.service";

log.info(`Server instance ${SHORT_SERVER_ID} starting...`);

export const wsService = env.REDIS_URL
  ? new WebSocketSyncService(
      createClient({ url: env.REDIS_URL }),
      createClient({ url: env.REDIS_URL }),
    )
  : undefined;

if (!wsService)
  log.warn(
    `Redis not configured, skipping. (This should only be the case in development or staging environments)`,
  );

const app = new Elysia()
  .use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? /.*\.pict\.sh$/
          : env.FRONTEND_URL,
    }),
  )

  .use(authRoute)
  .use(projectRoute)
  .use(elementRoute)
  .use(imageRoute)
  .use(websocketRoute)

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

  .use(log.into())

  .listen(PORT);

process.on("SIGTERM", async () => {
  await wsService?.destroy();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await wsService?.destroy();
  process.exit(0);
});

log.info(`Server instance ${SHORT_SERVER_ID} is running on port ${PORT}`);

export type App = typeof app;
