import { WebSocketEventType } from "@api/routes/ws/ws.schema";
import { StageService } from "@web/services/stage.service";
import { Viewport } from "pixi-viewport";
import { Application, FederatedPointerEvent, Graphics } from "pixi.js";
import { DisplayElement, ImageElement } from "../objects";
import { TextElement } from "../objects/text";

export class TransformerManager {
  private _app: Application;
  private _viewport: Viewport;
  private _stageService: StageService;
  private _transformer: Graphics = new Graphics();
  private _target: DisplayElement | null = null;
  private _isResizing: boolean = false;
  private _initialSize = { width: 0, height: 0 };
  private _initialPosition = { x: 0, y: 0 };
  private _initialPointerPosition = { x: 0, y: 0 };
  private _shiftPressed = false;
  private _optionPressed = false;
  private _ctrlPressed = false;

  private _initialScale = { x: 1, y: 1 };
  private _handles: Graphics[] = [
    new Graphics(),
    new Graphics(),
    new Graphics(),
    new Graphics(),
  ];
  private _signs = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];

  public constructor({
    app,
    viewport,
  }: { app: Application; viewport: Viewport }) {
    this._app = app;
    this._viewport = viewport;
    this._setupEventListeners();
    this.createTransformer();
    this._stageService = StageService.getInstance();

    this._stageService.subscribe(WebSocketEventType.FRAME_UPDATE, () => {
      this.reset();
    });
  }

  private _setupEventListeners(): void {
    this._app.stage.on("dragging", this.moveTransformer.bind(this));
    this._viewport.on("zoomed", this.moveTransformer.bind(this));
    this._viewport.on("moved", this.moveTransformer.bind(this));
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
    window.addEventListener("click", function (event) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    });
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Shift") this._shiftPressed = true;
    if (event.key === "Alt") this._optionPressed = true;
    if (event.key === "Control") this._ctrlPressed = true;
  }
  public handleKeyUp(event: KeyboardEvent): void {
    if (event.key === "Shift") this._shiftPressed = false;
    if (event.key === "Alt") this._optionPressed = false;
    if (event.key === "Control") this._ctrlPressed = false;
  }

  public moveTransformer(): void {
    this._transformer.clear();
    this._handles.forEach((handle) => handle.clear());

    if (this._target) {
      const padding = 0;

      const scaleFactor =
        Math.pow(2, Math.log2((100 / this._viewport.scale.x) * 1)) / 100;
      const lineSize = 1.5 * scaleFactor;
      const handleSize = 10 * scaleFactor;

      const pos = this._target.position;
      const dimensions = {
        width: this._target.width,
        height: this._target.height,
      };

      this._transformer
        .rect(
          pos.x - dimensions.width / 2 - padding,
          pos.y - dimensions.height / 2 - padding,
          dimensions.width + padding * 2,
          dimensions.height + padding * 2,
        )
        .stroke({ color: 0x3c82f6, width: lineSize, alignment: 0 });

      if (this._target instanceof TextElement && this._target.isEditing) return;
      this._signs.forEach((offset, index) => {
        this._handles[index]
          .rect(
            pos.x + dimensions.width * offset.x * 0.5 - handleSize / 2,
            pos.y + dimensions.height * offset.y * 0.5 - handleSize / 2,
            handleSize,
            handleSize,
          )
          .fill(0xffffff)
          .stroke({ color: 0x3c82f6, width: lineSize });
        this._handles[index].cursor =
          offset.x * offset.y === 1 ? "nwse-resize" : "nesw-resize";
      });
    }
  }

  private _onResizeMove(event: PointerEvent, index: number): void {
    if (!this._isResizing || !this._target) return;

    const signX = this._signs[index].x;
    const signY = this._signs[index].y;

    const canvas = this._app.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const dx =
      ((x - this._initialPointerPosition.x) / this._viewport.scale.x) * signX;
    const dy =
      ((y - this._initialPointerPosition.y) / this._viewport.scale.y) * signY;

    let scaleX: number;
    let scaleY: number;
    let deltaWidth: number;
    let deltaHeight: number;

    const shouldKeepAspect =
      (this._target instanceof ImageElement ||
        this._target instanceof TextElement) &&
      !this._ctrlPressed
        ? true
        : this._shiftPressed;

    if (shouldKeepAspect) {
      const scaleDeltaX =
        (this._initialSize.width + dx) / this._initialSize.width;
      const scaleDeltaY =
        (this._initialSize.height + dy) / this._initialSize.height;
      const scaleDelta =
        Math.abs(scaleDeltaX) > Math.abs(scaleDeltaY)
          ? scaleDeltaX
          : scaleDeltaY;

      scaleX = this._initialScale.x * scaleDelta;
      scaleY = this._initialScale.y * scaleDelta;

      deltaWidth = this._initialSize.width * (scaleDelta - 1);
      deltaHeight = this._initialSize.height * (scaleDelta - 1);
    } else {
      scaleX =
        (this._initialScale.x * (this._initialSize.width + dx)) /
        this._initialSize.width;
      scaleY =
        (this._initialScale.y * (this._initialSize.height + dy)) /
        this._initialSize.height;

      deltaWidth =
        this._initialSize.width * (scaleX / this._initialScale.x - 1);
      deltaHeight =
        this._initialSize.height * (scaleY / this._initialScale.y - 1);
    }

    const newX = this._optionPressed
      ? this._initialPosition.x
      : this._initialPosition.x + (deltaWidth / 2) * signX;
    const newY = this._optionPressed
      ? this._initialPosition.y
      : this._initialPosition.y + (deltaHeight / 2) * signY;
    this._target.scale.set(scaleX, scaleY);
    this._target.position.set(newX, newY);

    this._stageService.sendFrameUpdate(this._target.toJSON());
    this.moveTransformer();
  }

  public createTransformer(): void {
    this._handles.forEach((handle, index) => {
      this._viewport.addChild(handle);
      handle.zIndex = 1001;
      handle.eventMode = "static";

      handle.on("pointerdown", (e) => this._onResizeStart(e, index));
    });
    this._viewport.addChild(this._transformer);
    this._transformer.zIndex = 1000;
  }

  private _onResizeStart(event: FederatedPointerEvent, index: number): void {
    if (!this._target) return;
    this._isResizing = true;

    this._initialSize = {
      width: this._target.width,
      height: this._target.height,
    };
    this._initialPosition = {
      x: this._target.x,
      y: this._target.y,
    };
    this._initialPointerPosition = {
      x: event.global.x,
      y: event.global.y,
    };
    this._initialScale = { x: this._target.scale.x, y: this._target.scale.y };

    const handleMove = (e: PointerEvent) => this._onResizeMove(e, index);

    const handleEnd = () => {
      if (this._target) {
        this._stageService.sendUpdate(this._target.toJSON());
      }
      this._isResizing = false;
      this._app.stage.off("pointermove", handleMove);
      this._app.stage.off("pointerup", handleEnd);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
  }

  public select(target: DisplayElement): void {
    if (this._target?.getId() !== target.getId()) this._target = target;
    if (this._target instanceof TextElement && this._target.isEditing) {
      this._target.onInput(() => this.moveTransformer());
    }
    this.moveTransformer();
  }

  public get target(): DisplayElement | null {
    return this._target;
  }

  public reset(): void {
    this._target = null;
    this.moveTransformer();
  }

  public cleanup(): void {
    this._transformer.destroy();
    this._handles.forEach((handle) => handle.destroy());
  }
}
