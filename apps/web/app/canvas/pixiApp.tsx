"use client";
import {
  Application,
  Assets,
  Graphics,
  GraphicsContext,
  Sprite,
  Texture,
} from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import { useRef, useEffect, useState, useCallback } from "react";
import { ViewportManager } from "./viewportManager";
import { DragManager } from "./dragManager";
import { Settings } from "./settings";
import { TransformerManager } from "./transformerManager";

const postItContext = new GraphicsContext().rect(0, 0, 400, 400).fill(0xcb9df0);
const circleContext = new GraphicsContext().circle(0, 0, 200).fill(0xcb9df0);

const Pixi = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(0.2);
  const appRef = useRef<Application>();
  const viewportManagerRef = useRef<ViewportManager>();
  const dragManagerRef = useRef<DragManager>();
  const transformerManagerRef = useRef<TransformerManager>();
  const settingsRef = useRef<Settings>();

  useEffect(() => {
    setupApp();

    return () => {
      dragManagerRef.current?.cleanup();
      transformerManagerRef.current?.cleanup();
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = undefined;
      }
    };
  }, []);

  const setupApp = async () => {
    const app = new Application();
    settingsRef.current = Settings.getInstance();
    appRef.current = app;

    initDevtools({ app });

    await app.init({
      background: settingsRef.current.backgroundColor,
      resizeTo: window,
      height: window.innerHeight,
      width: window.innerWidth,
      resolution: devicePixelRatio,
      antialias: true,
      autoDensity: true,
      preferWebGLVersion: 2,
    });

    if (!ref.current) return;
    ref.current.appendChild(app.canvas);

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    viewportManagerRef.current = new ViewportManager(app);
    dragManagerRef.current = new DragManager(app);
    transformerManagerRef.current = new TransformerManager(
      app,
      viewportManagerRef.current.viewport,
    );

    const viewport = viewportManagerRef.current.viewport;
    viewport.addEventListener("wheel", () => {
      setCurrentScale(viewportManagerRef.current!.scale);
    });
    viewport.addEventListener("pinch", () => {
      setCurrentScale(viewportManagerRef.current!.scale);
    });

    await Assets.load(
      "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
    );
  };

  const handleAddPicture = useCallback(() => {
    if (!viewportManagerRef.current || !dragManagerRef.current) return;

    const texture = Texture.from(
      "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
    );

    const sprite = new Sprite({
      texture,
      width: 400,
      height: 400,
    });

    const viewport = viewportManagerRef.current.viewport;

    sprite.eventMode = "static";
    sprite.cursor = "pointer";

    sprite.anchor.set(0.5);
    sprite.x = viewport.center.x;
    sprite.y = viewport.center.y;

    sprite.on("pointerdown", (event) =>
      dragManagerRef.current!.onDragStart(event, sprite),
    );
    sprite.on("click", (event) =>
      transformerManagerRef.current!.onSelect(event, sprite),
    );

    viewport.addChild(sprite);
  }, []);

  const handleAddSquare = useCallback(() => {
    if (!viewportManagerRef.current || !dragManagerRef.current) return;

    const gr = new Graphics(postItContext);
    const viewport = viewportManagerRef.current.viewport;

    gr.eventMode = "static";
    gr.cursor = "pointer";

    gr.pivot.set(gr.width / 2, gr.height / 2);
    gr.x = viewport.center.x;
    gr.y = viewport.center.y;

    gr.on("pointerdown", (event) =>
      dragManagerRef.current!.onDragStart(event, gr),
    );
    gr.on("click", (event) =>
      transformerManagerRef.current!.onSelect(event, gr),
    );

    viewport.addChild(gr);
  }, []);

  const handleAddCircle = useCallback(() => {
    if (!viewportManagerRef.current || !dragManagerRef.current) return;

    const gr = new Graphics(circleContext);
    const viewport = viewportManagerRef.current.viewport;

    gr.eventMode = "static";
    gr.cursor = "pointer";

    gr.x = viewport.center.x;
    gr.y = viewport.center.y;

    gr.on("pointerdown", (event) =>
      dragManagerRef.current!.onDragStart(event, gr),
    );
    gr.on("click", (event) =>
      transformerManagerRef.current!.onSelect(event, gr),
    );

    viewport.addChild(gr);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="absolute bottom-4 flex flex-row justify-between items-center bg-gray-800 rounded-md">
        <div className="pl-3">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => handleAddSquare()}
          >
            Post It
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => handleAddCircle()}
          >
            Circle
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={handleAddPicture}
          >
            Picture
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => {
              settingsRef.current?.setTheme(
                settingsRef.current?.getTheme() === "light" ? "dark" : "light",
              );
            }}
          >
            Toggle Theme
          </button>
        </div>
        <div>
          <div className="text-white m-5">
            {(currentScale * 100 + 80).toFixed(0)}%
          </div>
        </div>
      </div>
      <div ref={ref} />
    </div>
  );
};

export default Pixi;
