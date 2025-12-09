/**
 * useDoubleTapExit Hook
 * 
 * Prevents accidental app exit by requiring double-tap on back button/gesture.
 * Shows a toast message on first tap, exits on second tap within timeout.
 * 
 * Features:
 * - Hardware back button support (Android PWA)
 * - Swipe back gesture support
 * - Toast notification feedback
 * - Haptic feedback on first tap
 * - Automatic reset after timeout
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/** Duration in ms for double-tap window */
const DOUBLE_TAP_TIMEOUT = 2000;

export interface DoubleTapExitOptions {
    /** Whether this protection is enabled (default: true) */
    enabled?: boolean;
    /** Custom message to show on first tap */
    message?: string;
    /** Timeout duration in ms (default: 2000) */
    timeout?: number;
    /** Callback to show a toast/message */
    onFirstTap?: (message: string) => void;
    /** Callback when exit is confirmed */
    onExit?: () => void;
}

export interface DoubleTapExitReturn {
    /** Whether waiting for second tap */
    isPending: boolean;
    /** Time remaining in pending state (ms) */
    timeRemaining: number;
    /** Reset the pending state manually */
    reset: () => void;
}

/**
 * Hook to require double-tap on back button to exit the app
 */
export const useDoubleTapExit = (
    options: DoubleTapExitOptions = {}
): DoubleTapExitReturn => {
    const {
        enabled = true,
        message = 'לחץ שוב ליציאה',
        timeout = DOUBLE_TAP_TIMEOUT,
        onFirstTap,
        onExit,
    } = options;

    const [isPending, setIsPending] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const exitConfirmedRef = useRef(false);

    /**
     * Reset pending state
     */
    const reset = useCallback(() => {
        setIsPending(false);
        setTimeRemaining(0);
        if (pendingTimeoutRef.current) {
            clearTimeout(pendingTimeoutRef.current);
            pendingTimeoutRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    /**
     * Handle back button press
     */
    const handleBackPress = useCallback(() => {
        if (!enabled) return false;

        if (isPending) {
            // Second tap - allow exit
            exitConfirmedRef.current = true;
            reset();
            onExit?.();
            return true; // Allow navigation
        } else {
            // First tap - show warning and block
            setIsPending(true);
            setTimeRemaining(timeout);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }

            // Show message
            onFirstTap?.(message);

            // Start countdown
            const startTime = Date.now();
            countdownRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, timeout - elapsed);
                setTimeRemaining(remaining);
            }, 100);

            // Reset after timeout
            pendingTimeoutRef.current = setTimeout(() => {
                reset();
            }, timeout);

            return false; // Block navigation
        }
    }, [enabled, isPending, timeout, message, onFirstTap, onExit, reset]);

    // Handle popstate (back/forward buttons)
    useEffect(() => {
        if (!enabled) return;

        // Push initial state to intercept back button
        const currentUrl = window.location.href;
        window.history.pushState({ doubleTapExit: true }, '', currentUrl);

        const handlePopState = (e: PopStateEvent) => {
            // If exit was confirmed, allow navigation
            if (exitConfirmedRef.current) {
                exitConfirmedRef.current = false;
                return;
            }

            const shouldAllow = handleBackPress();

            if (!shouldAllow) {
                // Push state again to prevent navigation
                window.history.pushState({ doubleTapExit: true }, '', currentUrl);
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            reset();
        };
    }, [enabled, handleBackPress, reset]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    return {
        isPending,
        timeRemaining,
        reset,
    };
};

export default useDoubleTapExit;
