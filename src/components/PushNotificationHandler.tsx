"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { debounce } from "lodash"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PushNotificationHandler({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [showPermissionPopup, setShowPermissionPopup] = useState(false)
  const [hasSeenPopup, setHasSeenPopup] = useState(false)
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null) // Store push preference
  const [isPushLoading, setIsPushLoading] = useState(true)

  const handlePermissionGranted = useCallback(async (registration: ServiceWorkerRegistration) => {
    if (pushEnabled === null) return // Don't do anything if push preference hasn't been loaded yet

    const saveSubscription = async (subscription: PushSubscription) => {
      try {
        const response = await fetch("/api/push-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save push subscription")
        }
        console.log("Push subscription saved successfully")
      } catch (error) {
        console.error("Error saving push subscription:", error)
      }
    }

    const deleteSubscription = async () => {
      try {
        const response = await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          throw new Error("Failed to delete push subscription")
        }
        console.log("Push subscription deleted successfully")
      } catch (error) {
        console.error("Error deleting push subscription:", error)
      }
    }

    if (pushEnabled) {
      let currentSubscription = await registration.pushManager.getSubscription()

      if (!currentSubscription) {
        console.log("No subscription found, creating new subscription")
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          throw new Error("VAPID public key is not set")
        }
        currentSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        })
        if (currentSubscription) {
          await saveSubscription(currentSubscription)
        }
      }

      setSubscription(currentSubscription)
    } else if (!pushEnabled && subscription) {
      await subscription.unsubscribe()
      await deleteSubscription()
      setSubscription(null)
    }
  }, [userId, subscription, pushEnabled])

  const debouncedHandlePermissionGranted = debounce(handlePermissionGranted, 1000)

  useEffect(() => {
    const setupPushNotifications = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready

          // Check the current permission status
          const currentPermission = Notification.permission

          if (currentPermission === "default" && !hasSeenPopup) {
            setShowPermissionPopup(true)
          } else if (currentPermission === "granted") {
            await debouncedHandlePermissionGranted(registration)
          }
          // If permission is "denied", do nothing
        } catch (error) {
          console.error("Error setting up push notifications:", error)
        }
      } else {
        console.log("Push notifications are not supported")
      }
    }

    setupPushNotifications()
  }, [userId, hasSeenPopup, debouncedHandlePermissionGranted])

  useEffect(() => {
    const getPushPreference = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/push-preference`)
        const { enabled } = await response.json()
        setPushEnabled(enabled)
      } catch (error) {
        console.error("Error getting push preference:", error)
      } finally {
        setIsPushLoading(false)
      }
    }

    getPushPreference()
  }, [userId])

  useEffect(() => {
    if (!isPushLoading && "serviceWorker" in navigator && "PushManager" in window && pushEnabled !== null) {
      navigator.serviceWorker.ready.then((registration) => {
        void debouncedHandlePermissionGranted(registration)
      })
    }
  }, [isPushLoading, pushEnabled, debouncedHandlePermissionGranted])

  const handlePermissionRequest = async (event: React.MouseEvent<HTMLButtonElement> | boolean = true) => {
    if (typeof event !== "boolean") {
      setShowPermissionPopup(false)
    }
    setHasSeenPopup(true)

    const currentPermission = Notification.permission
    if (currentPermission === "default") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready
        await handlePermissionGranted(registration)
      }
    }
    // If permission is already "granted" or "denied", do nothing
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "PUSH_NOTIFICATION") {
          toast(event.data.title, {
            description: event.data.body,
          })
        }
      })
    }
  }, [])

  return (
    <>
      <Dialog
        open={showPermissionPopup}
        onOpenChange={(open) => {
          setShowPermissionPopup(open)
          if (!open) {
            setHasSeenPopup(true)
          }
        }}
      >
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Enable Push Notifications</DialogTitle>
            <DialogDescription>
              RideShare needs your permission to send push notifications. This allows us to keep you updated about your
              rides and important information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setShowPermissionPopup(false)}>
              Cancel
            </Button>
            <Button className="mb-2" onClick={handlePermissionRequest}>Allow Notifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

