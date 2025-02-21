export async function unregisterServiceWorker(subscription: PushSubscription | null) {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
  }

  if (subscription) {
    try {
      await subscription.unsubscribe()
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
    }
  }
}

