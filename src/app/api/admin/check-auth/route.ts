import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const adminJwt = cookieStore.get("admin_jwt")?.value;

  if (!adminJwt) {
    return NextResponse.json(
      {
        authenticated: false,
        message: "No admin token found",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }

  try {
    const { payload } = await jwtVerify(adminJwt, secret);

    if (payload.role !== "admin") {
      throw new Error("Not an admin");
    }

    return NextResponse.json(
      {
        authenticated: true,
        message: "Admin authenticated successfully",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch {
    // Delete the invalid/expired token
    cookieStore.delete("admin_jwt");

    return NextResponse.json(
      {
        authenticated: false,
        message: "Invalid or expired admin token",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }
}
