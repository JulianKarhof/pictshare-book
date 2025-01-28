import { GraphicsContext } from "pixi.js";
import { BaseShape, SerializedShape } from "./shape";

export class RectangleShape extends BaseShape {
  static readonly TYPE = "rectangle";

  constructor(color: number = 0xcb9df0) {
    const context = new GraphicsContext().rect(0, 0, 400, 400).fill(color);

    super(context, RectangleShape.TYPE, color);
    this.pivot.set(this.width / 2, this.height / 2);
  }

  public static override from(data: SerializedShape): RectangleShape {
    return Object.assign(new RectangleShape(data.color), data);
  }
}
