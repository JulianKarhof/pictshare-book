import { Minus, Plus } from "lucide-react";

interface ZoomControlsProps {
  currentScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
}

export const ZoomControls = ({
  currentScale,
  onZoomIn,
  onZoomOut,
  className,
}: ZoomControlsProps) => {
  return (
    <div
      className={`flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border p-2 ${className}`}
    >
      <button
        className="bg-secondary/80 backdrop-blur-sm hover:bg-secondary/60 text-secondary-foreground p-2 rounded-full border border-border"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="text-foreground text-sm font-medium w-[4ch] text-center">
        {(currentScale * 100 + 80).toFixed(0)}%
      </div>
      <button
        className="bg-secondary/80 backdrop-blur-sm hover:bg-secondary/60 text-secondary-foreground p-2 rounded-full border border-border"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};
