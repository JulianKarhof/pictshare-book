import {
  WebSocketEvent,
  WebSocketEventMap,
  WebSocketEventType,
} from "@api/routes/ws/ws.schema";
import { EdenWS } from "@elysiajs/eden/treaty";
import { client as treatyClient } from "@web/lib/client";

export enum WebSocketStatus {
  CONNECTING = "CONNECTING",
  OPEN = "OPEN",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
  DESTROYED = "DESTROYED",
}

export type EdenWebSocket = EdenWS<{
  body: WebSocketEvent;
  params: {};
  query: never;
  headers: never;
  response: unknown;
}>;

export class WebSocketManager {
  private _ws: EdenWebSocket | null = null;
  private _status: WebSocketStatus = WebSocketStatus.CLOSED;
  private _messageQueue: WebSocketEvent[] = [];
  private _listeners: Map<
    WebSocketEventType,
    Set<(data: WebSocketEventMap[WebSocketEventType]) => void>
  > = new Map();

  private static readonly _CONNECTION_TIMEOUT_MS = 5000;

  public constructor() {}

  private _getWsClient:
    | ((client: typeof treatyClient) => EdenWebSocket)
    | null = null;

  public async init(
    connect: (client: typeof treatyClient) => EdenWebSocket,
  ): Promise<WebSocketManager> {
    this._getWsClient = connect;
    try {
      await this._connect();
      return this;
    } catch (error) {
      console.error("Failed to initialize WebSocketManager:", error);
      throw error;
    }
  }

  public send(event: Omit<WebSocketEvent, "timestamp">) {
    const eventWithTimestamp: WebSocketEvent = {
      ...event,
      timestamp: Date.now(),
    } as WebSocketEvent;

    if (this._status !== WebSocketStatus.OPEN) {
      this._messageQueue.push(eventWithTimestamp);
      if (this._status === WebSocketStatus.CLOSED) {
        this._reconnect();
      }
    } else {
      this._ws?.send(eventWithTimestamp);
    }
  }

  public subscribe<T extends WebSocketEventType>(
    event: T,
    callback: (data: WebSocketEventMap[T]) => void,
  ): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)?.add(callback as (data: WebSocketEvent) => void);
  }

  public unsubscribe<T extends WebSocketEventType>(
    event: T,
    callback: (data: WebSocketEventMap[T]) => void,
  ): void {
    this._listeners
      .get(event)
      ?.delete(callback as (data: WebSocketEvent) => void);
  }

  private _processMessageQueue() {
    while (this._messageQueue.length > 0) {
      const message = this._messageQueue.shift()!;
      this.send(message);
    }
  }

  private _handleMessage(event: WebSocketEvent) {
    if (!this._listeners.has(event.type)) return;

    this._listeners.get(event.type)?.forEach((callback) => {
      callback(event);
    });
  }

  private _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._status === WebSocketStatus.CONNECTING)
        return reject(new Error("WebSocket already connecting"));
      if (this._status === WebSocketStatus.OPEN) return resolve();

      this._status = WebSocketStatus.CONNECTING;

      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
        this._status = WebSocketStatus.CLOSED;
      }, WebSocketManager._CONNECTION_TIMEOUT_MS);

      if (!this._getWsClient) {
        reject(new Error("WebSocket client not initialized"));
        this._status = WebSocketStatus.CLOSED;
        return;
      }

      this._ws = this._getWsClient(treatyClient);

      this._ws.on("open", () => {
        clearTimeout(timeout);
        console.log("WebSocket connected");
        this._status = WebSocketStatus.OPEN;
        this._processMessageQueue();
        resolve();
      });

      this._ws.on("message", (message) =>
        this._handleMessage(message.data as unknown as WebSocketEvent),
      );

      this._ws.on("close", () => {
        clearTimeout(timeout);
        console.log("WebSocket disconnected");
        if (this._status !== WebSocketStatus.DESTROYED) {
          this._status = WebSocketStatus.CLOSED;
          this._reconnect();
        }
      });

      this._ws.on("error", (error) => {
        clearTimeout(timeout);
        console.error("WebSocket error:", error);
        reject(error);
      });

      document.onvisibilitychange = () => {
        if (
          document.visibilityState === "visible" &&
          this._status === WebSocketStatus.CLOSED
        ) {
          this._reconnect();
        }
      };
    });
  }

  private async _reconnect(): Promise<void> {
    if (
      this._status === WebSocketStatus.DESTROYED ||
      this._status === WebSocketStatus.CONNECTING
    )
      return;
    console.log("WebSocket reconnecting...");
    try {
      await this._connect();
    } catch (error) {
      console.error("WebSocket reconnect failed:", error);
    }
  }

  public destroy() {
    console.log("WebSocket destroyed");
    this._status = WebSocketStatus.DESTROYED;
    if (this._ws) {
      this._ws?.close();
      this._ws = null;
    }
    document.onvisibilitychange = null;
    this._listeners.clear();
    this._messageQueue = [];
  }

  public get status(): WebSocketStatus {
    return this._status;
  }
}
