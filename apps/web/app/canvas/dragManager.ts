import { Application, FederatedPointerEvent, Graphics, Sprite } from "pixi.js";

export class DragManager {
  private dragTarget: Graphics | Sprite | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.stage.on("pointerup", this.onDragEnd.bind(this));
    this.app.stage.on("pointerupoutside", this.onDragEnd.bind(this));
  }

  public onDragStart(
    event: FederatedPointerEvent,
    target: Graphics | Sprite,
  ): void {
    target.alpha = 0.8;
    this.dragTarget = target;

    const localPosition = target.parent.toLocal(event.global);
    this.dragOffset = {
      x: localPosition.x - target.x,
      y: localPosition.y - target.y,
    };

    window.addEventListener("pointermove", this.onDragMove.bind(this));
    window.addEventListener("pointerup", this.onDragEnd.bind(this));
  }

  private onDragMove(event: PointerEvent): void {
    if (this.dragTarget) {
      this.app.stage.emit("dragging");

      const canvas = this.app.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newPosition = this.dragTarget.parent.toLocal({ x, y });

      this.dragTarget.position.set(
        newPosition.x - this.dragOffset.x,
        newPosition.y - this.dragOffset.y,
      );
    }
  }

  private onDragEnd(): void {
    if (this.dragTarget) {
      window.removeEventListener("pointermove", this.onDragMove.bind(this));
      window.removeEventListener("pointerup", this.onDragEnd.bind(this));

      this.dragTarget.alpha = 1;
      this.dragTarget = null;
    }
  }

  public cleanup(): void {
    window.removeEventListener("pointermove", this.onDragMove.bind(this));
    window.removeEventListener("pointerup", this.onDragEnd.bind(this));
    this.app.stage.off("pointerup", this.onDragEnd.bind(this));
    this.app.stage.off("pointerupoutside", this.onDragEnd.bind(this));
  }
}
