import {
  DrawingElementSchema,
  ElementType,
} from "@api/routes/element/element.schema";
import { Graphics, PointData } from "pixi.js";
import { DisplayElement, DisplayElementParams, ElementFactory } from "./object";

export interface DrawingElementParams extends DisplayElementParams {
  stroke?: number | null;
  strokeWidth?: number | null;
  points?: PointData[];
}

export class DrawingElement extends DisplayElement {
  protected readonly elementType = ElementType.DRAWING;

  private _color: number;
  private _lineWidth: number;
  private _points: PointData[];

  public constructor(params: DrawingElementParams = {}) {
    super(params);

    this._color = params.stroke ?? 0x000000;
    this._lineWidth = params.strokeWidth ?? 8;
    this._points = params.points ?? [];

    this.draw();
  }

  private _getCurvePoints(points: PointData[]): PointData[] {
    if (points.length < 3) return points;

    const curvePoints: PointData[] = [];
    curvePoints.push(points[0]);

    for (let i = 1; i < points.length - 1; i++) {
      const previous = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      const handle1x = previous.x + (current.x - previous.x) * 0.5;
      const handle1y = previous.y + (current.y - previous.y) * 0.5;
      const handle2x = current.x + (next.x - current.x) * 0.5;
      const handle2y = current.y + (next.y - current.y) * 0.5;

      curvePoints.push(
        { x: handle1x, y: handle1y },
        { x: current.x, y: current.y },
        { x: handle2x, y: handle2y },
      );
    }

    curvePoints.push(points[points.length - 1]);
    return curvePoints;
  }

  private _drawPath(graphics: Graphics): void {
    if (this._points.length < 2) return;

    graphics.moveTo(this._points[0].x, this._points[0].y);

    if (this._points.length === 2) {
      graphics.lineTo(this._points[1].x, this._points[1].y);
    } else {
      const curvePoints = this._getCurvePoints(this._points);
      for (let i = 1; i < curvePoints.length - 2; i += 3) {
        graphics.bezierCurveTo(
          curvePoints[i].x,
          curvePoints[i].y,
          curvePoints[i + 1].x,
          curvePoints[i + 1].y,
          curvePoints[i + 2].x,
          curvePoints[i + 2].y,
        );
      }
    }
  }

  protected draw(): void {
    const graphics = this.createGraphics();

    this._drawPath(graphics);
    graphics.stroke({
      width: this._lineWidth + 40,
      color: 0x000000,
      alpha: 0,
      cap: "round",
      join: "round",
    });

    this._drawPath(graphics);
    graphics.stroke({
      width: this._lineWidth,
      color: this._color,
      cap: "round",
      join: "round",
    });

    this.addChild(graphics);
  }

  public override update(params: Partial<DrawingElementParams>): this {
    if (params.points !== undefined) {
      this._points = params.points ?? [];
    }

    super.update(params);
    return this;
  }

  public override resize(width: number, height: number): this {
    super.resize(width, height);
    return this;
  }

  public setColor(color: number): this {
    this._color = color;
    this.draw();
    return this;
  }

  public setLineWidth(width: number): this {
    this._lineWidth = width;
    this.draw();
    return this;
  }

  public getPoints(): PointData[] {
    return [...this._points];
  }

  public override toJSON(): typeof DrawingElementSchema.static {
    return {
      ...super.baseToJSON(),
      type: this.elementType,
      stroke: this._color,
      strokeWidth: this._lineWidth,
      points: this._points,
    };
  }

  public static fromJSON(
    json: typeof DrawingElementSchema.static,
  ): DrawingElement {
    const drawing = new DrawingElement({
      id: json.id,
      x: json.x,
      y: json.y,
      angle: json.angle,
      scaleX: json.scaleX,
      scaleY: json.scaleY,
      zIndex: json.zIndex,
      width: json.width,
      height: json.height,
      stroke: json.stroke,
      strokeWidth: json.strokeWidth,
      points: json.points,
    });

    return drawing;
  }
}

ElementFactory.register(ElementType.DRAWING, DrawingElement);
