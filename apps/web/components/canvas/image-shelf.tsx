import { ImageReturnSchema } from "@api/routes/image/image.schema";
import { ImageElement } from "@web/components/canvas/objects";
import { useSession } from "@web/lib/auth-client";
import {
  Image as ImageIcon,
  PinIcon,
  PinOffIcon,
  UploadIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useSettings } from "./settings";

interface ImageShelfProps {
  images: (typeof ImageReturnSchema.static)[];
  onImageSelect: (element: ImageElement) => void;
  onImageUpload?: (files: File[]) => void;
  className?: string;
}

export const ImageShelf = ({
  images,
  onImageSelect,
  onImageUpload,
  className,
}: ImageShelfProps) => {
  const { imageShelfPinned: isPinned, setImageShelfPinned } = useSettings();
  const session = useSession();
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  const myImages = images.filter(
    (image) => image.uploaderId === session.data?.user.id,
  );
  const displayedImages = activeTab === "all" ? images : myImages;

  return (
    <div
      id="image-shelf"
      className={`w-96 h-[60vh] bg-card/80 backdrop-blur-sm shadow-lg transform transition-transform duration-300 ease-in-out ${
        isPinned
          ? "translate-y-[6px]"
          : "translate-y-[calc(100%-70px)] hover:translate-y-[6px]"
      } rounded-t-xl border border-border group ${className}`}
    >
      <div className="flex flex-col h-full relative">
        <div className="flex items-center justify-between p-4 border-border z-10 relative">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-card-foreground" />
            <h2 className="text-card-foreground text-lg font-semibold">
              Images
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="p-1.5 rounded-md hover:bg-accent text-card-foreground cursor-pointer"
              title="Upload image"
            >
              <UploadIcon className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0 && onImageUpload) {
                    onImageUpload(files);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <button
              onClick={() => setImageShelfPinned(!isPinned)}
              className={`p-1.5 rounded-md hover:bg-accent ${
                isPinned ? "text-primary bg-accent/50" : "text-card-foreground"
              }`}
              title={isPinned ? "Unpin shelf" : "Pin shelf"}
            >
              {isPinned ? (
                <PinOffIcon className="h-4 w-4" />
              ) : (
                <PinIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex border-b border-border z-10">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === "all"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Images
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              activeTab === "my"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
            onClick={() => setActiveTab("my")}
          >
            My Images
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 relative z-10">
          {displayedImages.length === 0 ? (
            <div className="text-muted-foreground text-center mt-4">
              {activeTab === "all"
                ? "No images added yet"
                : "You haven't uploaded any images yet"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[...displayedImages].reverse().map((image) => (
                <ImageTile
                  key={image.id}
                  url={image.src}
                  onSelect={() => {
                    const element = new ImageElement({
                      assetId: image.id,
                    });
                    onImageSelect(element);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="absolute right-[-20px] left-[-20px] bottom-[-20px] h-[70vh] pointer-events-auto" />
      </div>
    </div>
  );
};

const ImageTile = ({
  url,
  onSelect,
}: { url: string; onSelect: () => void }) => (
  <div
    className="relative group/image cursor-pointer aspect-square w-full rounded-md overflow-hidden"
    onClick={onSelect}
  >
    <Image
      src={url}
      height={200}
      width={200}
      alt="Canvas image"
      className="w-full h-full object-cover"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/40 transition-all duration-200 flex items-center justify-center">
      <span className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
        Add to canvas
      </span>
    </div>
  </div>
);
