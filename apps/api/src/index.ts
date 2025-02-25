import env from "@api/env";
import websocketRoute from "@api/routes/ws/ws.routes";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import authRoute from "@routes/auth/auth.routes";
import elementRoute from "@routes/element/element.routes";
import projectRoute from "@routes/project/project.routes";
import { Elysia } from "elysia";
import { log } from "./logger";
import imageRoute from "./routes/image/image.routes";

const port = process.env.PORT || 4000;

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

  .listen(port);

log.info(`Server is running on port ${port}`);

export type App = typeof app;
