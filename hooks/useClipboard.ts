/**
 * useClipboard Hook
 * 
 * Easy-to-use clipboard operations with feedback.
 */

import { useState, useCallback } from 'react';

interface UseClipboardOptions {
    /** How long to show success state (ms) */
    successDuration?: number;
}

interface UseClipboardReturn {
    /** Copy text to clipboard */
    copy: (text: string) => Promise<boolean>;
    /** Whether copy was successful (resets after successDuration) */
    copied: boolean;
    /** Any error that occurred */
    error: Error | null;
}

/**
 * Hook for clipboard operations with success/error state
 */
export const useClipboard = (
    options: UseClipboardOptions = {}
): UseClipboardReturn => {
    const { successDuration = 2000 } = options;

    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const copy = useCallback(async (text: string): Promise<boolean> => {
        if (!navigator?.clipboard) {
            const error = new Error('Clipboard API not available');
            setError(error);
            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setError(null);

            // Reset copied state after duration
            setTimeout(() => setCopied(false), successDuration);

            return true;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Copy failed');
            setError(error);
            setCopied(false);
            return false;
        }
    }, [successDuration]);

    return { copy, copied, error };
};

export default useClipboard;
