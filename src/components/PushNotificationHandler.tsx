"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function PushNotificationHandler({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [showPermissionPopup, setShowPermissionPopup] = useState(false)
  const [hasSeenPopup, setHasSeenPopup] = useState(false)

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
            await handlePermissionGranted(registration)
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
  }, [userId, hasSeenPopup])

  async function saveSubscription(subscription: PushSubscription) {
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

  async function deleteSubscription() {
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

  const handlePermissionGranted = async (registration: ServiceWorkerRegistration) => {
    const response = await fetch(`/api/users/${userId}/push-preference`)
    const { enabled } = await response.json()

    if (enabled) {
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        console.log("No subscription found, creating new subscription")
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          throw new Error("VAPID public key is not set")
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        })
        await saveSubscription(subscription)
      }

      setSubscription(subscription)
    } else if (!enabled && subscription) {
      await subscription.unsubscribe()
      await deleteSubscription()
      setSubscription(null)
    }
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

