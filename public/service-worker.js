// Cache names with versioning for better cache management
const CACHE_NAMES = {
  static: "static-cache-v1",
  dynamic: "dynamic-cache-v1",
  api: "api-cache-v1",
  images: "images-cache-v1",
};

// Assets that should be cached immediately on service worker installation
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192x192.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/wide-pwa.png",
  "/narrow-pwa.png",
  "/offline.html", // Fallback page for when offline
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker...");

  // Precache static assets
  event.waitUntil(
    caches
      .open(CACHE_NAMES.static)
      .then((cache) => {
        console.log("[Service Worker] Precaching App Shell");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[Service Worker] Precaching complete");
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error("[Service Worker] Precaching error:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker...");

  // Remove old cache versions
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            // If the key doesn't match any of our current cache names, delete it
            if (!Object.values(CACHE_NAMES).includes(key)) {
              console.log("[Service Worker] Removing old cache", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log("[Service Worker] Claiming clients");
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests (network-first strategy)
  if (isApiRequest(event.request)) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Handle image requests (cache-first strategy)
  if (isImageRequest(event.request)) {
    event.respondWith(cacheFirstStrategy(event.request, CACHE_NAMES.images));
    return;
  }

  // For navigation requests, use network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline.html");
      })
    );
    return;
  }

  // For all other requests, use stale-while-revalidate strategy
  event.respondWith(staleWhileRevalidateStrategy(event.request));
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json();

      event.waitUntil(
        self.clients
          .matchAll({
            type: "window",
            includeUncontrolled: true,
          })
          .then((clients) => {
            // Check if we have any visible clients
            const visibleClients = clients.filter((client) => client.visibilityState === "visible");

            if (visibleClients.length > 0) {
              // Send to all clients to ensure it's received
              return Promise.all(
                clients.map((client) => {
                  return client.postMessage({
                    type: "PUSH_NOTIFICATION",
                    title: data.title,
                    body: data.body,
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
                  ...(data.data || {}),
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
          body: "You have a new notification",
        })
      );
    }
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow("/");
      })
  );
});

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Sync", event.tag);

  if (event.tag === "sync-rides") {
    event.waitUntil(syncRides());
  } else if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  } else if (event.tag === "sync-profile") {
    event.waitUntil(syncProfile());
  }
});

// Message handler for communication with the app
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches()
      .then(() => {
        // Notify the client that caches were cleared
        event.ports[0].postMessage({ status: "SUCCESS" });
      })
      .catch((error) => {
        console.error("[Service Worker] Cache clearing error:", error);
        event.ports[0].postMessage({ status: "ERROR", error: error.message });
      });
  } else if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ===== Helper Functions =====

// Check if request is for an API endpoint
function isApiRequest(request) {
  return request.url.includes("/api/");
}

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === "image" || /\.(png|jpg|jpeg|svg|gif)$/i.test(request.url);
}

// Network-first strategy with cache fallback
async function networkFirstStrategy(request) {
  const cacheName = isApiRequest(request) ? CACHE_NAMES.api : CACHE_NAMES.dynamic;

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Clone the response before using it
    const responseToCache = networkResponse.clone();

    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch {
    console.log("[Service Worker] Network request failed, falling back to cache", request.url);

    // If network fails, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's an API request and we don't have a cached response,
    // return a custom offline response
    if (isApiRequest(request)) {
      return new Response(
        JSON.stringify({
          error: "You are offline",
          offline: true,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For other resources, return the default offline page
    return caches.match("/offline.html");
  }
}

// Cache-first strategy with network fallback
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // If we have a cached response, use it but also update cache in background
      updateCache(request, cacheName);
      return cachedResponse;
    }

    // If not in cache, get from network
    const networkResponse = await fetch(request);

    // Clone the response before using it
    const responseToCache = networkResponse.clone();

    // Cache the new response
    const cache = await caches.open(cacheName);
    await cache.put(request, responseToCache);

    return networkResponse;
  } catch (error) {
    console.error("[Service Worker] Cache-first strategy error:", error);

    // For images, return a placeholder image
    if (isImageRequest(request)) {
      return caches.match("/placeholder.svg");
    }

    // For other resources, return the default offline page
    return caches.match("/offline.html");
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cacheName = CACHE_NAMES.dynamic;

  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);

    // Update cache in background regardless of whether we found a cached response
    const updatePromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches
            .open(cacheName)
            .then((cache) => cache.put(request, responseToCache))
            .catch((error) => console.error("[Service Worker] Cache update error:", error));
        }
        return networkResponse;
      })
      .catch((error) => {
        console.error("[Service Worker] Network fetch error in stale-while-revalidate:", error);
      });

    // Return cached response immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cached response, wait for the network response
    return await updatePromise;
  } catch (error) {
    console.error("[Service Worker] Stale-while-revalidate strategy error:", error);
    return caches.match("/offline.html");
  }
}

// Update cache in background
async function updateCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    console.error("[Service Worker] Background cache update error:", error);
  }
}

// Clear all caches
async function clearAllCaches() {
  const cacheKeys = await caches.keys();
  return Promise.all(cacheKeys.map((key) => caches.delete(key)));
}

// Background sync for rides
async function syncRides() {
  try {
    // Get all pending ride operations from IndexedDB
    const pendingRides = await getPendingRidesFromDB();

    // Process each pending operation
    for (const operation of pendingRides) {
      try {
        // Attempt to send the operation to the server
        await sendRideOperation(operation);

        // If successful, remove from pending operations
        await removePendingRideFromDB(operation.id);

        // Notify the user that the operation was successful
        await notifyUser("Ride update synchronized", "Your ride changes have been saved.");
      } catch (error) {
        console.error("[Service Worker] Failed to sync ride operation:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Sync rides error:", error);
  }
}

// Background sync for messages
async function syncMessages() {
  try {
    // Get all pending messages from IndexedDB
    const pendingMessages = await getPendingMessagesFromDB();

    // Process each pending message
    for (const message of pendingMessages) {
      try {
        // Attempt to send the message to the server
        await sendMessage(message);

        // If successful, remove from pending messages
        await removePendingMessageFromDB(message.id);
      } catch (error) {
        console.error("[Service Worker] Failed to sync message:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Sync messages error:", error);
  }
}

// Background sync for profile updates
async function syncProfile() {
  try {
    // Get pending profile updates from IndexedDB
    const pendingUpdates = await getPendingProfileUpdatesFromDB();

    // Process each pending update
    for (const update of pendingUpdates) {
      try {
        // Attempt to send the update to the server
        await sendProfileUpdate(update);

        // If successful, remove from pending updates
        await removePendingProfileUpdateFromDB(update.id);

        // Notify the user that the update was successful
        await notifyUser("Profile update synchronized", "Your profile changes have been saved.");
      } catch (error) {
        console.error("[Service Worker] Failed to sync profile update:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Sync profile error:", error);
  }
}

// Placeholder functions for IndexedDB operations
// These would be implemented with actual IndexedDB code in a real application
async function getPendingRidesFromDB() {
  // This would fetch pending ride operations from IndexedDB
  return [];
}

async function removePendingRideFromDB(id) {
  // This would remove a pending ride operation from IndexedDB
  console.log("[Service Worker] Removed pending ride operation:", id);
}

async function getPendingMessagesFromDB() {
  // This would fetch pending messages from IndexedDB
  return [];
}

async function removePendingMessageFromDB(id) {
  // This would remove a pending message from IndexedDB
  console.log("[Service Worker] Removed pending message:", id);
}

async function getPendingProfileUpdatesFromDB() {
  // This would fetch pending profile updates from IndexedDB
  return [];
}

async function removePendingProfileUpdateFromDB(id) {
  // This would remove a pending profile update from IndexedDB
  console.log("[Service Worker] Removed pending profile update:", id);
}

// Placeholder functions for network operations
async function sendRideOperation(operation) {
  // This would send a ride operation to the server
  console.log("[Service Worker] Sending ride operation:", operation);
}

async function sendMessage(message) {
  // This would send a message to the server
  console.log("[Service Worker] Sending message:", message);
}

async function sendProfileUpdate(update) {
  // This would send a profile update to the server
  console.log("[Service Worker] Sending profile update:", update);
}

// Notify the user
async function notifyUser(title, body) {
  // Check if we can show notifications
  const permission = self.Notification.permission;

  if (permission === "granted") {
    return self.registration.showNotification(title, {
      body: body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
    });
  }
}
