// Utility functions for handling offline functionality

/**
 * Registers the service worker for the application
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }
  console.warn("Service Workers are not supported in this browser");
  return null;
}

/**
 * Registers a background sync task
 * @param tag The tag to identify the sync task
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error("Background sync registration failed:", error);
      return false;
    }
  }
  console.warn("Background Sync is not supported in this browser");
  return false;
}

/**
 * Stores data in IndexedDB for offline use
 * @param storeName The name of the store to save to
 * @param data The data to store
 */
export async function storeOfflineData(storeName: string, data: any): Promise<boolean> {
  // This is a simplified example - in a real app, you'd use a proper IndexedDB library
  try {
    // Implementation would depend on your IndexedDB setup
    console.log(`Storing offline data in ${storeName}:`, data);
    return true;
  } catch (error) {
    console.error("Failed to store offline data:", error);
    return false;
  }
}

/**
 * Checks if the app is currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Clears all service worker caches
 */
export async function clearCaches(): Promise<boolean> {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Create a message channel to receive the response
      const messageChannel = new MessageChannel();

      // Create a promise that will resolve when we get a response
      const clearPromise = new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.status === "SUCCESS") {
            resolve(true);
          } else {
            resolve(false);
          }
        };
      });

      // Send the message to the service worker
      registration.active?.postMessage({ type: "CLEAR_CACHE" }, [messageChannel.port2]);

      return await clearPromise;
    } catch (error) {
      console.error("Failed to clear caches:", error);
      return false;
    }
  }
  return false;
}

/**
 * Handles failed fetch requests by storing them for later sync
 * @param request The request that failed
 * @param data The data that was being sent
 */
export async function handleFailedRequest(request: Request, data: any): Promise<void> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Determine what type of request this is
  if (path.includes("/api/rides")) {
    await storeOfflineData("pendingRides", {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      data: data,
      timestamp: Date.now(),
    });

    // Register for background sync
    await registerBackgroundSync("sync-rides");
  } else if (path.includes("/api/notes")) {
    await storeOfflineData("pendingMessages", {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      data: data,
      timestamp: Date.now(),
    });

    // Register for background sync
    await registerBackgroundSync("sync-messages");
  } else if (path.includes("/api/users")) {
    await storeOfflineData("pendingProfileUpdates", {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      data: data,
      timestamp: Date.now(),
    });

    // Register for background sync
    await registerBackgroundSync("sync-profile");
  }
}

/**
 * Shows a notification to the user about offline status
 * @param message The message to show
 */
export function showOfflineNotification(message: string): void {
  // This would integrate with your app's notification system
  console.log("Offline notification:", message);
}
