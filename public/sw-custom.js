// Import Workbox libraries from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const CACHE_VERSION = 'spark-v1';
const NOTIFICATION_CACHE = 'spark-notifications';
const WIDGET_CACHE = 'spark-widget-data';

// Workbox manifest injection point - DO NOT MODIFY THIS LINE
// Workbox will replace self.__WB_MANIFEST with the actual precache manifest
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

const DB_NAME = 'SparkOS';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('scheduledNotifications')) {
        const store = db.createObjectStore('scheduledNotifications', { keyPath: 'id' });
        store.createIndex('scheduledFor', 'scheduledFor', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('widgetData')) {
        db.createObjectStore('widgetData', { keyPath: 'type' });
      }
    };
  });
}

async function getScheduledNotifications() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['scheduledNotifications'], 'readonly');
    const store = transaction.objectStore('scheduledNotifications');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function updateNotificationStatus(id, status) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['scheduledNotifications'], 'readwrite');
    const store = transaction.objectStore('scheduledNotifications');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const notification = getRequest.result;
      if (notification) {
        notification.status = status;
        notification.updatedAt = new Date().toISOString();
        const putRequest = store.put(notification);
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(false);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function checkAndSendScheduledNotifications() {
  try {
    const notifications = await getScheduledNotifications();
    const now = new Date();

    const pendingNotifications = notifications.filter(n =>
      n.status === 'pending' &&
      new Date(n.scheduledFor) <= now
    );

    for (const notification of pendingNotifications) {
      try {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/images/spark192.png',
          badge: '/images/spark192.png',
          tag: notification.id,
          data: notification.data || {},
          actions: notification.actions || [],
          requireInteraction: notification.type === 'task_reminder',
          vibrate: [200, 100, 200],
          silent: false
        });

        await updateNotificationStatus(notification.id, 'sent');

        if (notification.repeatPattern === 'daily') {
          const nextTime = new Date(notification.scheduledFor);
          nextTime.setDate(nextTime.getDate() + 1);

          const db = await openDatabase();
          const transaction = db.transaction(['scheduledNotifications'], 'readwrite');
          const store = transaction.objectStore('scheduledNotifications');

          store.put({
            ...notification,
            id: `${notification.id}-${nextTime.getTime()}`,
            scheduledFor: nextTime.toISOString(),
            status: 'pending'
          });
        }
      } catch (error) {
        console.error('[SW] Failed to send notification:', notification.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Error checking scheduled notifications:', error);
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkAndSendScheduledNotifications());
  }

  if (event.tag === 'update-widget-data') {
    event.waitUntil(updateWidgetData());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkAndSendScheduledNotifications());
  }
});

async function updateWidgetData() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['widgetData'], 'readonly');
    const store = transaction.objectStore('widgetData');

    const todayData = await new Promise((resolve, reject) => {
      const request = store.get('today');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (todayData) {
      const cache = await caches.open(WIDGET_CACHE);
      await cache.put(
        '/widgets/today-data.json',
        new Response(JSON.stringify(todayData), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }
  } catch (error) {
    console.error('[SW] Error updating widget data:', error);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  if (action === 'complete') {
    event.waitUntil(
      handleCompleteAction(data)
    );
  } else if (action === 'snooze') {
    event.waitUntil(
      handleSnoozeAction(data)
    );
  } else if (action === 'skip') {
    event.waitUntil(
      handleSkipAction(data)
    );
  } else {
    event.waitUntil(
      openApp(data.deepLink || '/')
    );
  }
});

async function handleCompleteAction(data) {
  if (data.itemId) {
    const allClients = await clients.matchAll({ type: 'window' });

    for (const client of allClients) {
      client.postMessage({
        type: 'COMPLETE_ITEM',
        itemId: data.itemId,
        itemType: data.actionType
      });
    }
  }

  await openApp('/?action=go_today');
}

async function handleSnoozeAction(data) {
  const snoozeMinutes = 60;
  const newTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);

  if (data.itemId) {
    const db = await openDatabase();
    const transaction = db.transaction(['scheduledNotifications'], 'readwrite');
    const store = transaction.objectStore('scheduledNotifications');

    store.put({
      id: `snooze-${data.itemId}-${Date.now()}`,
      type: data.actionType || 'task_reminder',
      scheduledFor: newTime.toISOString(),
      title: data.title || 'תזכורת',
      body: `נדחה מ-${new Date().toLocaleTimeString('he-IL')}`,
      status: 'pending',
      data: data,
      actions: [
        { action: 'complete', title: 'סיימתי' },
        { action: 'snooze', title: 'דחה שעה' }
      ]
    });
  }
}

async function handleSkipAction(data) {
  console.log('[SW] Skipped:', data.itemId);
}

async function openApp(path) {
  const allClients = await clients.matchAll({ type: 'window' });

  for (const client of allClients) {
    if (client.url.includes(self.registration.scope) && 'focus' in client) {
      await client.focus();
      if (path !== '/') {
        client.postMessage({
          type: 'NAVIGATE',
          path: path
        });
      }
      return;
    }
  }

  if (clients.openWindow) {
    await clients.openWindow(path);
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/images/spark192.png',
        badge: '/images/spark192.png',
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        vibrate: [200, 100, 200]
      })
    );
  } catch (error) {
    console.error('[SW] Push event error:', error);
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
    event.waitUntil(checkAndSendScheduledNotifications());
  }

  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    event.waitUntil(scheduleNotification(event.data.notification));
  }
});

async function scheduleNotification(notification) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['scheduledNotifications'], 'readwrite');
    const store = transaction.objectStore('scheduledNotifications');

    await new Promise((resolve, reject) => {
      const request = store.put({
        ...notification,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('[SW] Notification scheduled:', notification.id);
  } catch (error) {
    console.error('[SW] Error scheduling notification:', error);
  }
}

self.addEventListener('install', (event) => {
  console.log('[SW] Custom service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Custom service worker activated');
  event.waitUntil(clients.claim());
});