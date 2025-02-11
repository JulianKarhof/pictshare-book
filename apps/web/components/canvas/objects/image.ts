import {
  ElementSchema,
  ImageElementSchema,
} from "@api/routes/element/element.schema";
import { Sprite, Texture } from "pixi.js";
import { v4 } from "uuid";
import { BaseObject } from "./object";

export class ImageObject extends Sprite implements BaseObject {
  id: string;
  readonly type: string;
  readonly isObject = true;
  url: string;

  constructor({ url }: { url: string }) {
    super(Texture.from(url));
    this.id = v4();
    this.type = "IMAGE";
    this.anchor.set(0.5);
    this.height = 400;
    this.width = 400;
    this.url = url;
    this._setupInteractivity();
  }

  private _setupInteractivity(): void {
    this.eventMode = "static";
    this.cursor = "pointer";
  }

  public toJson(): typeof ImageElementSchema.static {
    return {
      id: this.id,
      type: "IMAGE",
      x: this.x,
      y: this.y,
      angle: this.rotation,
      scaleX: this.scale.x,
      scaleY: this.scale.y,
      width: this.width,
      height: this.height,
      zIndex: this.zIndex,
      url: this.url,
    };
  }

  public update(data: typeof ElementSchema.static): void {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.angle;
    this.scale.set(data.scaleX, data.scaleY);
    this.width = data.width;
    this.height = data.height;
  }

  public static from(data: typeof ImageElementSchema.static): ImageObject {
    const image = new ImageObject({
      url: data.url,
    });
    Object.assign(image, {
      ...data,
      scale: { x: data.scaleX, y: data.scaleY },
    });
    return image;
  }
}
