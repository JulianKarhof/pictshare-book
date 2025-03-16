import { ElementSchema } from "@api/routes/element/element.schema";
import { ImageReturnSchema } from "@api/routes/image/image.schema";
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

  private static readonly _FRAME_UPDATE_THROTTLE_MS = 50;
  private static readonly _CURSOR_SYNC_THROTTLE_MS = 50;

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

  private _lastInBetweenUpdate = 0;

  public sendFrameUpdate(element: typeof ElementSchema.static): void {
    const now = Date.now();
    if (
      now - this._lastInBetweenUpdate <
      StageService._FRAME_UPDATE_THROTTLE_MS
    ) {
      return;
    }

    this._ws.send({
      type: WebSocketEventType.FRAME_UPDATE,
      payload: element,
    });
    this._lastInBetweenUpdate = now;
  }

  private _lastCursorSync = 0;

  public sendCursorSync({
    x,
    y,
    cursor,
  }: { x: number; y: number; cursor?: string }): void {
    const now = Date.now();
    if (now - this._lastCursorSync < StageService._CURSOR_SYNC_THROTTLE_MS) {
      return;
    }

    this._ws.send({
      type: WebSocketEventType.CURSOR_SYNC,
      payload: {
        x: x,
        y: y,
        cursor: cursor ?? "default",
      },
    });
    this._lastCursorSync = now;
  }

  public async sendCreate(
    element: typeof ElementSchema.static,
  ): Promise<string> {
    if (!this._canvasId) {
      throw new Error("Canvas id not initialized");
    }

    const { data, error } = await client
      .projects({ id: this._canvasId })
      .elements.post(element);

    if (error) {
      throw new Error("Failed to create element");
    }

    this._ws.send({
      type: WebSocketEventType.SHAPE_CREATE,
      payload: {
        ...element,
        id: data.id,
      },
    });

    return data.id;
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

  private _createFileList = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => {
      dataTransfer.items.add(file);
    });
    return dataTransfer.files;
  };

  public async sendImageCreate(
    files: File[],
  ): Promise<(typeof ImageReturnSchema.static)[]> {
    if (!this._canvasId) {
      throw new Error("Canvas id not initialized");
    }

    const { data, error } = await client
      .projects({ id: this._canvasId })
      .images.post({
        files: this._createFileList(files),
      });

    if (error) {
      throw new Error(`Failed to upload images`);
    }

    this._ws.send({
      type: WebSocketEventType.IMAGE_CREATE,
      payload: {
        images: data,
      },
    });

    return data;
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
