import { auth } from "@api/auth";
import { log } from "@api/logger";
import { Role } from "@prisma/client";
import { ElementService } from "@routes/element/element.service";
import { Elysia, t } from "elysia";
import { WebSocketEventSchema } from "./ws.schema";

const websocketRoute = new Elysia()

  .state("role", undefined as Role | null | undefined)

  .ws("/canvas/:id", {
    params: t.Object({
      id: t.String(),
    }),
    body: WebSocketEventSchema,
    async open(ws) {
      const session = await auth.api.getSession({
        headers: new Headers({
          cookie: ws.data.headers.cookie ?? "",
        }),
      });

      if (!session) {
        log.debug(`[unauthorized] ID: ${ws.id}`);
        ws.close(3000, "Unauthorized");
        return;
      }

      const access = await ElementService.hasProjectAccess(
        ws.data.params.id,
        session.user.id,
      );

      ws.data.store.role = access;

      log.debug(`[opened] ID: ${ws.id} User: ${session.user.id}`);
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

      if (ws.data.store.role === null || ws.data.store.role === Role.VIEWER) {
        ws.send({
          type: "ERROR",
          payload: "Unauthorized",
        });
        return;
      }

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
      log.debug(`[closed] ID: ${ws.id}`);
    },
  });

export default websocketRoute;
