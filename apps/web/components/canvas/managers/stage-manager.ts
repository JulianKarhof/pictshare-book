import { ElementSchema } from "@api/routes/element/element.schema";
import { WebSocketEventType } from "@api/routes/ws/ws.schema";
import { initDevtools } from "@pixi/devtools";
import {
  DragManager,
  TransformerManager,
  ViewportManager,
} from "@web/components/canvas/managers";
import {
  DisplayElement,
  ElementFactory,
  ImageElement,
} from "@web/components/canvas/objects";
import { Settings } from "@web/components/canvas/settings";
import { client } from "@web/lib/client";
import { isTest } from "@web/lib/env";
import { StageService } from "@web/services/stage.service";
import { Application, Assets, Container, Rectangle } from "pixi.js";
import { ShapeElement } from "../objects/shape";
import { TextElement } from "../objects/text";
import { CursorManager } from "./cursor-manager";

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
  private _cursorManager?: CursorManager;

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
      powerPreference: "high-performance",
    });

    this._viewportManager = new ViewportManager(this._app);
    this._dragManager = new DragManager({
      app: this._app,
    });
    this._transformerManager = new TransformerManager({
      app: this._app,
      viewport: this._viewportManager.viewport,
    });

    if (!isTest) {
      this._cursorManager = new CursorManager({
        projectId: this._canvasId,
        viewport: this._viewportManager.viewport,
      });
    }

    this._app.stage.eventMode = "static";
    this._app.stage.hitArea = this._app.screen;

    this._viewportManager?.viewport.addChild(this._parentContainer);

    this._loadCanvas();

    this._stageService.subscribe(
      WebSocketEventType.SHAPE_CREATE,
      async (data) => {
        const element = ElementFactory.fromJSON(data.payload);
        if (element) this._addInteractiveChild(element);
      },
    );
    this._stageService.subscribe(WebSocketEventType.SHAPE_UPDATE, (data) => {
      this._updateElement(data.payload);
    });
    this._stageService.subscribe(WebSocketEventType.SHAPE_DELETE, (data) => {
      this._removeInteractiveChild(data.payload.id);
    });
    this._stageService.subscribe(WebSocketEventType.FRAME_UPDATE, (data) => {
      this._updateElement(data.payload);
    });

    this._setupEventListeners();
    this._loadAssets();
  }

  private _loadAssets(): void {
    Assets.add({
      alias: "cursor",
      src: `${window.location.origin}/cursor.png`,
    });
    Assets.add({
      alias: "cursor-inside",
      src: `${window.location.origin}/cursor-inside.png`,
    });

    Assets.load("cursor");
    Assets.load("cursor-inside");
  }

  private _updateElement(data: typeof ElementSchema.static): void {
    this._parentContainer.children.forEach((child) => {
      if (child instanceof DisplayElement) {
        if (child.getId() === data.id) child.update(data);
      }
    });
  }

  private async _loadCanvas(): Promise<void> {
    const { error, data } = await client
      .projects({ id: this._canvasId })
      .elements.get();

    if (error) {
      return console.error(error.value);
    }

    const sortedResponse = data?.sort((a) => (a.type === "IMAGE" ? -1 : 1));

    for (const item of sortedResponse) {
      if (item instanceof ImageElement) {
        const src = item.getSrc();
        if (src) {
          await Assets.load(src);
        }
      }

      const element = ElementFactory.fromJSON(item);
      if (element) {
        this._addInteractiveChild(element, {
          selectAfterCreation: false,
        });
      }
    }
  }

  public async saveCanvas(): Promise<void> {
    const stageObjects = this._parentContainer.children
      .map((child) => {
        if (child instanceof DisplayElement) {
          return child.toJSON();
        }
        return undefined;
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

    document.addEventListener("wheel", this._preventWheelZoom.bind(this), {
      passive: false,
    });
  }

  public handleKeyPress(event: KeyboardEvent): void {
    if (event.key === "Backspace" || event.key === "Delete") {
      const target = this._transformerManager?.target;

      if (target && target instanceof DisplayElement) {
        if (target instanceof TextElement && target.isEditing) return;
        this._removeElement(target);
      }
    }
  }

  private _preventWheelZoom(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  }

  public addElement(element: DisplayElement): void {
    if (this._viewportManager) {
      const center = this._viewportManager.viewport.center;
      element.position.set(center.x, center.y);
    }

    const colorScheme = [0x640d5f, 0xd91656, 0xeb5b00, 0xffb200];
    if (element instanceof ShapeElement) {
      element.setFill({
        color: isTest
          ? 0x000000
          : colorScheme[Math.floor(Math.random() * colorScheme.length)],
      });
    }

    this._addInteractiveChild(element);

    this._stageService.sendCreate(element.toJSON()).then((id) => {
      element.setId(id);
    });
  }

  private _addInteractiveChild(
    child: DisplayElement,
    options: InteractiveChildOptions = {
      selectAfterCreation: true,
    },
  ): DisplayElement {
    child.on("pointerdown", (event) => {
      this._dragManager?.onDragStart(event, child),
        this._transformerManager?.reset();
    });
    child.on("click", () => this._transformerManager?.select(child));

    this._parentContainer.addChild(child);

    if (options.selectAfterCreation) {
      if (child instanceof ImageElement) {
        child.onDrawComplete(() => {
          this._transformerManager?.select(child);
        });
      } else {
        this._transformerManager?.select(child);
      }
    }

    return child;
  }

  private _removeElement(element: DisplayElement): void {
    this._removeInteractiveChild(element.getId());

    this._stageService.sendDelete(element.toJSON());
  }

  private _removeInteractiveChild(id: string): void {
    const child = this._parentContainer.children.find((child) =>
      child instanceof DisplayElement ? child.getId() === id : false,
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

  public async save(): Promise<object[]> {
    const stageObjects = this._parentContainer.children
      .map((child) => {
        if (child instanceof DisplayElement) {
          return child.toJSON();
        }
        return undefined;
      })
      .filter((item) => item !== undefined);

    return stageObjects;
  }

  public async load(data: object[]): Promise<void> {
    for (const item of data) {
      const element = ElementFactory.fromJSON(item);
      if (element) {
        this._addInteractiveChild(element, {
          selectAfterCreation: false,
        });
      }
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
      frame: new Rectangle(-5000, -5500, 18000, 18000),
    });
  }
}
