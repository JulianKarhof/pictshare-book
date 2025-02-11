import type { App } from "@api/index";
import { ElementSchema } from "@api/routes/element/element.schema";
import { treaty } from "@elysiajs/eden";
import { EdenWS } from "@elysiajs/eden/treaty";
import { BaseObject } from "@web/components/canvas/objects";
import env from "@web/util/env";

export enum WebSocketMessageType {
  SHAPE_CREATE = "SHAPE_CREATE",
  SHAPE_UPDATE = "SHAPE_UPDATE",
  FRAME_UPDATE = "FRAME_UPDATE",
  DEFAULT = "DEFAULT",
  CONNECTION = "CONNECTION",
  ERROR = "ERROR",
}

interface BaseWebSocketEvent {
  type: WebSocketMessageType;
  timestamp: number;
  payload: unknown;
}

export type WebSocketEvent =
  | ShapeUpdateEvent
  | FrameUpdateEvent
  | DefaultEvent
  | ConnectionEvent
  | ErrorEvent;

export interface ShapeCreateEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.SHAPE_CREATE;
  payload: typeof ElementSchema.static;
}

export interface ShapeUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.SHAPE_UPDATE;
  payload: typeof ElementSchema.static;
}

export interface FrameUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.FRAME_UPDATE;
  payload: typeof ElementSchema.static;
}

export interface DefaultEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.DEFAULT;
  payload: unknown;
}

export interface ConnectionEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.CONNECTION;
  payload: { status: string };
}

export interface ErrorEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.ERROR;
  payload: unknown;
}

type WebSocketEventMap = {
  [WebSocketMessageType.SHAPE_CREATE]: ShapeCreateEvent;
  [WebSocketMessageType.SHAPE_UPDATE]: ShapeUpdateEvent;
  [WebSocketMessageType.FRAME_UPDATE]: FrameUpdateEvent;
  [WebSocketMessageType.DEFAULT]: DefaultEvent;
  [WebSocketMessageType.CONNECTION]: ConnectionEvent;
  [WebSocketMessageType.ERROR]: ErrorEvent;
};

export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private socket: EdenWS<{
    body: unknown;
    params: {};
    query: unknown;
    headers: unknown;
    response: unknown;
  }> | null = null;

  private client = treaty<App>(env.BACKEND_URL);
  private listeners: Map<
    WebSocketMessageType,
    Set<(data: WebSocketEvent) => void>
  > = new Map();

  private canvasId: string;
  private reconnectAttempts = 0;
  private lastInBetweenUpdate = 0;
  private reconnecting = false;
  private destroyed = false;
  private readonly maxReconnectAttempts = 100;
  private readonly reconnectDelay = 3000;
  private readonly inBetweenUpdateThrottle = 50;

  private constructor(id: string) {
    this.canvasId = id;
  }

  public static getInstance(id: string): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(id);
    }
    return WebSocketManager.instance;
  }

  public connect(timeoutMs: number = 5000): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.destroyed) return reject();
      if (this.socket) {
        if (this.socket.ws.readyState === WebSocket.OPEN) {
          return reject(new Error("WebSocket is already connected"));
        } else {
          try {
            await this.disconnect();
          } catch (error) {
            return reject(new Error("Failed to disconnect WebSocket:" + error));
          }
        }
      }

      const timeoutId = setTimeout(() => {
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
        reject(new Error("Connection timeout"));
      }, timeoutMs);

      try {
        this.socket = this.client.canvas({ id: this.canvasId }).subscribe();

        this.socket.on("open", () => {
          clearTimeout(timeoutId);
          this.setupEventHandlers();
          console.log("WebSocket connected");

          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on("close", () => {
          clearTimeout(timeoutId);
          reject(new Error("WebSocket closed during connection"));
        });

        this.socket.on("error", () => {
          clearTimeout(timeoutId);
          reject(new Error("WebSocket connection error"));
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Failed to establish WebSocket connection:", error);
        reject(new Error("Failed to establish WebSocket connection"));
      }
    });
  }

  public disconnect(timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Disconnect timeout"));
      }, timeoutMs);

      const cleanup = () => {
        this.socket = null;
        clearTimeout(timeoutId);
      };

      if (
        this.socket &&
        this.socket.ws.readyState !== WebSocket.CLOSED &&
        this.socket.ws.readyState !== WebSocket.CLOSING
      ) {
        this.socket.close();
        this.socket.on("close", () => {
          cleanup();
          resolve();
        });
      } else {
        cleanup();
        resolve();
      }
    });
  }

  public destroy(): void {
    this.disconnect();
    this.destroyed = true;
    this.listeners.clear();
    WebSocketManager.instance = null;
  }

  public sendObjectCreate(shape: BaseObject, projectId: string): void {
    if (!this.socket) {
      return console.error("WebSocket is not connected");
    }

    try {
      this.client
        .projects({ id: projectId })
        .elements.post(shape.toJson())
        .then((result) => {
          if (result.data) shape.id = result.data.id;
          this.socket?.send({
            type: WebSocketMessageType.SHAPE_CREATE,
            timestamp: Date.now(),
            payload: shape.toJson(),
          });
        });
    } catch (error) {
      console.error("Failed to send shape create:", error);
    }
  }

  public sendObjectUpdate(shape: typeof ElementSchema.static): void {
    if (!this.socket) {
      return console.error("WebSocket is not connected");
    }

    try {
      this.socket.send({
        type: WebSocketMessageType.SHAPE_UPDATE,
        timestamp: Date.now(),
        payload: shape,
      });

      this.client.elements({ id: shape.id }).put(shape);
    } catch (error) {
      console.error("Failed to send shape update:", error);
    }
  }

  public sendInBetweenUpdate(shape: typeof ElementSchema.static): void {
    if (!this.socket) {
      return console.error("WebSocket is not connected");
    }

    const now = Date.now();
    if (now - this.lastInBetweenUpdate < this.inBetweenUpdateThrottle) {
      return;
    }

    try {
      this.socket.send({
        type: WebSocketMessageType.FRAME_UPDATE,
        timestamp: now,
        payload: shape,
      });
      this.lastInBetweenUpdate = now;
    } catch (error) {
      console.error("Failed to send frame update:", error);
    }
  }

  public subscribe<T extends WebSocketMessageType>(
    event: T,
    callback: (data: WebSocketEventMap[T]) => void,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback as (data: WebSocketEvent) => void);
  }

  public unsubscribe<T extends WebSocketMessageType>(
    event: T,
    callback: (data: WebSocketEventMap[T]) => void,
  ): void {
    this.listeners
      .get(event)
      ?.delete(callback as (data: WebSocketEvent) => void);
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("open", () => {
      this.reconnectAttempts = 0;
      this.notifyListeners({
        type: WebSocketMessageType.CONNECTION,
        timestamp: Date.now(),
        payload: { status: "connected" },
      });
    });

    this.socket.on("close", () => {
      console.log("WebSocket disconnected");
      this.handleReconnection();
      this.notifyListeners({
        type: WebSocketMessageType.CONNECTION,
        timestamp: Date.now(),
        payload: { status: "disconnected" },
      });
    });

    this.socket.on("message", (data) => {
      try {
        this.handleMessage(data.data);
      } catch (error) {
        console.warn("Failed to handle message:", error);
      }
    });

    this.socket.on("error", (error) => {
      console.warn("WebSocket error:", error);
      this.notifyListeners({
        type: WebSocketMessageType.ERROR,
        timestamp: Date.now(),
        payload: error,
      });
    });
  }

  private handleMessage(data: unknown): void {
    try {
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;

      if (!parsedData.type) {
        console.error("Invalid message format");
        return;
      }
      if (parsedData.type === WebSocketMessageType.FRAME_UPDATE) {
        const messageAge = Date.now() - parsedData.timestamp;
        if (messageAge > 1000) {
          console.log("Discarding old frame update");
          return;
        }
      }

      this.notifyListeners(parsedData);
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  private notifyListeners(event: WebSocketEvent): void {
    this.listeners.get(event?.type)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in listener for ${event}:`, error);
      }
    });
  }

  private handleReconnection(): void {
    if (this.reconnecting || this.destroyed) return;
    this.reconnecting = true;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.notifyListeners({
        type: WebSocketMessageType.CONNECTION,
        timestamp: Date.now(),
        payload: { status: "failed" },
      });
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(async () => {
      try {
        await this.connect();
        this.reconnecting = false;
      } catch (error) {
        console.error("Failed to reconnect:", error);
        this.reconnecting = false;
        this.handleReconnection();
      }
    }, this.reconnectDelay);
  }

  public isConnected(): boolean {
    return this.socket !== null;
  }
}
