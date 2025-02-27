"use client";
import { StageManager } from "@web/components/canvas/managers";
import { StageService } from "@web/services/stage.service";
import { useCallback, useEffect, useRef, useState } from "react";
import Dropzone from "react-dropzone";
import { ImageShelf } from "./image-shelf";
import { CircleElement, ImageElement, RectangleElement } from "./objects";
import { Toolbar } from "./toolbar";
import { ZoomControls } from "./zoom-controls";

const BookCanvas = ({ canvasId: id }: { canvasId: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(0.2);
  const stageManagerRef = useRef<StageManager | null>(null);
  const [images, _setImages] = useState<string[]>([]);

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
          element = new RectangleElement();
          break;
        case "circle":
          element = new CircleElement();
          break;
        case "picture":
          element = new ImageElement({
            src: "https://fastly.picsum.photos/id/901/200/200.jpg?hmac=BofL61KMrHssTtPwqR7iI272BvpjGsjt5PJ_ultE4Z8",
            assetId: "cm7kup7sm0001wq0crge5t0n4",
          });
          break;
      }

      stageManagerRef.current?.addElement(element);
    },
    [],
  );

  const handleFiles = useCallback((files: File[]) => {
    console.log(files);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <Toolbar
        className="absolute left-4 top-4 z-50"
        onAddShape={handleAddShape}
        onFileSelect={handleFiles}
        onDownload={() => stageManagerRef.current?.download()}
      />

      <ZoomControls
        className="absolute left-4 bottom-4 z-50"
        currentScale={currentScale}
        onZoomIn={() => stageManagerRef.current?.zoomIn()}
        onZoomOut={() => stageManagerRef.current?.zoomOut()}
      />

      <ImageShelf
        className="fixed bottom-0 right-4 z-50"
        images={images}
        onImageSelect={(element) =>
          stageManagerRef.current?.addElement(element)
        }
      />

      <Dropzone onDrop={handleFiles} noKeyboard noClick>
        {({ getRootProps, isDragActive }) => (
          <div {...getRootProps()} className="relative">
            <div ref={ref} />
            {isDragActive && (
              <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm border-2 border-dashed border-gray-500 flex items-center justify-center z-60">
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
