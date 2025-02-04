import { GraphicsContext } from "pixi.js";
import { BaseShape } from "./shape";
import { ShapeElementSchema } from "@api/routes/element/element.schema";

export class CircleShape extends BaseShape {
  static readonly TYPE = "CIRCLE";

  constructor(color: number | null = null) {
    const context = new GraphicsContext()
      .circle(0, 0, 200)
      .fill(color ?? 0xcb9df0);

    super({ context, shapeType: CircleShape.TYPE });
  }

  public static from(data: typeof ShapeElementSchema.static): CircleShape {
    return Object.assign(new CircleShape(data.fill), data);
  }
}
