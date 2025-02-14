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
});

export default websocketRoute;
