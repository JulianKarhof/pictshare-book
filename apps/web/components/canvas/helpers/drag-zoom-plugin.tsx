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
  parent: Viewport;
  private options: Options;
  private moveReverse: number;
  private zoomReverse: number;
  private lastWheelTime: number = 0;
  private isTrackpad: boolean = false;

  constructor(parent: Viewport, options: Partial<Options>) {
    super(parent);
    this.parent = parent;
    this.options = Object.assign({}, defaults, options);

    this.moveReverse = options.moveReverse ? 1 : -1;
    this.zoomReverse = options.zoomReverse ? 1 : -1;
  }

  wheel(event: WheelEvent) {
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastWheelTime;

    if (
      Math.abs(event.deltaY) < 40 &&
      timeDelta < 50 &&
      event.deltaMode === 0 &&
      !Number.isInteger(event.deltaY)
    ) {
      this.isTrackpad = true;
    } else if (timeDelta > 500) {
      this.isTrackpad = false;
    }

    this.lastWheelTime = currentTime;

    if (event.ctrlKey) {
      this.zoom(event);
      return true;
    } else {
      this.pan(event);
      return true;
    }
  }

  private pan(event: WheelEvent) {
    this.parent.x += event.deltaX * this.options.moveSpeed * this.moveReverse;
    this.parent.y += event.deltaY * this.options.moveSpeed * this.moveReverse;
    this.parent.emit("moved", { type: "drag", viewport: this.parent });
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  private zoom(event: WheelEvent) {
    const zoomSpeed = this.isTrackpad
      ? this.options.trackPadZoomSpeed
      : this.options.zoomSpeed;

    const delta = 1 - (this.zoomReverse * event.deltaY * zoomSpeed) / 300;

    const point = this.parent.input.getPointerPosition(event);
    const oldPoint = this.parent.toLocal(point);

    this.parent.scale.x *= delta;
    this.parent.scale.y *= delta;

    this.parent.scale.x = this.clamp(this.parent.scale.x, 0.0246, 1.5);
    this.parent.scale.y = this.clamp(this.parent.scale.y, 0.0246, 1.5);

    const newPoint = this.parent.toGlobal(oldPoint);
    this.parent.x += point.x - newPoint.x;
    this.parent.y += point.y - newPoint.y;
    this.parent.emit("zoomed", { type: "wheel", viewport: this.parent });
  }
}
