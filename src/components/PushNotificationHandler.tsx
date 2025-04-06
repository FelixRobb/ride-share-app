"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [_permissionState, setPermissionState] = useState<NotificationPermission | null>(null);

  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined" && typeof navigator !== "undefined";

  // Function to get current notification permission
  const checkPermission = useCallback(() => {
    if (isBrowser && "Notification" in window) {
      const permission = Notification.permission;
      // Store permission in localStorage for persistence across reloads
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("notificationPermission", permission);
      }
      return permission;
    }
    return null;
  }, [isBrowser]);

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

  const deleteSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/push-subscription", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          deviceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete subscription: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      return false;
    }
  }, [userId, deviceId]);

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

  // Effect to check permission state on mount and when it changes
  useEffect(() => {
    if (isBrowser) {
      // First check localStorage for previously stored permission
      const storedPermission = localStorage.getItem("notificationPermission");
      const hasDeclinedInApp = localStorage.getItem("pushNotificationDeclined") === "true";

      // Then get current browser permission
      const currentPermission = checkPermission();
      setPermissionState(currentPermission);

      // If the stored permission was granted but is now denied, clean up
      if (storedPermission === "granted" && currentPermission === "denied") {
        void deleteSubscription();
      }

      // If permission is denied or user has declined in app with default permission, remove subscription
      if (currentPermission === "denied" || (currentPermission === "default" && hasDeclinedInApp)) {
        void deleteSubscription();
      }
    }
  }, [isBrowser, checkPermission, deleteSubscription]);

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
        setPermissionState(currentPermission);

        // Check if user has explicitly declined in the app
        const hasDeclinedInApp = localStorage.getItem("pushNotificationDeclined") === "true";

        if (currentPermission === "granted") {
          // Check if we have a valid subscription
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            // Subscription exists, update it
            const success = await handlePermissionGranted(registration);
            if (!success) {
              toast.error("Failed to setup push notifications");
            }
          } else {
            // No subscription yet, create a new one
            const success = await handlePermissionGranted(registration);
            if (!success) {
              toast.error("Failed to setup push notifications");
            }
          }
        } else if (currentPermission === "default" && !hasSeenPopup && !hasDeclinedInApp) {
          // Only show popup if user hasn't seen it and hasn't declined before
          setShowPermissionPopup(true);
        } else if (currentPermission === "default" && hasDeclinedInApp) {
          // If permission is default but user has declined in app, remove subscription
          await deleteSubscription();
        } else if (currentPermission === "denied") {
          // Remove subscription if it exists when permission is denied
          await deleteSubscription();
        }
      } catch {
        toast.error("Failed to setup push notifications");
      }
    };

    setupPushNotifications();

    // Set up periodic permission check (every 30 minutes)
    const permissionCheckInterval = setInterval(
      () => {
        if (isBrowser && "Notification" in window) {
          const currentPermission = Notification.permission;
          const hasDeclinedInApp = localStorage.getItem("pushNotificationDeclined") === "true";

          // Need to check both denied and default+declined
          if (
            (_permissionState === "granted" && currentPermission === "denied") ||
            (_permissionState === "granted" && currentPermission === "default" && hasDeclinedInApp)
          ) {
            void deleteSubscription();
          }

          setPermissionState(currentPermission);
        }
      },
      30 * 60 * 1000
    );

    return () => {
      clearInterval(permissionCheckInterval);
    };
  }, [
    hasSeenPopup,
    registerServiceWorker,
    handlePermissionGranted,
    deleteSubscription,
    isBrowser,
    _permissionState,
  ]);

  const handleDecline = () => {
    setShowPermissionPopup(false);
    setHasSeenPopup(true);
    localStorage.setItem("pushNotificationDeclined", "true");

    // Also delete any existing subscription when user explicitly declines
    void deleteSubscription();
  };

  const handlePermissionRequest = async () => {
    setShowPermissionPopup(false);
    setHasSeenPopup(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      // Store permission in localStorage
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("notificationPermission", permission);
      }

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
          className="fixed top-[4.5rem] md:top-[5.5rem] left-0 right-0 mx-auto z-50 w-80 sm:left-4 md:right-auto md:mx-0 shadow-lg"
        >
          <Card className="border-primary/20 shadow-md shadow-primary/10">
            <CardContent className="p-3 flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Stay updated about your rides and important information with push notifications on
                  this device.
                </p>
              </div>
              <div className="flex gap-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="h-8 px-3 text-xs"
                >
                  Not Now
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePermissionRequest}
                  className="h-8 px-3 text-xs"
                >
                  Enable
                </Button>
              </div>
            </CardContent>
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
