import {
  ElementType,
  ImageElementSchema,
} from "@api/routes/element/element.schema";
import { Assets, Sprite, Texture } from "pixi.js";
import { AssetManager } from "../managers/asset-manager";
import { DisplayElement, DisplayElementParams, ElementFactory } from "./object";

export interface ImageElementParams extends DisplayElementParams {
  assetId: string;
  keepAspectRatio?: boolean;
}

export class ImageElement extends DisplayElement {
  protected readonly elementType = ElementType.IMAGE;

  private _src?: string;
  private _assetId: string;
  private _sprite: Sprite | null = null;
  private _originalWidth: number = 0;
  private _originalHeight: number = 0;
  private _targetWidth?: number;
  private _targetHeight?: number;
  private _keepAspectRatio: boolean;

  private _onDrawComplete: (() => void)[] = [];

  public constructor(params: ImageElementParams) {
    const baseImageSize = 1200;
    super({ ...params, height: baseImageSize, width: baseImageSize });

    const asset = AssetManager.getInstance().getAsset(params.assetId);

    this._src = asset?.src;
    this._assetId = params.assetId;
    this._targetWidth = params.width ?? baseImageSize;
    this._targetHeight = params.height ?? baseImageSize;
    this._keepAspectRatio = params.keepAspectRatio ?? true;

    this.draw();
  }

  protected async draw(): Promise<void> {
    if (!this._src) {
      this._renderPlaceholder();

      this._completeDrawing();
      return;
    }
    try {
      const texture: Texture = await Assets.load(this._src);

      this._sprite = new Sprite(texture);

      this._sprite.texture.source.autoGenerateMipmaps = true;
      this._sprite.texture.source.style.maxAnisotropy = 16;

      this._originalWidth = texture.width;
      this._originalHeight = texture.height;

      this._sprite.anchor.set(0.5);

      if (this._targetWidth !== undefined || this._targetHeight !== undefined) {
        this._resizeImage(this._targetWidth, this._targetHeight);
      }

      this.addChild(this._sprite);
      this._completeDrawing();
    } catch (error) {
      this._renderPlaceholder();
      this._completeDrawing();
      console.error(`Failed to load image: ${this._src}`, error);
    }
  }

  private _completeDrawing(): void {
    this._onDrawComplete.forEach((callback) => callback());
    this._onDrawComplete = [];
  }

  public onDrawComplete(callback: () => void): this {
    this._onDrawComplete.push(callback);
    return this;
  }

  private _renderPlaceholder(): void {
    const placeholder = this.createGraphics()
      .fill(0xcccccc)
      .setStrokeStyle({ width: 1, color: 0x999999 })
      .rect(-50, -50, 100, 100)
      .moveTo(-30, -30)
      .lineTo(30, 30)
      .moveTo(30, -30)
      .lineTo(-30, 30);
    this.addChild(placeholder);
  }

  public setSrc(src: string): this {
    this._src = src;
    this.redraw();
    return this;
  }

  public getSrc(): string | undefined {
    return this._src;
  }

  public resize(width?: number, height?: number): this {
    this._targetWidth = width;
    this._targetHeight = height;
    this._resizeImage(width, height);
    return this;
  }

  private _resizeImage(width?: number, height?: number): void {
    if (!this._sprite) return;

    if (width === undefined && height === undefined) {
      this._sprite.width = this._originalWidth;
      this._sprite.height = this._originalHeight;
      return;
    }

    if (this._keepAspectRatio) {
      const aspectRatio = this._originalWidth / this._originalHeight;

      if (width !== undefined && height !== undefined) {
        if (this._originalWidth <= this._originalHeight) {
          this._sprite.width = width;
          this._sprite.height = width / aspectRatio;
        } else {
          this._sprite.height = height;
          this._sprite.width = height * aspectRatio;
        }
      } else if (width !== undefined) {
        this._sprite.width = width;
        this._sprite.height = width / aspectRatio;
      } else if (height !== undefined) {
        this._sprite.height = height;
        this._sprite.width = height * aspectRatio;
      }
    } else {
      if (width !== undefined) this._sprite.width = width;
      if (height !== undefined) this._sprite.height = height;
    }
  }

  public setKeepAspectRatio(keep: boolean): this {
    this._keepAspectRatio = keep;
    if (this._targetWidth !== undefined || this._targetHeight !== undefined) {
      this._resizeImage(this._targetWidth, this._targetHeight);
    }
    return this;
  }

  public getOriginalDimensions(): { width: number; height: number } {
    return {
      width: this._originalWidth,
      height: this._originalHeight,
    };
  }

  public getCurrentDimensions(): { width: number; height: number } {
    return {
      width: this._sprite?.width || 0,
      height: this._sprite?.height || 0,
    };
  }

  public override toJSON(): typeof ImageElementSchema.static {
    const baseJson = super.baseToJSON();
    return {
      ...baseJson,
      type: this.elementType,
      assetId: this._assetId,
    };
  }

  public static fromJSON(json: typeof ImageElementSchema.static): ImageElement {
    const image = new ImageElement({
      id: json.id,
      x: json.x,
      y: json.y,
      angle: json.angle,
      scaleX: json.scaleX,
      scaleY: json.scaleY,
      zIndex: json.zIndex,
      width: json.width,
      height: json.width,
      assetId: json.assetId,
    });

    image._originalWidth = json.width;
    image._originalHeight = json.height;

    return image;
  }
}

ElementFactory.register(ElementType.IMAGE, ImageElement);
