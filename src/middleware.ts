import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import type { JwtPayload } from "@/types/jwt"

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

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
  "/api/auth/reset-password",
  "/api/admin/login",
  "/api/admin/logout", 
  "/api/admin/check-auth",
  "/manifest.webmanifest",
  // Add public directory files
  "icon-192x192.png",
  "icon.svg",
  "web-app-manifest-192x192.png",
  "web-app-manifest-512x512.png",
  "wide-pwa.png",
  "narrow-pwa.png",
  // Catch all route for public assets
  "/assets/"
]

// List of admin routes that require admin authentication
const adminRoutes = [
  "/api/admin/stats",
  "/api/admin/users",
  "/api/admin/notify-all",
  "/api/admin/notify-user",
  "/api/admin/users/",
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (publicRoutes.includes(path)) {
    return NextResponse.next()
  }

  if (adminRoutes.some((route) => path.startsWith(route))) {
    const adminJwt = request.cookies.get("admin_jwt")?.value

    if (!adminJwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const { payload } = await jwtVerify(adminJwt, secret)
      if (payload.role !== "admin") {
        throw new Error("Not an admin")
      }
      return NextResponse.next()
    } catch (error) {
      console.error("Invalid admin token:", error)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const jwt = request.cookies.get("jwt")?.value

  if (!jwt) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } else {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  try {
    const { payload } = (await jwtVerify(jwt, secret)) as { payload: JwtPayload }

    // Securely attach user data to request
    request.nextUrl.searchParams.set("userId", payload.userId)
    return NextResponse.rewrite(request.nextUrl)
  } catch (error) {
    console.error("Invalid token:", error)
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } else {
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.delete("jwt")
      return response
    }
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|service-worker.js).*)"],
}

