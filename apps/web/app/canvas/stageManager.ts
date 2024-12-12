import { Application, Assets, Container, Sprite } from "pixi.js";
import { Settings } from "./settings";
import { ViewportManager } from "./viewportManager";
import { DragManager } from "./dragManager";
import { TransformerManager } from "./transformerManager";
import { initDevtools } from "@pixi/devtools";
import { BaseShape, SerializedShape } from "./shapes/shape";
import { RectangleShape } from "./shapes/rectangle";
import { CircleShape } from "./shapes/circle";

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

  private onScaleChange?: (scale: number) => void;
  private onChange?: (data: SerializedShape[]) => void;

  constructor({
    onScaleChange,
    onChange,
  }: {
    onScaleChange?: (scale: number) => void;
    onChange?: (data: SerializedShape[]) => void;
  }) {
    this._app = new Application();
    this.onScaleChange = onScaleChange;
    this.parentContainer = new Container();
    this.onChange = onChange;
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

    this.setupEventListeners();
    this.loadAssets();
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
    child: BaseShape | Sprite,
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
    this.save();
  }

  public async save(): Promise<SerializedShape[]> {
    const stageObjects = this.parentContainer.children.map((child) => {
      if (child instanceof BaseShape) {
        return child.toJson();
      }

      return {
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
    localStorage.setItem("canvasData", JSON.stringify(stageObjects));
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

  public async load(data: SerializedShape[]): Promise<void> {
    for (const item of data) {
      let shape: BaseShape | Sprite;
      if (item.type === "circle") {
        shape = CircleShape.from(item);
      } else if (item.type === "rectangle") {
        shape = RectangleShape.from(item);
      } else {
        shape = new Sprite({
          texture: Assets.get(
            "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
          ),
        });

        shape.anchor.set(0.5);
      }

      shape.x = item.x;
      shape.y = item.y;
      shape.rotation = item.rotation;
      shape.width = item.width;
      shape.height = item.height;
      shape.scale.set(item.scaleX ?? 1, item.scaleY ?? 1);

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
