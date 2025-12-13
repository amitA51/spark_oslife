/**
 * Focus Context - Index
 * 
 * Re-exports all focus-related types, constants, and the main context.
 */

// Types and constants
export {
    // Types
    type FocusMode,
    type SessionEndReason,
    type TimerSettings,
    type ActiveFocusSession,
    type CompletedSession,
    type FocusStreak,
    type DailyGoal,
    type FocusStats,
    type FocusContextValue,
    // Constants
    DEFAULT_TIMER_SETTINGS,
    FOCUS_STORAGE_KEYS,
    // Utilities
    generateId,
    getDateKey,
    isThisWeek,
    formatFocusTime,
    loadFromStorage,
    saveToStorage,
} from './focusTypes';

// Main context (will be updated to import from focusTypes)
export {
    FocusProvider,
    useFocusSession,
    useFocusTimer,
    useFocusStats,
    useFocusControls,
    useIsInFocusSession,
    useFocusHistory,
} from '../FocusContext';
