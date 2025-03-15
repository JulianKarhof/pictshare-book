import { DragZoomPlugin } from "@web/components/canvas/helpers/drag-zoom-plugin";
import { Settings } from "@web/components/canvas/settings";
import { Viewport } from "pixi-viewport";
import { Application, Graphics, Texture, TilingSprite } from "pixi.js";

export class ViewportManager {
  private _viewport: Viewport;
  private _background: TilingSprite;
  private _app: Application;
  private _settings: Settings;

  private _lastGridSize: number;

  public constructor({ app }: { app: Application }) {
    this._app = app;
    this._settings = Settings.getInstance();
    this._viewport = this._createViewport();
    this._background = this._createBackground();
    this._setupViewportPlugins();
    this._setupEventListeners();
    this._lastGridSize = 0;
    this._handleZoomPan();
  }

  private _createViewport(): Viewport {
    const viewport = new Viewport({
      worldWidth: 1000,
      worldHeight: 1000,
      events: this._app.renderer.events,
      stopPropagation: true,
      passiveWheel: false,
      disableOnContextMenu: true,
    });
    viewport.scale = 0.2;
    this._app.stage.addChild(viewport);
    return viewport;
  }

  private _setupViewportPlugins(): void {
    this._viewport.plugins.add(
      "wheel",
      new DragZoomPlugin(this._viewport, {
        zoomReverse: true,
        moveSpeed: 1.5,
      }),
    );
    this._viewport.pinch().drag({ mouseButtons: "middle-right" });
  }

  private _setupEventListeners(): void {
    this._viewport.addEventListener("zoomed", () => this._handleZoomPan());
    this._viewport.addEventListener("moved", () => this._handleZoomPan());
    window.addEventListener("resize", () => this._handleZoomPan());
  }

  private _handleZoomPan(): void {
    this._updateBackgroundPosition();
    this._updateBackgroundSize();
    this._updateGridSize();
  }

  private _updateBackgroundPosition(): void {
    this._background.tilePosition.y = -this._viewport.top;
    this._background.tilePosition.x = -this._viewport.left;
    this._background.y = this._viewport.top;
    this._background.x = this._viewport.left;
  }

  private _updateBackgroundSize(): void {
    this._background.width = window.innerWidth / this._viewport.scale.x;
    this._background.height = window.innerHeight / this._viewport.scale.y;
  }

  private _createBackground(): TilingSprite {
    const scale = this._viewport.scale.x;
    const gridSize = Math.pow(2, Math.floor(Math.log2(100 / scale)));
    const lineSize = Math.pow(2, Math.log2(1 / scale));

    const gridGraphics = new Graphics()
      .rect(0, 0, gridSize - 1, gridSize - 1)
      .stroke({
        color: this._settings.gridColor,
        width: lineSize,
        alignment: 0,
      });

    const texture = this._app.renderer.generateTexture({
      target: gridGraphics,
    });

    gridGraphics.destroy();

    const background = new TilingSprite({
      texture,
      width: this._app.screen.width,
      height: this._app.screen.height,
      alpha: 0.1,
      tilePosition: { x: 0, y: 0 },
    });

    this._viewport.addChild(background);
    return background;
  }

  private _drawGrid(gridSize: number): Texture {
    const scale = this._viewport.scale.x;
    const lineSize = Math.pow(2, Math.floor(Math.log2(100 / scale))) / 100;
    const adjustedSize = gridSize - lineSize;

    const gridGraphics = new Graphics()
      .rect(0, 0, adjustedSize, adjustedSize)
      .stroke({
        color: this._settings.gridColor,
        width: lineSize,
        alignment: 0,
      })
      .moveTo(adjustedSize / 2, 0)
      .lineTo(adjustedSize / 2, adjustedSize)
      .moveTo(0, adjustedSize / 2)
      .lineTo(adjustedSize, adjustedSize / 2)
      .stroke({
        color: this._settings.gridColor,
        alpha: 0.3,
        width: lineSize,
        alignment: 0,
      });

    this._background.texture.destroy(true); // very important to prevent memory leaks

    const texture = this._app.renderer.generateTexture({
      target: gridGraphics,
      resolution: this._viewport.scale.x * 5,
    });
    texture.source.scaleMode = "nearest";

    return texture;
  }

  private _updateGridSize(): void {
    const scale = this._viewport.scale.x;
    const gridSize = Math.pow(2, Math.floor(Math.log2(100 / scale)));

    if (gridSize !== this._lastGridSize) {
      this._lastGridSize = gridSize;

      this._background.texture = this._drawGrid(gridSize);
    }
  }

  public zoom(scale: number): void {
    this._viewport.zoomPercent(scale, true).clampZoom({
      maxScale: 1.5,
      minScale: 0.0246,
    });
    this._viewport.emit("zoomed", {
      type: "clamp-zoom",
      viewport: this._viewport,
    });
    this._handleZoomPan();
  }

  public get viewport(): Viewport {
    return this._viewport;
  }

  public get scale(): number {
    return this._viewport.scale.x;
  }
}
