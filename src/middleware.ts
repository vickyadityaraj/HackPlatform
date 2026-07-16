import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

  // Allow API routes to pass through (handled separately or via API tokens)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages to their respective dashboards
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }
    return NextResponse.next();
  }

  // Handle protected dashboard routes
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login", nextUrl));
    }

    // Redirect /dashboard root to the role-specific sub-path
    if (nextUrl.pathname === "/dashboard" || nextUrl.pathname === "/dashboard/") {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }

    // Role-based directory guarding
    if (nextUrl.pathname.startsWith("/dashboard/admin") && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }
    if (nextUrl.pathname.startsWith("/dashboard/organizer") && userRole !== "ORGANIZER") {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }
    if (nextUrl.pathname.startsWith("/dashboard/participant") && userRole !== "PARTICIPANT") {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }
    if (nextUrl.pathname.startsWith("/dashboard/judge") && userRole !== "JUDGE") {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }
    if (nextUrl.pathname.startsWith("/dashboard/coordinator") && userRole !== "COORDINATOR") {
      return NextResponse.redirect(new URL(getRedirectUrl(userRole), nextUrl));
    }
  }

  return NextResponse.next();
});

function getRedirectUrl(role?: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard/admin";
    case "ORGANIZER":
      return "/dashboard/organizer";
    case "JUDGE":
      return "/dashboard/judge";
    case "COORDINATOR":
      return "/dashboard/coordinator";
    case "PARTICIPANT":
    default:
      return "/dashboard/participant";
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
