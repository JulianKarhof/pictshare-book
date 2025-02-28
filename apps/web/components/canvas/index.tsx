"use client";
import { StageManager } from "@web/components/canvas/managers";
import { StageService } from "@web/services/stage.service";
import { useCallback, useEffect, useRef, useState } from "react";
import Dropzone from "react-dropzone";
import { ImageShelf } from "./image-shelf";
import { useAssetManager } from "./managers/asset-manager";
import { CircleElement, RectangleElement } from "./objects";
import { Toolbar } from "./toolbar";
import { ZoomControls } from "./zoom-controls";

const BookCanvas = ({ canvasId: id }: { canvasId: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(0.2);
  const stageManagerRef = useRef<StageManager | null>(null);

  const { uploadFiles, fetchImages, assets } = useAssetManager();

  useEffect(() => {
    fetchImages(id).catch(console.error);
  }, [fetchImages, id]);

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

  const handleAddShape = useCallback((type: "square" | "circle") => {
    if (!stageManagerRef.current) return;

    let element;
    switch (type) {
      case "square":
        element = new RectangleElement();
        break;
      case "circle":
        element = new CircleElement();
        break;
    }

    stageManagerRef.current?.addElement(element);
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        await uploadFiles(files, id);
      } catch (error) {
        console.error("Failed to upload files:", error);
      }
    },
    [uploadFiles, id],
  );

  return (
    <div className="flex flex-col justify-center items-center">
      <Toolbar
        className="absolute left-4 top-4 z-50"
        onAddShape={handleAddShape}
        onImageUpload={handleFiles}
        onDownload={() => stageManagerRef.current?.download()}
      />

      <ZoomControls
        className="absolute left-4 bottom-4 z-50"
        currentScale={currentScale}
        onZoomIn={() => stageManagerRef.current?.zoomIn()}
        onZoomOut={() => stageManagerRef.current?.zoomOut()}
      />

      <ImageShelf
        images={assets}
        className="fixed bottom-0 right-4 z-50"
        onImageSelect={(element) =>
          stageManagerRef.current?.addElement(element)
        }
        onImageUpload={handleFiles}
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
