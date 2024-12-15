import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import z from "zod";
import type { WSContext } from "hono/ws";
import projectRoute from "./project.js";

const schema = z.object({
  name: z.string(),
});

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
const clients = new Set<WSContext>();

const route = app
  .get("/", (c) => {
    return c.json({ message: "Hello World!" });
  })

  .get("/hello/:name", zValidator("param", schema), (c) => {
    const { name } = c.req.valid("param");
    return c.json(`Hello ${name}!`, 200);
  })

  .route("/project", projectRoute)

  .get(
    "/ws",
    upgradeWebSocket((_) => {
      return {
        onOpen(_, ws) {
          console.log("WebSocket connected");
          ws.send("Connected");
          clients.add(ws);
          console.log(clients.size);
        },
        onMessage(event, ws) {
          console.log(`Message from client: ${event.data}`);
          clients.forEach((client) => {
            client.send(event.data.toString());
          });
        },
        onClose(_, ws) {
          console.log("Connection closed");
          clients.delete(ws);
        },
      };
    }),
  );

export type AppTypeRouter = typeof route;

const port = 4000;
console.log(`Server is running on http://localhost:${port}`);
const server = serve({
  fetch: app.fetch,
  port,
});

injectWebSocket(server);
