import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import type { JwtPayload } from "@/types/jwt"

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/privacy-policy",
  "/terms-of-service",
  "/admin",
  "/reset-password",
  "/logout",
  "/api/login",
  "/api/register",
  "/api/auth/reset-password",
  "/api/admin/login",
  "/api/check-user",
  "/api/suggested-contacts",
  "/api/users/search",
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (publicRoutes.includes(path)) {
    return NextResponse.next()
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
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|service-worker.js|api/login|api/register|api/auth/reset-password|api/admin/login|api/check-user|api/suggested-contacts|logout|api/users/search).*)",
  ],
}

