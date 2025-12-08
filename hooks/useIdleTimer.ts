/**
 * Enhanced Idle Timer Hook
 * Detects user inactivity with advanced features like:
 * - Multiple idle states (warning -> idle -> away)
 * - Visibility change detection
 * - Pause/resume capability
 * - Time remaining tracking
 * - Activity callbacks
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// Idle state progression
export type IdleState = 'active' | 'warning' | 'idle' | 'away';

export interface UseIdleTimerOptions {
  /** Time in ms before entering 'idle' state */
  idleTimeout?: number;
  /** Time in ms before showing warning (must be less than idleTimeout) */
  warningTimeout?: number;
  /** Time in ms of inactivity after idle before 'away' state */
  awayTimeout?: number;
  /** Called when user becomes idle */
  onIdle?: () => void;
  /** Called when warning period starts */
  onWarning?: () => void;
  /** Called when user becomes away */
  onAway?: () => void;
  /** Called when user becomes active again */
  onActive?: () => void;
  /** Called on every activity event */
  onActivity?: () => void;
  /** Additional events to track beyond defaults */
  customEvents?: (keyof WindowEventMap)[];
  /** Whether to start paused */
  startPaused?: boolean;
  /** Whether page visibility changes affect idle state */
  detectVisibility?: boolean;
}

export interface UseIdleTimerReturn {
  /** Current idle state */
  state: IdleState;
  /** Whether user is currently active */
  isActive: boolean;
  /** Whether user is idle (includes warning state) */
  isIdle: boolean;
  /** Whether user is away */
  isAway: boolean;
  /** Time remaining until idle (in ms) */
  timeUntilIdle: number;
  /** Time remaining until warning (in ms) */
  timeUntilWarning: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset and restart the timer */
  reset: () => void;
  /** Whether timer is currently paused */
  isPaused: boolean;
}

// Default events to monitor
const DEFAULT_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'mouseup',
  'keydown',
  'keypress',
  'keyup',
  'scroll',
  'wheel',
  'touchstart',
  'touchmove',
  'touchend',
  'click',
  'contextmenu',
  'drag',
  'drop',
];

const useIdleTimer = (options: UseIdleTimerOptions = {}): UseIdleTimerReturn => {
  const {
    idleTimeout = 5 * 60 * 1000, // 5 minutes default
    warningTimeout,
    awayTimeout = 15 * 60 * 1000, // 15 minutes default
    onIdle,
    onWarning,
    onAway,
    onActive,
    onActivity,
    customEvents = [],
    startPaused = false,
    detectVisibility = true,
  } = options;

  // Refs for timers
  const warningTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const awayTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // State
  const [state, setState] = useState<IdleState>('active');
  const [isPaused, setIsPaused] = useState(startPaused);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeUntilIdle, setTimeUntilIdle] = useState(idleTimeout);
  const [timeUntilWarning, setTimeUntilWarning] = useState(warningTimeout || idleTimeout);

  // Combined events list
  const events = useMemo(
    () => [...new Set([...DEFAULT_EVENTS, ...customEvents])],
    [customEvents]
  );

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (awayTimerRef.current) {
      window.clearTimeout(awayTimerRef.current);
      awayTimerRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start timers
  const startTimers = useCallback(() => {
    clearAllTimers();

    const now = Date.now();
    setLastActivity(now);

    // Update countdown every second
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - now;
      setTimeUntilIdle(Math.max(0, idleTimeout - elapsed));
      if (warningTimeout) {
        setTimeUntilWarning(Math.max(0, warningTimeout - elapsed));
      }
    }, 1000);

    // Warning timer
    if (warningTimeout && warningTimeout < idleTimeout) {
      warningTimerRef.current = window.setTimeout(() => {
        setState('warning');
        onWarning?.();
      }, warningTimeout);
    }

    // Idle timer
    idleTimerRef.current = window.setTimeout(() => {
      setState('idle');
      onIdle?.();

      // Start away timer after becoming idle
      if (awayTimeout) {
        awayTimerRef.current = window.setTimeout(() => {
          setState('away');
          onAway?.();
        }, awayTimeout);
      }
    }, idleTimeout);
  }, [clearAllTimers, idleTimeout, warningTimeout, awayTimeout, onWarning, onIdle, onAway]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (isPaused) return;

    const wasIdle = state !== 'active';

    // Fire activity callback
    onActivity?.();

    // If coming back from idle/away, fire onActive
    if (wasIdle) {
      setState('active');
      onActive?.();
    }

    // Restart timers
    startTimers();
  }, [isPaused, state, onActivity, onActive, startTimers]);

  // Pause timer
  const pause = useCallback(() => {
    setIsPaused(true);
    clearAllTimers();
  }, [clearAllTimers]);

  // Resume timer
  const resume = useCallback(() => {
    setIsPaused(false);
    startTimers();
  }, [startTimers]);

  // Reset timer
  const reset = useCallback(() => {
    setState('active');
    setIsPaused(false);
    startTimers();
  }, [startTimers]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (!detectVisibility) return;

    if (document.hidden) {
      // Page is hidden - consider it as potential idle
      // Don't immediately trigger idle, but stop activity detection
    } else {
      // Page is visible again - reset if user was idle/away
      if (state === 'away') {
        handleActivity();
      }
    }
  }, [detectVisibility, state, handleActivity]);

  // Set up event listeners
  useEffect(() => {
    if (isPaused) return;

    // Activity events
    const listener = () => handleActivity();
    events.forEach(event => {
      window.addEventListener(event, listener, { passive: true });
    });

    // Visibility change
    if (detectVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Start initial timer
    startTimers();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, listener);
      });
      if (detectVisibility) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      clearAllTimers();
    };
  }, [events, isPaused, handleActivity, detectVisibility, handleVisibilityChange, startTimers, clearAllTimers]);

  return {
    state,
    isActive: state === 'active',
    isIdle: state === 'idle' || state === 'warning',
    isAway: state === 'away',
    timeUntilIdle,
    timeUntilWarning,
    lastActivity,
    pause,
    resume,
    reset,
    isPaused,
  };
};

export default useIdleTimer;
