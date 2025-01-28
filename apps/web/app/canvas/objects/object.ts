import { Container } from "pixi.js";
import { v4 } from "uuid";
import { RectangleShape } from "./rectangle";
import { SerializedShape } from "./shape";
import { ImageObject, SerializedImage } from "./image";
import { CircleShape } from "./circle";

export interface SerializedObject {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
}

export abstract class BaseObject extends Container {
  id: string;
  readonly type: string;
  readonly isObject = true;

  constructor(type: string) {
    super();
    this.id = v4();
    this.type = type;
  }

  public toJson(): SerializedObject {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scale.x,
      scaleY: this.scale.y,
      width: this.width,
      height: this.height,
    };
  }

  public static from(data: unknown): BaseObject {
    if (!data || typeof data !== "object" || !("type" in data)) {
      throw new Error("Invalid object data");
    }

    switch (data.type) {
      case "rectangle":
        return RectangleShape.from(data as SerializedShape);
      case "circle":
        return CircleShape.from(data as SerializedShape);
      case "image":
        return ImageObject.from(data as SerializedImage);
      default:
        throw new Error(`Unknown object type: ${data.type}`);
    }
  }

  public update(data: SerializedObject): void {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.rotation;
    this.scale.set(data.scaleX, data.scaleY);
    this.width = data.width;
    this.height = data.height;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Used as a type guard
  public static typeguard(obj: any): obj is BaseObject {
    return obj.isObject === true;
  }
}
