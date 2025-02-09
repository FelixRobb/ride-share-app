import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split("/")[3];

  try {
    const { data, error } = await supabase.from("users").select("push_enabled").eq("id", userId).single();

    if (error) throw error;

    return NextResponse.json({ enabled: data.push_enabled });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split("/")[3];
  const { enabled } = await request.json();

  try {
    const { error } = await supabase.from("users").update({ push_enabled: enabled }).eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
