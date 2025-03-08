import {
  ElementType,
  TextElementSchema,
} from "@api/routes/element/element.schema";
import { Text } from "pixi.js";
import { Settings } from "../settings";
import { DisplayElement, DisplayElementParams, ElementFactory } from "./object";

export interface TextElementParams extends DisplayElementParams {
  content?: string;
  fontSize?: number;
  fontFamily?: string | null;
  fontWeight?: string;
  color?: number | null;
  align?: "left" | "center" | "right";
}

export class TextElement extends DisplayElement {
  protected readonly elementType = ElementType.TEXT;

  private _content: string;
  private _fontSize: number;
  private _fontFamily: string;
  private _fontWeight: string;
  private _color: number;
  private _align: "left" | "center" | "right";

  private _inputElement: HTMLDivElement | null = null;
  private _textElement: Text | null = null;

  private _previousClickTime: number = Date.now();
  private _isEditing: boolean = false;
  private _onInput: (() => void)[] = [];

  public constructor(params: TextElementParams = {}) {
    super(params);

    const defaultColor =
      Settings.getInstance().getTheme() === "dark" ? 0xffffff : 0x000000;

    this._content = params.content ?? "Text";
    this._fontSize = params.fontSize ?? 130;
    this._fontFamily = params.fontFamily ?? "Arial";
    this._fontWeight = params.fontWeight ?? "normal";
    this._color = params.color ?? defaultColor;
    this._align = params.align ?? "left";

    if (this._inputElement) {
      document.body.removeChild(this._inputElement);
    }

    this._inputElement = this._createInputElement();

    this.draw();
    requestAnimationFrame(this._updateLoop.bind(this));
  }

  protected draw(): void {
    this._textElement = new Text({
      text: this._content,
      style: {
        fontSize: this._fontSize,
        fontFamily: this._fontFamily,
        fill: this._color,
        align: this._align,
      },
    });

    this._textElement.anchor.set(0.5);

    this.addChild(this._textElement);
  }

  private _createInputElement(): HTMLDivElement {
    const styles = {
      div: {
        display: "none",
        position: "absolute",
        background: "transparent",
        border: "none",
        outline: "none",
        padding: "0",
        margin: "0",
        pointerEvents: "none",
        fontFamily: this._fontFamily,
        fontWeight: this._fontWeight,
        fontSize: `${this._fontSize}px`,
        color: `#${this._color.toString(16).padStart(6, "0")}`,
        textAlign: this._align,
        lineHeight: "1.1",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        userSelect: "text",
        cursor: "text",
      },
      paragraph: {
        margin: "0",
        height: `${this._fontSize * 1.1}px`,
      },
    };

    const div = document.createElement("div");
    Object.assign(div.style, styles.div);
    div.contentEditable = "true";
    div.spellcheck = false;

    const lines = this._content.split("\n");
    lines.forEach((line) => {
      const p = document.createElement("p");
      Object.assign(p.style, styles.paragraph);
      p.textContent = line;
      div.appendChild(p);
    });

    document.body.appendChild(div);
    this._setupEventListeners(div);

    return div;
  }

  private _setupEventListeners(div: HTMLDivElement) {
    div.onkeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.stopEditing();
      }
    };

    div.onblur = () => {
      this.stopEditing();
    };

    div.addEventListener("input", (event) => {
      const inputElement = event.target as HTMLDivElement;
      this._content = Array.from(inputElement.children)
        .map((child) => child.textContent)
        .join("\n");
      this.redraw();
      this._notifyListeners();
    });

    div.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const canvas = document.querySelector("canvas");
        canvas?.dispatchEvent(new WheelEvent("wheel", e));
      },
      { passive: false },
    );

    div.addEventListener("pointermove", (e) => {
      if (e.buttons > 0) {
        e.preventDefault();
        e.stopPropagation();
        const canvas = document.querySelector("canvas");
        canvas?.dispatchEvent(new PointerEvent("pointermove", e));
      }
    });

    this.on("click", () => {
      if (Date.now() - this._previousClickTime < 500) {
        this.startEditing();
      }

      this._previousClickTime = Date.now();
    });
  }

  private _updateLoop(): void {
    if (!this._isEditing) return;
    this._updateInputPosition();
    requestAnimationFrame(this._updateLoop.bind(this));
  }

  private _updateInputPosition(): void {
    if (!this._inputElement) return;

    const globalPosition = this.getGlobalPosition();
    const canvas = document.querySelector("canvas");

    if (!canvas) return;
    const canvasBounds = canvas.getBoundingClientRect();

    const x = canvasBounds.left + globalPosition.x;
    const y = canvasBounds.top + globalPosition.y;

    this._inputElement.style.left = `${x - this._inputElement.offsetWidth / 2}px`;
    this._inputElement.style.top = `${y - this._inputElement.offsetHeight / 2}px`;

    this._inputElement.style.transform = `scale(${this.worldTransform.d})`;
  }

  private _placeCursorAtEnd(element: HTMLDivElement) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
  }

  public startEditing(): void {
    requestAnimationFrame(this._updateLoop.bind(this));
    if (!this._inputElement) return;
    this._isEditing = true;
    this._inputElement.style.display = "inline-block";
    this._inputElement.style.pointerEvents = "auto";
    this._inputElement.focus();
    this.visible = false;
    this._placeCursorAtEnd(this._inputElement);
  }

  public stopEditing(): void {
    if (!this._inputElement) return;
    this._isEditing = false;
    this._inputElement.style.display = "none";
    this._inputElement.style.pointerEvents = "none";
    this.visible = true;
    this._notifyListeners();
  }

  private _notifyListeners() {
    this._onInput.forEach((callback) => callback());
  }

  public onInput(callback: () => void): void {
    this._onInput.push(callback);
  }

  public get isEditing(): boolean {
    return this._isEditing;
  }

  public getText(): string {
    return this._content;
  }

  public setText(text: string): this {
    this._content = text;
    this.redraw();
    return this;
  }

  public setFontSize(size: number): this {
    this._fontSize = size;
    this.redraw();
    return this;
  }

  public setFontFamily(family: string): this {
    this._fontFamily = family;
    this.redraw();
    return this;
  }

  public setFontWeight(weight: string): this {
    this._fontWeight = weight;
    this.redraw();
    return this;
  }

  public setColor(color: number): this {
    this._color = color;
    this.redraw();
    return this;
  }

  public setAlign(align: "left" | "center" | "right"): this {
    this._align = align;
    this.redraw();
    return this;
  }

  public override toJSON(): typeof TextElementSchema.static {
    return {
      ...super.baseToJSON(),
      type: this.elementType,
      content: this._content,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
    };
  }

  public static fromJSON(json: typeof TextElementSchema.static): TextElement {
    const text = new TextElement({
      id: json.id,
      x: json.x,
      y: json.y,
      angle: json.angle,
      scaleX: json.scaleX,
      scaleY: json.scaleY,
      zIndex: json.zIndex,
      width: json.width,
      height: json.height,
      content: json.content,
      fontSize: json.fontSize,
      fontFamily: json.fontFamily,
      color: json.color,
    });

    return text;
  }
}

ElementFactory.register(ElementType.TEXT, TextElement);
