import { initDevtools } from "@pixi/devtools";
import { Application, Assets, Container } from "pixi.js";
import { DragManager } from "./dragManager";
import { Settings } from "./settings";
import { BaseObject, type SerializedObject } from "./objects/object";
import { TransformerManager } from "./transformerManager";
import { ViewportManager } from "./viewportManager";
import {
  ObjectTypes,
  WebSocketManager,
  WebSocketMessageType,
} from "./wsManager";

interface InteractiveChildOptions {
  location: { x: number; y: number };
  selectAfterCreation?: boolean;
}

export class StageManager {
  private _app: Application;
  private _settings = Settings.getInstance();
  private viewportManager?: ViewportManager;
  private dragManager?: DragManager;
  private transformerManager?: TransformerManager;
  private currentScale: number = 0.2;
  private parentContainer: Container;
  private socketManager: WebSocketManager;

  private onScaleChange?: (scale: number) => void;
  private onChange?: (data: SerializedObject[]) => void;

  constructor({
    onScaleChange,
    onChange,
  }: {
    onScaleChange?: (scale: number) => void;
    onChange?: (data: SerializedObject[]) => void;
  }) {
    this._app = new Application();
    this.onScaleChange = onScaleChange;
    this.parentContainer = new Container();
    this.onChange = onChange;
    this.socketManager = WebSocketManager.getInstance();
    this.socketManager.connect();
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

    this.viewportManager = new ViewportManager(this._app);
    this.dragManager = new DragManager(this._app);
    this.transformerManager = new TransformerManager(
      this._app,
      this.viewportManager.viewport,
    );

    this._app.stage.eventMode = "static";
    this._app.stage.hitArea = this._app.screen;

    this.viewportManager?.viewport.addChild(this.parentContainer);

    this.socketManager.subscribe(WebSocketMessageType.SHAPE_UPDATE, (data) => {
      this.updateShape(data.payload);
    });
    this.socketManager.subscribe(WebSocketMessageType.FRAME_UPDATE, (data) => {
      this.updateShape(data.payload);
    });

    this.setupEventListeners();
    this.loadAssets();
  }

  private updateShape(data: ObjectTypes): void {
    this.parentContainer.children.forEach((child) => {
      if (child instanceof BaseObject) {
      }
      if (BaseObject.typeguard(child)) {
        child.update(data);
      }
    });
  }

  private setupEventListeners(): void {
    const viewport = this.viewportManager?.viewport;
    viewport?.addEventListener("wheel", () => {
      this.currentScale = this.viewportManager?.scale ?? 0.2;
      this.onScaleChange?.(this.currentScale);
    });
    viewport?.addEventListener("pinch", () => {
      this.currentScale = this.viewportManager?.scale ?? 0.2;
      this.onScaleChange?.(this.currentScale);
    });
    viewport?.on("clicked", () => {
      this.transformerManager?.reset();
    });
    this.app.stage.on("dragging", this.save.bind(this));
    this.app.stage.on("click", this.save.bind(this));
    this.app.stage.on("drag-end", this.save.bind(this));
  }

  private async loadAssets(): Promise<void> {
    await Assets.load(
      "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
    );

    const canvasData = localStorage.getItem("canvasData");
    if (canvasData) {
      await this.load(JSON.parse(canvasData));
    }
  }

  public addInteractiveChild(
    child: BaseObject,
    options: InteractiveChildOptions = {
      location: {
        x: this.viewportManager?.viewport.center.x ?? 0,
        y: this.viewportManager?.viewport.center.y ?? 0,
      },
      selectAfterCreation: true,
    },
  ): void {
    child.eventMode = "static";
    child.cursor = "pointer";
    child.x = options.location.x;
    child.y = options.location.y;

    child.on("pointerdown", (event) =>
      this.dragManager?.onDragStart(event, child),
    );
    child.on("click", () => this.transformerManager?.onSelect(child));

    if (options.selectAfterCreation) this.transformerManager?.onSelect(child);
    this.parentContainer.addChild(child);
    if (child instanceof BaseObject) {
      this.socketManager.sendObjectUpdate(child.toJson());
    }
    this.save();
  }

  public async save(): Promise<SerializedObject[]> {
    const stageObjects = this.parentContainer.children.map((child) => {
      if (BaseObject.typeguard(child)) {
        return child.toJson();
      }

      return {
        id: "error",
        x: child.x,
        y: child.y,
        width: child.width,
        height: child.height,
        scaleX: child.scale.x,
        scaleY: child.scale.y,
        color: child.tint,
        rotation: child.rotation,
        type: child.constructor.name,
      };
    });

    this.onChange?.(stageObjects);
    return stageObjects;
  }

  public async saveToFile(): Promise<void> {
    const jsonString = await this.save();
    const json = JSON.stringify(jsonString, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "canvas.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public async load(data: SerializedObject[]): Promise<void> {
    for (const item of data) {
      const shape = BaseObject.from(item);

      this.addInteractiveChild(shape, {
        location: { x: shape.x, y: shape.y },
        selectAfterCreation: false,
      });
    }
  }

  public async loadFromFile(): Promise<void> {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    return new Promise((resolve, reject) => {
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }
        const data = await file.text();
        await this.load(JSON.parse(data));
        resolve();
      };
      input.click();
    });
  }

  public cleanup(): void {
    this.dragManager?.cleanup();
    this.transformerManager?.cleanup();
    this._app.destroy(true);
    this.socketManager.disconnect();
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
    this._app.renderer.extract.download(this.parentContainer);
  }
}
