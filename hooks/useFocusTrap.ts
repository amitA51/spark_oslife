/**
 * Enhanced Focus Trap Hook
 * Comprehensive focus management for modals, dialogs, and accessible components
 * Features: Escape key handling, click outside, scroll lock, focus restoration
 */

import { useEffect, useRef, useCallback, RefObject } from 'react';

// All focusable element selectors
const FOCUSABLE_SELECTORS = [
  'a[href]:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"]):not([type="hidden"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'details > summary:first-of-type',
].join(', ');

export interface UseFocusTrapOptions {
  /** Whether the trap is active */
  isOpen: boolean;
  /** Close handler for escape key */
  onClose?: () => void;
  /** Close on escape key press */
  closeOnEscape?: boolean;
  /** Close when clicking outside the container */
  closeOnClickOutside?: boolean;
  /** Lock body scroll when open */
  lockScroll?: boolean;
  /** Auto-focus first element when opened */
  autoFocus?: boolean;
  /** Return focus to trigger element when closed */
  restoreFocus?: boolean;
  /** Initial element to focus (selector or element) */
  initialFocus?: string | HTMLElement;
  /** Element to focus when trap is deactivated */
  returnFocusTo?: HTMLElement | null;
  /** Callback when focus escapes (shouldn't happen with trap) */
  onFocusEscape?: () => void;
}

export interface UseFocusTrapReturn {
  /** Get all focusable elements in container */
  getFocusableElements: () => HTMLElement[];
  /** Focus the first focusable element */
  focusFirst: () => void;
  /** Focus the last focusable element */
  focusLast: () => void;
  /** Focus a specific element by index */
  focusByIndex: (index: number) => void;
  /** Check if an element is focusable */
  isFocusable: (element: HTMLElement) => boolean;
}

/**
 * Enhanced focus trap hook for modals and dialogs
 */
export const useFocusTrap = (
  ref: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions
): UseFocusTrapReturn => {
  const {
    isOpen,
    onClose,
    closeOnEscape = true,
    closeOnClickOutside = false,
    lockScroll = true,
    autoFocus = true,
    restoreFocus = true,
    initialFocus,
    returnFocusTo,
    onFocusEscape,
  } = options;

  // Store the element that had focus before the trap was activated
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef<string>('');

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!ref.current) return [];

    const elements = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter(el => {
      // Additional visibility check
      const style = window.getComputedStyle(el);
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('hidden');
    });
  }, [ref]);

  /**
   * Focus the first focusable element
   */
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  /**
   * Focus the last focusable element
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  /**
   * Focus element by index
   */
  const focusByIndex = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (index >= 0 && index < elements.length) {
      elements[index].focus();
    }
  }, [getFocusableElements]);

  /**
   * Check if element is focusable
   */
  const isFocusable = useCallback((element: HTMLElement): boolean => {
    return element.matches(FOCUSABLE_SELECTORS);
  }, []);

  // Main focus trap effect
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const container = ref.current;

    // Store the currently focused element
    triggerRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    if (lockScroll) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Handle initial focus
    if (autoFocus) {
      requestAnimationFrame(() => {
        if (initialFocus) {
          let elementToFocus: HTMLElement | null = null;

          if (typeof initialFocus === 'string') {
            elementToFocus = container.querySelector<HTMLElement>(initialFocus);
          } else {
            elementToFocus = initialFocus;
          }

          if (elementToFocus) {
            elementToFocus.focus();
          } else {
            focusFirst();
          }
        } else {
          focusFirst();
        }
      });
    }

    /**
     * Handle Tab key for focus trapping
     */
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Escape key handling
      if (e.key === 'Escape' && closeOnEscape && onClose) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Tab key handling
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab: Going backwards
        if (activeElement === firstElement || !container.contains(activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Going forwards
        if (activeElement === lastElement || !container.contains(activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    /**
     * Handle clicks outside the container
     */
    const handleClickOutside = (e: MouseEvent): void => {
      if (!closeOnClickOutside || !onClose) return;

      const target = e.target as Node;
      if (container && !container.contains(target)) {
        onClose();
      }
    };

    /**
     * Prevent focus from leaving the container
     */
    const handleFocusIn = (e: FocusEvent): void => {
      const target = e.target as Node;
      if (container && !container.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        onFocusEscape?.();
        focusFirst();
      }
    };

    // Add event listeners
    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleFocusIn);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleFocusIn);

      // Restore body scroll
      if (lockScroll) {
        document.body.style.overflow = previousOverflowRef.current;
      }

      // Restore focus
      if (restoreFocus) {
        const elementToFocus = returnFocusTo || triggerRef.current;
        if (elementToFocus && typeof elementToFocus.focus === 'function') {
          // Use setTimeout to ensure focus happens after any animations
          setTimeout(() => {
            elementToFocus.focus();
          }, 0);
        }
      }
    };
  }, [
    isOpen,
    ref,
    onClose,
    closeOnEscape,
    closeOnClickOutside,
    lockScroll,
    autoFocus,
    restoreFocus,
    initialFocus,
    returnFocusTo,
    onFocusEscape,
    getFocusableElements,
    focusFirst,
  ]);

  return {
    getFocusableElements,
    focusFirst,
    focusLast,
    focusByIndex,
    isFocusable,
  };
};

/**
 * Simple version for backward compatibility
 */
export const useFocusTrapSimple = (
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean
): void => {
  useFocusTrap(ref, { isOpen });
};

export default useFocusTrap;
