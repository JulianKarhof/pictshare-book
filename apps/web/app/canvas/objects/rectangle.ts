import { GraphicsContext } from "pixi.js";
import { BaseShape } from "./shape";
import { ShapeElementSchema } from "@api/routes/element/element.schema";

export class RectangleShape extends BaseShape {
  static readonly TYPE = "RECTANGLE";

  constructor(color?: number | null) {
    const context = new GraphicsContext()
      .rect(0, 0, 400, 400)
      .fill(color ?? 0xcb9df0);

    super({
      context,
      shapeType: RectangleShape.TYPE,
    });
    this.pivot.set(this.width / 2, this.height / 2);
  }

  public static override from(
    data: typeof ShapeElementSchema.static,
  ): RectangleShape {
    return Object.assign(new RectangleShape(data.fill), data);
  }
}
