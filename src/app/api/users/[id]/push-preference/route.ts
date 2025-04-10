import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.id !== id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  }

  const url = new URL(request.url);
  const deviceId = url.searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json(
      { error: "Device ID is required" },
      {
        status: 400,
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
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("enabled")
      .eq("user_id", id)
      .eq("device_id", deviceId)
      .single();

    if (error) throw error;

    return NextResponse.json(
      { enabled: data?.enabled ?? false },
      {
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
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
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
    const { data, error } = await supabase
      .from("push_subscriptions")
      .update({ enabled })
      .eq("user_id", id)
      .eq("device_id", deviceId)
      .select();

    if (error) throw error;

    if (data && data.length === 0) {
      return NextResponse.json({ error: "No matching subscription found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
