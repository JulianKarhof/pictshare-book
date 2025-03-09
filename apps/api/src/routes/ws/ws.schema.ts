import { t } from "elysia/type-system";
import { ElementSchema } from "../element/element.schema";

export enum WebSocketEventType {
  SHAPE_CREATE = "SHAPE_CREATE",
  SHAPE_UPDATE = "SHAPE_UPDATE",
  SHAPE_DELETE = "SHAPE_DELETE",
  FRAME_UPDATE = "FRAME_UPDATE",
  CURSOR_SYNC = "CURSOR_SYNC",
  CONNECTION = "CONNECTION",
  ERROR = "ERROR",
}

export enum ConnectionStatus {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
}
const ConnectionStatusSchema = t.Enum(ConnectionStatus);

const BaseEventSchema = t.Object({
  timestamp: t.Number(),
  userId: t.String(),
});

export const ShapeCreateEventSchema = t.Composite([
  BaseEventSchema,
  t.Object({
    type: t.Literal(WebSocketEventType.SHAPE_CREATE),
    payload: ElementSchema,
  }),
]);

type ShapeCreateEvent = typeof ShapeCreateEventSchema.static;

export const ShapeUpdateEventSchema = t.Composite([
  BaseEventSchema,
  t.Object({
    type: t.Literal(WebSocketEventType.SHAPE_UPDATE),
    payload: ElementSchema,
  }),
]);

type ShapeUpdateEvent = typeof ShapeUpdateEventSchema.static;

export const ShapeDeleteEventSchema = t.Composite([
  BaseEventSchema,
  t.Object({
    type: t.Literal(WebSocketEventType.SHAPE_DELETE),
    payload: ElementSchema,
  }),
]);

type ShapeDeleteEvent = typeof ShapeDeleteEventSchema.static;

export const FrameUpdateEventSchema = t.Composite([
  BaseEventSchema,
  t.Object({
    type: t.Literal(WebSocketEventType.FRAME_UPDATE),
    payload: ElementSchema,
  }),
]);

type FrameUpdateEvent = typeof FrameUpdateEventSchema.static;

export const ConnectionEventSchema = t.Composite([
  t.Omit(BaseEventSchema, ["userId"]),
  t.Object({
    type: t.Literal(WebSocketEventType.CONNECTION),
    payload: t.Object({
      status: ConnectionStatusSchema,
      message: t.Optional(t.String()),
    }),
  }),
]);
type ConnectionEvent = typeof ConnectionEventSchema.static;

export const CursorSyncEventSchema = t.Composite([
  BaseEventSchema,
  t.Object({
    type: t.Literal(WebSocketEventType.CURSOR_SYNC),
    payload: t.Object({
      x: t.Number(),
      y: t.Number(),
      cursor: t.String(),
    }),
  }),
]);
type CursorSyncEvent = typeof CursorSyncEventSchema.static;

export const ErrorEventSchema = t.Composite([
  BaseEventSchema,
  t.Object({
    type: t.Literal(WebSocketEventType.ERROR),
    payload: t.Object({
      status: t.Number({ default: 500 }),
      message: t.Optional(t.String()),
      data: t.Optional(t.Unknown()),
    }),
  }),
]);
type ErrorEvent = typeof ErrorEventSchema.static;

export const WebSocketEventSchema = t.Union([
  ShapeCreateEventSchema,
  ShapeUpdateEventSchema,
  ShapeDeleteEventSchema,
  FrameUpdateEventSchema,
  ConnectionEventSchema,
  CursorSyncEventSchema,
  ErrorEventSchema,
]);

export const WebSocketEventSendSchema = t.Omit(WebSocketEventSchema, [
  "userId",
]);

export type WebSocketEvent = typeof WebSocketEventSchema.static;
export type WebSocketEventSend = typeof WebSocketEventSendSchema.static;

export type WebSocketEventMap = {
  [WebSocketEventType.SHAPE_CREATE]: ShapeCreateEvent;
  [WebSocketEventType.SHAPE_UPDATE]: ShapeUpdateEvent;
  [WebSocketEventType.SHAPE_DELETE]: ShapeDeleteEvent;
  [WebSocketEventType.FRAME_UPDATE]: FrameUpdateEvent;
  [WebSocketEventType.CONNECTION]: ConnectionEvent;
  [WebSocketEventType.CURSOR_SYNC]: CursorSyncEvent;
  [WebSocketEventType.ERROR]: ErrorEvent;
};
