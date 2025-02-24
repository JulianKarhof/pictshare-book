import { BaseObject } from "@web/components/canvas/objects";
import { StageService } from "@web/services/stage.service";
import { Application, FederatedPointerEvent } from "pixi.js";

export class DragManager {
  private _dragTarget: BaseObject | null = null;
  private _dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private _app: Application;
  private _stageService: StageService;
  private _lastUpdateTime: number = 0;
  private _updateInterval: number = 50;

  public constructor({ app }: { app: Application }) {
    this._app = app;
    this._setupEventListeners();
    this._stageService = StageService.getInstance();
  }

  private _setupEventListeners(): void {
    this._app.stage.on("pointerup", this._onDragEnd.bind(this));
    this._app.stage.on("pointerupoutside", this._onDragEnd.bind(this));
  }

  public onDragStart(event: FederatedPointerEvent, target: BaseObject): void {
    target.alpha = 0.8;
    this._dragTarget = target;

    const localPosition = target.parent.toLocal(event.global);
    this._dragOffset = {
      x: localPosition.x - target.x,
      y: localPosition.y - target.y,
    };

    window.addEventListener("pointermove", this._onDragMove.bind(this));
    window.addEventListener("pointerup", this._onDragEnd.bind(this));
  }

  private _onDragMove(event: PointerEvent): void {
    if (this._dragTarget) {
      this._app.stage.emit("dragging");

      const canvas = this._app.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newPosition = this._dragTarget.parent.toLocal({ x, y });

      this._dragTarget.position.set(
        newPosition.x - this._dragOffset.x,
        newPosition.y - this._dragOffset.y,
      );

      const currentTime = Date.now();
      if (currentTime - this._lastUpdateTime >= this._updateInterval) {
        this._stageService.sendFrameUpdate(this._dragTarget.toJson());
        this._lastUpdateTime = currentTime;
      }
    }
  }

  private _onDragEnd(): void {
    if (this._dragTarget) {
      window.removeEventListener("pointermove", this._onDragMove.bind(this));
      window.removeEventListener("pointerup", this._onDragEnd.bind(this));

      this._stageService.sendUpdate(this._dragTarget.toJson());

      this._dragTarget.alpha = 1;
      this._dragTarget = null;
    }
  }

  public cleanup(): void {
    window.removeEventListener("pointermove", this._onDragMove.bind(this));
    window.removeEventListener("pointerup", this._onDragEnd.bind(this));
    this._app.stage?.off("pointerup", this._onDragEnd.bind(this));
    this._app.stage?.off("pointerupoutside", this._onDragEnd.bind(this));
  }
}
