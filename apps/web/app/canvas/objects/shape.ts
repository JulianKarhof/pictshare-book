import { Graphics, GraphicsContext } from "pixi.js";
import { v4 } from "uuid";
import { BaseObject, SerializedObject } from "./object";

export interface SerializedShape extends SerializedObject {
  color: number;
}

export class BaseShape extends Graphics implements BaseObject {
  id: string;
  readonly type: string;
  readonly isObject = true;
  color: number;

  constructor(
    context: GraphicsContext,
    type: string,
    color: number = 0xcb9df0,
  ) {
    super(context);
    this.id = v4();
    this.type = type;
    this.color = color;
    this._setupInteractivity();
  }

  private _setupInteractivity(): void {
    this.eventMode = "static";
    this.cursor = "pointer";
  }

  public toJson(): SerializedShape {
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
      color: this.color,
    };
  }

  public update(data: SerializedShape): void {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.rotation;
    this.scale.set(data.scaleX, data.scaleY);
    this.width = data.width;
    this.height = data.height;
    this.color = data.color;
  }

  public static from(_data: SerializedObject): BaseShape {
    throw new Error("Method not implemented! Use derived class");
  }
}
