import { Graphics, GraphicsContext } from "pixi.js";

export interface SerializedShape {
  type: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  color: number;
}

export abstract class BaseShape extends Graphics {
  type: string;
  color: number;

  constructor(
    context: GraphicsContext,
    type: string,
    color: number = 0xcb9df0,
  ) {
    super(context);
    this.type = type;
    this.color = color;
    this.setupInteractivity();
  }

  private setupInteractivity(): void {
    this.eventMode = "static";
    this.cursor = "pointer";
  }

  public toJson(): SerializedShape {
    return {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static from(data: SerializedShape): BaseShape {
    throw new Error("Method not implemented! Use derived class");
  }
}
