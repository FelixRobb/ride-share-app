import webpush, { sendNotification, setVapidDetails, WebPushError } from "web-push";

import { supabase } from "./db";

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

setVapidDetails(
  "mailto:rideshareapp.mail@gmail.com",
  vapidKeys.publicKey as string,
  vapidKeys.privateKey as string
);

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: string
) {
  try {
    await sendNotification(subscription, payload);
    return true;
  } catch (error) {
    if (error instanceof WebPushError && error.statusCode === 410) {
      return false;
    }
    throw error;
  }
}

export async function sendImmediateNotification(userId: string, title: string, body: string) {
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from("push_subscriptions")
    .select("id, subscription, enabled")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (subscriptionError) throw subscriptionError;

  if (subscriptionData && subscriptionData.length > 0) {
    const payload = JSON.stringify({ title, body });
    const expiredSubscriptions: string[] = [];

    await Promise.all(
      subscriptionData.map(async (sub) => {
        const subscription = JSON.parse(sub.subscription);
        const success = await sendPushNotification(subscription, payload);
        if (!success) {
          expiredSubscriptions.push(sub.id);
        }
      })
    );

    // Remove expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredSubscriptions);
    }
  }
}
