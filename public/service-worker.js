console.log('Service Worker: File loaded');

self.addEventListener('install', function(event) {
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activated');
});

self.addEventListener('push', function(event) {
  console.log('Service Worker: Push event received');
  if (event.data) {
    const data = event.data.json();
    console.log('Push event data:', data);
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon.png' // Ensure you have an icon.png in your public folder
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification click event');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/dashboard')
  );
});

self.addEventListener('message', function(event) {
  console.log('Service Worker: Message event received', event.data);
  if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
    self.clients.matchAll().then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage(event.data);
      });
    });
  }
});

