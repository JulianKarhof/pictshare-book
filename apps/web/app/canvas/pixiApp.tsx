"use client";
import { Application, Assets, Sprite, Texture } from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import { useRef, useEffect, useState, useCallback } from "react";
import { ViewportManager } from "./viewportManager";
import { DragManager } from "./dragManager";
import { Settings } from "./settings";
import { TransformerManager } from "./transformerManager";
import { RectangleShape } from "./shapes/rectangle";
import { CircleShape } from "./shapes/circle";

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
    viewport.on("clicked", () => {
      transformerManagerRef.current!.reset();
    });

    await Assets.load(
      "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
    );
  };

  const handleAdd = useCallback((type: "square" | "circle" | "picture") => {
    if (!viewportManagerRef.current || !dragManagerRef.current) return;

    const viewport = viewportManagerRef.current.viewport;
    let element;

    switch (type) {
      case "square":
        element = new RectangleShape();
        element.pivot.set(element.width / 2, element.height / 2);
        break;
      case "circle":
        element = new CircleShape();
        break;
      case "picture":
        const texture = Texture.from(
          "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
        );
        element = new Sprite({
          texture,
          width: 400,
          height: 400,
        });
        element.anchor.set(0.5);
        break;
    }

    if (!element) return;

    element.eventMode = "static";
    element.cursor = "pointer";
    element.x = viewport.center.x;
    element.y = viewport.center.y;

    element.on("pointerdown", (event) =>
      dragManagerRef.current!.onDragStart(event, element),
    );
    element.on("click", () => transformerManagerRef.current!.onSelect(element));

    transformerManagerRef.current!.onSelect(element);
    viewport.addChild(element);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="absolute bottom-4 flex flex-row justify-between items-center bg-gray-800 rounded-md">
        <div className="pl-3">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => handleAdd("square")}
          >
            Square
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => handleAdd("circle")}
          >
            Circle
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => handleAdd("picture")}
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
