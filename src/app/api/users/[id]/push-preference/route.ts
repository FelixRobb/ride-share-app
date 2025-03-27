import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.id !== id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const deviceId = url.searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.from("push_subscriptions").select("enabled").eq("user_id", id).eq("device_id", deviceId).single();

    if (error) throw error;

    return NextResponse.json({ enabled: data?.enabled ?? false });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.id !== id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { enabled, deviceId } = await request.json();

  if (typeof enabled !== "boolean" || !deviceId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.from("push_subscriptions").update({ enabled }).eq("user_id", id).eq("device_id", deviceId).select();

    if (error) throw error;

    if (data && data.length === 0) {
      return NextResponse.json({ error: "No matching subscription found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
