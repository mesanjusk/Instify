// Instify Push & Offline Service Worker
// Handles: push notifications, notification clicks, offline mutation queuing.
// Precaching & runtime caching are handled by the Workbox SW (workbox-sw.js).

const CACHE_VERSION = 'instify-push-v2';
const OFFLINE_QUEUE_TAG = 'instify-offline-queue';

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(['/index.html', '/manifest.json', '/icon.svg']).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate: remove stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('instify-') && k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: offline fallback for navigation ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Queue failed API mutations for background sync replay
  if (
    request.url.includes('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  ) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        const body = await request.clone().text().catch(() => '');
        const queued = {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body,
          timestamp: Date.now(),
        };
        self.clients.matchAll().then((clients) =>
          clients.forEach((c) =>
            c.postMessage({ type: 'OFFLINE_QUEUED', payload: queued })
          )
        );
        return new Response(
          JSON.stringify({ success: false, offline: true, queued: true }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // For HTML navigation, fall back to cached index.html when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((r) => r || Response.error())
      )
    );
  }
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === OFFLINE_QUEUE_TAG) {
    event.waitUntil(
      self.clients.matchAll().then((clients) =>
        clients.forEach((c) => c.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' }))
      )
    );
  }
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = { title: 'Instify', body: 'You have a new notification', url: '/' };
  try {
    payload = { ...payload, ...event.data?.json() };
  } catch {
    if (event.data?.text()) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag || 'instify-notif',
      data: { url: payload.url || '/' },
      vibrate: [100, 50, 100],
    })
  );
});

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.startsWith(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate?.(targetUrl);
        } else {
          self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Message Channel ───────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'REGISTER_SYNC') {
    self.registration.sync?.register(OFFLINE_QUEUE_TAG).catch(() => {});
  }
});
