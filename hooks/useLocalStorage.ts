/**
 * useLocalStorage Hook
 * 
 * A type-safe hook for persisting state to localStorage with
 * automatic serialization and error handling.
 */

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

/**
 * Hook for managing state that persists to localStorage
 * 
 * @param key - The localStorage key
 * @param initialValue - Default value if nothing stored
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
    // Get stored value or use initial
    const readValue = useCallback((): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [initialValue, key]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Update localStorage when value changes
    const setValue = useCallback(
        (value: SetValue<T>) => {
            try {
                const valueToStore = value instanceof Function
                    ? value(storedValue)
                    : value;

                setStoredValue(valueToStore);

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));

                    // Dispatch custom event for cross-tab sync
                    window.dispatchEvent(new StorageEvent('storage', {
                        key,
                        newValue: JSON.stringify(valueToStore),
                    }));
                }
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    // Remove from localStorage
    const removeValue = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
                setStoredValue(initialValue);
            }
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [initialValue, key]);

    // Listen for changes from other tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(event.newValue) as T);
                } catch {
                    // Ignore parse errors
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
