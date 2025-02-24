type Theme = "light" | "dark";

interface ThemeColors {
  gridColor: number;
  backgroundColor: number;
}

export class Settings {
  private static _instance: Settings;
  private _currentTheme: Theme = "dark";

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
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | undefined;

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

  public get gridColor(): number {
    return this._themeColors[this._currentTheme].gridColor;
  }

  public get backgroundColor(): number {
    return this._themeColors[this._currentTheme].backgroundColor;
  }
}
