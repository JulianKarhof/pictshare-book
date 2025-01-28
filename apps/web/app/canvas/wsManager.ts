import type { App } from "@api/index.js";
import { treaty } from "@elysiajs/eden";
import { EdenWS } from "@elysiajs/eden/treaty";
import type { SerializedObject } from "./objects/object";
import { SerializedShape } from "./objects/shape";
import { SerializedImage } from "./objects/image";

export enum WebSocketMessageType {
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

export type ObjectTypes = SerializedShape | SerializedImage;

export interface ShapeUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.SHAPE_UPDATE;
  payload: ObjectTypes;
}

export interface FrameUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketMessageType.FRAME_UPDATE;
  payload: ObjectTypes;
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

  private client = treaty<App>("http://localhost:4000/");
  private listeners: Map<
    WebSocketMessageType,
    Set<(data: WebSocketEvent) => void>
  > = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 100;
  private readonly reconnectDelay = 3000;
  private lastInBetweenUpdate = 0;
  private readonly inBetweenUpdateThrottle = 50;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(): void {
    if (this.socket) {
      if (this.socket.ws.readyState === WebSocket.OPEN) {
        console.warn("WebSocket connection already exists");
        return;
      } else {
        this.disconnect();
      }
    }

    try {
      this.socket = this.client.ws.subscribe();
      console.log("WebSocket connected");
      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to establish WebSocket connection:", error);
      this.handleReconnection();
    }
  }

  public disconnect(): void {
    if (
      this.socket &&
      this.socket.ws.readyState !== WebSocket.CLOSED &&
      this.socket.ws.readyState !== WebSocket.CLOSING
    ) {
      this.socket.close();
    }
    this.socket = null;
    this.reconnectAttempts = 0;
  }

  public sendObjectUpdate(shape: SerializedObject): void {
    if (!this.socket) {
      console.error("WebSocket is not connected");
      return;
    }

    try {
      this.socket.send({
        type: WebSocketMessageType.SHAPE_UPDATE,
        timestamp: Date.now(),
        payload: shape,
      });
    } catch (error) {
      console.error("Failed to send shape update:", error);
    }
  }

  public sendInBetweenUpdate(shape: SerializedObject): void {
    if (!this.socket) {
      console.error("WebSocket is not connected");
      return;
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
      this.handleReconnection();
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
      this.notifyListeners({
        type: WebSocketMessageType.CONNECTION,
        timestamp: Date.now(),
        payload: { status: "disconnected" },
      });
      this.handleReconnection();
    });

    this.socket.on("message", (data) => {
      try {
        this.handleMessage(data.data);
      } catch (error) {
        console.error("Failed to handle message:", error);
      }
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
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

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  public isConnected(): boolean {
    return this.socket !== null;
  }
}
