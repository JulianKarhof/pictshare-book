import { Plugin, Viewport } from "pixi-viewport";

type Options = {
  moveSpeed: number;
  moveReverse: boolean;
  zoomSpeed: number;
  zoomReverse: boolean;
  trackPadZoomSpeed: number;
};

const defaults: Options = {
  moveSpeed: 1,
  moveReverse: false,
  zoomSpeed: 1,
  zoomReverse: false,
  trackPadZoomSpeed: 5,
};

export class DragZoomPlugin extends Plugin {
  public parent: Viewport;
  private _options: Options;
  private _moveReverse: number;
  private _zoomReverse: number;
  private _lastWheelTime: number = 0;
  private _isTrackpad: boolean = false;

  public constructor(parent: Viewport, options: Partial<Options>) {
    super(parent);
    this.parent = parent;
    this._options = Object.assign({}, defaults, options);

    this._moveReverse = options.moveReverse ? 1 : -1;
    this._zoomReverse = options.zoomReverse ? 1 : -1;
  }

  public wheel(event: WheelEvent) {
    const currentTime = Date.now();
    const timeDelta = currentTime - this._lastWheelTime;

    if (
      Math.abs(event.deltaY) < 40 &&
      timeDelta < 50 &&
      event.deltaMode === 0 &&
      !Number.isInteger(event.deltaY)
    ) {
      this._isTrackpad = true;
    } else if (timeDelta > 500) {
      this._isTrackpad = false;
    }

    this._lastWheelTime = currentTime;

    if (event.ctrlKey) {
      this._zoom(event);
      return true;
    } else {
      this._pan(event);
      return true;
    }
  }

  private _pan(event: WheelEvent) {
    this.parent.x += event.deltaX * this._options.moveSpeed * this._moveReverse;
    this.parent.y += event.deltaY * this._options.moveSpeed * this._moveReverse;
    this.parent.emit("moved", { type: "drag", viewport: this.parent });
  }

  private _clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  private _zoom(event: WheelEvent) {
    const zoomSpeed = this._isTrackpad
      ? this._options.trackPadZoomSpeed
      : this._options.zoomSpeed;

    const delta = 1 - (this._zoomReverse * event.deltaY * zoomSpeed) / 300;

    const point = this.parent.input.getPointerPosition(event);
    const oldPoint = this.parent.toLocal(point);

    this.parent.scale.x *= delta;
    this.parent.scale.y *= delta;

    this.parent.scale.x = this._clamp(this.parent.scale.x, 0.0246, 1.5);
    this.parent.scale.y = this._clamp(this.parent.scale.y, 0.0246, 1.5);

    const newPoint = this.parent.toGlobal(oldPoint);
    this.parent.x += point.x - newPoint.x;
    this.parent.y += point.y - newPoint.y;
    this.parent.emit("zoomed", { type: "wheel", viewport: this.parent });
  }
}
