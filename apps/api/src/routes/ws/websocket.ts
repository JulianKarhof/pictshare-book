import { auth } from "@api/auth";
import { log } from "@api/logger";
import { Elysia, t } from "elysia";

const websocketRoute = new Elysia().ws("/canvas/:id", {
  params: t.Object({
    id: t.String(),
  }),
  body: t.Object({
    type: t.String(),
    timestamp: t.Number(),
    payload: t.Any(),
  }),
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
