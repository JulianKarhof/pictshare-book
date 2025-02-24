import { ElementSchema } from "@api/routes/element/element.schema";
import { WebSocketEventType } from "@api/routes/ws/ws.schema";
import {
  WebSocketManager,
  WebSocketStatus,
} from "@web/components/canvas/managers";
import { client } from "@web/lib/client";

export class StageService {
  private static _instance: StageService | null = null;
  private _ws: WebSocketManager = new WebSocketManager();
  private _canvasId: string | null = null;
  private _initializationPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): StageService {
    if (!StageService._instance) {
      StageService._instance = new StageService();
    }
    return StageService._instance;
  }

  public async init(canvasId: string): Promise<StageService> {
    if (this._canvasId === canvasId && this._ws) {
      return this;
    }

    if (this._initializationPromise) {
      await this._initializationPromise;
      return this;
    }

    if (this._canvasId && this._canvasId !== canvasId) {
      this.destroy();
    }

    this._initializationPromise = (async () => {
      this._canvasId = canvasId;

      try {
        await this._ws.init((client) =>
          client.canvas({ id: canvasId }).subscribe(),
        );
      } finally {
        this._initializationPromise = null;
      }
    })();

    await this._initializationPromise;
    return this;
  }

  public sendFrameUpdate(element: typeof ElementSchema.static): void {
    this._ws.send({
      type: WebSocketEventType.FRAME_UPDATE,
      payload: element,
    });
  }

  public async sendCreate(
    element: typeof ElementSchema.static,
  ): Promise<string> {
    if (!this._canvasId) {
      throw new Error("canvas id not initialized");
    }

    const result = await client
      .projects({ id: this._canvasId })
      .elements.post(element);

    if (!result.data) {
      throw new Error("Failed to create element");
    }

    this._ws.send({
      type: WebSocketEventType.SHAPE_CREATE,
      payload: {
        ...element,
        id: result.data.id,
      },
    });

    return result.data.id;
  }

  public sendDelete(element: typeof ElementSchema.static): void {
    this._ws.send({
      type: WebSocketEventType.SHAPE_DELETE,
      payload: element,
    });
    client.elements({ id: element.id }).delete();
  }

  public sendUpdate(element: typeof ElementSchema.static): void {
    this._ws.send({
      type: WebSocketEventType.SHAPE_UPDATE,
      payload: element,
    });
    client.elements({ id: element.id }).put(element);
  }

  public get ws(): WebSocketManager {
    return this._ws;
  }

  public subscribe = this._ws.subscribe.bind(this._ws);
  public unsubscribe = this._ws.unsubscribe.bind(this._ws);

  public destroy() {
    if (this._ws?.status === WebSocketStatus.OPEN) {
      this._ws?.destroy();
      this._canvasId = null;
    }
  }
}
