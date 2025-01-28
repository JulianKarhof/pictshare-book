import { Sprite, Texture } from "pixi.js";
import { v4 } from "uuid";
import { BaseObject, SerializedObject } from "./object";

export interface SerializedImage extends SerializedObject {
  url: string;
}

export class ImageObject extends Sprite implements BaseObject {
  id: string;
  readonly type: string;
  readonly isObject = true;
  url: string;

  constructor(url: string) {
    super(Texture.from(url));
    this.id = v4();
    this.type = "image";
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

  public toJson(): SerializedImage {
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
      url: this.url,
    };
  }

  public update = (data: SerializedImage): void => {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.rotation;
    this.scale.set(data.scaleX, data.scaleY);
    this.width = data.width;
    this.height = data.height;
  };

  public static from(data: SerializedImage): ImageObject {
    const image = new ImageObject(data.url);
    image.id = data.id;
    image.x = data.x;
    image.y = data.y;
    image.rotation = data.rotation;
    image.scale.set(data.scaleX, data.scaleY);
    image.width = data.width;
    image.height = data.height;
    return image;
  }
}
