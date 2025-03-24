import { getSessionCookie } from "better-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import env from "./lib/env";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: `pctsh-book-${env.NEXT_PUBLIC_PICTSHARE_BOOK_ENV}`,
  });

  if (!sessionCookie && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (sessionCookie && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
};
