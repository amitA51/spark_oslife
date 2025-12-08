/**
 * Performance Utilities
 * Optimized helpers for performance-critical operations
 */

/**
 * RAF (RequestAnimationFrame) Throttle
 * Ensures a function is called at most once per animation frame
 * Performance optimization for scroll/resize handlers
 */
export const rafThrottle = <T extends (...args: any[]) => any>(callback: T) => {
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    const throttled = (...args: Parameters<T>) => {
        lastArgs = args;

        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                if (lastArgs) {
                    callback(...lastArgs);
                }
                rafId = null;
                lastArgs = null;
            });
        }
    };

    throttled.cancel = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
            lastArgs = null;
        }
    };

    return throttled;
};

/**
 * Debounce function
 * Delays execution until after wait milliseconds have elapsed since the last call
 */
export const debounce = <T extends (...args: any[]) => any>(
    callback: T,
    wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
    let timeoutId: NodeJS.Timeout | null = null;

    const debounced = (...args: Parameters<T>) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            callback(...args);
            timeoutId = null;
        }, wait);
    };

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
};

/**
 * Simple throttle function
 * Limits function calls to once per specified time period
 */
export const throttle = <T extends (...args: any[]) => any>(
    callback: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let waiting = false;

    return (...args: Parameters<T>) => {
        if (!waiting) {
            callback(...args);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
};
