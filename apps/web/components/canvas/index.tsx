"use client";
import { Role } from "@prisma/client";
import { StageManager } from "@web/components/canvas/managers";
import { useSession } from "@web/lib/auth-client";
import { StageService } from "@web/services/stage.service";
import { useCallback, useEffect, useRef, useState } from "react";
import Dropzone from "react-dropzone";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { toast } from "sonner";
import { MemberModal } from "../blocks/auth/member-modal";
import styles from "./canvas.module.css";
import { ImageShelf } from "./image-shelf";
import { useAssetManager } from "./managers/asset-manager";
import { CircleElement, RectangleElement } from "./objects";
import { TextElement } from "./objects/text";
import { SettingsBar } from "./settings-bar";
import { Toolbar } from "./toolbar";
import { ZoomControls } from "./zoom-controls";

const BookCanvas = ({ canvasId: projectId }: { canvasId: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(0.2);
  const stageManagerRef = useRef<StageManager | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const session = useSession();
  const { uploadFiles, fetchImages, assets } = useAssetManager();
  const [isDrawing, setIsDrawing] = useState(false);
  const handle = useFullScreenHandle();

  useEffect(() => {
    fetchImages(projectId).catch((error) => {
      toast.error("Failed to fetch images");
      console.error(error);
    });
  }, [fetchImages, projectId]);

  useEffect(() => {
    StageService.getInstance().init(projectId);
    return () => {
      StageService.getInstance().destroy();
    };
  }, [projectId]);

  useEffect(() => {
    document.body.classList.add(styles.noScroll);

    return () => {
      document.body.classList.remove(styles.noScroll);
    };
  }, []);

  useEffect(() => {
    const setup = async () => {
      const newStageManager = new StageManager({
        canvasId: projectId,
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

  useEffect(() => {
    if (window.innerWidth < 500)
      toast.warning(
        "This view is currently not optimized for mobile devices.",
        {
          id: "mobile-warning",
          duration: 5000,
          closeButton: true,
          position: "top-center",
        },
      );
  });

  const handleAddShape = useCallback((type: "square" | "circle" | "text") => {
    if (!stageManagerRef.current) return;

    let element;
    switch (type) {
      case "square":
        element = new RectangleElement();
        break;
      case "circle":
        element = new CircleElement();
        break;
      case "text":
        element = new TextElement();
        break;
    }

    stageManagerRef.current?.addElement(element);
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        await uploadFiles(files);
      } catch (error) {
        console.error("Failed to upload files:", error);
      }
    },
    [uploadFiles, projectId],
  );

  const startDrawing = useCallback(() => {
    if (!stageManagerRef.current) return;

    setIsDrawing(true);
    stageManagerRef.current.startDrawing();
  }, [stageManagerRef]);

  const stopDrawing = useCallback(() => {
    if (!stageManagerRef.current) return;

    setIsDrawing(false);
    stageManagerRef.current.stopDrawing();
  }, [stageManagerRef]);

  const userRole =
    session.data?.members.find((member) => member.projectId === projectId)
      ?.role ?? Role.VIEWER;

  return (
    <div className="!overflow-hidden ![overscroll-behavior-y:none]">
      <MemberModal
        projectId={projectId}
        open={userModalOpen}
        role={userRole}
        onOpenChange={(newState) => setUserModalOpen(newState)}
      />

      <Toolbar
        className="absolute z-50 top-4 left-4"
        onAddShape={handleAddShape}
        isDrawing={isDrawing}
        onDraw={() => {
          if (isDrawing) {
            stopDrawing();
          } else {
            startDrawing();
          }
        }}
      />

      <SettingsBar
        className="absolute top-4 right-4 z-50"
        onManageUsers={() => setUserModalOpen(true)}
        onDownload={() => stageManagerRef.current?.download()}
        onFullscreen={handle.active ? handle.exit : handle.enter}
        isFullscreen={handle.active}
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

      <Dropzone
        onDrop={handleFiles}
        maxFiles={10}
        maxSize={1024 * 1024 * 20}
        noKeyboard
        noClick
      >
        {({ getRootProps, isDragActive }) => (
          <FullScreen handle={handle}>
            <div {...getRootProps()} ref={ref} className="relative">
              {isDragActive && (
                <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm border-2 border-dashed border-gray-500 flex items-center justify-center z-60">
                  <div className="text-white text-xl font-semibold">
                    Drop files here to upload
                  </div>
                </div>
              )}
            </div>
          </FullScreen>
        )}
      </Dropzone>
    </div>
  );
};

export default BookCanvas;
