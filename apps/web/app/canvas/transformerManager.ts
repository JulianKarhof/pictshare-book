import { Viewport } from "pixi-viewport";
import { FederatedPointerEvent, Graphics, Sprite, Application } from "pixi.js";

export class TransformerManager {
  private app: Application;
  private viewport: Viewport;
  private transformer: Graphics;
  private handles: Graphics[];
  private target: Graphics | Sprite | null = null;
  private isResizing: boolean = false;

  constructor(app: Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    this.transformer = new Graphics();
    this.handles = [];
    this.setupEventListeners();
    this.createTransformer();
  }

  private setupEventListeners(): void {
    this.app.stage.on("pointerup", this.onDragEnd.bind(this));
    this.app.stage.on("pointerupoutside", this.onDragEnd.bind(this));
    this.app.stage.on("dragging", this.moveTransformer.bind(this));
    this.viewport.on("zoomed", this.moveTransformer.bind(this));
  }

  public moveTransformer(): void {
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

      this.transformer.clear();
      this.handles.forEach((handle) => handle.clear());

      this.transformer
        .rect(
          pos.x - dimensions.width / 2 - padding,
          pos.y - dimensions.height / 2 - padding,
          dimensions.height + padding * 2,
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

  private onResizeStart(event: FederatedPointerEvent, index: number): void {
    if (!this.target) return;
    console.log("resize start", index);
    this.isResizing = true;

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onResizeMove(_event: FederatedPointerEvent, index: number): void {
    if (!this.isResizing || !this.target) return;
    console.log("resize move");
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

  public onSelect(
    event: FederatedPointerEvent,
    target: Graphics | Sprite,
  ): void {
    if (this.target !== target) this.target = target;
    this.moveTransformer();
  }

  private onDragEnd(): void {}

  public cleanup(): void {}
}
