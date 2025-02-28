// This is a minimal service worker for push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json();

      event.waitUntil(
        self.clients.matchAll({
          type: "window",
          includeUncontrolled: true
        }).then((clients) => {
          // Check if we have any visible clients
          const visibleClients = clients.filter(client => client.visibilityState === "visible");

          if (visibleClients.length > 0) {
            // Send to all clients to ensure it's received
            return Promise.all(
              clients.map(client => {
                return client.postMessage({
                  type: "PUSH_NOTIFICATION",
                  title: data.title,
                  body: data.body
                });
              })
            );
          } else {
            // No visible clients - show native notification
            const options = {
              body: data.body,
              icon: data.icon || "/icon.png",
              vibrate: [100, 50, 100],
              data: {
                dateOfArrival: Date.now(),
                primaryKey: "2",
                ...(data.data || {})
              },
            };
            return self.registration.showNotification(data.title, options);
          }
        })
      );
    } catch {
      // Fall back to basic notification if parsing fails
      event.waitUntil(
        self.registration.showNotification("New Notification", {
          body: "You have a new notification"
        })
      );
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({
      type: "window"
    }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});

// Log when service worker installs and activates
self.addEventListener("install", () => {
  self.skipWaiting(); // Force activation
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim()); // Take control immediately
});