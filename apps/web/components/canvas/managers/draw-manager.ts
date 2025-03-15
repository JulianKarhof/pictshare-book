import { Viewport } from "pixi-viewport";
import { FederatedPointerEvent, Graphics, PointData } from "pixi.js";
import simplify from "simplify-js";

interface DrawSettings {
  color?: number;
  lineWidth?: number;
}

export interface DrawingSchematic {
  points: PointData[];
  position: PointData;
  settings: DrawSettings;
}

export class DrawManager {
  private _points: PointData[] = [];
  private _isDrawing: boolean = false;
  private _active = false;
  private _onDone: (schematic: DrawingSchematic) => void;
  private _onStart?: () => void;
  private _onStop?: () => void;
  private _viewport: Viewport;
  private _graphics: Graphics;
  private _settings: DrawSettings;

  public constructor({
    viewport,
    onDone,
    onStart,
    onStop,
    settings,
  }: {
    viewport: Viewport;
    onDone: (schematic: DrawingSchematic) => void;
    onStart: () => void;
    onStop: () => void;
    settings?: DrawSettings;
  }) {
    this._viewport = viewport;
    this._onDone = onDone;
    this._onStart = onStart;
    this._onStop = onStop;
    this._settings = settings ?? {
      color: 0xffffff,
      lineWidth: 8,
    };

    this._graphics = new Graphics();
    this._graphics.zIndex = 1000;
    this._viewport.addChild(this._graphics);

    this._setupEventListeners();
  }

  private _setupEventListeners(): void {
    this._viewport.eventMode = "static";

    this._viewport.on("pointerdown", this._onPointerDown.bind(this));
    this._viewport.on("pointermove", this._onPointerMove.bind(this));
    this._viewport.on("pointerup", this._onPointerUp.bind(this));
    this._viewport.on("pointerupoutside", this._onPointerUp.bind(this));
  }

  private _draw(): void {
    this._graphics.clear();

    if (this._points.length < 2) return;

    this._graphics.moveTo(this._points[0].x, this._points[0].y);

    for (let i = 1; i < this._points.length; i++) {
      this._graphics.lineTo(this._points[i].x, this._points[i].y);
    }

    this._graphics.stroke({
      width: this._settings.lineWidth,
      color: this._settings.color,
      cap: "round",
      join: "round",
    });
  }

  private _onPointerDown(event: FederatedPointerEvent): void {
    if (!this._active) return;

    this._isDrawing = true;
    this._points = [];
    const localPos = event.getLocalPosition(this._viewport);
    this._points.push({ x: localPos.x, y: localPos.y });
    this._draw();
  }

  private _onPointerMove(event: FederatedPointerEvent): void {
    if (!this._isDrawing || !this._active) return;

    const localPos = event.getLocalPosition(this._viewport);
    this._points.push({ x: localPos.x, y: localPos.y });
    this._draw();
  }

  private _getBounds(points: PointData[]) {
    if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    return points.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      {
        minX: points[0].x,
        maxX: points[0].x,
        minY: points[0].y,
        maxY: points[0].y,
      },
    );
  }

  private _onPointerUp(): void {
    this._isDrawing = false;
    if (!this._active) return;

    const simplifiedPoints = simplify(this._points, 3, true);
    const bounds = this._getBounds(simplifiedPoints);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + width / 2;
    const centerY = bounds.minY + height / 2;

    const relativePoints = simplifiedPoints.map((point) => ({
      x: point.x - centerX,
      y: point.y - centerY,
    }));

    this._onDone({
      points: relativePoints,
      position: { x: centerX, y: centerY },
      settings: this._settings,
    });

    this._points = [];
    this._graphics.clear();
  }

  public startDrawing() {
    this._active = true;
    this._viewport.cursor = "crosshair";
    this._onStart?.();
  }

  public stopDrawing() {
    this._active = false;
    this._viewport.cursor = "default";
    this._onStop?.();
  }

  public get isDrawing(): boolean {
    return this._active;
  }
}
