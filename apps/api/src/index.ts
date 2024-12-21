import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import projectRoute from "@routes/project/project.routes.js";
import elementRoute from "./routes/element/element.routes.js";
import env from "@api/env.js";

const port = 4000;

const app = new Elysia()

  .use(cors({ origin: env.FRONTEND_URL }))

  .use(projectRoute)
  .use(elementRoute)

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
  .listen(port);

console.log(`Server is running on http://localhost:${port}`);

export type App = typeof app;
