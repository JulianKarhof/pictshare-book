import {
  CircleElementSchema,
  ElementType,
} from "@api/routes/element/element.schema";
import { ElementFactory } from "./element";
import { ShapeElement, ShapeElementParams } from "./shape";

export interface CircleElementParams extends ShapeElementParams {}

export class CircleElement extends ShapeElement {
  protected readonly elementType = ElementType.CIRCLE;

  public constructor(params: CircleElementParams = {}) {
    super(params);

    this.draw();
  }

  protected draw(): void {
    const graphics = this.createGraphics();

    if (
      this.strokeColor !== null &&
      this.strokeWidth !== null &&
      this.strokeWidth > 0
    ) {
      graphics.setStrokeStyle({
        width: this.strokeWidth,
        color: this.strokeColor,
      });
    }

    const radius = Math.min(this._width, this._height) / 2;

    graphics.circle(0, 0, radius);
    if (this.fillColor !== null) graphics.fill(this.fillColor);

    this.addChild(graphics);
  }

  public override toJSON(): typeof CircleElementSchema.static {
    return {
      ...super.baseToJSON(),
      type: this.elementType,
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
      fill: json.fill,
      stroke: json.stroke,
      strokeWidth: json.strokeWidth,
    });

    return circle;
  }
}

ElementFactory.register(ElementType.CIRCLE, CircleElement);
