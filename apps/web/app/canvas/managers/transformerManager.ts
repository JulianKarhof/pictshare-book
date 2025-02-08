import {
  WebSocketManager,
  WebSocketMessageType,
} from "@web/app/canvas/managers";
import { BaseObject } from "@web/app/canvas/objects";
import { Viewport } from "pixi-viewport";
import { Application, FederatedPointerEvent, Graphics } from "pixi.js";

export class TransformerManager {
  private app: Application;
  private viewport: Viewport;
  private socketManager: WebSocketManager;
  private transformer: Graphics = new Graphics();
  private target: BaseObject | null = null;
  private isResizing: boolean = false;
  private initialSize = { width: 0, height: 0 };
  private initialPosition = { x: 0, y: 0 };
  private initialPointerPosition = { x: 0, y: 0 };
  private shiftPressed = false;
  private optionPressed = false;
  private initialScale = { x: 1, y: 1 };
  private handles: Graphics[] = [
    new Graphics(),
    new Graphics(),
    new Graphics(),
    new Graphics(),
  ];
  private signs = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];

  constructor({
    app,
    viewport,
    id,
  }: { app: Application; viewport: Viewport; id: string }) {
    this.app = app;
    this.viewport = viewport;
    this.setupEventListeners();
    this.createTransformer();
    this.socketManager = WebSocketManager.getInstance(id);

    this.socketManager.subscribe(WebSocketMessageType.FRAME_UPDATE, () => {
      this.reset();
    });
  }

  private setupEventListeners(): void {
    this.app.stage.on("dragging", this.moveTransformer.bind(this));
    this.viewport.on("zoomed", this.moveTransformer.bind(this));
    this.viewport.on("moved", this.moveTransformer.bind(this));
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  public handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Shift") this.shiftPressed = true;
    if (event.key === "Alt") this.optionPressed = true;
  }
  public handleKeyUp(event: KeyboardEvent): void {
    if (event.key === "Shift") this.shiftPressed = false;
    if (event.key === "Alt") this.optionPressed = false;
  }

  public moveTransformer(): void {
    this.transformer.clear();
    this.handles.forEach((handle) => handle.clear());

    if (this.target) {
      const padding = 0;

      const scaleFactor =
        Math.pow(2, Math.log2((100 / this.viewport.scale.x) * 1)) / 100;
      const lineSize = 1.5 * scaleFactor;
      const handleSize = 10 * scaleFactor;

      const pos = this.target.position;
      const dimensions = {
        width: this.target.width,
        height: this.target.height,
      };

      this.transformer
        .rect(
          pos.x - dimensions.width / 2 - padding,
          pos.y - dimensions.height / 2 - padding,
          dimensions.width + padding * 2,
          dimensions.height + padding * 2,
        )
        .rect(this.target.position.x, this.target.position.y, 1, 1)
        .stroke({ color: 0x3c82f6, width: lineSize, alignment: 0 });

      this.signs.forEach((offset, index) => {
        this.handles[index]
          .rect(
            pos.x + dimensions.width * offset.x * 0.5 - handleSize / 2,
            pos.y + dimensions.height * offset.y * 0.5 - handleSize / 2,
            handleSize,
            handleSize,
          )
          .fill(0xffffff)
          .stroke({ color: 0x3c82f6, width: lineSize });
        this.handles[index].cursor =
          offset.x * offset.y === 1 ? "nwse-resize" : "nesw-resize";
      });
    }
  }

  private onResizeMove(event: FederatedPointerEvent, index: number): void {
    if (!this.isResizing || !this.target) return;

    const signX = this.signs[index].x;
    const signY = this.signs[index].y;

    const dx =
      ((event.global.x - this.initialPointerPosition.x) /
        this.viewport.scale.x) *
      signX;
    const dy =
      ((event.global.y - this.initialPointerPosition.y) /
        this.viewport.scale.y) *
      signY;

    let scaleX: number;
    let scaleY: number;
    let deltaWidth: number;
    let deltaHeight: number;

    if (this.shiftPressed) {
      const scaleDeltaX =
        (this.initialSize.width + dx) / this.initialSize.width;
      const scaleDeltaY =
        (this.initialSize.height + dy) / this.initialSize.height;
      const scaleDelta =
        Math.abs(scaleDeltaX) > Math.abs(scaleDeltaY)
          ? scaleDeltaX
          : scaleDeltaY;

      scaleX = this.initialScale.x * scaleDelta;
      scaleY = this.initialScale.y * scaleDelta;

      deltaWidth = this.initialSize.width * (scaleDelta - 1);
      deltaHeight = this.initialSize.height * (scaleDelta - 1);
    } else {
      scaleX =
        (this.initialScale.x * (this.initialSize.width + dx)) /
        this.initialSize.width;
      scaleY =
        (this.initialScale.y * (this.initialSize.height + dy)) /
        this.initialSize.height;

      deltaWidth = this.initialSize.width * (scaleX / this.initialScale.x - 1);
      deltaHeight =
        this.initialSize.height * (scaleY / this.initialScale.y - 1);
    }

    const newX = this.optionPressed
      ? this.initialPosition.x
      : this.initialPosition.x + (deltaWidth / 2) * signX;
    const newY = this.optionPressed
      ? this.initialPosition.y
      : this.initialPosition.y + (deltaHeight / 2) * signY;
    this.target.scale.set(scaleX, scaleY);
    this.target.position.set(newX, newY);

    this.socketManager.sendInBetweenUpdate(this.target.toJson());
    this.moveTransformer();
  }

  public createTransformer(): void {
    this.handles.forEach((handle, index) => {
      this.viewport.addChild(handle);
      handle.zIndex = 1001;
      handle.eventMode = "static";

      handle.on("pointerdown", (e) => this.onResizeStart(e, index));
    });
    this.viewport.addChild(this.transformer);
    this.transformer.zIndex = 1000;
  }

  private onResizeStart(event: FederatedPointerEvent, index: number): void {
    if (!this.target) return;
    this.isResizing = true;

    this.initialSize = {
      width: this.target.width,
      height: this.target.height,
    };
    this.initialPosition = {
      x: this.target.x,
      y: this.target.y,
    };
    this.initialPointerPosition = {
      x: event.global.x,
      y: event.global.y,
    };
    this.initialScale = { x: this.target.scale.x, y: this.target.scale.y };

    const handleMove = (e: FederatedPointerEvent) =>
      this.onResizeMove(e, index);

    const handleEnd = () => {
      if (this.target)
        this.socketManager.sendObjectUpdate(this.target.toJson());
      this.isResizing = false;
      this.app.stage.off("pointermove", handleMove);
      this.app.stage.off("pointerup", handleEnd);
    };

    this.app.stage.on("pointermove", handleMove);
    this.app.stage.on("pointerup", handleEnd);
  }

  public onSelect(target: BaseObject): void {
    if (this.target !== target) this.target = target;
    this.moveTransformer();
  }

  public reset(): void {
    this.target = null;
    this.moveTransformer();
  }

  public cleanup(): void {
    this.transformer.destroy();
    this.handles.forEach((handle) => handle.destroy());
  }
}
