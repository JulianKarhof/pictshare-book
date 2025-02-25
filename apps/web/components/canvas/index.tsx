"use client";
import { StageManager } from "@web/components/canvas/managers";
import {
  CircleShape,
  ImageObject,
  RectangleShape,
} from "@web/components/canvas/objects";
import { ModeToggle } from "@web/components/ui/mode-toggle";
import { StageService } from "@web/services/stage.service";
import { useCallback, useEffect, useRef, useState } from "react";
import Dropzone from "react-dropzone";

const BookCanvas = ({ canvasId: id }: { canvasId: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(0.2);
  const stageManagerRef = useRef<StageManager | null>(null);

  useEffect(() => {
    StageService.getInstance().init(id);

    return () => {
      StageService.getInstance().destroy();
    };
  }, [id]);

  useEffect(() => {
    const setup = async () => {
      const newStageManager = new StageManager({
        canvasId: id,
        onScaleChange: setCurrentScale,
      });
      stageManagerRef.current = newStageManager;

      await newStageManager.init();
      ref.current?.appendChild(newStageManager.canvas);

      return newStageManager;
    };

    const initPromise = setup();

    return () => {
      const destroyApp = async () => {
        try {
          const stageManager = await initPromise;
          stageManager.cleanup();
        } catch (error) {
          console.error("PixiJS application cleanup: ", error);
        }
      };
      destroyApp();
    };
  }, []);

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
          element = new ImageObject({
            url: "https://fastly.picsum.photos/id/404/2000/2000.jpg?hmac=pCwJvO67FP1G3bObWhz5HjADxB2tS8v8s7TqrfqYEd0",
          });
          break;
      }

      stageManagerRef.current?.addShape(element);
    },
    [],
  );

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="absolute bottom-4 flex flex-row justify-between items-center bg-gray-800 rounded-md z-50">
        <div className="pl-3">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm"
            onClick={() => handleAddShape("square")}
          >
            Square
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm ml-2"
            onClick={() => handleAddShape("circle")}
          >
            Circle
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm ml-2"
            onClick={() => handleAddShape("picture")}
          >
            Picture
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm ml-2"
            onClick={() => stageManagerRef.current?.download()}
          >
            Download
          </button>
          <ModeToggle
            trigger={
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm ml-2">
                Theme
              </button>
            }
            onToggle={() => {
              window.location.reload();
            }}
          />
        </div>
        <div>
          <div className="text-white m-5">
            {(currentScale * 100 + 80).toFixed(0)}%
          </div>
        </div>
      </div>
      <Dropzone onDrop={(files) => console.log(files)}>
        {({ getRootProps, isDragActive }) => (
          <div {...getRootProps()} className="relative">
            <div ref={ref} />
            {isDragActive && (
              <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm border-2 border-dashed border-gray-500 flex items-center justify-center z-40">
                <div className="text-white text-xl font-semibold">
                  Drop files here to upload
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
    </div>
  );
};

export default BookCanvas;
