import { ElementType } from "@api/routes/element/element.schema";
import { ElementSchema } from "@api/routes/element/element.schema";
import { Container, Graphics } from "pixi.js";

export interface DisplayElementParams {
  id?: string;
  x?: number;
  y?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}

export interface DisplayElementJSON extends Required<DisplayElementParams> {
  type: ElementType;
}

export abstract class DisplayElement extends Container {
  protected id: string;
  protected isVisible: boolean;
  protected _width: number;
  protected _height: number;
  protected abstract readonly elementType: ElementType;

  public constructor(params: DisplayElementParams = {}) {
    super();

    this.id = params.id || crypto.randomUUID();
    this.isVisible = true; // TODO

    this.position.set(params.x ?? 0, params.y ?? 0);
    this.rotation = params.angle ?? 0;

    this._width = params.width ?? 800;
    this._height = params.height ?? 800;

    this.scale.set(params.scaleX ?? 1, params.scaleY ?? 1);

    this.alpha = 1; // TODO
    this.zIndex = params.zIndex ?? 0;
    this.visible = this.isVisible;

    this.sortableChildren = true;
    this.interactive = true;

    this.eventMode = "static";
    this.cursor = "pointer";
  }

  /**
   * Gets the unique identifier for this element
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Sets the unique identifier for this element
   */
  public setId(id: string): void {
    this.id = id;
  }

  /**
   * Updates multiple properties at once
   */
  public update(params: Partial<DisplayElementParams>): this {
    const needsRedraw = false;

    if (params.x !== undefined || params.y !== undefined) {
      this.position.set(
        params.x ?? this.position.x,
        params.y ?? this.position.y,
      );
    }

    if (params.angle !== undefined) {
      this.rotation = params.angle;
    }

    if (params.scaleX !== undefined || params.scaleY !== undefined) {
      this.scale.set(
        params.scaleX ?? this.scale.x,
        params.scaleY ?? this.scale.y,
      );
    }

    if (params.width !== undefined || params.height !== undefined) {
      this._width = params.width ?? this._width;
      this._height = params.height ?? this._height;
    }

    if (params.zIndex !== undefined) {
      this.zIndex = params.zIndex;
    }

    if (needsRedraw) {
      this.redraw();
    }

    return this;
  }

  /**
   * Sets the position of this element
   */
  public setPosition(x: number, y: number): this {
    return this.update({ x, y });
  }

  /**
   * Sets the rotation of this element in radians
   */
  public setRotation(rotation: number): this {
    return this.update({ angle: rotation });
  }

  /**
   * Sets the scale of this element
   */
  public setScale(scale: number): this;
  public setScale(scaleX: number, scaleY: number): this;
  public setScale(scaleX: number, scaleY?: number): this {
    return this.update({ scaleX, scaleY });
  }

  /**
   * Method for implementing the drawing logic in subclasses
   */
  protected abstract draw(): void;

  /**
   * Clears and redraws this element when visual properties change
   */
  protected redraw(): void {
    this.removeChildren();
    this.draw();
  }

  /**
   * Copy this element to create a new independent instance
   */
  public clone(): DisplayElement {
    const json = this.toJSON();
    const clone = ElementFactory.fromJSON(json);
    if (!clone) {
      throw new Error(`Failed to clone element of type ${this.elementType}`);
    }
    return clone;
  }

  /**
   * Converts this element to a JSON representation
   */
  public abstract toJSON(): typeof ElementSchema.static;

  protected baseToJSON(): DisplayElementJSON {
    return {
      type: this.elementType,
      id: this.id,
      x: this.position.x,
      y: this.position.y,
      angle: this.rotation,
      scaleX: this.scale.x,
      scaleY: this.scale.y,
      width: this._width,
      height: this._height,
      zIndex: this.zIndex,
    };
  }

  /**
   * Helper method to create a Graphics object
   */
  protected createGraphics(): Graphics {
    return new Graphics();
  }
}

export class ElementFactory {
  private static _registry = new Map<
    string,
    new (
      params: DisplayElementParams,
    ) => DisplayElement
  >();

  /**
   * Registers an element type with the factory
   */
  public static register<
    T extends DisplayElement,
    P extends DisplayElementParams,
  >(type: ElementType, constructor: new (params: P) => T): void {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ElementFactory._registry.set(type, constructor as any);
  }

  /**
   * Creates a DisplayElement from JSON data
   */
  public static fromJSON(
    json: Partial<DisplayElementJSON>,
  ): DisplayElement | null {
    const type = json.type;

    if (!type) {
      console.error("Missing element type in JSON");
      return null;
    }

    const constructor = ElementFactory._registry.get(type);

    if (!constructor) {
      console.error(`Unknown element type: ${type}`);
      return null;
    }

    const element = new constructor(json);
    return element;
  }
}
