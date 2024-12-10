import { Application, Assets, Sprite } from "pixi.js";
import { Settings } from "./settings";
import { ViewportManager } from "./viewportManager";
import { DragManager } from "./dragManager";
import { TransformerManager } from "./transformerManager";
import { initDevtools } from "@pixi/devtools";
import { BaseShape } from "./shapes/shape";

export class StageManager {
  private _app: Application;
  private _settings = Settings.getInstance();
  private viewportManager?: ViewportManager;
  private dragManager?: DragManager;
  private transformerManager?: TransformerManager;
  private currentScale: number = 0.2;

  private onScaleChange?: (scale: number) => void;

  constructor({ onScaleChange }: { onScaleChange: (scale: number) => void }) {
    this._app = new Application();
    this.onScaleChange = onScaleChange;
  }

  public async init(): Promise<void> {
    initDevtools({ app: this.app });

    await this.app.init({
      background: this._settings.backgroundColor,
      resizeTo: window,
      height: window.innerHeight,
      width: window.innerWidth,
      resolution: devicePixelRatio,
      antialias: true,
      autoDensity: true,
      preferWebGLVersion: 2,
    });

    this.viewportManager = new ViewportManager(this.app);
    this.dragManager = new DragManager(this.app);
    this.transformerManager = new TransformerManager(
      this.app,
      this.viewportManager.viewport,
    );

    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;

    const viewport = this.viewportManager.viewport;
    viewport.addEventListener("wheel", () => {
      this.currentScale = this.viewportManager?.scale ?? 0.2;
      this.onScaleChange?.(this.currentScale);
    });
    viewport.addEventListener("pinch", () => {
      this.currentScale = this.viewportManager?.scale ?? 0.2;
      this.onScaleChange?.(this.currentScale);
    });
    viewport.on("clicked", () => {
      this.transformerManager?.reset();
    });

    await Assets.load(
      "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
    );
  }

  public addInteractiveChild(child: BaseShape | Sprite): void {
    this.app.stage.addChild(child);

    child.eventMode = "static";
    child.cursor = "pointer";
    child.x = this.viewportManager?.viewport.center.x ?? 0;
    child.y = this.viewportManager?.viewport.center.y ?? 0;

    child.on("pointerdown", (event) =>
      this.dragManager?.onDragStart(event, child),
    );
    child.on("click", () => this.transformerManager?.onSelect(child));

    this.transformerManager?.onSelect(child);
    this.viewportManager?.viewport.addChild(child);
  }

  public get app(): Application {
    return this._app;
  }

  public get settings(): Settings {
    return this._settings;
  }

  public get canvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  public cleanup(): void {
    this.dragManager?.cleanup();
    this.transformerManager?.cleanup();
    this.app.destroy(true);
  }
}
