import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/db";
import { jwtVerify } from "jose";

export async function GET(request: NextRequest) {
  const jwt = request.cookies.get("jwt")?.value;

  if (!jwt) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(jwt, secret);
    const userId = payload.userId as string;

    const { data: user, error } = await supabase.from("users").select("id, name, email, phone").eq("id", userId).single();

    if (error) throw error;

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
