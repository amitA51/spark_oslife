/**
 * Enhanced PWA Update Hook
 * Comprehensive Progressive Web App update management
 * Features: Version tracking, download progress, offline detection, install prompt
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export type UpdateStatus =
  | 'idle'           // No update activity
  | 'checking'       // Checking for updates
  | 'downloading'    // Update is downloading
  | 'ready'          // Update ready to install
  | 'installing'     // Installing update
  | 'error';         // Error occurred

export interface PwaUpdateState {
  /** Current update status */
  status: UpdateStatus;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** The waiting service worker */
  waitingWorker: ServiceWorker | null;
  /** Whether PWA is supported */
  isSupported: boolean;
  /** Whether currently offline */
  isOffline: boolean;
  /** Current installed version (if set in SW) */
  currentVersion: string | null;
  /** New version available (if set in SW) */
  newVersion: string | null;
  /** Last time we checked for updates */
  lastCheckTime: Date | null;
  /** Error message if any */
  error: string | null;
  /** Download progress (0-100) if available */
  downloadProgress: number | null;
  /** Whether the app can be installed (beforeinstallprompt) */
  canInstall: boolean;
}

export interface PwaUpdateReturn extends PwaUpdateState {
  /** Apply the available update (reloads page) */
  applyUpdate: () => void;
  /** Manually check for updates */
  checkForUpdate: () => Promise<void>;
  /** Dismiss the update notification */
  dismissUpdate: () => void;
  /** Show install prompt (if available) */
  promptInstall: () => Promise<boolean>;
  /** Number of times update was dismissed */
  dismissCount: number;
}

// Storage keys
const STORAGE_KEYS = {
  DISMISS_COUNT: 'pwa_update_dismiss_count',
  LAST_DISMISS: 'pwa_update_last_dismiss',
  CURRENT_VERSION: 'pwa_current_version',
};

/**
 * Enhanced PWA update hook with full control over app updates
 */
export const usePwaUpdate = (): PwaUpdateReturn => {
  // State
  const [state, setState] = useState<PwaUpdateState>({
    status: 'idle',
    updateAvailable: false,
    waitingWorker: null,
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    currentVersion: null,
    newVersion: null,
    lastCheckTime: null,
    error: null,
    downloadProgress: null,
    canInstall: false,
  });

  const [dismissCount, setDismissCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.DISMISS_COUNT) || '0', 10);
    } catch {
      return 0;
    }
  });

  // Refs
  const installPromptRef = useRef<any>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<PwaUpdateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle service worker state changes
   */
  const handleWorkerStateChange = useCallback((worker: ServiceWorker) => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      updateState({
        status: 'ready',
        updateAvailable: true,
        waitingWorker: worker,
      });
    } else if (worker.state === 'installing') {
      updateState({ status: 'downloading' });
    } else if (worker.state === 'activated') {
      updateState({ status: 'idle' });
    }
  }, [updateState]);

  /**
   * Check for updates manually
   */
  const checkForUpdate = useCallback(async (): Promise<void> => {
    if (!state.isSupported) return;

    updateState({ status: 'checking', error: null });

    try {
      const registration = await navigator.serviceWorker.ready;
      registrationRef.current = registration;

      await registration.update();

      updateState({
        lastCheckTime: new Date(),
        status: registration.waiting ? 'ready' : 'idle',
        updateAvailable: !!registration.waiting,
        waitingWorker: registration.waiting,
      });
    } catch (error) {
      console.error('Update check failed:', error);
      updateState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Update check failed',
      });
    }
  }, [state.isSupported, updateState]);

  /**
   * Apply the pending update
   */
  const applyUpdate = useCallback(() => {
    if (!state.waitingWorker) return;

    updateState({ status: 'installing' });

    // Tell the waiting service worker to skip waiting
    state.waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // Listen for the controlling service worker to change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;

      // Store that we just updated
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, state.newVersion || 'unknown');
      } catch {
        // Ignore storage errors
      }

      window.location.reload();
    });
  }, [state.waitingWorker, state.newVersion, updateState]);

  /**
   * Dismiss the update notification
   */
  const dismissUpdate = useCallback(() => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);

    try {
      localStorage.setItem(STORAGE_KEYS.DISMISS_COUNT, String(newCount));
      localStorage.setItem(STORAGE_KEYS.LAST_DISMISS, new Date().toISOString());
    } catch {
      // Ignore storage errors
    }

    updateState({ updateAvailable: false });
  }, [dismissCount, updateState]);

  /**
   * Prompt user to install PWA
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPromptRef.current) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      const result = await installPromptRef.current.prompt();
      const outcome = result.outcome || result.userChoice?.outcome;

      if (outcome === 'accepted') {
        updateState({ canInstall: false });
        installPromptRef.current = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }, [updateState]);

  // Initialize service worker listeners
  useEffect(() => {
    if (!state.isSupported) return;

    const registerListeners = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        registrationRef.current = registration;

        // Check if there's already a waiting worker
        if (registration.waiting) {
          updateState({
            status: 'ready',
            updateAvailable: true,
            waitingWorker: registration.waiting,
          });
        }

        // Listen for new service workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              handleWorkerStateChange(newWorker);
            });
          }
        });

        // Get current version from service worker if available
        if (navigator.serviceWorker.controller) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data?.version) {
              updateState({ currentVersion: event.data.version });
            }
          };
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          );
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
        updateState({
          status: 'error',
          error: 'Failed to register service worker listeners',
        });
      }
    };

    registerListeners();
  }, [state.isSupported, updateState, handleWorkerStateChange]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => updateState({ isOffline: false });
    const handleOffline = () => updateState({ isOffline: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateState]);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
      updateState({ canInstall: true });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [updateState]);

  // Check for updates periodically (every hour)
  useEffect(() => {
    if (!state.isSupported) return;

    const interval = setInterval(() => {
      checkForUpdate();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [state.isSupported, checkForUpdate]);

  return {
    ...state,
    applyUpdate,
    checkForUpdate,
    dismissUpdate,
    promptInstall,
    dismissCount,
  };
};

// Simple backward-compatible export
export default usePwaUpdate;
