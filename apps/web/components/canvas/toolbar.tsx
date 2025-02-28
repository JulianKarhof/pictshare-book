import { ModeToggle } from "@web/components/ui/mode-toggle";
import {
  ArrowLeft,
  Circle,
  Download,
  LucideIcon,
  Moon,
  Square,
  Sun,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface ToolbarProps {
  onAddShape: (type: "square" | "circle") => void;
  onImageUpload: (files: File[]) => void;
  onDownload: () => void;
  className?: string;
}

export const Toolbar = ({
  onAddShape,
  onImageUpload: onFileSelect,
  onDownload,
  className,
}: ToolbarProps) => {
  return (
    <div className={` ${className}`}>
      <Link
        href={"/"}
        className="bg-card/80 backdrop-blur-sm rounded-full border border-border p-2 mb-1 flex items-center justify-center h-14 w-14 group relative overflow-hidden"
      >
        <Image
          src="/logo.svg"
          alt="pictshare logo"
          height={28}
          width={28}
          className="absolute transition-transform duration-300 group-hover:-translate-x-14 dark:invert-0 invert"
        />
        <ArrowLeft className="h-[26px] w-[26px] absolute transition-transform duration-300 translate-x-14 group-hover:translate-x-0" />
      </Link>

      <div className="flex flex-col justify-between items-center bg-card/80 backdrop-blur-sm rounded-full border border-border p-2 gap-2">
        <ToolbarButton
          icon={Square}
          onClick={() => onAddShape("square")}
          title="Add Square"
        />

        <ToolbarButton
          icon={Circle}
          onClick={() => onAddShape("circle")}
          title="Add Circle"
        />

        <ToolbarButton icon={Upload} title="Upload Image" asChild>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);

              if (files.length > 0 && onFileSelect) {
                onFileSelect(files);
                e.target.value = "";
              }
            }}
          />
        </ToolbarButton>

        <ToolbarButton icon={Download} onClick={onDownload} title="Download" />
        <ModeToggle
          trigger={
            <button
              className="bg-secondary/80 backdrop-blur-sm hover:bg-secondary/60 text-secondary-foreground p-2 rounded-full border border-border relative"
              title="Toggle Theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute inset-0 m-auto" />
            </button>
          }
          onToggle={() => {
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  title: string;
  className?: string;
  asChild?: boolean;
  children?: ReactNode;
}

export const ToolbarButton = ({
  icon: Icon,
  onClick,
  title,
  className,
  asChild,
  children,
}: ToolbarButtonProps) => {
  const baseClassName =
    "bg-secondary/80 backdrop-blur-sm hover:bg-secondary/60 text-secondary-foreground p-2 rounded-full border border-border";

  if (asChild) {
    return (
      <label
        className={`${baseClassName} cursor-pointer ${className || ""}`}
        title={title}
      >
        <Icon className="h-5 w-5" />
        {children}
      </label>
    );
  }

  return (
    <button
      className={`${baseClassName} ${className || ""}`}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};
