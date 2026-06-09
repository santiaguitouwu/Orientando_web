import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "orientando_auth";

const PROTECTED_PATHS = [
  "/dashboard",
  "/customers",
  "/professionals",
  "/areas",
  "/files",
  "/chat-audit",
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME);
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/professionals/:path*",
    "/areas/:path*",
    "/files/:path*",
    "/chat-audit/:path*",
    "/login",
  ],
};