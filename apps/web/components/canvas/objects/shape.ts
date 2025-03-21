import { DisplayElement, DisplayElementParams } from "./object";

export interface ShapeElementParams extends DisplayElementParams {
  fill?: number | null;
  stroke?: number | null;
  strokeWidth?: number | null;
}

export abstract class ShapeElement extends DisplayElement {
  protected fillColor: number | null;
  protected strokeColor: number;
  protected strokeWidth: number | null;

  public constructor(params: ShapeElementParams = {}) {
    super(params);

    this.fillColor = params.fill ?? 0xffffff;
    this.strokeColor = params.stroke ?? 0x000000;
    this.strokeWidth = params.strokeWidth ?? null;
  }

  public override update(params: Partial<ShapeElementParams>): this {
    if (
      params.fill !== undefined ||
      params.stroke !== undefined ||
      params.strokeWidth !== undefined
    ) {
      if (params.fill !== undefined) this.fillColor = params.fill;
      if (params.stroke !== undefined)
        this.strokeColor = params.stroke ?? 0x000000;
      if (params.strokeWidth !== undefined)
        this.strokeWidth = params.strokeWidth;
    }

    super.update(params);
    this.redraw();

    return this;
  }

  /**
   * Sets the fill color
   */
  public setFill(params: { color: number }): this {
    return this.update({
      fill: params.color,
    });
  }

  /**
   * Sets the stroke properties
   */
  public setStroke(params: {
    color: number;
    width?: number;
  }): this {
    return this.update({
      stroke: params.color,
      strokeWidth: params.width ?? this.strokeWidth,
    });
  }

  protected abstract draw(): void;

  protected baseToJSON() {
    return {
      ...super.baseToJSON(),
      fill: this.fillColor,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
    };
  }
}
