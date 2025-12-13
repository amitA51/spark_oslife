/**
 * Constants Export Index
 * 
 * Re-exports all constants for convenient importing.
 * This helps keep imports clean and organized.
 */

// Storage keys
export const LOCAL_STORAGE_KEYS = {
    THEME: 'spark_theme',
    USER_PREFERENCES: 'spark_user_preferences',
    LIKED_QUOTES: 'spark_liked_quotes',
    RECENT_SETTINGS: 'settings_recent',
    WORKOUT_SETTINGS: 'workout_settings',
    FOCUS_SESSIONS: 'focus_sessions',
} as const;

// Common validation limits
export const LIMITS = {
    TITLE_MAX_LENGTH: 500,
    CONTENT_MAX_LENGTH: 50000,
    HABIT_STREAK_FREEZE_DAYS: 2,
    MAX_TAGS_PER_ITEM: 10,
    MAX_FOCUS_SESSION_MINUTES: 240,
    MIN_FOCUS_SESSION_MINUTES: 1,
} as const;

// API endpoints (not sensitive - just base URLs)
export const API_URLS = {
    GEMINI_BASE: 'https://generativelanguage.googleapis.com',
    RSS_PROXY: 'https://api.rss2json.com/v1/api.json',
} as const;

// Default durations (in ms)
export const DURATIONS = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_LIMIT: 100,
    TOAST_DURATION: 3000,
    AUTO_SAVE_DELAY: 5000,
    SYNC_RETRY_DELAY: 500,
} as const;

// Animation presets
export const ANIMATIONS = {
    FAST: { duration: 0.15 },
    NORMAL: { duration: 0.3 },
    SLOW: { duration: 0.5 },
    SPRING: { type: 'spring', stiffness: 260, damping: 20 },
} as const;

// Hebrew date format options
export const DATE_FORMATS = {
    SHORT: { day: 'numeric', month: 'short' } as const,
    MEDIUM: { day: 'numeric', month: 'short', year: 'numeric' } as const,
    LONG: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const,
    TIME: { hour: '2-digit', minute: '2-digit' } as const,
    DATETIME: {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    } as const,
};
