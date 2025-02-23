import {
  WebSocketEvent,
  WebSocketEventMap,
  WebSocketEventType,
} from "@api/routes/ws/ws.schema";
import { EdenWS } from "@elysiajs/eden/treaty";
import { client } from "@web/lib/client";

export enum WebSocketStatus {
  CONNECTING = "CONNECTING",
  OPEN = "OPEN",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
  DESTROYED = "DESTROYED",
}

export class WebSocketManager {
  private static _instance: WebSocketManager | null = null;
  private _initializationPromise: Promise<WebSocketManager> | null = null;
  private _ws: EdenWS<{
    body: WebSocketEvent;
    params: {};
    query: never;
    headers: never;
    response: unknown;
  }> | null = null;
  private _canvasId: string | null = null;
  private _status: WebSocketStatus = WebSocketStatus.CLOSED;
  private _messageQueue: WebSocketEvent[] = [];
  private _listeners: Map<
    WebSocketEventType,
    Set<(data: WebSocketEventMap[WebSocketEventType]) => void>
  > = new Map();

  private static readonly CONNECTION_TIMEOUT = 5000;

  private constructor() {}

  public async initialize(canvasId: string): Promise<WebSocketManager> {
    if (this._canvasId === canvasId && this._status === WebSocketStatus.OPEN) {
      console.log("WebSocketManager already initialized");
      return this;
    }

    if (this._initializationPromise) {
      console.log("WebSocketManager initialization already in progress");
      return this._initializationPromise;
    }

    if (this._canvasId && this._canvasId !== canvasId) {
      this.destroy();
    }

    this._initializationPromise = (async () => {
      this._canvasId = canvasId;
      try {
        await this.connect();
        return this;
      } catch (error) {
        console.error("Failed to initialize WebSocketManager:", error);
        throw error;
      } finally {
        this._initializationPromise = null;
      }
    })();

    return this._initializationPromise;
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager._instance) {
      WebSocketManager._instance = new WebSocketManager();
    }
    return WebSocketManager._instance;
  }

  public send(event: Omit<WebSocketEvent, "timestamp">) {
    const eventWithTimestamp: WebSocketEvent = {
      ...event,
      timestamp: Date.now(),
    } as WebSocketEvent;

    if (this._status !== WebSocketStatus.OPEN) {
      this._messageQueue.push(eventWithTimestamp);
      if (this._status === WebSocketStatus.CLOSED) {
        this.reconnect();
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

  private processMessageQueue() {
    while (this._messageQueue.length > 0) {
      console.log("Processing message queue");
      const message = this._messageQueue.shift()!;
      this.send(message);
    }
  }

  private handleMessage(event: WebSocketEvent) {
    if (!this._listeners.has(event.type)) return;

    this._listeners.get(event.type)?.forEach((callback) => {
      callback(event);
    });
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._status === WebSocketStatus.CONNECTING)
        return reject(new Error("WebSocket already connected"));
      if (this._status === WebSocketStatus.OPEN) return resolve();
      if (!this._canvasId) return reject(new Error("Canvas ID not provided"));
      this._status = WebSocketStatus.CONNECTING;

      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
        this._status = WebSocketStatus.CLOSED;
      }, WebSocketManager.CONNECTION_TIMEOUT);

      this._ws = client.canvas({ id: this._canvasId }).subscribe();

      this._ws.on("open", () => {
        clearTimeout(timeout);
        console.log("WebSocket connected");
        this._status = WebSocketStatus.OPEN;
        this.processMessageQueue();
        resolve();
      });
      this._ws.on("message", (message) =>
        this.handleMessage(message.data as unknown as WebSocketEvent),
      );
      this._ws.on("close", () => {
        clearTimeout(timeout);
        console.log("WebSocket disconnected");
        if (this._status !== WebSocketStatus.DESTROYED) {
          this._status = WebSocketStatus.CLOSED;
          this.reconnect();
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
          this.reconnect();
        }
      };
    });
  }

  private async reconnect(): Promise<void> {
    if (
      this._status === WebSocketStatus.DESTROYED ||
      this._status === WebSocketStatus.CONNECTING
    )
      return;
    console.log("WebSocket reconnecting...");
    try {
      await this.connect();
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
    this._canvasId = null;
    this._listeners.clear();
    this._messageQueue = [];
  }

  public get status(): WebSocketStatus {
    return this._status;
  }
}
