type Theme = "light" | "dark";

interface ThemeColors {
  gridColor: number;
  backgroundColor: number;
}

export class Settings {
  private static instance: Settings;
  private currentTheme: Theme = "dark";

  private themeColors: Record<"light" | "dark", ThemeColors> = {
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
        this.currentTheme = "dark";
      } else {
        this.currentTheme = "light";
      }
    } else {
      if (savedTheme) {
        this.currentTheme = savedTheme;
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
          this.currentTheme = "dark";
        } else {
          this.currentTheme = "light";
        }
      } else {
        if (currentSavedTheme) {
          this.currentTheme = currentSavedTheme;
        }
      }
    });
  }

  public static getInstance(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }
    return Settings.instance;
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public setTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem("theme", theme);
    window.location.reload();
  }

  public get gridColor(): number {
    return this.themeColors[this.currentTheme].gridColor;
  }

  public get backgroundColor(): number {
    return this.themeColors[this.currentTheme].backgroundColor;
  }
}
