import { auth } from "@api/auth";
import { wsService } from "@api/index";
import { log } from "@api/logger";
import { AuthService } from "@api/routes/auth/auth.service";
import { Role } from "@prisma/client";
import { Elysia, t } from "elysia";
import { WebSocketEventSendSchema, WebSocketEventType } from "./ws.schema";

const websocketRoute = new Elysia()

  .state("role", undefined as Role | null | undefined)
  .state("userId", undefined as string | undefined)

  .ws("/canvas/:id", {
    params: t.Object({
      id: t.String(),
    }),
    body: WebSocketEventSendSchema,
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

      const access = await AuthService.hasProjectAccess(
        ws.data.params.id,
        session.user.id,
      );

      ws.data.store.role = access;
      ws.data.store.userId = session.user.id;

      log.debug(`[opened] ID: ${ws.id} User: ${session.user.id}`);
      ws.subscribe(ws.data.params.id);
      wsService?.subscribe(ws.data.params.id, ws.id, (message) => {
        ws.publish(ws.data.params.id, message);
      });
    },
    error(error) {
      log.error(error);
    },
    message(ws, message) {
      const userId = ws.data.store.userId;
      const logData = {
        type: message.type,
        userId: userId,
        payload: message.payload,
      };

      if (
        ws.data.store.role === null ||
        ws.data.store.role === Role.VIEWER ||
        !userId
      ) {
        ws.send({
          type: "ERROR",
          payload: "Unauthorized",
        });
        return;
      }

      const isAtomicUpdate =
        message.type === WebSocketEventType.FRAME_UPDATE ||
        message.type === WebSocketEventType.CURSOR_SYNC;

      if (!isAtomicUpdate) log.info(logData);
      else {
        const now = Date.now();
        if (now - message.timestamp > 5000) {
          return;
        }

        log.debug(logData);
      }

      const response =
        message.type === WebSocketEventType.CONNECTION
          ? message
          : {
              ...message,
              userId,
            };

      wsService?.publish(ws.data.params.id, response);
      ws.publish(ws.data.params.id, response);
    },
    close(ws) {
      wsService?.unsubscribe(ws.data.params.id, ws.id);
      log.debug(`[closed] ID: ${ws.id}`);
    },
  });

export default websocketRoute;
