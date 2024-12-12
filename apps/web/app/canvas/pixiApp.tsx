"use client";
import { Sprite, Texture } from "pixi.js";
import { useRef, useEffect, useState, useCallback } from "react";
import { RectangleShape } from "./shapes/rectangle";
import { CircleShape } from "./shapes/circle";
import { StageManager } from "./stageManager";

const Pixi = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(0.2);
  const stageManagerRef = useRef<StageManager>();

  useEffect(() => {
    setup();

    return () => {
      stageManagerRef.current?.cleanup();
    };
  }, []);

  const setup = async () => {
    stageManagerRef.current = new StageManager({
      onScaleChange: setCurrentScale,
    });
    await stageManagerRef.current.init();
    ref.current?.appendChild(stageManagerRef?.current.canvas);
  };

  const handleAddShape = useCallback(
    (type: "square" | "circle" | "picture") => {
      if (!stageManagerRef.current) return;

      let element;
      switch (type) {
        case "square":
          element = new RectangleShape();
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

      stageManagerRef.current?.addInteractiveChild(element);
    },
    [],
  );
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="absolute bottom-4 flex flex-row justify-between items-center bg-gray-800 rounded-md">
        <div className="pl-3">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => handleAddShape("square")}
          >
            Square
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => handleAddShape("circle")}
          >
            Circle
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => handleAddShape("picture")}
          >
            Picture
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => stageManagerRef.current?.download()}
          >
            Download
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => stageManagerRef.current?.saveToFile()}
          >
            Save
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => stageManagerRef.current?.loadFromFile()}
          >
            Load
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            onClick={() => {
              stageManagerRef.current?.settings.setTheme(
                stageManagerRef.current?.settings.getTheme() === "light"
                  ? "dark"
                  : "light",
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
