import { t } from "elysia/type-system";
import { ElementSchema } from "../element/element.schema";

export enum WebSocketEventType {
  SHAPE_CREATE = "SHAPE_CREATE",
  SHAPE_UPDATE = "SHAPE_UPDATE",
  SHAPE_DELETE = "SHAPE_DELETE",
  FRAME_UPDATE = "FRAME_UPDATE",
  CONNECTION = "CONNECTION",
  ERROR = "ERROR",
}

export enum ConnectionStatus {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
}
const ConnectionStatusSchema = t.Enum(ConnectionStatus);

export const ShapeCreateEventSchema = t.Object({
  type: t.Literal(WebSocketEventType.SHAPE_CREATE),
  timestamp: t.Number(),
  payload: ElementSchema,
});
type ShapeCreateEvent = typeof ShapeCreateEventSchema.static;

export const ShapeUpdateEventSchema = t.Object({
  type: t.Literal(WebSocketEventType.SHAPE_UPDATE),
  timestamp: t.Number(),
  payload: ElementSchema,
});
type ShapeUpdateEvent = typeof ShapeUpdateEventSchema.static;

export const ShapeDeleteEventSchema = t.Object({
  type: t.Literal(WebSocketEventType.SHAPE_DELETE),
  timestamp: t.Number(),
  payload: ElementSchema,
});
type ShapeDeleteEvent = typeof ShapeDeleteEventSchema.static;

export const FrameUpdateEventSchema = t.Object({
  type: t.Literal(WebSocketEventType.FRAME_UPDATE),
  timestamp: t.Number(),
  payload: ElementSchema,
});
type FrameUpdateEvent = typeof FrameUpdateEventSchema.static;

export const ConnectionEventSchema = t.Object({
  type: t.Literal(WebSocketEventType.CONNECTION),
  timestamp: t.Number(),
  payload: t.Object({
    status: ConnectionStatusSchema,
    message: t.Optional(t.String()),
  }),
});
type ConnectionEvent = typeof ConnectionEventSchema.static;

export const ErrorEventSchema = t.Object({
  type: t.Literal(WebSocketEventType.ERROR),
  timestamp: t.Number(),
  payload: t.Object({
    status: t.Number({ default: 500 }),
    message: t.Optional(t.String()),
    data: t.Optional(t.Unknown()),
  }),
});
type ErrorEvent = typeof ErrorEventSchema.static;

export const WebSocketEventSchema = t.Union([
  ShapeCreateEventSchema,
  ShapeUpdateEventSchema,
  ShapeDeleteEventSchema,
  FrameUpdateEventSchema,
  ConnectionEventSchema,
  ErrorEventSchema,
]);
export type WebSocketEvent = typeof WebSocketEventSchema.static;

export type WebSocketEventMap = {
  [WebSocketEventType.SHAPE_CREATE]: ShapeCreateEvent;
  [WebSocketEventType.SHAPE_UPDATE]: ShapeUpdateEvent;
  [WebSocketEventType.SHAPE_DELETE]: ShapeDeleteEvent;
  [WebSocketEventType.FRAME_UPDATE]: FrameUpdateEvent;
  [WebSocketEventType.CONNECTION]: ConnectionEvent;
  [WebSocketEventType.ERROR]: ErrorEvent;
};
