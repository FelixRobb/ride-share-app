import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { JwtPayload } from "@/types/jwt";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/privacy-policy",
  "/terms-of-service",
  "/admin",
  "/reset-password",
  "/verify-email",
  "/api/login",
  "/api/register",
  "/api/user",
  "/api/auth/reset-password",
  "/api/auth/check-reset-token",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/check-auth",
  "/api/check-user",
  "/api/suggested-contacts",
  "/api/users/search",
  "/api/logout",
  "/logout"
];

// List of static files and directories that should be publicly accessible
const publicFiles = ["/_next", "/favicon.ico", "/manifest.webmanifest", "/robots.txt", "/sitemap.xml", "/icon-192x192.png", "/icon-256x256.png", "/icon-384x384.png", "/icon-512x512.png", "/service-worker.js", "/wide-pwa.png", "/narrow-pwa.png"];

// List of admin routes that require admin authentication
const adminRoutes = ["/api/admin/stats", "/api/admin/users", "/api/admin/notify-all", "/api/admin/notify-user"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow public access to static files
  if (publicFiles.some((file) => path.startsWith(file))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Handle admin routes
  if (adminRoutes.some((route) => path.startsWith(route))) {
    return handleAdminRoute(request);
  }

  // Handle protected routes
  return handleProtectedRoute(request);
}

async function handleAdminRoute(request: NextRequest) {
  const adminJwt = request.cookies.get("admin_jwt")?.value;

  if (!adminJwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(adminJwt, secret);
    if (payload.role !== "admin") {
      throw new Error("Not an admin");
    }
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.delete("admin_jwt");
    return response;
  }
}

async function handleProtectedRoute(request: NextRequest) {
  const jwt = request.cookies.get("jwt")?.value;

  if (!jwt) {
    return handleInvalidToken(request);
  }

  try {
    const { payload } = (await jwtVerify(jwt, secret)) as unknown as { payload: JwtPayload };
    // Securely attach user data to request
    request.nextUrl.searchParams.set("userId", payload.userId);
    return NextResponse.rewrite(request.nextUrl);
  } catch {
    return handleInvalidToken(request);
  }
}

function handleInvalidToken(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("jwt");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
