// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, notificationIds } = await request.json();

  if (!userId || !notificationIds || !Array.isArray(notificationIds)) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .in('id', notificationIds);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications as read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
