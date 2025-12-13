export { };

// Battery Manager API types
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => void) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => void) | null;
}

// Periodic Sync API types
interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
}

declare global {
  interface Window {
    swRegistration?: ServiceWorkerRegistrationWithSync;
    webkitAudioContext: typeof AudioContext;
  }

  interface Navigator {
    // Battery API
    getBattery(): Promise<BatteryManager>;
    // Badging API
    setAppBadge(count?: number): Promise<void>;
    clearAppBadge(): Promise<void>;
    // PWA standalone check
    standalone?: boolean;
  }

  // Webkit vendor prefixed AudioContext
  interface WindowEventMap {
    webkitAudioContext: typeof AudioContext;
  }

  // Chrome's non-standard performance.memory API
  interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }

  interface Performance {
    memory?: MemoryInfo;
  }
}

