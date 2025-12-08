/**
 * Enhanced Context Menu Hook
 * Full-featured context menu management for React
 * Features: Positioning, keyboard support, nested menus, animations, touch support
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Types
export interface Position {
  x: number;
  y: number;
}

export interface ContextMenuState<T> {
  /** Whether the menu is open */
  isOpen: boolean;
  /** X position (viewport coordinates) */
  x: number;
  /** Y position (viewport coordinates) */
  y: number;
  /** The item that was right-clicked */
  item: T | null;
  /** Index of focused menu item (for keyboard navigation) */
  focusedIndex: number;
  /** Whether opened via keyboard (affects animations) */
  openedViaKeyboard: boolean;
  /** Parent menu ID for nested menus */
  parentMenuId: string | null;
  /** Submenu IDs that are open */
  openSubmenus: string[];
}

export interface ContextMenuOptions {
  /** Close when clicking outside */
  closeOnClickOutside?: boolean;
  /** Close when pressing Escape */
  closeOnEscape?: boolean;
  /** Close when scrolling */
  closeOnScroll?: boolean;
  /** Close when window resizes */
  closeOnResize?: boolean;
  /** Offset from cursor position */
  offset?: { x: number; y: number };
  /** Keep menu within viewport bounds */
  constrainToViewport?: boolean;
  /** Custom menu width for positioning calculations */
  menuWidth?: number;
  /** Custom menu height for positioning calculations */
  menuHeight?: number;
  /** Enable long-press on touch devices */
  enableLongPress?: boolean;
  /** Long press duration in ms */
  longPressDuration?: number;
  /** Callback when menu opens */
  onOpen?: () => void;
  /** Callback when menu closes */
  onClose?: () => void;
}

export interface ContextMenuReturn<T> {
  /** Current menu state */
  contextMenu: ContextMenuState<T>;
  /** Handle right-click event */
  handleContextMenu: (event: React.MouseEvent, item: T) => void;
  /** Handle keyboard context menu (Shift+F10 or Context Menu key) */
  handleKeyboardContextMenu: (event: React.KeyboardEvent, item: T, anchorElement?: HTMLElement) => void;
  /** Handle touch long-press start */
  handleTouchStart: (event: React.TouchEvent, item: T) => void;
  /** Handle touch end (cancel long-press) */
  handleTouchEnd: () => void;
  /** Close the context menu */
  closeContextMenu: () => void;
  /** Open submenu */
  openSubmenu: (submenuId: string) => void;
  /** Close submenu */
  closeSubmenu: (submenuId: string) => void;
  /** Navigate to next menu item */
  focusNext: () => void;
  /** Navigate to previous menu item */
  focusPrev: () => void;
  /** Set focused index directly */
  setFocusedIndex: (index: number) => void;
  /** Reset focused index */
  resetFocus: () => void;
  /** Adjusted position that stays within viewport */
  adjustedPosition: Position;
  /** Props to spread on the trigger element */
  triggerProps: {
    onContextMenu: (event: React.MouseEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onTouchStart?: (event: React.TouchEvent) => void;
    onTouchEnd?: () => void;
    onTouchMove?: () => void;
  };
}

const DEFAULT_OPTIONS: Required<ContextMenuOptions> = {
  closeOnClickOutside: true,
  closeOnEscape: true,
  closeOnScroll: true,
  closeOnResize: true,
  offset: { x: 0, y: 0 },
  constrainToViewport: true,
  menuWidth: 200,
  menuHeight: 300,
  enableLongPress: true,
  longPressDuration: 500,
  onOpen: () => { },
  onClose: () => { },
};

/**
 * Enhanced context menu hook with full keyboard and touch support
 */
export const useContextMenu = <T,>(
  options: ContextMenuOptions = {}
): ContextMenuReturn<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [contextMenu, setContextMenu] = useState<ContextMenuState<T>>({
    isOpen: false,
    x: 0,
    y: 0,
    item: null,
    focusedIndex: -1,
    openedViaKeyboard: false,
    parentMenuId: null,
    openSubmenus: [],
  });

  const longPressTimerRef = useRef<number | null>(null);
  const longPressItemRef = useRef<T | null>(null);
  const menuItemCountRef = useRef<number>(0);

  /**
   * Calculate position adjusted to stay within viewport
   */
  const adjustedPosition = useMemo((): Position => {
    if (!opts.constrainToViewport) {
      return { x: contextMenu.x + opts.offset.x, y: contextMenu.y + opts.offset.y };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = contextMenu.x + opts.offset.x;
    let y = contextMenu.y + opts.offset.y;

    // Adjust X if menu would overflow right edge
    if (x + opts.menuWidth > viewportWidth) {
      x = viewportWidth - opts.menuWidth - 10;
    }

    // Adjust Y if menu would overflow bottom edge
    if (y + opts.menuHeight > viewportHeight) {
      y = viewportHeight - opts.menuHeight - 10;
    }

    // Ensure not negative
    x = Math.max(10, x);
    y = Math.max(10, y);

    return { x, y };
  }, [contextMenu.x, contextMenu.y, opts]);

  /**
   * Open the context menu
   */
  const openMenu = useCallback((
    x: number,
    y: number,
    item: T,
    viaKeyboard: boolean = false
  ) => {
    setContextMenu({
      isOpen: true,
      x,
      y,
      item,
      focusedIndex: viaKeyboard ? 0 : -1, // Focus first item if opened via keyboard
      openedViaKeyboard: viaKeyboard,
      parentMenuId: null,
      openSubmenus: [],
    });
    opts.onOpen();
  }, [opts]);

  /**
   * Handle right-click context menu
   */
  const handleContextMenu = useCallback((event: React.MouseEvent, item: T) => {
    event.preventDefault();
    event.stopPropagation();
    openMenu(event.clientX, event.clientY, item, false);
  }, [openMenu]);

  /**
   * Handle keyboard-triggered context menu (Shift+F10 or Context Menu key)
   */
  const handleKeyboardContextMenu = useCallback((
    event: React.KeyboardEvent,
    item: T,
    anchorElement?: HTMLElement
  ) => {
    // Check for context menu key or Shift+F10
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      event.preventDefault();

      // Position near the focused element
      let x = 0;
      let y = 0;

      if (anchorElement) {
        const rect = anchorElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.bottom;
      } else {
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.bottom;
      }

      openMenu(x, y, item, true);
    }
  }, [openMenu]);

  /**
   * Handle touch long-press start
   */
  const handleTouchStart = useCallback((event: React.TouchEvent, item: T) => {
    if (!opts.enableLongPress) return;

    longPressItemRef.current = item;

    longPressTimerRef.current = window.setTimeout(() => {
      const touch = event.touches[0];
      if (touch && longPressItemRef.current) {
        openMenu(touch.clientX, touch.clientY, longPressItemRef.current, false);
      }
    }, opts.longPressDuration);
  }, [opts.enableLongPress, opts.longPressDuration, openMenu]);

  /**
   * Cancel long-press timer
   */
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressItemRef.current = null;
  }, []);

  /**
   * Close the context menu
   */
  const closeContextMenu = useCallback(() => {
    if (contextMenu.isOpen) {
      setContextMenu(prev => ({
        ...prev,
        isOpen: false,
        focusedIndex: -1,
        openSubmenus: [],
      }));
      opts.onClose();
    }
  }, [contextMenu.isOpen, opts]);

  /**
   * Open a submenu
   */
  const openSubmenu = useCallback((submenuId: string) => {
    setContextMenu(prev => ({
      ...prev,
      openSubmenus: [...prev.openSubmenus.filter(id => id !== submenuId), submenuId],
    }));
  }, []);

  /**
   * Close a submenu
   */
  const closeSubmenu = useCallback((submenuId: string) => {
    setContextMenu(prev => ({
      ...prev,
      openSubmenus: prev.openSubmenus.filter(id => id !== submenuId),
    }));
  }, []);

  /**
   * Focus next menu item
   */
  const focusNext = useCallback(() => {
    setContextMenu(prev => ({
      ...prev,
      focusedIndex: prev.focusedIndex < menuItemCountRef.current - 1
        ? prev.focusedIndex + 1
        : 0,
    }));
  }, []);

  /**
   * Focus previous menu item
   */
  const focusPrev = useCallback(() => {
    setContextMenu(prev => ({
      ...prev,
      focusedIndex: prev.focusedIndex > 0
        ? prev.focusedIndex - 1
        : menuItemCountRef.current - 1,
    }));
  }, []);

  /**
   * Set focused index directly
   */
  const setFocusedIndex = useCallback((index: number) => {
    setContextMenu(prev => ({ ...prev, focusedIndex: index }));
  }, []);

  /**
   * Reset focus
   */
  const resetFocus = useCallback(() => {
    setContextMenu(prev => ({ ...prev, focusedIndex: -1 }));
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!opts.closeOnClickOutside || !contextMenu.isOpen) return;

    const handleClick = (e: MouseEvent) => {
      // Small delay to allow menu item clicks to process first
      setTimeout(() => closeContextMenu(), 0);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [opts.closeOnClickOutside, contextMenu.isOpen, closeContextMenu]);

  // Close on Escape
  useEffect(() => {
    if (!opts.closeOnEscape || !contextMenu.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeContextMenu();
      }

      // Keyboard navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusPrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [opts.closeOnEscape, contextMenu.isOpen, closeContextMenu, focusNext, focusPrev]);

  // Close on scroll
  useEffect(() => {
    if (!opts.closeOnScroll || !contextMenu.isOpen) return;

    const handleScroll = () => closeContextMenu();
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [opts.closeOnScroll, contextMenu.isOpen, closeContextMenu]);

  // Close on resize
  useEffect(() => {
    if (!opts.closeOnResize || !contextMenu.isOpen) return;

    const handleResize = () => closeContextMenu();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [opts.closeOnResize, contextMenu.isOpen, closeContextMenu]);

  // Trigger props for easy spreading
  const triggerProps = useMemo(() => ({
    onContextMenu: (event: React.MouseEvent) => {
      // Item will be provided by the component
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      // Item will be provided by the component
    },
    ...(opts.enableLongPress && {
      onTouchStart: (event: React.TouchEvent) => {
        // Item will be provided by the component
      },
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchEnd, // Cancel on move
    }),
  }), [opts.enableLongPress, handleTouchEnd]);

  return {
    contextMenu,
    handleContextMenu,
    handleKeyboardContextMenu,
    handleTouchStart,
    handleTouchEnd,
    closeContextMenu,
    openSubmenu,
    closeSubmenu,
    focusNext,
    focusPrev,
    setFocusedIndex,
    resetFocus,
    adjustedPosition,
    triggerProps,
  };
};

export default useContextMenu;
