import { GraphicsContext } from "pixi.js";
import { BaseShape, SerializedShape } from "./shape";

export class CircleShape extends BaseShape {
  static readonly TYPE = "circle";

  constructor(color: number = 0xcb9df0) {
    const context = new GraphicsContext().circle(0, 0, 200).fill(color);

    super(context, CircleShape.TYPE, color);
  }

  public static override from(data: SerializedShape): CircleShape {
    return Object.assign(new CircleShape(data.color), data);
  }
}
