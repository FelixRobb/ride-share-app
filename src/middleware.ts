import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/privacy-policy",
  "/terms-of-service",
  "/admin",
  "/reset-password",
  "/api/login",
  "/api/register",
  "/logout",
  "/verify-email",
  "/api/reviews/approved",
  "/api/auth/reset-password",
  "/api/auth/check-reset-token",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/check-auth",
  "/api/logout",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/callback",
  "/api/auth/callback/credentials",
  "/api/auth/providers",
  "/api/auth/csrf",
  "/api/auth/logout",
  "/about",
  "/faq",
];

// List of admin routes that require admin authentication
const adminRoutes = ["/api/admin/stats", "/api/admin/users", "/api/admin/notify-all", "/api/admin/notify-user"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

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
    // Verify admin JWT here
    // If verification fails, throw an error
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.delete("admin_jwt");
    return response;
  }
}

async function handleProtectedRoute(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow NextAuth.js authentication routes
  if (path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    return handleInvalidToken(request);
  }

  // Attach the user ID to the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-User-Id", token.id as string);

  // Clone the request with the new headers
  const newRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  });

  return NextResponse.next({
    request: newRequest,
  });
}

function handleInvalidToken(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Don't redirect if it's an API route
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For non-API routes, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js authentication routes)
     * - _next (static files and images)
     * - public assets and icons
     */
    "/((?!api/auth|_next|favicon\\.ico|manifest\\.webmanifest|icon-\\d+x\\d+\\.png|icon\\.svg|service-worker\\.js|wide-pwa\\.png|narrow-pwa\\.png|twitter-image\\.png|og-image\\.png|web-app-manifest-192x192\\.png|web-app-manifest-512x512\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};
