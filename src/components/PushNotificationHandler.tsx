"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { debounce } from "lodash"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getDeviceId, getDeviceInfo } from "@/utils/deviceUtils"

export default function PushNotificationHandler({
  userId,
}: {
  userId: string
}) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [showPermissionPopup, setShowPermissionPopup] = useState(false)
  const [hasSeenPopup, setHasSeenPopup] = useState(false)
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null)
  const [isPushLoading, setIsPushLoading] = useState(true)
  const [deviceId] = useState(() => getDeviceId())
  const [deviceInfo] = useState(() => getDeviceInfo())

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
          deviceId,
          deviceName: deviceInfo.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save push subscription")
      }

      const data = await response.json()
      return data.enabled
    },
    [userId, deviceId, deviceInfo.name],
  )

  const deleteSubscription = useCallback(async () => {
    const response = await fetch("/api/push-subscription", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, deviceId }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete push subscription")
    }
  }, [userId, deviceId])

  const updateSubscriptionStatus = useCallback(
    async (enabled: boolean) => {
      const response = await fetch("/api/push-subscription", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, deviceId, enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to update push subscription status")
      }
    },
    [userId, deviceId],
  )

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
            const enabled = await saveSubscription(currentSubscription)
            setPushEnabled(enabled)
          }
        } else {
          // Update the subscription to ensure it's current
          const enabled = await saveSubscription(currentSubscription)
          setPushEnabled(enabled)
        }

        setSubscription(currentSubscription)
      } else if (!pushEnabled && subscription) {
        await updateSubscriptionStatus(false)
      }
    },
    [subscription, pushEnabled, saveSubscription, updateSubscriptionStatus],
  )

  const debouncedHandlePermissionGranted = debounce(handlePermissionGranted, 1000)

  useEffect(() => {
    const setupPushNotifications = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await registerServiceWorker()
        if (!registration) return

        const currentPermission = Notification.permission
        const hasDeclinedBefore = localStorage.getItem("pushNotificationDeclined")

        // Only show the popup if not granted and haven't declined before
        if (currentPermission === "default" && !hasDeclinedBefore && !hasSeenPopup) {
          setShowPermissionPopup(true)
        }
      }
    }

    setupPushNotifications()
  }, [hasSeenPopup, registerServiceWorker])

  const handleDecline = () => {
    setShowPermissionPopup(false)
    setHasSeenPopup(true)
    localStorage.setItem("pushNotificationDeclined", "true")
  }

  useEffect(() => {
    const getPushPreference = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/push-preference?deviceId=${deviceId}`)
        if (response.ok) {
          const { enabled } = await response.json()
          setPushEnabled(enabled)
        } else {
          setPushEnabled(false)
        }
      } finally {
        setIsPushLoading(false)
      }
    }

    getPushPreference()
  }, [userId, deviceId])

  useEffect(() => {
    if (!isPushLoading && pushEnabled !== null) {
      navigator.serviceWorker.ready.then((registration) => {
        // Only handle subscription management, not permission requests
        if (Notification.permission === "granted") {
          void debouncedHandlePermissionGranted(registration)
        }
      })
    }
  }, [isPushLoading, pushEnabled, debouncedHandlePermissionGranted])

  const handlePermissionRequest = async () => {
    setShowPermissionPopup(false)
    setHasSeenPopup(true)

    try {
      // Register service worker first if not already registered
      const registration = await registerServiceWorker()
      if (!registration) {
        throw new Error("Failed to register service worker")
      }

      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setPushEnabled(true)
        await handlePermissionGranted(registration)
        toast.success("Push notifications enabled successfully!")
      } else {
        setPushEnabled(false)
        toast.error("Permission denied for push notifications")
      }
    } catch {
      toast.error("Failed to enable push notifications")
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
    <AnimatePresence mode="wait">
      {showPermissionPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 left-0 right-0 mx-auto z-50 w-80 sm:left-4 sm:right-auto sm:mx-0"
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
                Stay updated about your rides and important information with push notifications on this device.
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
  )
}

