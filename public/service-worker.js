// This is a minimal service worker for push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || "/icon.png",
      badge: "/badge.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title, options))

    // Also send to client if active
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        clients.forEach((client) => {
          client.postMessage({
            type: "PUSH_NOTIFICATION",
            title: data.title,
            body: data.body,
          })
        })
      }
    })
  }
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.")
  event.notification.close()

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return self.clients.openWindow("/")
    }),
  )
})

