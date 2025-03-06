import { ModeToggle } from "@web/components/ui/mode-toggle";
import { Download, Moon, Sun } from "lucide-react";
import { ToolbarButton } from "./toolbar";

interface SettingsBarProps {
  onManageUsers: () => void;
  onDownload: () => void;
  className?: string;
}

export const SettingsBar = ({
  onManageUsers,
  onDownload,
  className,
}: SettingsBarProps) => {
  return (
    <div
      className={`flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full border border-border p-[5px] group ${className}`}
    >
      <ToolbarButton
        icon={Download}
        onClick={onDownload}
        title="Download"
        data-testid="download"
      />
      <ModeToggle
        data-testid="mode-toggle"
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
      <button
        onClick={onManageUsers}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-full border border-border flex items-center h-[40px] gap-2"
      >
        Share
      </button>
    </div>
  );
};
