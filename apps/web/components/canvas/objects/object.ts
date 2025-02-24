import { ElementSchema } from "@api/routes/element/element.schema";
import { Container } from "pixi.js";
import { v4 } from "uuid";
import { CircleShape } from "./circle";
import { ImageObject } from "./image";
import { RectangleShape } from "./rectangle";

export abstract class BaseObject extends Container {
  public id: string;
  public readonly type: string;
  public readonly isObject = true;

  public constructor({ type }: { type: string }) {
    super();
    this.id = v4();
    this.type = type;
  }

  public abstract toJson(): typeof ElementSchema.static;

  public static async from(
    data: typeof ElementSchema.static,
  ): Promise<BaseObject> {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid object data");
    }

    switch (data.type) {
      case "IMAGE":
        return ImageObject.from(data);
      case "SHAPE":
        switch (data.shapeType) {
          case "RECTANGLE":
            return RectangleShape.from(data);
          case "CIRCLE":
            return CircleShape.from(data);
          default:
            throw new Error(`Unknown shape type: ${data.shapeType}`);
        }
      case "TEXT":
        throw new Error("Text objects are not yet supported");
    }
  }

  public update(data: typeof ElementSchema.static): void {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.angle;
    this.scale.set(data.scaleX, data.scaleY);
    this.width = data.width;
    this.height = data.height;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Used as a type guard
  public static typeguard(obj: any): obj is BaseObject {
    return obj.isObject === true;
  }
}
