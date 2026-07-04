// ========================================================
// Rojgar Suvidha — Premium Service Worker (Web Push)
// ========================================================

self.addEventListener('push', function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'Aapke liye ek important update hai!',
    icon: '/logo-blue.png',          // Brand icon (192x192 recommended)
    badge: '/logo-blue.png',         // Small monochrome badge in notification bar
    image: data.image || null,       // Optional large banner image
    vibrate: [200, 100, 200, 100, 200],
    silent: false,
    tag: data.tag || 'rojgar-suvidha',          // Replaces old notification of same tag
    renotify: true,                             // Always play sound even if same tag
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'open',
        title: data.actionLabel || '🔗 Abhi Dekho',
      },
      {
        action: 'dismiss',
        title: '✕ Baad Mein',
      },
    ],
    data: {
      url: data.url || '/',
      jobTitle: data.jobTitle || '',
      category: data.category || 'general',
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Rojgar Suvidha', options)
  );
});

// ── Notification click handler ──────────────────────────
self.addEventListener('notificationclick', function (event) {
  const notification = event.notification;
  const action = event.action;
  const targetUrl = (notification.data && notification.data.url) || '/';

  notification.close();

  if (action === 'dismiss') return;

  // Focus existing window or open a new tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ── Push subscription change (auto re-subscribe) ────────
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then(function (subscription) {
        return fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, action: 'subscribe' }),
        });
      })
  );
});

