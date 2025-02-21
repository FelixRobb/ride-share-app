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
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null)
  const [isPushLoading, setIsPushLoading] = useState(true)

  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js")
      return registration
    } catch {
      return null
    }
  }, [])

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
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save push subscription")
      }
    },
    [userId],
  )

  const deleteSubscription = useCallback(async () => {
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

  }, [userId])

  const handlePermissionGranted = useCallback(
    async (registration: ServiceWorkerRegistration) => {
      if (pushEnabled === null) return

      if (pushEnabled) {
        let currentSubscription = await registration.pushManager.getSubscription()

        if (!currentSubscription) {
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
    },
    [subscription, pushEnabled, saveSubscription, deleteSubscription],
  )

  const debouncedHandlePermissionGranted = debounce(handlePermissionGranted, 1000)

  useEffect(() => {
    const setupPushNotifications = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await registerServiceWorker()
        if (!registration) return

        const currentPermission = Notification.permission

        if (currentPermission === "default" && !hasSeenPopup) {
          setShowPermissionPopup(true)
        } else if (currentPermission === "granted") {
          await debouncedHandlePermissionGranted(registration)
        }
      }
    }

    setupPushNotifications()
  }, [hasSeenPopup, debouncedHandlePermissionGranted, registerServiceWorker])

  useEffect(() => {
    const getPushPreference = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/push-preference`)
        const { enabled } = await response.json()
        setPushEnabled(enabled)
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

  const handlePermissionRequest = async () => {
    setShowPermissionPopup(false)
    setHasSeenPopup(true)

    const currentPermission = Notification.permission
    if (currentPermission === "default") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready
        await handlePermissionGranted(registration)
      }
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
            <Button className="mb-2" onClick={handlePermissionRequest}>
              Allow Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
