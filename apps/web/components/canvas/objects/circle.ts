import {
  CircleElementSchema,
  ElementType,
} from "@api/routes/element/element.schema";
import { DisplayElement, DisplayElementParams, ElementFactory } from "./object";

export interface CircleElementParams extends DisplayElementParams {
  fill?: number | null;
  stroke?: number | null;
  strokeWidth?: number | null;
}

export class CircleElement extends DisplayElement {
  protected readonly elementType = ElementType.CIRCLE;

  private _fill: number | null;
  private _stroke: number | null;
  private _strokeWidth: number | null;

  public constructor(params: CircleElementParams = {}) {
    super(params);

    this._fill = params.fill ?? null;
    this._stroke = params.stroke ?? null;
    this._strokeWidth = params.strokeWidth ?? null;

    this.draw();
  }

  protected draw(): void {
    const graphics = this.createGraphics();

    if (
      this._stroke !== null &&
      this._strokeWidth !== null &&
      this._strokeWidth > 0
    ) {
      graphics.setStrokeStyle({
        width: this._strokeWidth,
        color: this._stroke,
      });
    }

    const radius = Math.min(this._width, this._height) / 2;

    graphics.circle(0, 0, radius);
    if (this._fill) graphics.fill(this._fill);

    this.addChild(graphics);
  }

  public setStroke(color: number | null): this {
    this._stroke = color;
    this.redraw();
    return this;
  }

  public setFill(color: number | null): this {
    this._fill = color;
    this.redraw();
    return this;
  }

  public getStroke(): number | null {
    return this._stroke;
  }

  public setStrokeWidth(width: number | null): this {
    this._strokeWidth = width;
    this.redraw();
    return this;
  }

  public getStrokeWidth(): number | null {
    return this._strokeWidth;
  }

  public resize(width: number, height: number): this {
    this._width = width;
    this._height = height;
    this.redraw();
    return this;
  }

  public override toJSON(): typeof CircleElementSchema.static {
    return {
      ...super.baseToJSON(),
      type: this.elementType,
      stroke: this._stroke,
      strokeWidth: this._strokeWidth,
      fill: this._fill,
      width: this._width,
      height: this._height,
    };
  }

  public static fromJSON(
    json: typeof CircleElementSchema.static,
  ): CircleElement {
    const circle = new CircleElement({
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
    });

    return circle;
  }
}

ElementFactory.register(ElementType.CIRCLE, CircleElement);
