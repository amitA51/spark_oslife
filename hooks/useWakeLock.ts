/**
 * Enhanced Wake Lock Hook
 * Keeps the screen awake with advanced features:
 * - Automatic timeout
 * - Battery awareness
 * - Activity-based auto-release
 * - Statistics tracking
 * - Fallback for unsupported browsers
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Wake Lock Sentinel type (not all browsers have this in their types)
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
}

interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

export interface WakeLockStats {
  /** Total time screen has been kept awake (ms) */
  totalActiveTime: number;
  /** Number of times wake lock was acquired */
  acquisitionCount: number;
  /** Number of times wake lock was lost and reacquired */
  reacquisitionCount: number;
  /** Timestamp when wake lock was last acquired */
  lastAcquiredAt: number | null;
}

export interface UseWakeLockOptions {
  /** Initial enabled state */
  enabled?: boolean;
  /** Auto-release after this many milliseconds (0 = never) */
  timeout?: number;
  /** Release wake lock when battery is low (< 20%) */
  releaseonLowBattery?: boolean;
  /** Auto-reacquire when page becomes visible */
  reacquireOnVisibility?: boolean;
  /** Called when wake lock is acquired */
  onAcquire?: () => void;
  /** Called when wake lock is released */
  onRelease?: (reason: 'manual' | 'timeout' | 'visibility' | 'error' | 'battery') => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UseWakeLockReturn {
  /** Whether Wake Lock API is supported */
  isSupported: boolean;
  /** Whether wake lock is currently active */
  isActive: boolean;
  /** Request wake lock */
  request: () => Promise<boolean>;
  /** Release wake lock */
  release: (reason?: 'manual' | 'timeout' | 'visibility' | 'error' | 'battery') => Promise<void>;
  /** Toggle wake lock */
  toggle: () => Promise<boolean>;
  /** Time remaining until auto-release (ms), null if no timeout */
  timeRemaining: number | null;
  /** Statistics about wake lock usage */
  stats: WakeLockStats;
  /** Reset statistics */
  resetStats: () => void;
  /** Whether battery is low (if detectable) */
  isBatteryLow: boolean | null;
}

/**
 * Enhanced Wake Lock hook with timeout, battery awareness, and statistics
 */
export const useWakeLock = (options: UseWakeLockOptions = {}): UseWakeLockReturn => {
  const {
    enabled = false,
    timeout = 0,
    releaseonLowBattery = true,
    reacquireOnVisibility = true,
    onAcquire,
    onRelease,
    onError,
  } = options;

  // Check support once
  const isSupported = useMemo(() => {
    return typeof window !== 'undefined' &&
      'wakeLock' in navigator;
  }, []);

  // State
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isBatteryLow, setIsBatteryLow] = useState<boolean | null>(null);
  const [stats, setStats] = useState<WakeLockStats>({
    totalActiveTime: 0,
    acquisitionCount: 0,
    reacquisitionCount: 0,
    lastAcquiredAt: null,
  });

  // Refs
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wasActiveBeforeHiddenRef = useRef(false);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setTimeRemaining(null);
  }, []);

  /**
   * Update stats when releasing
   */
  const updateStatsOnRelease = useCallback(() => {
    if (startTimeRef.current) {
      const activeTime = Date.now() - startTimeRef.current;
      setStats(prev => ({
        ...prev,
        totalActiveTime: prev.totalActiveTime + activeTime,
      }));
      startTimeRef.current = null;
    }
  }, []);

  /**
   * Release wake lock
   */
  const release = useCallback(async (
    reason: 'manual' | 'timeout' | 'visibility' | 'error' | 'battery' = 'manual'
  ) => {
    clearTimers();

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (error) {
        // Ignore release errors
      }
      wakeLockRef.current = null;
    }

    updateStatsOnRelease();
    setIsActive(false);
    onRelease?.(reason);
  }, [clearTimers, updateStatsOnRelease, onRelease]);

  /**
   * Request wake lock
   */
  const request = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Wake Lock API is not supported in this browser');
      onError?.(new Error('Wake Lock API not supported'));
      return false;
    }

    // Check battery before acquiring
    if (releaseonLowBattery && isBatteryLow) {
      console.warn('Wake Lock not acquired due to low battery');
      return false;
    }

    try {
      const nav = navigator as NavigatorWithWakeLock;
      wakeLockRef.current = await nav.wakeLock!.request('screen');

      // Update state
      setIsActive(true);
      startTimeRef.current = Date.now();

      // Update stats
      setStats(prev => ({
        ...prev,
        acquisitionCount: prev.acquisitionCount + 1,
        lastAcquiredAt: Date.now(),
      }));

      // Set up release event handler
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
        updateStatsOnRelease();
      });

      // Set up timeout if specified
      if (timeout > 0) {
        setTimeRemaining(timeout);

        // Countdown update every second
        countdownRef.current = window.setInterval(() => {
          setTimeRemaining(prev => {
            if (prev === null || prev <= 1000) return null;
            return prev - 1000;
          });
        }, 1000);

        // Auto-release after timeout
        timeoutRef.current = window.setTimeout(() => {
          release('timeout');
        }, timeout);
      }

      onAcquire?.();
      return true;
    } catch (error) {
      console.error('Wake Lock request failed:', error);
      setIsActive(false);
      onError?.(error as Error);
      return false;
    }
  }, [isSupported, releaseonLowBattery, isBatteryLow, timeout, release, updateStatsOnRelease, onAcquire, onError]);

  /**
   * Toggle wake lock
   */
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isActive) {
      await release('manual');
      return false;
    } else {
      return await request();
    }
  }, [isActive, request, release]);

  /**
   * Reset statistics
   */
  const resetStats = useCallback(() => {
    setStats({
      totalActiveTime: 0,
      acquisitionCount: 0,
      reacquisitionCount: 0,
      lastAcquiredAt: null,
    });
  }, []);

  /**
   * Handle visibility change
   */
  useEffect(() => {
    if (!isSupported || !reacquireOnVisibility) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden - remember if we were active
        wasActiveBeforeHiddenRef.current = isActive;
      } else if (document.visibilityState === 'visible') {
        // Page is visible - reacquire if we were active before
        if (wasActiveBeforeHiddenRef.current && enabled && !isActive) {
          const acquired = await request();
          if (acquired) {
            setStats(prev => ({
              ...prev,
              reacquisitionCount: prev.reacquisitionCount + 1,
            }));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, reacquireOnVisibility, enabled, isActive, request]);

  /**
   * Monitor battery status
   */
  useEffect(() => {
    if (!releaseonLowBattery || !('getBattery' in navigator)) {
      return;
    }

    let battery: any = null;

    const handleBatteryChange = () => {
      if (battery) {
        const isLow = battery.level < 0.2 && !battery.charging;
        setIsBatteryLow(isLow);

        // Release if battery becomes low while active
        if (isLow && isActive) {
          release('battery');
        }
      }
    };

    (navigator as any).getBattery().then((bat: any) => {
      battery = bat;
      handleBatteryChange();

      battery.addEventListener('levelchange', handleBatteryChange);
      battery.addEventListener('chargingchange', handleBatteryChange);
    }).catch(() => {
      // Battery API not available
      setIsBatteryLow(null);
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', handleBatteryChange);
        battery.removeEventListener('chargingchange', handleBatteryChange);
      }
    };
  }, [releaseonLowBattery, isActive, release]);

  /**
   * Auto-request/release based on enabled prop
   */
  useEffect(() => {
    if (enabled && isSupported && !isActive) {
      request();
    } else if (!enabled && isActive) {
      release('manual');
    }
  }, [enabled, isSupported, isActive, request, release]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTimers();
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => { });
      }
    };
  }, [clearTimers]);

  return {
    isSupported,
    isActive,
    request,
    release,
    toggle,
    timeRemaining,
    stats,
    resetStats,
    isBatteryLow,
  };
};

export default useWakeLock;
