'use client'

import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast"

export default function PushNotificationHandler({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const setupPushNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;

          // Request notification permission
          const permission = await Notification.requestPermission();

          if (permission === 'granted') {
            const response = await fetch(`/api/users/${userId}/push-preference`);
            const { enabled } = await response.json();

            if (enabled) {
              let subscription = await registration.pushManager.getSubscription();
              
              if (!subscription) {
                console.log('No subscription found, creating new subscription');
                const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicKey) {
                  throw new Error('VAPID public key is not set');
                }
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: publicKey,
                });
                await saveSubscription(subscription);
              } 

              setSubscription(subscription);
            } else if (!enabled && subscription) {
              await subscription.unsubscribe();
              await deleteSubscription();
              setSubscription(null);
            }
          } else {
            console.log('Notification permission denied');
          }
        } catch (error) {
          console.error('Error setting up push notifications:', error);
        }
      } else {
        console.log('Push notifications are not supported');
      }
    };

    setupPushNotifications();
  }, [userId]);

  async function saveSubscription(subscription: PushSubscription) {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save push subscription');
      }
      console.log('Push subscription saved successfully');
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  async function deleteSubscription() {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete push subscription');
      }
      console.log('Push subscription deleted successfully');
    } catch (error) {
      console.error('Error deleting push subscription:', error);
    }
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          toast({
            title: event.data.title,
            description: event.data.body,
          });
        }
      });
    }
  }, [toast]);

  return null;
}

