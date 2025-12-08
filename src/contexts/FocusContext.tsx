import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode
} from 'react';
import type { PersonalItem } from '../../types';
import { useData } from './DataContext';

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

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  enableSounds: true,
};

const STORAGE_KEYS = {
  settings: 'focus_settings',
  history: 'focus_history',
  streak: 'focus_streak',
  dailyGoal: 'focus_daily_goal',
  pomodoros: 'focus_pomodoros_today',
};

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getDateKey = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0] ?? '';
};

const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
};

// ============================================================================
// Context
// ============================================================================

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

export interface FocusProviderProps {
  children: ReactNode;
}

export const FocusProvider: React.FC<FocusProviderProps> = ({ children }) => {
  const { updatePersonalItem } = useData();

  // PERFORMANCE: Batch all localStorage reads in a single initialization
  const [initialState] = useState(() => {
    const settings = loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    const history = loadFromStorage<CompletedSession[]>(STORAGE_KEYS.history, []);
    const streak = loadFromStorage(STORAGE_KEYS.streak, {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
    });

    const storedGoal = loadFromStorage<DailyGoal>(STORAGE_KEYS.dailyGoal, {
      targetMinutes: 120,
      completedMinutes: 0,
      sessionsCompleted: 0,
      date: getDateKey(),
    });
    const dailyGoal = storedGoal.date !== getDateKey()
      ? { ...storedGoal, completedMinutes: 0, sessionsCompleted: 0, date: getDateKey() }
      : storedGoal;

    const storedPomodoros = loadFromStorage<{ count: number; date: string }>(
      STORAGE_KEYS.pomodoros,
      { count: 0, date: getDateKey() }
    );
    const pomodorosCompleted = storedPomodoros.date === getDateKey() ? storedPomodoros.count : 0;

    return { settings, history, streak, dailyGoal, pomodorosCompleted };
  });

  // Core State
  const [activeSession, setActiveSession] = useState<ActiveFocusSession | null>(null);
  const [mode, setMode] = useState<FocusMode>('idle');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Settings & History - initialized from batched storage read
  const [settings, setSettings] = useState<TimerSettings>(initialState.settings);
  const [sessionHistory, setSessionHistory] = useState<CompletedSession[]>(initialState.history);
  const [streak, setStreak] = useState<FocusStreak>(initialState.streak);
  const [dailyGoal, setDailyGoalState] = useState<DailyGoal>(initialState.dailyGoal);
  const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(initialState.pomodorosCompleted);

  // Refs for timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // ========================================================================
  // Derived State
  // ========================================================================

  const isActive = mode === 'focusing';
  const isPaused = mode === 'paused';
  const isOnBreak = mode === 'break' || mode === 'longBreak';

  const timeElapsed = useMemo(() => {
    if (!activeSession) return 0;
    const now = Date.now();
    const elapsed = now - activeSession.startTime - activeSession.totalPausedTime;
    return Math.max(0, elapsed);
  }, [activeSession, timeRemaining]); // timeRemaining dependency for updates

  const progress = useMemo(() => {
    if (!activeSession || activeSession.targetDuration === 0) return 0;
    return Math.min(1, timeElapsed / activeSession.targetDuration);
  }, [activeSession, timeElapsed]);

  const pomodorosUntilLongBreak = settings.sessionsUntilLongBreak - (pomodorosCompleted % settings.sessionsUntilLongBreak);

  // ========================================================================
  // Statistics
  // ========================================================================

  const stats = useMemo<FocusStats>(() => {
    const now = new Date();
    const today = getDateKey(now);

    const todaySessions = sessionHistory.filter(s =>
      getDateKey(new Date(s.startTime)) === today
    );

    const thisWeekSessions = sessionHistory.filter(s =>
      isThisWeek(new Date(s.startTime))
    );

    const completedSessions = sessionHistory.filter(s => s.endReason === 'completed');
    const cancelledSessions = sessionHistory.filter(s => s.endReason === 'cancelled');

    const totalFocusTime = sessionHistory.reduce((sum, s) => sum + s.duration, 0);
    const todayFocusTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const thisWeekFocusTime = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalDistractions = sessionHistory.reduce((sum, s) => sum + s.distractionCount, 0);

    return {
      totalFocusTime,
      totalSessions: sessionHistory.length,
      completedSessions: completedSessions.length,
      cancelledSessions: cancelledSessions.length,
      averageSessionDuration: sessionHistory.length > 0
        ? totalFocusTime / sessionHistory.length
        : 0,
      totalDistractions,
      todayFocusTime,
      todaySessions: todaySessions.length,
      thisWeekFocusTime,
      thisWeekSessions: thisWeekSessions.length,
    };
  }, [sessionHistory]);

  // ========================================================================
  // Persistence Effects
  // ========================================================================

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.settings, settings);
  }, [settings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.history, sessionHistory.slice(-100)); // Keep last 100
  }, [sessionHistory]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.streak, streak);
  }, [streak]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.dailyGoal, dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.pomodoros, {
      count: pomodorosCompleted,
      date: getDateKey()
    });
  }, [pomodorosCompleted]);

  // ========================================================================
  // Timer Logic
  // ========================================================================

  useEffect(() => {
    if (mode === 'focusing' || mode === 'break' || mode === 'longBreak') {
      lastTickRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        setTimeRemaining(prev => {
          const next = prev - delta;
          if (next <= 0) {
            // Timer completed - handle in effect below
            return 0;
          }
          return next;
        });
      }, 100); // Update every 100ms for smooth display
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode]);

  // Handle timer completion
  useEffect(() => {
    if (timeRemaining === 0 && (mode === 'focusing' || mode === 'break' || mode === 'longBreak')) {
      if (mode === 'focusing') {
        endSession('completed');
        // Play completion sound if enabled
        if (settings.enableSounds) {
          playSound('complete');
        }
      } else {
        // Break ended
        if (settings.autoStartFocus) {
          // Auto-start next focus session - would need the item
          setMode('idle');
        } else {
          setMode('idle');
        }
        if (settings.enableSounds) {
          playSound('breakEnd');
        }
      }
    }
  }, [timeRemaining, mode, settings.enableSounds, settings.autoStartFocus]);

  // ========================================================================
  // Sound Effects
  // ========================================================================

  const playSound = useCallback((type: 'start' | 'complete' | 'pause' | 'breakEnd') => {
    if (!settings.enableSounds) return;

    // Simple beep sounds using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies: Record<string, number> = {
        start: 523.25, // C5
        complete: 783.99, // G5
        pause: 392.00, // G4
        breakEnd: 659.25, // E5
      };

      oscillator.frequency.value = frequencies[type] || 440;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Audio not supported
    }
  }, [settings.enableSounds]);

  // ========================================================================
  // Session Actions
  // ========================================================================

  const startSession = useCallback((item: PersonalItem, durationMinutes?: number) => {
    const duration = (durationMinutes ?? settings.focusDuration) * 60 * 1000;

    // Update item status if needed
    if (item.status === 'todo') {
      void updatePersonalItem(item.id, { status: 'doing' });
      item = { ...item, status: 'doing' };
    }

    const session: ActiveFocusSession = {
      id: generateId(),
      item,
      startTime: Date.now(),
      pausedAt: null,
      totalPausedTime: 0,
      targetDuration: duration,
      distractionCount: 0,
      notes: [],
    };

    setActiveSession(session);
    setTimeRemaining(duration);
    setMode('focusing');
    playSound('start');
  }, [settings.focusDuration, updatePersonalItem, playSound]);

  const pauseSession = useCallback(() => {
    if (!activeSession || mode !== 'focusing') return;

    setActiveSession(prev => prev ? {
      ...prev,
      pausedAt: Date.now(),
    } : null);
    setMode('paused');
    playSound('pause');
  }, [activeSession, mode, playSound]);

  const resumeSession = useCallback(() => {
    if (!activeSession || mode !== 'paused') return;

    const pausedDuration = activeSession.pausedAt
      ? Date.now() - activeSession.pausedAt
      : 0;

    setActiveSession(prev => prev ? {
      ...prev,
      pausedAt: null,
      totalPausedTime: prev.totalPausedTime + pausedDuration,
    } : null);
    setMode('focusing');
    playSound('start');
  }, [activeSession, mode, playSound]);

  const endSession = useCallback((reason: SessionEndReason = 'completed') => {
    if (!activeSession) return;

    const endTime = Date.now();
    const duration = endTime - activeSession.startTime - activeSession.totalPausedTime;

    const completedSession: CompletedSession = {
      id: activeSession.id,
      itemId: activeSession.item.id,
      itemTitle: activeSession.item.title || 'Untitled',
      startTime: activeSession.startTime,
      endTime,
      duration,
      pausedTime: activeSession.totalPausedTime,
      distractionCount: activeSession.distractionCount,
      endReason: reason,
      notes: activeSession.notes,
    };

    setSessionHistory(prev => [...prev, completedSession]);

    // Update daily goal
    const completedMinutes = Math.floor(duration / 60000);
    setDailyGoalState(prev => ({
      ...prev,
      completedMinutes: prev.completedMinutes + completedMinutes,
      sessionsCompleted: prev.sessionsCompleted + 1,
    }));

    // Update streak
    if (reason === 'completed') {
      const today = getDateKey();
      setStreak(prev => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getDateKey(yesterday);

        let newStreak = prev.currentStreak;
        if (prev.lastSessionDate === today) {
          // Already counted today
        } else if (prev.lastSessionDate === yesterdayKey) {
          newStreak = prev.currentStreak + 1;
        } else {
          newStreak = 1;
        }

        return {
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          lastSessionDate: today,
        };
      });

      // Update pomodoros count
      setPomodorosCompleted(prev => prev + 1);
    }

    setActiveSession(null);
    setTimeRemaining(0);

    // Auto-start break if enabled
    if (reason === 'completed' && settings.autoStartBreaks) {
      const isLongBreak = (pomodorosCompleted + 1) % settings.sessionsUntilLongBreak === 0;
      startBreak(isLongBreak);
    } else {
      setMode('idle');
    }
  }, [activeSession, settings.autoStartBreaks, settings.sessionsUntilLongBreak, pomodorosCompleted]);

  const cancelSession = useCallback(() => {
    endSession('cancelled');
  }, [endSession]);

  const extendSession = useCallback((additionalMinutes: number) => {
    if (!activeSession) return;

    const additionalMs = additionalMinutes * 60 * 1000;
    setActiveSession(prev => prev ? {
      ...prev,
      targetDuration: prev.targetDuration + additionalMs,
    } : null);
    setTimeRemaining(prev => prev + additionalMs);
  }, [activeSession]);

  // ========================================================================
  // Break Actions
  // ========================================================================

  const startBreak = useCallback((isLong = false) => {
    const duration = isLong
      ? settings.longBreakDuration * 60 * 1000
      : settings.shortBreakDuration * 60 * 1000;

    setTimeRemaining(duration);
    setMode(isLong ? 'longBreak' : 'break');
  }, [settings.longBreakDuration, settings.shortBreakDuration]);

  const skipBreak = useCallback(() => {
    if (!isOnBreak) return;
    setTimeRemaining(0);
    setMode('idle');
  }, [isOnBreak]);

  // ========================================================================
  // Distraction & Notes
  // ========================================================================

  const recordDistraction = useCallback((note?: string) => {
    if (!activeSession) return;

    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        distractionCount: prev.distractionCount + 1,
        notes: note ? [...prev.notes, `⚠️ ${note}`] : prev.notes,
      };
    });
  }, [activeSession]);

  const addSessionNote = useCallback((note: string) => {
    if (!activeSession) return;

    setActiveSession(prev => prev ? {
      ...prev,
      notes: [...prev.notes, note],
    } : null);
  }, [activeSession]);

  // ========================================================================
  // Settings & Goals
  // ========================================================================

  const updateSettings = useCallback((updates: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const setDailyGoal = useCallback((targetMinutes: number) => {
    setDailyGoalState(prev => ({ ...prev, targetMinutes }));
  }, []);

  // ========================================================================
  // Utilities
  // ========================================================================

  const clearHistory = useCallback(() => {
    setSessionHistory([]);
    setStreak({
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
    });
    setPomodorosCompleted(0);
  }, []);

  const getSessionsForDate = useCallback((date: Date): CompletedSession[] => {
    const dateKey = getDateKey(date);
    return sessionHistory.filter(s => getDateKey(new Date(s.startTime)) === dateKey);
  }, [sessionHistory]);

  // ========================================================================
  // Context Value
  // ========================================================================

  const value = useMemo<FocusContextValue>(() => ({
    // Session State
    activeSession,
    mode,
    isActive,
    isPaused,
    isOnBreak,

    // Timer State
    timeRemaining,
    timeElapsed,
    progress,

    // Session Actions
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
    extendSession,

    // Break Actions
    startBreak,
    skipBreak,

    // Distraction Tracking
    recordDistraction,
    addSessionNote,

    // History & Stats
    sessionHistory,
    stats,
    streak,
    dailyGoal,

    // Settings
    settings,
    updateSettings,

    // Daily Goal
    setDailyGoal,

    // Utilities
    clearHistory,
    getSessionsForDate,
    formatTime,

    // Pomodoro Counter
    pomodorosCompleted,
    pomodorosUntilLongBreak,
  }), [
    activeSession,
    mode,
    isActive,
    isPaused,
    isOnBreak,
    timeRemaining,
    timeElapsed,
    progress,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
    extendSession,
    startBreak,
    skipBreak,
    recordDistraction,
    addSessionNote,
    sessionHistory,
    stats,
    streak,
    dailyGoal,
    settings,
    updateSettings,
    setDailyGoal,
    clearHistory,
    getSessionsForDate,
    pomodorosCompleted,
    pomodorosUntilLongBreak,
  ]);

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
};

// ============================================================================
// Hooks
// ============================================================================

export const useFocusSession = (): FocusContextValue => {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocusSession must be used within a FocusProvider');
  }
  return ctx;
};

/**
 * Hook for timer display
 */
export const useFocusTimer = () => {
  const { timeRemaining, timeElapsed, progress, formatTime, mode } = useFocusSession();
  return {
    timeRemaining,
    timeElapsed,
    progress,
    formattedRemaining: formatTime(timeRemaining),
    formattedElapsed: formatTime(timeElapsed),
    mode,
  };
};

/**
 * Hook for focus statistics
 */
export const useFocusStats = () => {
  const { stats, streak, dailyGoal, pomodorosCompleted } = useFocusSession();
  return {
    stats,
    streak,
    dailyGoal,
    pomodorosCompleted,
    dailyProgress: dailyGoal.targetMinutes > 0
      ? Math.min(1, dailyGoal.completedMinutes / dailyGoal.targetMinutes)
      : 0,
  };
};

/**
 * Hook for focus controls
 */
export const useFocusControls = () => {
  const {
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
    extendSession,
    startBreak,
    skipBreak,
    recordDistraction,
    addSessionNote,
  } = useFocusSession();

  return {
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
    extendSession,
    startBreak,
    skipBreak,
    recordDistraction,
    addSessionNote,
  };
};

/**
 * Hook for checking if currently in a focus session
 */
export const useIsInFocusSession = (): boolean => {
  const { isActive, isPaused } = useFocusSession();
  return isActive || isPaused;
};

/**
 * Hook for focus session history
 */
export const useFocusHistory = () => {
  const { sessionHistory, getSessionsForDate, clearHistory } = useFocusSession();
  return {
    history: sessionHistory,
    getSessionsForDate,
    clearHistory,
    recentSessions: sessionHistory.slice(-10).reverse(),
  };
};
