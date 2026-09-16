// DevFest KL 2026 - Service Worker Notification Handlers

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus existing open window or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Optional: Listen for push events if push service is connected
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'DevFest KL 2026';
    const options = {
      body: data.body || 'New announcement available.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: data.data || {},
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('DevFest KL 2026', {
        body: text,
        icon: '/pwa-192x192.png',
      })
    );
  }
});
