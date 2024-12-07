"use client";

type Theme = "light" | "dark";

interface ThemeColors {
  gridColor: number;
  backgroundColor: number;
}

export class Settings {
  private static instance: Settings;
  private currentTheme: Theme = "dark";

  private themeColors: Record<Theme, ThemeColors> = {
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
    const savedTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1] as Theme | undefined;

    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
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
    document.cookie = `theme=${theme};max-age=31536000;path=/`;
    window.location.reload();
  }

  public get gridColor(): number {
    return this.themeColors[this.currentTheme].gridColor;
  }

  public get backgroundColor(): number {
    return this.themeColors[this.currentTheme].backgroundColor;
  }
}
