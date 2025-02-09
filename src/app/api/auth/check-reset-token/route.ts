import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.from("password_reset_tokens").select("expires_at").eq("token", token).single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ valid: false, message: "Token not found" });
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (expiresAt < now) {
      return NextResponse.json({ valid: false, message: "Token has expired" });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: "An error occurred while checking the token" }, { status: 500 });
  }
}
