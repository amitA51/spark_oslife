const CACHE_NAME = 'spark-pwa-v19'; // Incremented version
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// Install: Caches the app shell. NO LONGER SKIPS WAITING.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL);
      })
    // self.skipWaiting() is removed to allow for update prompts.
  );
});

// Activate: Cleans up old caches and takes control of the page.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener to handle 'SKIP_WAITING' from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// Fetch: Handles requests with specific strategies.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 0. Ignore cross-origin requests - Let browser handle external resources
  // This prevents "Failed to fetch" errors for Google Fonts, APIs, Analytics, etc.
  if (url.origin !== self.location.origin) {
    // For cross-origin, just pass through to network without caching
    // Don't call respondWith - let the browser handle it naturally
    return;
  }

  // 1. Navigation: Network First, fall back to cache (index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2. Assets (Images, Fonts, JS, CSS): Cache First
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. API Calls: Network First (don't cache API by default, or handle specifically)
  // For this app, most data is local (IndexedDB), but if we had API calls:
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // 4. Default: Stale While Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      const fetchPromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        if (!cachedResponse) throw err;
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// --- PWA Features: Background Sync & Notifications ---

// Periodic Sync: Triggers roughly every 12 hours to re-engage the user.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'feed-sync') {
    console.log('Periodic sync event fired for feed-sync');
    event.waitUntil(
      self.registration.showNotification('Spark בודק עדכונים', {
        body: 'פתח את האפליקציה כדי לסנכרן את התוכן האחרון שלך.',
        icon: '/images/resized-image.png',
        tag: 'feed-sync-notification',
        data: { action: 'go_feed' }
      })
    );
  }
});

// Push Notifications: Handles push messages from a server (if implemented).
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'התראה חדשה מ-Spark', body: 'יש לך תוכן חדש שמחכה.' };
  console.log('Push notification received', data);
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/resized-image.png',
      tag: data.tag || 'spark-push-notification',
      data: data.data || { action: 'go_today' }
    })
  );
});

// Notification Click: Handles what happens when a user interacts with a notification.
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag, 'Action:', event.action);
  event.notification.close();

  const action = event.notification.data?.action || 'go_today';
  const targetUrl = new URL(`/?action=${action}`, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's an open window for this origin.
      let client = clientList.find(c => c.url.startsWith(self.location.origin) && 'focus' in c);

      if (client) {
        // If a client is found, navigate it to the target URL and focus it.
        if (client.navigate) {
          client.navigate(targetUrl);
        }
        return client.focus();
      } else {
        // If no client is found, open a new one.
        return clients.openWindow(targetUrl);
      }
    })
  );
});