import { Viewport } from "pixi-viewport";
import { FederatedPointerEvent, Graphics, Sprite, Application } from "pixi.js";

export class TransformerManager {
  private app: Application;
  private viewport: Viewport;
  private transformer: Graphics;
  private handles: Graphics[];
  private target: Graphics | Sprite | null = null;
  private isResizing: boolean = false;
  private initialSize = { width: 0, height: 0 };
  private initialPosition = { x: 0, y: 0 };
  private initialPointerPosition = { x: 0, y: 0 };

  constructor(app: Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    this.transformer = new Graphics();
    this.handles = [];
    this.setupEventListeners();
    this.createTransformer();
  }

  private setupEventListeners(): void {
    this.app.stage.on("dragging", this.moveTransformer.bind(this));
    this.viewport.on("zoomed", this.moveTransformer.bind(this));
    this.viewport.on("moved", this.moveTransformer.bind(this));
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
        .stroke({ color: 0x3c82f6, width: lineSize, alignment: 0 });

      const handlePositions = [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 },
      ];

      handlePositions.forEach((offset, index) => {
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

    const dx =
      (event.global.x - this.initialPointerPosition.x) / this.viewport.scale.x;
    const dy =
      (event.global.y - this.initialPointerPosition.y) / this.viewport.scale.y;

    let newWidth = this.initialSize.width;
    let newHeight = this.initialSize.height;
    let newX = this.initialPosition.x;
    let newY = this.initialPosition.y;

    switch (index) {
      case 0: // Top-left
        newWidth = this.initialSize.width - dx;
        newHeight = this.initialSize.height - dy;
        newX = this.initialPosition.x + dx / 2;
        newY = this.initialPosition.y + dy / 2;
        break;
      case 1: // Top-right
        newWidth = this.initialSize.width + dx;
        newHeight = this.initialSize.height - dy;
        newX = this.initialPosition.x + dx / 2;
        newY = this.initialPosition.y + dy / 2;
        break;
      case 2: // Bottom-left
        newWidth = this.initialSize.width - dx;
        newHeight = this.initialSize.height + dy;
        newX = this.initialPosition.x + dx / 2;
        newY = this.initialPosition.y + dy / 2;
        break;
      case 3: // Bottom-right
        newWidth = this.initialSize.width + dx;
        newHeight = this.initialSize.height + dy;
        newX = this.initialPosition.x + dx / 2;
        newY = this.initialPosition.y + dy / 2;
        break;
    }

    this.target.width = newWidth;
    this.target.height = newHeight;
    this.target.position.set(newX, newY);
    this.moveTransformer();
  }

  public createTransformer(): void {
    this.transformer = new Graphics();
    this.handles = [
      new Graphics(),
      new Graphics(),
      new Graphics(),
      new Graphics(),
    ];

    this.handles.forEach((handle, index) => {
      this.viewport.addChild(handle);
      handle.zIndex = 1001;
      handle.eventMode = "static";

      handle.on("pointerdown", (e: FederatedPointerEvent) =>
        this.onResizeStart(e, index),
      );
    });
    this.viewport.addChild(this.transformer);
    this.transformer.zIndex = 1000;
  }

  private onResizeStart(event: FederatedPointerEvent, index: number): void {
    if (!this.target) return;
    console.log("resize start", index);
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

    const handleMove = (e: FederatedPointerEvent) =>
      this.onResizeMove(e, index);
    const handleEnd = () => {
      this.isResizing = false;
      this.app.stage.off("pointermove", handleMove);
      this.app.stage.off("pointerup", handleEnd);
      console.log("resize done");
    };

    this.app.stage.on("pointermove", handleMove);
    this.app.stage.on("pointerup", handleEnd);
  }

  public onSelect(target: Graphics | Sprite): void {
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
