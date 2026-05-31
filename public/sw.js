// Hextech push notifications service worker.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = data.title || 'Hextech';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        try {
          const u = new URL(c.url);
          if (u.origin === self.location.origin) {
            c.focus();
            return c.navigate(url).catch(() => {});
          }
        } catch (_) {}
      }
      return self.clients.openWindow(url);
    })
  );
});
