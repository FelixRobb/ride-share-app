self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon.png",
      }),
    )
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow("/dashboard"))
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PUSH_NOTIFICATION") {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(event.data)
      })
    })
  }
})
