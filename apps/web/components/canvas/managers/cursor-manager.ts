import { MemberSchema } from "@api/routes/project/project.schema";
import { WebSocketEventType } from "@api/routes/ws/ws.schema";
import { client } from "@web/lib/client";
import { StageService } from "@web/services/stage.service";
import Color from "color";
import { Viewport } from "pixi-viewport";
import { Assets, Container, Graphics, Sprite, Text, Ticker } from "pixi.js";

export class CursorManager {
  private _viewport: Viewport;
  private _stageService = StageService.getInstance();
  private _cursors: Map<string, Cursor> = new Map();
  private _cursorContainer: Container = new Container();
  private _colorScheme: number[] = [0x640d5f, 0xd91656, 0xeb5b00, 0xffb200];
  private _members: (typeof MemberSchema.static)[] = [];
  private _membersPromise: Promise<void>;

  public constructor({
    projectId,
    viewport,
  }: { projectId: string; viewport: Viewport }) {
    this._viewport = viewport;
    this._cursorContainer.zIndex = 10000;
    this._viewport.addChild(this._cursorContainer);

    this._membersPromise = this._fetchMembers(projectId);

    this._viewport.on("mousemove", (event) => {
      const pos = this._viewport.toWorld(event);
      this._stageService.sendCursorSync({
        x: pos.x,
        y: pos.y,
      });
    });

    this._viewport.on("zoomed", () => {
      this._updateCursorSize();
    });

    this._stageService.subscribe(
      WebSocketEventType.CURSOR_SYNC,
      async (data) => {
        await this._membersPromise;

        if (!this._cursors.has(data.userId)) {
          const userName =
            this._members.find((member) => member.userId === data.userId)
              ?.name || "Guest";

          const cursor = new Cursor({
            name: userName,
            color:
              this._colorScheme[
                data.userId.charCodeAt(0) % this._colorScheme.length
              ],
            x: data.payload.x,
            y: data.payload.y,
          });

          cursor.position.set(data.payload.x, data.payload.y);
          this._cursors.set(data.userId, cursor);
          this._cursorContainer.addChild(cursor);
        }

        this._updateCursorPosition(data.userId, data.payload);
        this._updateCursorSize();
      },
    );
  }

  private async _fetchMembers(projectId: string): Promise<void> {
    const response = await client.projects({ id: projectId }).users.get();
    if (!response.error) {
      this._members = response.data;
    }
  }

  private _updateCursorPosition(
    id: string,
    { x, y }: { x: number; y: number },
  ): void {
    const cursor = this._cursors.get(id);
    if (!cursor) return;

    cursor.setTargetPosition(x, y);
  }

  private _updateCursorSize(): void {
    if (!this._viewport?.scale?.x) {
      return;
    }

    const scaleFactor =
      Math.pow(2, Math.log2(100 / this._viewport.scale.x)) / 120;

    this._cursors.forEach((cursor) => {
      cursor.scale.set(scaleFactor, scaleFactor);
    });
  }
}

class Cursor extends Container {
  private _color: number;
  private _name: string;
  private _targetX: number = 0;
  private _targetY: number = 0;
  private _currentX: number = 0;
  private _currentY: number = 0;
  private _ticker: Ticker;

  public constructor({
    color,
    name,
    x = 0,
    y = 0,
  }: { color: number; name: string; x: number; y: number }) {
    super();
    this._color = color;
    this._name = name;

    this._currentX = x - 12;
    this._currentY = y - 12;
    this._targetX = x - 12;
    this._targetY = y - 12;

    this._ticker = new Ticker();
    this.eventMode = "none";

    this.draw()
      .then(() => {
        this._startAnimation();
      })
      .catch((error) => {
        console.error("Error initializing cursor:", error);
      });
  }

  private _startAnimation(): void {
    this._ticker.add(() => {
      const ease = 0.2;
      this._currentX += (this._targetX - this._currentX) * ease;
      this._currentY += (this._targetY - this._currentY) * ease;

      this.position?.set(this._currentX, this._currentY);
    });
    this._ticker.start();
  }

  public setTargetPosition(x: number, y: number): void {
    this._targetX = x - 12;
    this._targetY = y - 12;
  }

  public async draw(): Promise<void> {
    const graphics = new Graphics();

    graphics.poly([0, 0, 20, 10, 10, 20]);
    graphics.fill(this._color);
    graphics.stroke({ color: Color(this._color).darken(0.5).hex(), width: 2 });

    const cursorAsset = await Assets.load("cursor");
    const cursorInsideAsset = await Assets.load("cursor-inside");

    const cursorImage = new Sprite(cursorAsset);
    cursorImage.scale.set(0.4);

    const cursorInsideImage = new Sprite(cursorInsideAsset);
    cursorInsideImage.scale.set(0.4);
    cursorInsideImage.tint = this._color;

    const text = new Text({
      text: this._name,
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: Color(this._color).isDark() ? 0xffffff : 0x000000,
      },
    });

    text.resolution = 4;
    text.position.set(graphics.width + 4, 22);

    const textBox = new Graphics();

    textBox.roundRect(graphics.width, 20, text.width + 8, text.height + 4, 2);
    textBox.fill(this._color);
    textBox.stroke({
      color: Color(this._color).darken(0.2).hex(),
      width: 1,
    });

    this.addChild(cursorImage, cursorInsideImage, textBox, text);
  }
}
