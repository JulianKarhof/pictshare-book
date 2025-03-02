import { ElementType } from "@api/routes/element/element.schema";
import { RectangleElementSchema } from "@api/routes/element/element.schema";
import { ElementFactory } from "./object";
import { ShapeElement, ShapeElementParams } from "./shape";

export interface RectangleElementParams extends ShapeElementParams {
  cornerRadius?: number | null;
}

export class RectangleElement extends ShapeElement {
  protected readonly elementType = ElementType.RECTANGLE;

  private _cornerRadius: number;

  public constructor(params: RectangleElementParams = {}) {
    super(params);

    this._cornerRadius = params.cornerRadius ?? 0;

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

    if (this.strokeWidth !== null && this.strokeWidth > 0) {
      graphics.setStrokeStyle({
        width: this.strokeWidth,
        color: this.strokeColor,
      });
    }

    if (this.fillColor !== null) graphics.fill(this.fillColor);

    this.addChild(graphics);
  }

  public setCornerRadius(radius: number): this {
    this._cornerRadius = radius;
    this.redraw();
    return this;
  }

  public override toJSON(): typeof RectangleElementSchema.static {
    return {
      ...super.baseToJSON(),
      type: this.elementType,
      cornerRadius: this._cornerRadius,
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
