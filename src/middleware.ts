import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.pathname === "/") {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "img-src 'self' blob: data: https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://unpkg.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "connect-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
        "font-src 'self' data:;"
    );
  }

  return response;
}

export const config = {
  matcher: "/",
};

