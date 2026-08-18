import { NextResponse } from "next/server";
import { auth } from "./auth";

const publicPaths = new Set(["/login", "/register"]);

const demoProxy = () => {
  return NextResponse.next();
};

const authenticatedProxy = auth((request) => {
  const isAuthenticated = Boolean(request.auth?.user);
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && !publicPaths.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && publicPaths.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    isAuthenticated &&
    !request.auth?.user?.onboardingCompleted &&
    pathname !== "/onboarding"
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (
    isAuthenticated &&
    request.auth?.user?.onboardingCompleted &&
    pathname === "/onboarding"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export default process.env.SEED_DEMO_DATA === "true" ? demoProxy : authenticatedProxy;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
