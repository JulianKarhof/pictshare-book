import { ImageObject } from "@web/components/canvas/objects";
import { Image as ImageIcon } from "lucide-react";

interface ImageShelfProps {
  images: string[];
  onImageSelect: (element: ImageObject) => void;
  className?: string;
}

export const ImageShelf = ({
  images,
  onImageSelect,
  className,
}: ImageShelfProps) => {
  return (
    <div
      className={`w-96 h-[60vh] bg-card/80 backdrop-blur-sm shadow-lg transform transition-transform duration-300 ease-in-out translate-y-[calc(100%-70px)] hover:translate-y-[6px] rounded-t-xl border border-border group ${className}`}
    >
      <div className="absolute right-[-20px] left-[-20px] bottom-[-20px] h-[65vh]" />

      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <ImageIcon className="h-5 w-5 text-card-foreground" />
          <h2 className="text-card-foreground text-lg font-semibold">Images</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {images.length === 0 ? (
            <div className="text-muted-foreground text-center mt-4">
              No images added yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((imageUrl, index) => (
                <ImageTile
                  key={index}
                  url={imageUrl}
                  onSelect={() => {
                    const element = new ImageObject({ url: imageUrl });
                    onImageSelect(element);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ImageTile = ({
  url,
  onSelect,
}: { url: string; onSelect: () => void }) => (
  <div className="relative group/image cursor-pointer" onClick={onSelect}>
    <img
      src={url}
      alt="Canvas image"
      className="w-full h-32 object-cover rounded-md"
    />
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-40 transition-opacity duration-200 rounded-md flex items-center justify-center">
      <span className="text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
        Add to canvas
      </span>
    </div>
  </div>
);
