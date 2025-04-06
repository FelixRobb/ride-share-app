import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendPushNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { title, body } = await request.json();

  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabase.from("users").select("id");

    if (usersError) {
      throw usersError;
    }

    // Fetch all push subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, subscription");

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    // Send notifications
    const expiredSubscriptions: string[] = [];
    const notificationPromises = subscriptions.map(async (sub) => {
      const subscription = JSON.parse(sub.subscription);
      const success = await sendPushNotification(subscription, JSON.stringify({ title, body }));
      if (!success) {
        expiredSubscriptions.push(sub.id);
      }
    });

    await Promise.all(notificationPromises);

    // Remove expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredSubscriptions);
    }

    // Create notifications in the database
    const notifications = users.map((user) => ({
      user_id: user.id,
      message: `${title}: ${body}`, // Combine title and body into the message
      type: "admin_notification",
    }));

    const { error: notificationsError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationsError) {
      throw notificationsError;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
