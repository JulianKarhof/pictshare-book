import { Application, Graphics, Sprite, FederatedPointerEvent } from "pixi.js";
import { Viewport } from "pixi-viewport";

export class TransformerManager {
  private app: Application;
  private viewport: Viewport;
  private transformer: Graphics;
  private selectedObject: Graphics | Sprite | null = null;
  private isResizing: boolean = false;
  private isRotating: boolean = false;
  private rotationHandle: Graphics;
  private resizeHandles: Graphics[] = [];
  private initialRotation: number = 0;
  private initialAngle: number = 0;
  private initialSize = { width: 0, height: 0 };
  private initialPosition = { x: 0, y: 0 };
  private initialPointerPosition = { x: 0, y: 0 };

  constructor(app: Application, viewport: Viewport) {
    this.app = app;
    this.viewport = viewport;
    this.transformer = new Graphics();
    this.rotationHandle = new Graphics();
    this.setupEventListeners();
    this.createTransformer();
  }

  private createTransformer(): void {
    this.transformer = new Graphics();
    // this.transformer.visible = false;
    this.viewport.addChild(this.transformer);

    this.rotationHandle = new Graphics().circle(0, 0, 8).fill(0x0000ff);
    this.rotationHandle.eventMode = "static";
    this.rotationHandle.cursor = "pointer";
    this.viewport.addChild(this.rotationHandle);

    const handlePositions = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ];

    handlePositions.forEach((pos, index) => {
      const handle = new Graphics();
      handle.rect(-5, -5, 10, 10).fill(0x0000ff);
      handle.eventMode = "static";
      handle.cursor = pos.x * pos.y === 1 ? "nwse-resize" : "nesw-resize";
      this.resizeHandles.push(handle);
      this.viewport.addChild(handle);

      handle.on("pointerdown", (e) => this.onResizeStart(e, index));
    });

    this.rotationHandle.on("pointerdown", this.onRotateStart.bind(this));
  }

  public onSelect(
    event: FederatedPointerEvent,
    target: Graphics | Sprite,
  ): void {
    // if (this.selectedObject === target) return;

    this.selectedObject = target;
    this.updateTransformer();
    this.transformer.visible = true;
  }

  private updateTransformer(): void {
    if (!this.selectedObject) return;

    const bounds = this.selectedObject.bounds;
    const padding = 10;

    this.transformer.clear();
    this.transformer
      .rect(bounds.x, bounds.y, bounds.width + padding, bounds.height + padding)
      .stroke({ width: 4, color: 0x0000ff });

    this.rotationHandle.position.set(
      bounds.x + bounds.width / 2,
      bounds.y - 30,
    );

    const handlePositions = [
      { x: bounds.x - padding, y: bounds.y - padding },
      { x: bounds.x + bounds.width + padding, y: bounds.y - padding },
      { x: bounds.x - padding, y: bounds.y + bounds.height + padding },
      {
        x: bounds.x + bounds.width + padding,
        y: bounds.y + bounds.height + padding,
      },
    ];

    this.resizeHandles.forEach((handle, i) => {
      handle.position.copyFrom(handlePositions[i]);
      handle.visible = true;
    });
  }

  private onRotateStart(event: FederatedPointerEvent): void {
    if (!this.selectedObject) return;

    this.isRotating = true;
    const center = this.selectedObject.position;
    const pointer = event.global;

    this.initialRotation = this.selectedObject.rotation;
    this.initialAngle = Math.atan2(pointer.y - center.y, pointer.x - center.x);

    this.app.stage.on("pointermove", this.onRotateMove.bind(this));
    this.app.stage.on("pointerup", this.onRotateEnd.bind(this));
  }

  private onRotateMove(event: FederatedPointerEvent): void {
    if (!this.isRotating || !this.selectedObject) return;

    const center = this.selectedObject.position;
    const pointer = event.global;
    const angle = Math.atan2(pointer.y - center.y, pointer.x - center.x);

    this.selectedObject.rotation =
      this.initialRotation + (angle - this.initialAngle);
    this.updateTransformer();
  }

  private onRotateEnd(): void {
    this.isRotating = false;
    this.app.stage.off("pointermove", this.onRotateMove.bind(this));
    this.app.stage.off("pointerup", this.onRotateEnd.bind(this));
  }

  private onResizeStart(
    event: FederatedPointerEvent,
    handleIndex: number,
  ): void {
    if (!this.selectedObject) return;

    this.isResizing = true;
    this.initialSize = {
      width: this.selectedObject.width,
      height: this.selectedObject.height,
    };
    this.initialPosition = {
      x: this.selectedObject.x,
      y: this.selectedObject.y,
    };
    this.initialPointerPosition = {
      x: event.global.x,
      y: event.global.y,
    };

    const handleMove = (e: FederatedPointerEvent) =>
      this.onResizeMove(e, handleIndex);
    const handleEnd = () => {
      this.isResizing = false;
      this.app.stage.off("pointermove", handleMove);
      this.app.stage.off("pointerup", handleEnd);
    };

    this.app.stage.on("pointermove", handleMove);
    this.app.stage.on("pointerup", handleEnd);
    this.updateTransformer();
  }

  private onResizeMove(
    event: FederatedPointerEvent,
    handleIndex: number,
  ): void {
    if (!this.isResizing || !this.selectedObject) return;

    const dx =
      (event.global.x - this.initialPointerPosition.x) / this.viewport.scale.x;
    const dy =
      (event.global.y - this.initialPointerPosition.y) / this.viewport.scale.y;

    let newWidth = this.initialSize.width;
    let newHeight = this.initialSize.height;
    let newX = this.initialPosition.x;
    let newY = this.initialPosition.y;

    switch (handleIndex) {
      case 0: // Top-left
        newWidth = this.initialSize.width - dx;
        newHeight = this.initialSize.height - dy;
        newX = this.initialPosition.x + dx;
        newY = this.initialPosition.y + dy;
        break;
      case 1: // Top-right
        newWidth = this.initialSize.width + dx;
        newHeight = this.initialSize.height - dy;
        newY = this.initialPosition.y + dy;
        break;
      case 2: // Bottom-left
        newWidth = this.initialSize.width - dx;
        newHeight = this.initialSize.height + dy;
        newX = this.initialPosition.x + dx;
        break;
      case 3: // Bottom-right
        newWidth = this.initialSize.width + dx;
        newHeight = this.initialSize.height + dy;
        break;
    }

    if (newWidth > 20 && newHeight > 20) {
      this.selectedObject.width = newWidth;
      this.selectedObject.height = newHeight;
      this.selectedObject.position.set(newX, newY);
      this.updateTransformer();
    }
  }

  private setupEventListeners(): void {
    this.app.stage.on("pointerdown", (event: FederatedPointerEvent) => {
      if (!this.selectedObject) return;

      const clickedTransformer =
        this.transformer.containsPoint(event.global) ||
        this.rotationHandle.containsPoint(event.global) ||
        this.resizeHandles.some((handle) => handle.containsPoint(event.global));

      if (!clickedTransformer) {
        // this.transformer.visible = false;
        // this.rotationHandle.visible = false;
        // this.resizeHandles.forEach((handle) => (handle.visible = false));
        // this.selectedObject = null;
      }
    });
  }

  public cleanup(): void {
    this.transformer.destroy();
    this.rotationHandle.destroy();
    this.resizeHandles.forEach((handle) => handle.destroy());
  }
}
