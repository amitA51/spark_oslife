/**
 * Advanced Debounce & Throttle Utilities
 * A comprehensive collection of timing hooks for React applications
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// =============================================================================
// useDebounce - Debounce a value
// =============================================================================

/**
 * Debounces a value - only updates after the specified delay has passed
 * without new values coming in.
 * 
 * @param value The value to debounce
 * @param delay The debounce delay in milliseconds
 * @returns The debounced value
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * 
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// useDebouncedCallback - Debounce a callback function
// =============================================================================

export interface DebouncedCallbackOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Call on leading edge instead of trailing */
  leading?: boolean;
  /** Call on trailing edge (default: true) */
  trailing?: boolean;
  /** Maximum time to wait before forcing call */
  maxWait?: number;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** Cancel pending invocation */
  cancel: () => void;
  /** Immediately invoke if pending */
  flush: () => void;
  /** Check if there's a pending invocation */
  isPending: () => boolean;
}

/**
 * Returns a debounced version of the callback function.
 * The debounced function delays invoking callback until after delay
 * milliseconds have elapsed since the last time it was invoked.
 * 
 * @example
 * const saveToServer = useDebouncedCallback(
 *   (data) => api.save(data),
 *   { delay: 1000, maxWait: 5000 }
 * );
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebouncedCallbackOptions
): DebouncedFunction<T> {
  const { delay, leading = false, trailing = true, maxWait } = options;

  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const leadingCalledRef = useRef(false);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    lastArgsRef.current = null;
    leadingCalledRef.current = false;
  }, []);

  const flush = useCallback(() => {
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current);
      cancel();
    }
  }, [cancel]);

  const isPending = useCallback(() => {
    return timerRef.current !== null;
  }, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      const now = Date.now();

      // Leading edge call
      if (leading && !leadingCalledRef.current) {
        leadingCalledRef.current = true;
        callbackRef.current(...args);
        lastCallTimeRef.current = now;
      }

      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set up trailing edge call
      if (trailing) {
        timerRef.current = window.setTimeout(() => {
          // Don't call if leading was just called with same args
          if (!leading || now - lastCallTimeRef.current >= delay) {
            callbackRef.current(...args);
          }
          cancel();
        }, delay);
      }

      // Set up maxWait timer
      if (maxWait && !maxTimerRef.current) {
        maxTimerRef.current = window.setTimeout(() => {
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
          }
          cancel();
        }, maxWait);
      }
    },
    [delay, leading, trailing, maxWait, cancel]
  ) as DebouncedFunction<T>;

  // Add control methods
  debouncedFn.cancel = cancel;
  debouncedFn.flush = flush;
  debouncedFn.isPending = isPending;

  // Cleanup on unmount
  useEffect(() => cancel, [cancel]);

  return debouncedFn;
}

// =============================================================================
// useThrottle - Throttle a value
// =============================================================================

/**
 * Throttles a value - updates at most once per interval.
 * 
 * @param value The value to throttle
 * @param interval The minimum time between updates in milliseconds
 * @returns The throttled value
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// =============================================================================
// useThrottledCallback - Throttle a callback function
// =============================================================================

/**
 * Returns a throttled version of the callback function.
 * The function will be called at most once per interval.
 * 
 * @example
 * const handleScroll = useThrottledCallback(
 *   () => updatePosition(),
 *   100
 * );
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const lastCalledRef = useRef<number>(0);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCalledRef.current;

      if (timeSinceLastCall >= interval) {
        lastCalledRef.current = now;
        callbackRef.current(...args);
      } else {
        pendingArgsRef.current = args;

        if (!timerRef.current) {
          timerRef.current = window.setTimeout(() => {
            if (pendingArgsRef.current) {
              lastCalledRef.current = Date.now();
              callbackRef.current(...pendingArgsRef.current);
              pendingArgsRef.current = null;
            }
            timerRef.current = null;
          }, interval - timeSinceLastCall);
        }
      }
    },
    [interval]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return throttledFn;
}

// =============================================================================
// useDebouncedState - Debounced useState
// =============================================================================

/**
 * Like useState, but the value is debounced.
 * Returns both the immediate and debounced values.
 * 
 * @example
 * const [search, debouncedSearch, setSearch] = useDebouncedState('', 300);
 * 
 * <input value={search} onChange={e => setSearch(e.target.value)} />
 * <Results query={debouncedSearch} />
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

// =============================================================================
// useDebounceEffect - Debounced useEffect
// =============================================================================

/**
 * Like useEffect, but the effect is debounced.
 * 
 * @example
 * useDebounceEffect(() => {
 *   saveToLocalStorage(data);
 * }, [data], 500);
 */
export function useDebounceEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delay: number
): void {
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    const timer = setTimeout(() => {
      cleanupRef.current = effect();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

// =============================================================================
// Default export for backward compatibility
// =============================================================================

export default useDebounce;
