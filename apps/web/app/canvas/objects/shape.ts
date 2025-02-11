import {
  ElementSchema,
  ShapeElementSchema,
} from "@api/routes/element/element.schema";
import { Graphics, GraphicsContext } from "pixi.js";
import { v4 } from "uuid";
import { BaseObject } from "./object";

type ShapeType = "RECTANGLE" | "CIRCLE";

export class BaseShape extends Graphics implements BaseObject {
  id: string;
  readonly type = "SHAPE";
  readonly isObject = true;
  shapeType: ShapeType;

  constructor({
    context,
    shapeType,
  }: {
    context: GraphicsContext;
    shapeType: ShapeType;
  }) {
    super(context);
    this.id = v4();
    this.shapeType = shapeType;
    this._setupInteractivity();
  }

  private _setupInteractivity(): void {
    this.eventMode = "static";
    this.cursor = "pointer";
  }

  public toJson(): typeof ElementSchema.static {
    return {
      id: this.id,
      type: "SHAPE",
      shapeType: this.shapeType,
      x: this.x,
      y: this.y,
      angle: this.rotation,
      scaleX: this.scale.x,
      scaleY: this.scale.y,
      width: this.width,
      height: this.height,
      fill: this.fillStyle.color,
      stroke: this.strokeStyle.color,
      strokeWidth: this.strokeStyle.width,
      zIndex: this.zIndex,
    };
  }

  public update(data: typeof ShapeElementSchema.static): void {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.angle;
    this.scale.set(data.scaleX, data.scaleY);
    this.width = data.width;
    this.height = data.height;
    this.fillStyle.color = data.fill ?? 0xcb9df0;
  }

  public static from(_data: typeof ShapeElementSchema.static): BaseShape {
    throw new Error("Method not implemented! Use derived class");
  }
}
