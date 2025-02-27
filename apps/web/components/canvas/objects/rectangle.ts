import { ElementType } from "@api/routes/element/element.schema";
import { RectangleElementSchema } from "@api/routes/element/element.schema";
import {
  DisplayElement,
  DisplayElementJSON,
  DisplayElementParams,
  ElementFactory,
} from "./object";

export interface RectangleElementParams extends DisplayElementParams {
  width?: number;
  height?: number;
  stroke?: number | null;
  strokeWidth?: number | null;
  cornerRadius?: number | null;
  fill?: number | null;
}

export interface RectangleElementJSON extends DisplayElementJSON {
  width: number;
  height: number;
  stroke?: number | null;
  strokeWidth?: number | null;
  cornerRadius?: number;
  fill: number | null;
}

export class RectangleElement extends DisplayElement {
  protected readonly elementType = ElementType.RECTANGLE;

  private _stroke: number | null;
  private _strokeWidth: number | null;
  private _cornerRadius: number;
  private _fill: number | null;

  public constructor(params: RectangleElementParams = {}) {
    super(params);

    this._stroke = params.stroke ?? null;
    this._strokeWidth = params.strokeWidth ?? null;
    this._cornerRadius = params.cornerRadius ?? 0;
    this._fill = params.fill ?? null;

    this.draw();
  }

  protected draw(): void {
    const graphics = this.createGraphics();

    const x = -this._width / 2;
    const y = -this._height / 2;

    if (this._cornerRadius > 0) {
      graphics.roundRect(x, y, this._width, this._height, this._cornerRadius);
    } else {
      graphics.rect(x, y, this._width, this._height);
    }

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

    if (this._fill) graphics.fill(this._fill);

    this.addChild(graphics);
  }

  public setWidth(width: number): this {
    this._width = width;
    this.redraw();
    return this;
  }

  public getWidth(): number {
    return this._width;
  }

  public setHeight(height: number): this {
    this._height = height;
    this.redraw();
    return this;
  }

  public getHeight(): number {
    return this._height;
  }

  public setFill(color: number | null): this {
    this._fill = color;
    this.redraw();
    return this;
  }

  public getFill(): number | null {
    return this._fill;
  }

  public setStroke(color: number | null): this {
    this._stroke = color;
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

  public setCornerRadius(radius: number): this {
    this._cornerRadius = radius;
    this.redraw();
    return this;
  }

  public getCornerRadius(): number {
    return this._cornerRadius;
  }

  public resize(width: number, height: number): this {
    this._width = width;
    this._height = height;
    this.redraw();
    return this;
  }

  public override toJSON(): typeof RectangleElementSchema.static {
    return {
      ...super.baseToJSON(),
      type: this.elementType,
      width: this._width,
      height: this._height,
      stroke: this._stroke,
      strokeWidth: this._strokeWidth,
      cornerRadius: this._cornerRadius,
      fill: this._fill,
    };
  }

  public static fromJSON(
    json: typeof RectangleElementSchema.static,
  ): RectangleElement {
    const rectangle = new RectangleElement({
      id: json.id,
      x: json.x,
      y: json.y,
      angle: json.angle,
      scaleX: json.scaleX,
      scaleY: json.scaleY,
      fill: json.fill,
      zIndex: json.zIndex,
      width: json.width,
      height: json.height,
      stroke: json.stroke,
      strokeWidth: json.strokeWidth,
      cornerRadius: json.cornerRadius,
    });

    return rectangle;
  }
}

ElementFactory.register(ElementType.RECTANGLE, RectangleElement);
