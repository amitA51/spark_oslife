/**
 * useToggle Hook
 * 
 * Simple boolean toggle with optional initial value.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for toggling boolean state
 * 
 * @example
 * const [isOpen, toggleOpen, setOpen] = useToggle(false);
 * <button onClick={toggleOpen}>Toggle</button>
 * <button onClick={() => setOpen(true)}>Open</button>
 */
export const useToggle = (
    initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => {
        setValue(v => !v);
    }, []);

    const set = useCallback((newValue: boolean) => {
        setValue(newValue);
    }, []);

    return [value, toggle, set];
};

export default useToggle;
