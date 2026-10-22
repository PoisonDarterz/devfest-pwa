// DevFest KL 2026 - Service Worker Push & Notification Handlers

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for remote push events dispatched by Web Push (VAPID) server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let title = 'DevFest KL 2026';
  let options = {
    body: 'New announcement available.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: `devfest-push-${Date.now()}`,
    data: { url: '/' },
  };

  try {
    const data = event.data.json();
    title = data.title || title;
    options.body = data.body || data.message || options.body;
    options.icon = data.icon || options.icon;
    options.badge = data.badge || options.badge;
    if (data.tag) options.tag = data.tag;
    if (data.url) options.data.url = data.url;
    if (data.data) options.data = { ...options.data, ...data.data };
  } catch (err) {
    const text = event.data.text();
    if (text) options.body = text;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});
