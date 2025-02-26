import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("push_enabled")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return NextResponse.json({ enabled: data.push_enabled });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split("/")[3];
  const { enabled } = await request.json();

  try {
    const { error } = await supabase
      .from("users")
      .update({ push_enabled: enabled })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
