import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET() {
  const cookieStore = await cookies();
  const adminJwt = cookieStore.get("admin_jwt")?.value;

  if (!adminJwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(adminJwt, secret);
    if (payload.role !== "admin") {
      throw new Error("Not an admin");
    }
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
