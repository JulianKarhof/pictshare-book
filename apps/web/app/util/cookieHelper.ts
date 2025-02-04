export class CookieHelper {
  static getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;

    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  }

  static setCookie(
    name: string,
    value: string,
    options: {
      maxAge?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: "Strict" | "Lax" | "None";
    } = {},
  ): void {
    if (typeof document === "undefined") return;

    const {
      maxAge = 31536000, // 1 year
      path = "/",
      domain,
      secure,
      sameSite = "Lax",
    } = options;

    let cookieString = `${name}=${value}`;

    if (maxAge) cookieString += `;max-age=${maxAge}`;
    if (path) cookieString += `;path=${path}`;
    if (domain) cookieString += `;domain=${domain}`;
    if (secure) cookieString += ";secure";
    if (sameSite) cookieString += `;samesite=${sameSite}`;

    document.cookie = cookieString;
  }

  static removeCookie(name: string, path: string = "/"): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=;max-age=0;path=${path}`;
  }
}
