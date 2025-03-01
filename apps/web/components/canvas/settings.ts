import { useCallback, useEffect, useState } from "react";
type Theme = "light" | "dark";

interface ThemeColors {
  gridColor: number;
  backgroundColor: number;
}

export class Settings {
  private static _instance: Settings;
  private _currentTheme: Theme = "light";
  private _imageShelfPinned: boolean = false;

  private _themeColors: Record<"light" | "dark", ThemeColors> = {
    light: {
      gridColor: 0x404040,
      backgroundColor: 0xffffff,
    },
    dark: {
      gridColor: 0xaaaaaa,
      backgroundColor: 0x1a1a1a,
    },
  };

  private constructor() {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | undefined;

    this._imageShelfPinned =
      localStorage.getItem("image_shelf_pinned") === "true";

    if (savedTheme === "system") {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        this._currentTheme = "dark";
      } else {
        this._currentTheme = "light";
      }
    } else {
      if (savedTheme) {
        this._currentTheme = savedTheme;
      }
    }

    window.addEventListener("storage", () => {
      const currentSavedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | "system"
        | undefined;

      if (currentSavedTheme === "system") {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          this._currentTheme = "dark";
        } else {
          this._currentTheme = "light";
        }
      } else {
        if (currentSavedTheme) {
          this._currentTheme = currentSavedTheme;
        }
      }
    });
  }

  public static getInstance(): Settings {
    if (!Settings._instance) {
      Settings._instance = new Settings();
    }
    return Settings._instance;
  }

  public getTheme(): Theme {
    return this._currentTheme;
  }

  public setTheme(theme: Theme): void {
    this._currentTheme = theme;
    localStorage.setItem("theme", theme);
    window.location.reload();
  }

  public get imageShelfPinned(): boolean {
    return this._imageShelfPinned;
  }

  public set imageShelfPinned(pinned: boolean) {
    this._imageShelfPinned = pinned;
    localStorage.setItem("image_shelf_pinned", pinned.toString());
  }

  public get gridColor(): number {
    return this._themeColors[this._currentTheme].gridColor;
  }

  public get backgroundColor(): number {
    return this._themeColors[this._currentTheme].backgroundColor;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [imageShelfPinned, setImageShelfPinnedState] = useState(false);

  useEffect(() => {
    const settingsInstance = Settings.getInstance();
    setSettings(settingsInstance);
    setImageShelfPinnedState(settingsInstance.imageShelfPinned);
  }, []);

  const setImageShelfPinned = useCallback(
    (pinned: boolean) => {
      if (settings) {
        settings.imageShelfPinned = pinned;
        setImageShelfPinnedState(pinned);
      }
    },
    [settings],
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "image_shelf_pinned") {
        const newPinnedValue = e.newValue === "true";
        if (newPinnedValue !== imageShelfPinned) {
          setImageShelfPinnedState(newPinnedValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [imageShelfPinned]);

  const theme = settings?.getTheme() || "light";

  const setTheme = useCallback(
    (newTheme: "light" | "dark") => {
      settings?.setTheme(newTheme);
    },
    [settings],
  );

  return {
    imageShelfPinned,
    setImageShelfPinned,
    theme,
    setTheme,
    backgroundColor: settings?.backgroundColor || 0x1a1a1a,
    gridColor: settings?.gridColor || 0xaaaaaa,
  };
}
