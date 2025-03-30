import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { userId, title, body } = await request.json();

  try {
    // Send the push notification without adding to the database
    await sendImmediateNotification(userId, title, body);

    // Create a notification in the database
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: userId,
      message: `${title}: ${body}`,
      type: "admin_notification",
    });

    if (notificationError) {
      throw notificationError;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
