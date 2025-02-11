import { WebSocketManager } from "@web/components/canvas/managers";
import { BaseObject } from "@web/components/canvas/objects";
import { Application, FederatedPointerEvent } from "pixi.js";

export class DragManager {
  private dragTarget: BaseObject | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private app: Application;
  private socketManager: WebSocketManager;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 50;

  constructor({ app, canvasId }: { app: Application; canvasId: string }) {
    this.app = app;
    this.setupEventListeners();
    this.socketManager = WebSocketManager.getInstance(canvasId);
  }

  private setupEventListeners(): void {
    this.app.stage.on("pointerup", this.onDragEnd.bind(this));
    this.app.stage.on("pointerupoutside", this.onDragEnd.bind(this));
  }

  public onDragStart(event: FederatedPointerEvent, target: BaseObject): void {
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

      const currentTime = Date.now();
      if (currentTime - this.lastUpdateTime >= this.updateInterval) {
        this.socketManager.sendInBetweenUpdate(this.dragTarget.toJson());
        this.lastUpdateTime = currentTime;
      }
    }
  }

  private onDragEnd(): void {
    if (this.dragTarget) {
      window.removeEventListener("pointermove", this.onDragMove.bind(this));
      window.removeEventListener("pointerup", this.onDragEnd.bind(this));

      this.socketManager.sendObjectUpdate(this.dragTarget.toJson());

      this.dragTarget.alpha = 1;
      this.dragTarget = null;
    }
  }

  public cleanup(): void {
    window.removeEventListener("pointermove", this.onDragMove.bind(this));
    window.removeEventListener("pointerup", this.onDragEnd.bind(this));
    this.app.stage?.off("pointerup", this.onDragEnd.bind(this));
    this.app.stage?.off("pointerupoutside", this.onDragEnd.bind(this));
  }
}
