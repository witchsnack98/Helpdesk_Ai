import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-based route protection
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/customer": ["CUSTOMER", "ADMIN"],
  "/agent": ["AGENT", "ADMIN"],
  "/admin": ["ADMIN"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token");
  
  // Get stored user from Zustand persist (stored in localStorage, not accessible here)
  // For server-side protection, we check the cookie existence
  const isAuthenticated = !!token;

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    if (
      pathname.startsWith("/customer") ||
      pathname.startsWith("/agent") ||
      pathname.startsWith("/admin")
    ) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/agent/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
