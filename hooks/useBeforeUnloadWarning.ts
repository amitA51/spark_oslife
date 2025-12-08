/**
 * Enhanced Unsaved Changes Warning Hook
 * Prevents accidental data loss with multi-layer protection
 * Features: Browser warning, route blocking, auto-save, form tracking
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Types
export interface UnsavedChangesOptions {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Custom warning message (shown in custom UI, not browser) */
  message?: string;
  /** Auto-save function to call before unload (optional) */
  onAutoSave?: () => Promise<void>;
  /** Callback when user tries to leave */
  onBlock?: () => void;
  /** Callback when user confirms leaving */
  onConfirmLeave?: () => void;
  /** Whether to block in-app navigation (requires custom router handling) */
  blockNavigation?: boolean;
  /** Show custom confirmation dialog instead of browser default */
  useCustomDialog?: boolean;
  /** List of form field IDs to track for changes */
  trackedFields?: string[];
}

export interface UnsavedChangesReturn {
  /** Whether changes are currently pending */
  isDirty: boolean;
  /** Mark as dirty */
  setDirty: () => void;
  /** Mark as clean (after save) */
  setClean: () => void;
  /** Toggle dirty state */
  toggleDirty: (value?: boolean) => void;
  /** Show confirmation dialog manually */
  confirmNavigation: () => Promise<boolean>;
  /** Bypass warning and navigate */
  forceNavigate: () => void;
  /** Number of blocked navigation attempts */
  blockedAttempts: number;
  /** Last time changes were detected */
  lastChangeTime: Date | null;
  /** Time since last change (ms) */
  timeSinceChange: number | null;
}

// Default Hebrew warning message
const DEFAULT_MESSAGE = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?';

/**
 * Original simple hook for backward compatibility
 */
export const useBeforeUnloadWarning = (isDirty: boolean): void => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};

/**
 * Enhanced unsaved changes hook with full control
 */
export const useUnsavedChanges = (
  options: UnsavedChangesOptions
): UnsavedChangesReturn => {
  const {
    isDirty: initialDirty,
    message = DEFAULT_MESSAGE,
    onAutoSave,
    onBlock,
    onConfirmLeave,
    blockNavigation = true,
    useCustomDialog = false,
    trackedFields = [],
  } = options;

  const [isDirty, setIsDirty] = useState(initialDirty);
  const [blockedAttempts, setBlockedAttempts] = useState(0);
  const [lastChangeTime, setLastChangeTime] = useState<Date | null>(null);
  const [timeSinceChange, setTimeSinceChange] = useState<number | null>(null);

  const forceNavigateRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Sync with external isDirty prop
  useEffect(() => {
    setIsDirty(initialDirty);
    if (initialDirty) {
      setLastChangeTime(new Date());
    }
  }, [initialDirty]);

  // Update time since change
  useEffect(() => {
    if (!lastChangeTime) {
      setTimeSinceChange(null);
      return;
    }

    const updateTime = () => {
      setTimeSinceChange(Date.now() - lastChangeTime.getTime());
    };

    updateTime();
    timerRef.current = window.setInterval(updateTime, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lastChangeTime]);

  /**
   * Mark form as dirty
   */
  const setDirty = useCallback(() => {
    setIsDirty(true);
    setLastChangeTime(new Date());
  }, []);

  /**
   * Mark form as clean (after save)
   */
  const setClean = useCallback(() => {
    setIsDirty(false);
    setLastChangeTime(null);
    setTimeSinceChange(null);
    setBlockedAttempts(0);
  }, []);

  /**
   * Toggle dirty state
   */
  const toggleDirty = useCallback((value?: boolean) => {
    if (value !== undefined) {
      if (value) {
        setDirty();
      } else {
        setClean();
      }
    } else {
      setIsDirty(prev => !prev);
    }
  }, [setDirty, setClean]);

  /**
   * Show confirmation dialog
   */
  const confirmNavigation = useCallback(async (): Promise<boolean> => {
    if (!isDirty) return true;

    // Try auto-save first if available
    if (onAutoSave) {
      try {
        await onAutoSave();
        setClean();
        return true;
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }

    // Show confirmation dialog
    if (useCustomDialog) {
      // For custom dialog, caller should handle this
      onBlock?.();
      return false;
    }

    const confirmed = window.confirm(message);
    if (confirmed) {
      onConfirmLeave?.();
      forceNavigateRef.current = true;
    } else {
      setBlockedAttempts(prev => prev + 1);
      onBlock?.();
    }

    return confirmed;
  }, [isDirty, message, onAutoSave, onBlock, onConfirmLeave, useCustomDialog, setClean]);

  /**
   * Force navigate without confirmation
   */
  const forceNavigate = useCallback(() => {
    forceNavigateRef.current = true;
    setClean();
  }, [setClean]);

  // Browser beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (forceNavigateRef.current) {
        forceNavigateRef.current = false;
        return;
      }

      if (!isDirty) return;

      // Attempt auto-save
      if (onAutoSave) {
        try {
          // Note: This is async but beforeunload doesn't wait
          // This is a "best effort" save
          onAutoSave().catch(console.error);
        } catch (e) {
          console.error('Auto-save on unload failed:', e);
        }
      }

      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message, onAutoSave]);

  // Track form field changes
  useEffect(() => {
    if (trackedFields.length === 0) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id && trackedFields.includes(target.id)) {
        setDirty();
      }
    };

    const handleChange = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id && trackedFields.includes(target.id)) {
        setDirty();
      }
    };

    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleChange, true);

    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('change', handleChange, true);
    };
  }, [trackedFields, setDirty]);

  // Handle visibility change (mobile background)
  useEffect(() => {
    if (!isDirty || !onAutoSave) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isDirty) {
        // Page is going to background - try to auto-save
        onAutoSave().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDirty, onAutoSave]);

  // Handle popstate (back/forward buttons)
  useEffect(() => {
    if (!blockNavigation || !isDirty) return;

    const handlePopState = (e: PopStateEvent) => {
      if (forceNavigateRef.current) {
        forceNavigateRef.current = false;
        return;
      }

      if (isDirty) {
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        setBlockedAttempts(prev => prev + 1);
        onBlock?.();
      }
    };

    // Push an initial state to block back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [blockNavigation, isDirty, onBlock]);

  return {
    isDirty,
    setDirty,
    setClean,
    toggleDirty,
    confirmNavigation,
    forceNavigate,
    blockedAttempts,
    lastChangeTime,
    timeSinceChange,
  };
};

export default useBeforeUnloadWarning;
