import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export async function POST(request: Request) {
  const { subscription, userId, deviceId, deviceName } = await request.json();

  try {
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        device_id: deviceId,
        subscription: JSON.stringify(subscription),
        device_name: deviceName,
        enabled: true,
        last_used: new Date().toISOString(),
      },
      {
        onConflict: "user_id,device_id",
      }
    );

    if (error) throw error;

    return NextResponse.json({ success: true, enabled: true });
  } catch {
    return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { userId, deviceId } = await request.json();

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .match({ user_id: userId, device_id: deviceId });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete push subscription" }, { status: 500 });
  }
}
