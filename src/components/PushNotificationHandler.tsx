"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceId, getDeviceInfo } from "@/utils/deviceUtils";

interface PushNotificationMessage {
  type: string;
  title?: string;
  body?: string;
}

export default function PushNotificationHandler({ userId }: { userId: string }) {
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);
  const [deviceId] = useState(() => getDeviceId());
  const [deviceInfo] = useState(() => getDeviceInfo());
  const messageHandlerSet = useRef(false);

  // Function to register the service worker
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    try {
      // Force update by unregistering existing service workers first
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }

      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
      });
      return registration;
    } catch {
      toast.error("Failed to register service worker");
      return null;
    }
  }, []);

  const saveSubscription = useCallback(
    async (subscription: PushSubscription) => {
      const response = await fetch("/api/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
          deviceId,
          deviceName: deviceInfo.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.status}`);
      }

      const data = await response.json();
      return data.enabled;
    },
    [userId, deviceId, deviceInfo.name]
  );

  const handlePermissionGranted = useCallback(
    async (registration: ServiceWorkerRegistration) => {
      // First, unsubscribe from any existing subscription
      let currentSubscription = await registration.pushManager.getSubscription();
      if (currentSubscription) {
        await currentSubscription.unsubscribe();
      }

      // Create a new subscription
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("VAPID public key is not set");
      }

      // Use the VAPID key directly
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      currentSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      if (currentSubscription) {
        await saveSubscription(currentSubscription);
        return true;
      }
      return false;
    },
    [saveSubscription]
  );

  // Setup push notification message handler
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Prevent setting up multiple handlers
    if (messageHandlerSet.current) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as PushNotificationMessage;

      // Handle push notification messages
      if (data && data.type === "PUSH_NOTIFICATION") {
        // Show toast notification
        toast.info(data.title || "Notification", {
          description: data.body || "",
          duration: 5000,
        });
      }
    };

    // Setup listener directly on navigator.serviceWorker
    navigator.serviceWorker.addEventListener("message", handleMessage);
    messageHandlerSet.current = true;

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
        messageHandlerSet.current = false;
      }
    };
  }, []);

  // Initial setup for push notifications
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          return;
        }

        const registration = await registerServiceWorker();
        if (!registration) {
          return;
        }

        const currentPermission = Notification.permission;

        if (currentPermission === "granted") {
          const success = await handlePermissionGranted(registration);
          if (!success) {
            toast.error("Failed to setup push notifications");
          }
        } else if (currentPermission === "default" && !hasSeenPopup) {
          const hasDeclined = localStorage.getItem("pushNotificationDeclined");
          if (!hasDeclined) {
            setShowPermissionPopup(true);
          }
        } else if (currentPermission === "denied") {
          // Do nothing
        }
      } catch {
        toast.error("Failed to setup push notifications");
      }
    };

    setupPushNotifications();
  }, [hasSeenPopup, registerServiceWorker, handlePermissionGranted]);

  const handleDecline = () => {
    setShowPermissionPopup(false);
    setHasSeenPopup(true);
    localStorage.setItem("pushNotificationDeclined", "true");
  };

  const handlePermissionRequest = async () => {
    setShowPermissionPopup(false);
    setHasSeenPopup(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        toast.error("Permission denied for push notifications");
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("Failed to register service worker");
      }

      const success = await handlePermissionGranted(registration);
      if (success) {
        toast.success("Push notifications enabled successfully!");
      } else {
        throw new Error("Failed to setup push notifications");
      }
    } catch {
      toast.error("Failed to enable push notifications");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {showPermissionPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 md:top-20 left-0 right-0 mx-auto z-50 w-80 sm:left-4 sm:right-auto sm:mx-0"
        >
          <Card className="w-80 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Enable Notifications</span>
                <Button variant="ghost" size="sm" onClick={handleDecline}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Stay updated about your rides and important information with push notifications on
                this device.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleDecline}>
                Not Now
              </Button>
              <Button variant="default" size="sm" onClick={handlePermissionRequest}>
                Enable
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Remove any padding characters
  const base64 = base64String
    .replace(/=/g, "")
    // Replace URL-safe characters
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  // Add padding back
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = base64 + padding;

  try {
    const rawData = window.atob(base64Padded);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch {
    throw new Error("Invalid VAPID key format");
  }
}
