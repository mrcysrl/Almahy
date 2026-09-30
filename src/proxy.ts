import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  if (!hasSession && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// API routes do their own auth and return 401 JSON, so they're excluded
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};