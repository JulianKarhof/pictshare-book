import { ElementSchema } from "@api/routes/element/element.schema";
import { WebSocketEventType } from "@api/routes/ws/ws.schema";
import { initDevtools } from "@pixi/devtools";
import {
  DragManager,
  TransformerManager,
  ViewportManager,
} from "@web/components/canvas/managers";
import { BaseObject, BaseShape } from "@web/components/canvas/objects";
import { Settings } from "@web/components/canvas/settings";
import { client } from "@web/lib/client";
import { StageService } from "@web/services/stage.service";
import { Application, Assets, Container, Rectangle } from "pixi.js";

interface InteractiveChildOptions {
  selectAfterCreation?: boolean;
}

export class StageManager {
  private _canvasId: string;
  private _app: Application;
  private _settings = Settings.getInstance();
  private _viewportManager?: ViewportManager;
  private _dragManager?: DragManager;
  private _transformerManager?: TransformerManager;
  private _currentScale: number = 0.2;
  private _parentContainer: Container;
  private _stageService: StageService;

  private _onScaleChange?: (scale: number) => void;

  public constructor({
    canvasId,
    onScaleChange,
  }: {
    canvasId: string;
    onScaleChange?: (scale: number) => void;
  }) {
    this._canvasId = canvasId;
    this._onScaleChange = onScaleChange;
    this._app = new Application();
    this._parentContainer = new Container();
    this._stageService = StageService.getInstance();
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

    this._viewportManager = new ViewportManager(this._app);
    this._dragManager = new DragManager({
      app: this._app,
    });
    this._transformerManager = new TransformerManager({
      app: this._app,
      viewport: this._viewportManager.viewport,
    });

    this._app.stage.eventMode = "static";
    this._app.stage.hitArea = this._app.screen;

    this._viewportManager?.viewport.addChild(this._parentContainer);

    this._loadCanvas();

    this._stageService.subscribe(
      WebSocketEventType.SHAPE_CREATE,
      async (data) => {
        this._addInteractiveChild(await BaseObject.from(data.payload));
      },
    );
    this._stageService.subscribe(WebSocketEventType.SHAPE_UPDATE, (data) => {
      this._updateShape(data.payload);
    });
    this._stageService.subscribe(WebSocketEventType.SHAPE_DELETE, (data) => {
      this._removeInteractiveChild(data.payload.id);
    });
    this._stageService.subscribe(WebSocketEventType.FRAME_UPDATE, (data) => {
      this._updateShape(data.payload);
    });

    this._setupEventListeners();
  }

  private _updateShape(data: typeof ElementSchema.static): void {
    this._parentContainer.children.forEach((child) => {
      if (BaseObject.typeguard(child)) {
        if (child.id === data.id) child.update(data);
      }
    });
  }

  private async _loadCanvas(): Promise<void> {
    const response = await client
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

      this._addInteractiveChild(shape, {
        selectAfterCreation: false,
      });
    });
  }

  public async saveCanvas(): Promise<void> {
    const stageObjects = this._parentContainer.children
      .map((child) => {
        if (BaseObject.typeguard(child)) {
          return child.toJson();
        }
      })
      .filter((item) => item !== undefined);

    await client
      .projects({ id: this._canvasId })
      .elements.bulk.put(stageObjects);
  }

  public zoomIn(): void {
    this._viewportManager?.zoom(0.25);
    this._onScaleChange?.(this._viewportManager?.scale ?? 0.2);
  }

  public zoomOut(): void {
    this._viewportManager?.zoom(-0.25);
    this._onScaleChange?.(this._viewportManager?.scale ?? 0.2);
  }

  private _setupEventListeners(): void {
    const viewport = this._viewportManager?.viewport;
    viewport?.addEventListener("wheel", () => {
      this._currentScale = this._viewportManager?.scale ?? 0.2;
      this._onScaleChange?.(this._currentScale);
    });
    viewport?.addEventListener("pinch", () => {
      this._currentScale = this._viewportManager?.scale ?? 0.2;
      this._onScaleChange?.(this._currentScale);
    });
    viewport?.on("clicked", () => {
      this._transformerManager?.reset();
    });
    this._app?.stage.on("dragging", this.save.bind(this));
    this._app?.stage.on("click", this.save.bind(this));
    this._app?.stage.on("drag-end", this.save.bind(this));

    window.addEventListener("keydown", this.handleKeyPress.bind(this));
  }

  public handleKeyPress(event: KeyboardEvent): void {
    if (event.key === "Backspace" || event.key === "Delete") {
      const target = this._transformerManager?.target;
      if (target) this._removeShape(target);
    }
  }

  private async _loadAssets(): Promise<void> {
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

    if (shape instanceof BaseShape) {
      const colorScheme = [0x640d5f, 0xd91656, 0xeb5b00, 0xffb200];
      shape.fillStyle.color =
        colorScheme[Math.floor(Math.random() * colorScheme.length)];
    }

    this._addInteractiveChild(shape);
    this._stageService.sendCreate(shape.toJson()).then((id) => {
      shape.id = id;
    });
  }

  private _addInteractiveChild(
    child: BaseObject,
    options: InteractiveChildOptions = {
      selectAfterCreation: true,
    },
  ): BaseObject {
    child.eventMode = "static";
    child.cursor = "pointer";

    child.on("pointerdown", (event) =>
      this._dragManager?.onDragStart(event, child),
    );
    child.on("click", () => this._transformerManager?.select(child));

    if (options.selectAfterCreation) this._transformerManager?.select(child);
    this._parentContainer.addChild(child);

    return child;
  }

  private _removeShape(shape: BaseObject): void {
    this._removeInteractiveChild(shape.id);

    this._stageService.sendDelete(shape.toJson());
  }

  private _removeInteractiveChild(id: string): void {
    const child = this._parentContainer.children.find((child) =>
      BaseObject.typeguard(child) ? child.id === id : false,
    );

    if (child) {
      child.off("pointerdown");
      child.off("click");
      if (this._transformerManager?.target === child) {
        this._transformerManager.reset();
      }
      this._parentContainer.removeChild(child);
    }
  }

  public async save(): Promise<(typeof ElementSchema.static)[]> {
    const stageObjects = this._parentContainer.children
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

      this._addInteractiveChild(shape, {
        selectAfterCreation: false,
      });
    }
  }

  public cleanup(): void {
    this._app.destroy(true, {
      children: true,
    });
    this._dragManager?.cleanup();
    this._transformerManager?.cleanup();
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
      target: this._parentContainer,
      filename: "book.png",
      resolution: 0.4,
      frame: new Rectangle(-5000, -5000, 10000, 10000),
    });
  }
}
