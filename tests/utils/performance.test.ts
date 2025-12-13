/**
 * Performance Utility Tests
 * Tests for throttle, debounce, and RAF utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rafThrottle, debounce, throttle } from '../../utils/performance';

describe('Performance Utilities', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('debounce', () => {
        it('should delay execution until after wait period', () => {
            const callback = vi.fn();
            const debounced = debounce(callback, 100);

            debounced();
            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(60);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should reset timer on subsequent calls', () => {
            const callback = vi.fn();
            const debounced = debounce(callback, 100);

            debounced();
            vi.advanceTimersByTime(50);
            debounced(); // Reset timer
            vi.advanceTimersByTime(50);
            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(60);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to callback', () => {
            const callback = vi.fn();
            const debounced = debounce(callback, 100);

            debounced('arg1', 'arg2');
            vi.advanceTimersByTime(110);

            expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should have a cancel method', () => {
            const callback = vi.fn();
            const debounced = debounce(callback, 100);

            debounced();
            debounced.cancel();
            vi.advanceTimersByTime(200);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('throttle', () => {
        it('should call immediately on first invocation', () => {
            const callback = vi.fn();
            const throttled = throttle(callback, 100);

            throttled();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not call again within limit period', () => {
            const callback = vi.fn();
            const throttled = throttle(callback, 100);

            throttled();
            throttled();
            throttled();

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should allow calls after limit period', () => {
            const callback = vi.fn();
            const throttled = throttle(callback, 100);

            throttled();
            expect(callback).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(110);
            throttled();
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should pass arguments to callback', () => {
            const callback = vi.fn();
            const throttled = throttle(callback, 100);

            throttled('test', 123);
            expect(callback).toHaveBeenCalledWith('test', 123);
        });
    });

    describe('rafThrottle', () => {
        let rafId = 0;
        const rafCallbacks: Map<number, FrameRequestCallback> = new Map();

        beforeEach(() => {
            rafId = 0;
            rafCallbacks.clear();

            vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
                const id = ++rafId;
                rafCallbacks.set(id, callback);
                return id;
            });

            vi.stubGlobal('cancelAnimationFrame', (id: number) => {
                rafCallbacks.delete(id);
            });
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const flushRaf = () => {
            rafCallbacks.forEach((callback, id) => {
                callback(performance.now());
                rafCallbacks.delete(id);
            });
        };

        it('should call callback on next animation frame', () => {
            const callback = vi.fn();
            const throttled = rafThrottle(callback);

            throttled();
            expect(callback).not.toHaveBeenCalled();

            flushRaf();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should only queue one frame at a time', () => {
            const callback = vi.fn();
            const throttled = rafThrottle(callback);

            throttled();
            throttled();
            throttled();

            expect(rafCallbacks.size).toBe(1);
            flushRaf();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should use latest arguments', () => {
            const callback = vi.fn();
            const throttled = rafThrottle(callback);

            throttled('first');
            throttled('second');
            throttled('third');

            flushRaf();
            expect(callback).toHaveBeenCalledWith('third');
        });

        it('should have a cancel method', () => {
            const callback = vi.fn();
            const throttled = rafThrottle(callback);

            throttled();
            throttled.cancel();
            flushRaf();

            expect(callback).not.toHaveBeenCalled();
        });
    });
});
