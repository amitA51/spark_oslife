// services/notificationsService.ts

/**
 * Checks if Notifications are supported by the browser.
 * @returns {boolean} True if supported, false otherwise.
 */
export const isSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Requests permission from the user to show notifications.
 * @returns {Promise<NotificationPermission>} The permission result ('granted', 'denied', or 'default').
 */
export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!isSupported()) {
    console.warn('Notifications not supported in this browser.');
    return 'denied';
  }
  const permission = await window.Notification.requestPermission();
  return permission;
};

/**
 * A generic function to show a local notification via the Service Worker.
 * @param title The title of the notification.
 * @param options The standard NotificationOptions object.
 */
export const showNotification = (title: string, options: NotificationOptions): void => {
  if (!isSupported() || Notification.permission !== 'granted') {
    return;
  }
  navigator.serviceWorker.ready.then(registration => {
    registration.showNotification(title, {
      ...options,
      icon: '/images/spark192.png',
      badge: '/images/spark192.png',
    });
  });
};

/**
 * Shows a test notification to the user if permission has been granted.
 */
export const showTestNotification = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupported()) {
    return { success: false, message: 'הדפדפן אינו תומך בהתראות.' };
  }

  if (Notification.permission === 'granted') {
    showNotification('Spark - התראה לדוגמה', {
      body: 'ההתראות פועלות!',
      tag: 'spark-test-notification',
    });
    return { success: true, message: 'ההתראה נשלחה!' };
  } else if (Notification.permission === 'denied') {
    return { success: false, message: 'התראות נחסמו. יש לאפשר אותן בהגדרות הדפדפן.' };
  } else {
    const permission = await requestPermission();
    if (permission === 'granted') {
      showTestNotification();
      return { success: true, message: 'הרשאה התקבלה, שולח התראה...' };
    } else {
      return { success: false, message: 'הבקשה להיתר התראות נדחתה.' };
    }
  }
};

/**
 * Updates the app icon badge with a given count. Clears it if count is 0.
 * @param {number} count The number to display on the badge.
 */
export const updateAppBadge = (count: number): void => {
  if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
    if (count > 0) {
      navigator.setAppBadge(count).catch((error: Error) => {
        console.error('Failed to set app badge:', error);
      });
    } else {
      navigator.clearAppBadge().catch((error: Error) => {
        console.error('Failed to clear app badge:', error);
      });
    }
  }
};

/**
 * Registers for periodic background sync to check for new feed items.
 */
export const registerPeriodicSync = async (): Promise<void> => {
  const registration = window.swRegistration;
  if (!registration || !registration.periodicSync) {
    console.warn('Periodic Background Sync is not supported.');
    return;
  }

  try {
    await registration.periodicSync.register('feed-sync', {
      minInterval: 12 * 60 * 60 * 1000, // 12 hours
    });
  } catch (error) {
    console.error('Periodic sync registration failed:', error);
  }
};

/**
 * Unregisters from periodic background sync.
 */
export const unregisterPeriodicSync = async (): Promise<void> => {
  const registration = window.swRegistration;
  if (!registration || !registration.periodicSync) {
    return;
  }
  try {
    await registration.periodicSync.unregister('feed-sync');
  } catch (error) {
    console.error('Periodic sync unregistration failed:', error);
  }
};

/**
 * Subscribes the user to push notifications.
 * @param vapidPublicKey The VAPID public key from the server.
 * @returns The PushSubscription object or null if failed.
 */
export const subscribeToPush = async (vapidPublicKey: string): Promise<PushSubscription | null> => {
  if (!isSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
