import type { App } from "@api/index.js";
import { ElementSchema } from "@api/routes/element/element.schema.js";
import { treaty } from "@elysiajs/eden";
import { initDevtools } from "@pixi/devtools";
import {
  DragManager,
  TransformerManager,
  ViewportManager,
  WebSocketManager,
  WebSocketMessageType,
} from "@web/components/canvas/managers";
import { BaseObject } from "@web/components/canvas/objects";
import { Settings } from "@web/components/canvas/settings";
import env from "@web/util/env";
import { Application, Assets, Container, Rectangle } from "pixi.js";

interface InteractiveChildOptions {
  selectAfterCreation?: boolean;
}

export class StageManager {
  private _canvasId: string;
  private _app: Application;
  private _settings = Settings.getInstance();
  private _viewportManager?: ViewportManager;
  private dragManager?: DragManager;
  private transformerManager?: TransformerManager;
  private currentScale: number = 0.2;
  private parentContainer: Container;
  private socketManager: WebSocketManager;
  private client = treaty<App>(env.BACKEND_URL);

  private onScaleChange?: (scale: number) => void;

  constructor({
    canvasId,
    onScaleChange,
  }: {
    canvasId: string;
    onScaleChange?: (scale: number) => void;
  }) {
    this._canvasId = canvasId;
    this.onScaleChange = onScaleChange;
    this._app = new Application();
    this.parentContainer = new Container();
    this.socketManager = WebSocketManager.getInstance(canvasId);
  }

  public async init(): Promise<void> {
    initDevtools({ app: this._app });

    await this._app.init({
      background: this._settings.backgroundColor,
      resizeTo: window,
      height: window.innerHeight,
      width: window.innerWidth,
      resolution: devicePixelRatio,
      antialias: true,
      autoDensity: true,
      preferWebGLVersion: 2,
    });

    if (!this.socketManager.isConnected()) {
      this.socketManager.connect();
    }

    this._viewportManager = new ViewportManager(this._app);
    this.dragManager = new DragManager({
      app: this._app,
      canvasId: this._canvasId,
    });
    this.transformerManager = new TransformerManager({
      app: this._app,
      viewport: this._viewportManager.viewport,
      id: this._canvasId,
    });

    this._app.stage.eventMode = "static";
    this._app.stage.hitArea = this._app.screen;

    this._viewportManager?.viewport.addChild(this.parentContainer);

    this.loadCanvas();

    this.socketManager.subscribe(
      WebSocketMessageType.SHAPE_CREATE,
      async (data) => {
        this.addInteractiveChild(await BaseObject.from(data.payload));
      },
    );
    this.socketManager.subscribe(WebSocketMessageType.SHAPE_UPDATE, (data) => {
      this.updateShape(data.payload);
    });
    this.socketManager.subscribe(WebSocketMessageType.FRAME_UPDATE, (data) => {
      this.updateShape(data.payload);
    });

    this.setupEventListeners();
  }

  private async loadCanvas(): Promise<void> {
    const response = await this.client
      .projects({ id: this._canvasId })
      .elements.get();

    if (response.status !== 200) {
      return console.error(response.error);
    }

    const sortedResponse = response.data?.sort((a) =>
      a.type === "IMAGE" ? -1 : 1,
    );

    sortedResponse?.forEach(async (item) => {
      if (item.type === "IMAGE") {
        await Assets.load(item.url);
      }

      const shape = await BaseObject.from(item);

      this.addInteractiveChild(shape, {
        selectAfterCreation: false,
      });
    });
  }

  public async saveCanvas(): Promise<void> {
    const stageObjects = this.parentContainer.children
      .map((child) => {
        if (BaseObject.typeguard(child)) {
          return child.toJson();
        }
      })
      .filter((item) => item !== undefined);

    await this.client
      .projects({ id: this._canvasId })
      .elements.bulk.put(stageObjects);
  }

  private updateShape(data: typeof ElementSchema.static): void {
    this.parentContainer.children.forEach((child) => {
      if (BaseObject.typeguard(child)) {
        if (child.id === data.id) child.update(data);
      }
    });
  }

  private setupEventListeners(): void {
    const viewport = this._viewportManager?.viewport;
    viewport?.addEventListener("wheel", () => {
      this.currentScale = this._viewportManager?.scale ?? 0.2;
      this.onScaleChange?.(this.currentScale);
    });
    viewport?.addEventListener("pinch", () => {
      this.currentScale = this._viewportManager?.scale ?? 0.2;
      this.onScaleChange?.(this.currentScale);
    });
    viewport?.on("clicked", () => {
      this.transformerManager?.reset();
    });
    this._app?.stage.on("dragging", this.save.bind(this));
    this._app?.stage.on("click", this.save.bind(this));
    this._app?.stage.on("drag-end", this.save.bind(this));
  }

  private async loadAssets(): Promise<void> {
    const canvasData = localStorage.getItem("canvasData");
    if (canvasData) {
      await this.load(JSON.parse(canvasData));
    }
  }

  public addShape(shape: BaseObject): void {
    if (this._viewportManager) {
      const center = this._viewportManager.viewport.center;
      shape.position.set(center.x, center.y);
    }

    this.addInteractiveChild(shape);
    this.socketManager.sendObjectCreate(shape, this._canvasId);
  }

  private addInteractiveChild(
    child: BaseObject,
    options: InteractiveChildOptions = {
      selectAfterCreation: true,
    },
  ): BaseObject {
    child.eventMode = "static";
    child.cursor = "pointer";

    child.on("pointerdown", (event) =>
      this.dragManager?.onDragStart(event, child),
    );
    child.on("click", () => this.transformerManager?.onSelect(child));

    if (options.selectAfterCreation) this.transformerManager?.onSelect(child);
    this.parentContainer.addChild(child);
    this.save();

    return child;
  }

  public async save(): Promise<(typeof ElementSchema.static)[]> {
    const stageObjects = this.parentContainer.children
      .map((child) => {
        if (BaseObject.typeguard(child)) {
          return child.toJson();
        }
      })
      .filter((item) => item !== undefined);

    return stageObjects;
  }

  public async load(data: (typeof ElementSchema.static)[]): Promise<void> {
    for (const item of data) {
      const shape = await BaseObject.from(item);

      this.addInteractiveChild(shape, {
        selectAfterCreation: false,
      });
    }
  }

  public cleanup(): void {
    this._app.destroy(true, {
      children: true,
    });
    this.dragManager?.cleanup();
    this.transformerManager?.cleanup();
  }

  public get app(): Application {
    return this._app;
  }

  public get settings(): Settings {
    return this._settings;
  }

  public get canvas(): HTMLCanvasElement {
    return this._app.canvas;
  }

  public async download(): Promise<void> {
    this._app?.renderer.extract.download({
      target: this.parentContainer,
      filename: "book.png",
      resolution: 0.4,
      frame: new Rectangle(-5000, -5000, 10000, 10000),
    });
  }
}
