import { PinchToZoomAndMove } from "@web/app/canvas/helpers/pinchToZoomAndMove";
import { Settings } from "@web/app/canvas/settings";
import * as VP from "pixi-viewport";
import { Application, Graphics, Texture, TilingSprite } from "pixi.js";

export class ViewportManager {
  private _viewport: VP.Viewport;
  private background: TilingSprite;
  private app: Application;
  private settings: Settings;

  private lastGridSize: number;

  constructor(app: Application) {
    this.app = app;
    this.settings = Settings.getInstance();
    this._viewport = this.createViewport();
    this.background = this.createBackground();
    this.setupViewportPlugins();
    this.setupEventListeners();
    this.lastGridSize = 0;
    this.handleZoomPan();
  }

  private createViewport(): VP.Viewport {
    const viewport = new VP.Viewport({
      worldWidth: 1000,
      worldHeight: 1000,
      events: this.app.renderer.events,
      stopPropagation: true,
      passiveWheel: false,
    });
    viewport.scale = 0.2;
    this.app.stage.addChild(viewport);
    return viewport;
  }

  private setupViewportPlugins(): void {
    this._viewport.plugins.add(
      "wheel",
      new PinchToZoomAndMove(this._viewport, {
        zoomReverse: true,
        moveSpeed: 1.5,
      }),
    );
    this._viewport.pinch().drag({ mouseButtons: "middle-right" });
  }

  private setupEventListeners(): void {
    this._viewport.addEventListener("zoomed", () => this.handleZoomPan());
    this._viewport.addEventListener("moved", () => this.handleZoomPan());
    window.addEventListener("resize", () => this.handleZoomPan());
  }

  private handleZoomPan(): void {
    this.updateBackgroundPosition();
    this.updateBackgroundSize();
    this.updateGridSize();
  }

  private updateBackgroundPosition(): void {
    this.background.tilePosition.y = -this._viewport.top;
    this.background.tilePosition.x = -this._viewport.left;
    this.background.y = this._viewport.top;
    this.background.x = this._viewport.left;
  }

  private updateBackgroundSize(): void {
    this.background.width = window.innerWidth / this._viewport.scale.x;
    this.background.height = window.innerHeight / this._viewport.scale.y;
  }

  private createBackground(): TilingSprite {
    const scale = this._viewport.scale.x;
    const gridSize = Math.pow(2, Math.floor(Math.log2(100 / scale)));
    const lineSize = Math.pow(2, Math.log2(1 / scale));

    const gridGraphics = new Graphics()
      .rect(0, 0, gridSize - 1, gridSize - 1)
      .stroke({
        color: this.settings.gridColor,
        width: lineSize,
        alignment: 0,
      });

    const texture = this.app.renderer.generateTexture({
      target: gridGraphics,
    });

    gridGraphics.destroy();

    const background = new TilingSprite({
      texture,
      width: this.app.screen.width,
      height: this.app.screen.height,
      alpha: 0.1,
      tilePosition: { x: 0, y: 0 },
    });

    this._viewport.addChild(background);
    return background;
  }

  private drawGrid(gridSize: number): Texture {
    const scale = this._viewport.scale.x;
    const lineSize = Math.pow(2, Math.floor(Math.log2(100 / scale))) / 100;
    const adjustedSize = gridSize - lineSize;

    const gridGraphics = new Graphics()
      .rect(0, 0, adjustedSize, adjustedSize)
      .stroke({
        color: this.settings.gridColor,
        width: lineSize,
        alignment: 0,
      })
      .moveTo(adjustedSize / 2, 0)
      .lineTo(adjustedSize / 2, adjustedSize)
      .moveTo(0, adjustedSize / 2)
      .lineTo(adjustedSize, adjustedSize / 2)
      .stroke({
        color: this.settings.gridColor,
        alpha: 0.3,
        width: lineSize,
        alignment: 0,
      });

    this.background.texture.destroy(true); // very important to prevent memory leaks

    const texture = this.app.renderer.generateTexture({
      target: gridGraphics,
      resolution: 2,
    });
    texture.source.scaleMode = "nearest";

    return texture;
  }

  private updateGridSize(): void {
    const scale = this._viewport.scale.x;
    const gridSize = Math.pow(2, Math.floor(Math.log2(100 / scale)));

    if (gridSize !== this.lastGridSize) {
      this.lastGridSize = gridSize;

      this.background.texture = this.drawGrid(gridSize);
    }
  }

  public get viewport(): VP.Viewport {
    return this._viewport;
  }

  public get scale(): number {
    return this._viewport.scale.x;
  }
}
