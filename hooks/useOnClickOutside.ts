/**
 * useOnClickOutside Hook
 * 
 * Detects clicks outside of a referenced element.
 * Useful for dropdowns, modals, and popovers.
 */

import { useEffect, RefObject } from 'react';

type EventType = MouseEvent | TouchEvent;

/**
 * Hook that calls handler when clicking outside the ref element
 * 
 * @example
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useOnClickOutside(dropdownRef, () => setIsOpen(false));
 */
export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: EventType) => void,
    enabled: boolean = true
): void => {
    useEffect(() => {
        if (!enabled) return;

        const listener = (event: EventType) => {
            const el = ref?.current;

            // Do nothing if clicking ref's element or its descendants
            if (!el || el.contains(event.target as Node)) {
                return;
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, enabled]);
};

export default useOnClickOutside;
