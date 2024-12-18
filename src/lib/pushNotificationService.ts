import webpush from 'web-push';
import { supabase } from './db';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:rideshareapp.mail@gmail.com',
  vapidKeys.publicKey!,
  vapidKeys.privateKey!
);

export async function sendPushNotification(subscription: webpush.PushSubscription, payload: string) {
  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function sendImmediateNotification(userId: string, title: string, body: string) {
  try {
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (subscriptionError) throw subscriptionError;

    if (subscriptionData && subscriptionData.length > 0) {
      const { data: pushPreferenceData, error: pushPreferenceError } = await supabase
        .from('users')
        .select('push_enabled')
        .eq('id', userId);

      if (pushPreferenceError) throw pushPreferenceError;

      if (pushPreferenceData && pushPreferenceData[0].push_enabled) {
        const payload = JSON.stringify({ title, body });
        await Promise.all(subscriptionData.map(async (sub) => {
          const subscription = JSON.parse(sub.subscription);
          await sendPushNotification(subscription, payload);
        }));
      } else {
        console.log('Push notifications are not enabled for user', userId);
      }
    }
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
}

