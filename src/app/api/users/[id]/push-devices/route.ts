import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Await params before using
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.id !== id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = params.id;

  try {
    const { data, error } = await supabase.from("push_subscriptions").select("id, device_id, device_name, enabled, last_used").eq("user_id", userId).order("last_used", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ devices: data });
  } catch (error) {
    console.error("Error fetching push devices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
