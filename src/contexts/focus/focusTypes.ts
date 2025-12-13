/**
 * Focus Context - Types, Interfaces, and Constants
 * 
 * Extracted from FocusContext.tsx for better organization
 * and potential reuse in other modules.
 */

import type { PersonalItem } from '../../../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type FocusMode = 'idle' | 'focusing' | 'break' | 'longBreak' | 'paused';

export type SessionEndReason = 'completed' | 'cancelled' | 'interrupted' | 'timeout';

export interface TimerSettings {
    focusDuration: number; // in minutes
    shortBreakDuration: number; // in minutes
    longBreakDuration: number; // in minutes
    sessionsUntilLongBreak: number;
    autoStartBreaks: boolean;
    autoStartFocus: boolean;
    enableSounds: boolean;
}

export interface ActiveFocusSession {
    id: string;
    item: PersonalItem;
    startTime: number;
    pausedAt: number | null;
    totalPausedTime: number;
    targetDuration: number; // in milliseconds
    distractionCount: number;
    notes: string[];
}

export interface CompletedSession {
    id: string;
    itemId: string;
    itemTitle: string;
    startTime: number;
    endTime: number;
    duration: number; // effective duration in ms
    pausedTime: number;
    distractionCount: number;
    endReason: SessionEndReason;
    notes: string[];
}

export interface FocusStreak {
    currentStreak: number;
    longestStreak: number;
    lastSessionDate: string | null;
}

export interface DailyGoal {
    targetMinutes: number;
    completedMinutes: number;
    sessionsCompleted: number;
    date: string;
}

export interface FocusStats {
    totalFocusTime: number; // in ms
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    averageSessionDuration: number;
    totalDistractions: number;
    todayFocusTime: number;
    todaySessions: number;
    thisWeekFocusTime: number;
    thisWeekSessions: number;
}

export interface FocusContextValue {
    // Session State
    activeSession: ActiveFocusSession | null;
    mode: FocusMode;
    isActive: boolean;
    isPaused: boolean;
    isOnBreak: boolean;

    // Timer State
    timeRemaining: number; // in ms
    timeElapsed: number; // in ms
    progress: number; // 0-1

    // Session Actions
    startSession: (item: PersonalItem, durationMinutes?: number) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    endSession: (reason?: SessionEndReason) => void;
    cancelSession: () => void;
    extendSession: (additionalMinutes: number) => void;

    // Break Actions
    startBreak: (isLong?: boolean) => void;
    skipBreak: () => void;

    // Distraction Tracking
    recordDistraction: (note?: string) => void;
    addSessionNote: (note: string) => void;

    // History & Stats
    sessionHistory: CompletedSession[];
    stats: FocusStats;
    streak: FocusStreak;
    dailyGoal: DailyGoal;

    // Settings
    settings: TimerSettings;
    updateSettings: (updates: Partial<TimerSettings>) => void;

    // Daily Goal
    setDailyGoal: (targetMinutes: number) => void;

    // Utilities
    clearHistory: () => void;
    getSessionsForDate: (date: Date) => CompletedSession[];
    formatTime: (ms: number) => string;

    // Pomodoro Counter
    pomodorosCompleted: number;
    pomodorosUntilLongBreak: number;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    enableSounds: true,
};

export const FOCUS_STORAGE_KEYS = {
    settings: 'focus_settings',
    history: 'focus_history',
    streak: 'focus_streak',
    dailyGoal: 'focus_daily_goal',
    pomodoros: 'focus_pomodoros_today',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getDateKey = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0] ?? '';
};

export const isThisWeek = (date: Date): boolean => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return date >= startOfWeek && date < endOfWeek;
};

export const formatFocusTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch {
        return defaultValue;
    }
};

export const saveToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to storage:', error);
    }
};
