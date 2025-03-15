import {
  ArrowLeft,
  Circle,
  LucideIcon,
  Pencil,
  Square,
  Type,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface ToolbarProps {
  onAddShape: (type: "square" | "circle" | "text") => void;
  onDraw: () => void;
  isDrawing: boolean;
  className?: string;
}

export const Toolbar = ({
  onAddShape,
  onDraw,
  isDrawing,
  className,
}: ToolbarProps) => {
  return (
    <div id="toolbar" className={className}>
      <Link
        href={"/"}
        className="bg-card/80 backdrop-blur-sm rounded-full border border-border mb-1 flex items-center justify-center h-13 w-13 group relative overflow-hidden"
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

      <div className="flex flex-col justify-between items-center bg-card/80 backdrop-blur-sm rounded-full border border-border gap-2 p-[5px]">
        <ToolbarButton
          icon={Square}
          onClick={() => onAddShape("square")}
          title="Add Square"
          data-testid="add-square"
        />

        <ToolbarButton
          icon={Circle}
          onClick={() => onAddShape("circle")}
          title="Add Circle"
          data-testid="add-circle"
        />

        <ToolbarButton
          icon={Type}
          onClick={() => onAddShape("text")}
          title="Add Text"
          data-testid="add-text"
        />

        <ToolbarButton
          icon={Pencil}
          active={isDrawing}
          onClick={() => onDraw()}
          title="Draw"
          data-testid="draw"
        />
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
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
  active,
  ...rest
}: ToolbarButtonProps) => {
  const baseClassName =
    "bg-secondary/80 backdrop-blur-sm hover:bg-secondary/60 text-secondary-foreground p-2 rounded-full border border-border";

  const activeClassName = active
    ? "bg-secondary text-primary-foreground border-primary"
    : "";

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
      className={`${baseClassName} ${activeClassName} ${className || ""}`}
      onClick={onClick}
      title={title}
      {...rest}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};
