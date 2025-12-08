import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  ReactNode
} from 'react';
import type { GoogleCalendarEvent } from '../../types';
import * as googleCalendarService from '../../services/googleCalendarService';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type GoogleAuthState = 'loading' | 'signedIn' | 'signedOut' | 'error';

export type CalendarLoadingState = 'idle' | 'loading' | 'refreshing' | 'error';

export type EventFilterType = 'all' | 'today' | 'upcoming' | 'past' | 'thisWeek' | 'thisMonth';

export interface CalendarError {
  code: string;
  message: string;
  timestamp: Date;
  retryable: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CacheEntry {
  events: GoogleCalendarEvent[];
  fetchedAt: Date;
  range: DateRange;
}

export interface CalendarStats {
  totalEvents: number;
  todayEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  thisWeekEvents: number;
}

export interface CalendarContextValue {
  // Core State
  calendarEvents: GoogleCalendarEvent[];
  googleAuthState: GoogleAuthState;
  loadingState: CalendarLoadingState;
  error: CalendarError | null;

  // Setters
  setCalendarEvents: (events: GoogleCalendarEvent[]) => void;
  setGoogleAuthState: (state: GoogleAuthState) => void;

  // Actions
  refreshCalendarEvents: (forceRefresh?: boolean) => Promise<void>;
  fetchEventsForRange: (start: Date, end: Date) => Promise<GoogleCalendarEvent[]>;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;

  // Optimistic Updates
  addEventOptimistically: (event: GoogleCalendarEvent) => void;
  updateEventOptimistically: (eventId: string, updates: Partial<GoogleCalendarEvent>) => void;
  removeEventOptimistically: (eventId: string) => void;

  // Filtering & Queries
  getEventsByDate: (date: Date) => GoogleCalendarEvent[];
  getEventsByDateRange: (start: Date, end: Date) => GoogleCalendarEvent[];
  getFilteredEvents: (filter: EventFilterType) => GoogleCalendarEvent[];
  searchEvents: (query: string) => GoogleCalendarEvent[];

  // Date Utilities
  getTodayEvents: () => GoogleCalendarEvent[];
  getUpcomingEvents: (days?: number) => GoogleCalendarEvent[];
  getEventsForWeek: (weekStart?: Date) => GoogleCalendarEvent[];

  // Stats
  stats: CalendarStats;

  // Cache Info
  lastFetchedAt: Date | null;
  isCacheStale: boolean;

  // Auto-refresh
  enableAutoRefresh: (intervalMs?: number) => void;
  disableAutoRefresh: () => void;
  isAutoRefreshEnabled: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// ============================================================================
// Utility Functions
// ============================================================================

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isWithinRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  return getStartOfDay(result);
};

const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return getEndOfDay(end);
};

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getEventDate = (event: GoogleCalendarEvent): Date => {
  // Handle different event date formats
  if (event.start?.dateTime) {
    return new Date(event.start.dateTime);
  }
  if (event.start?.date) {
    return new Date(event.start.date);
  }
  return new Date();
};

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// Context
// ============================================================================

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

export interface CalendarProviderProps {
  children: ReactNode;
  /** Initial cache TTL in milliseconds */
  cacheTTL?: number;
  /** Enable auto-refresh on mount */
  autoRefreshOnMount?: boolean;
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
  cacheTTL = CACHE_TTL_MS,
  autoRefreshOnMount = false,
  autoRefreshInterval = DEFAULT_AUTO_REFRESH_INTERVAL
}) => {
  // Core State
  const [calendarEvents, setCalendarEventsState] = useState<GoogleCalendarEvent[]>([]);
  const [googleAuthState, setGoogleAuthStateState] = useState<GoogleAuthState>('loading');
  const [loadingState, setLoadingState] = useState<CalendarLoadingState>('idle');
  const [error, setError] = useState<CalendarError | null>(null);

  // Cache State
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const cacheRef = useRef<CacheEntry | null>(null);

  // Auto-refresh State
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefreshOnMount);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentAutoRefreshInterval = useRef(autoRefreshInterval);

  // Retry State
  const lastOperationRef = useRef<(() => Promise<void>) | null>(null);
  const retryCountRef = useRef(0);

  // ========================================================================
  // Cache Management
  // ========================================================================

  const isCacheStale = useMemo(() => {
    if (!lastFetchedAt) return true;
    return Date.now() - lastFetchedAt.getTime() > cacheTTL;
  }, [lastFetchedAt, cacheTTL]);

  // ========================================================================
  // Error Handling
  // ========================================================================

  const createError = useCallback((
    code: string,
    message: string,
    retryable = true
  ): CalendarError => ({
    code,
    message,
    timestamp: new Date(),
    retryable
  }), []);

  const clearError = useCallback(() => {
    setError(null);
    retryCountRef.current = 0;
  }, []);

  // ========================================================================
  // Core Setters
  // ========================================================================

  const setCalendarEvents = useCallback((events: GoogleCalendarEvent[]) => {
    setCalendarEventsState(events);
    setLastFetchedAt(new Date());
    cacheRef.current = {
      events,
      fetchedAt: new Date(),
      range: {
        start: new Date(),
        end: new Date()
      }
    };
  }, []);

  const setGoogleAuthState = useCallback((state: GoogleAuthState) => {
    setGoogleAuthStateState(state);
    if (state === 'signedOut') {
      // Clear events on sign out
      setCalendarEventsState([]);
      cacheRef.current = null;
      setLastFetchedAt(null);
    }
  }, []);

  // ========================================================================
  // Fetch with Retry Logic
  // ========================================================================

  const fetchWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    maxRetries = MAX_RETRY_ATTEMPTS
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries - 1) {
          await delay(RETRY_DELAY_MS * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }, []);

  // ========================================================================
  // Fetch Operations
  // ========================================================================

  const fetchEventsForRange = useCallback(async (
    start: Date,
    end: Date
  ): Promise<GoogleCalendarEvent[]> => {
    if (googleAuthState !== 'signedIn') {
      return [];
    }

    try {
      const events = await fetchWithRetry(() =>
        googleCalendarService.getEventsForDateRange(start, end)
      );
      return events;
    } catch (err) {
      console.error('Failed to fetch events for range:', err);
      throw err;
    }
  }, [googleAuthState, fetchWithRetry]);

  const refreshCalendarEvents = useCallback(async (forceRefresh = false) => {
    if (googleAuthState !== 'signedIn') return;

    // Skip if cache is fresh and not forcing refresh
    if (!forceRefresh && !isCacheStale && cacheRef.current) {
      return;
    }

    const isInitialLoad = calendarEvents.length === 0;
    setLoadingState(isInitialLoad ? 'loading' : 'refreshing');
    setError(null);

    const operation = async () => {
      try {
        const now = new Date();
        const start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        const end = new Date(now);
        end.setMonth(end.getMonth() + 3);

        const events = await fetchWithRetry(() =>
          googleCalendarService.getEventsForDateRange(start, end)
        );

        setCalendarEventsState(events);
        setLastFetchedAt(new Date());
        cacheRef.current = {
          events,
          fetchedAt: new Date(),
          range: { start, end }
        };
        setLoadingState('idle');
        retryCountRef.current = 0;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(createError('FETCH_FAILED', `Failed to refresh calendar events: ${errorMessage}`));
        setLoadingState('error');
        throw err;
      }
    };

    lastOperationRef.current = operation;
    await operation();
  }, [googleAuthState, isCacheStale, calendarEvents.length, fetchWithRetry, createError]);

  const retryLastOperation = useCallback(async () => {
    if (lastOperationRef.current && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
      retryCountRef.current++;
      await lastOperationRef.current();
    }
  }, []);

  // ========================================================================
  // Optimistic Updates
  // ========================================================================

  const addEventOptimistically = useCallback((event: GoogleCalendarEvent) => {
    setCalendarEventsState(prev => [...prev, event]);
  }, []);

  const updateEventOptimistically = useCallback((
    eventId: string,
    updates: Partial<GoogleCalendarEvent>
  ) => {
    setCalendarEventsState(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
  }, []);

  const removeEventOptimistically = useCallback((eventId: string) => {
    setCalendarEventsState(prev => prev.filter(event => event.id !== eventId));
  }, []);

  // ========================================================================
  // Event Filtering & Queries
  // ========================================================================

  const getEventsByDate = useCallback((date: Date): GoogleCalendarEvent[] => {
    return calendarEvents.filter(event => isSameDay(getEventDate(event), date));
  }, [calendarEvents]);

  const getEventsByDateRange = useCallback((
    start: Date,
    end: Date
  ): GoogleCalendarEvent[] => {
    return calendarEvents.filter(event => {
      const eventDate = getEventDate(event);
      return isWithinRange(eventDate, start, end);
    });
  }, [calendarEvents]);

  const getTodayEvents = useCallback((): GoogleCalendarEvent[] => {
    const today = new Date();
    return getEventsByDate(today);
  }, [getEventsByDate]);

  const getUpcomingEvents = useCallback((days = 7): GoogleCalendarEvent[] => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    return calendarEvents
      .filter(event => {
        const eventDate = getEventDate(event);
        return eventDate >= now && eventDate <= futureDate;
      })
      .sort((a, b) => getEventDate(a).getTime() - getEventDate(b).getTime());
  }, [calendarEvents]);

  const getEventsForWeek = useCallback((weekStart?: Date): GoogleCalendarEvent[] => {
    const start = getStartOfWeek(weekStart || new Date());
    const end = getEndOfWeek(start);
    return getEventsByDateRange(start, end);
  }, [getEventsByDateRange]);

  const getFilteredEvents = useCallback((filter: EventFilterType): GoogleCalendarEvent[] => {
    const now = new Date();

    switch (filter) {
      case 'today':
        return getTodayEvents();
      case 'upcoming':
        return calendarEvents.filter(event => getEventDate(event) >= now);
      case 'past':
        return calendarEvents.filter(event => getEventDate(event) < now);
      case 'thisWeek':
        return getEventsForWeek();
      case 'thisMonth':
        return getEventsByDateRange(getStartOfMonth(now), getEndOfMonth(now));
      case 'all':
      default:
        return calendarEvents;
    }
  }, [calendarEvents, getTodayEvents, getEventsForWeek, getEventsByDateRange]);

  const searchEvents = useCallback((query: string): GoogleCalendarEvent[] => {
    if (!query.trim()) return calendarEvents;

    const lowerQuery = query.toLowerCase();
    return calendarEvents.filter(event => {
      const summary = event.summary?.toLowerCase() || '';
      const description = event.description?.toLowerCase() || '';
      const location = event.location?.toLowerCase() || '';

      return (
        summary.includes(lowerQuery) ||
        description.includes(lowerQuery) ||
        location.includes(lowerQuery)
      );
    });
  }, [calendarEvents]);

  // ========================================================================
  // Stats
  // ========================================================================

  const stats = useMemo<CalendarStats>(() => {
    const now = new Date();
    const today = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const weekStart = getStartOfWeek(now);
    const weekEnd = getEndOfWeek(now);

    return {
      totalEvents: calendarEvents.length,
      todayEvents: calendarEvents.filter(event => {
        const eventDate = getEventDate(event);
        return isWithinRange(eventDate, today, todayEnd);
      }).length,
      upcomingEvents: calendarEvents.filter(event =>
        getEventDate(event) >= now
      ).length,
      pastEvents: calendarEvents.filter(event =>
        getEventDate(event) < now
      ).length,
      thisWeekEvents: calendarEvents.filter(event => {
        const eventDate = getEventDate(event);
        return isWithinRange(eventDate, weekStart, weekEnd);
      }).length,
    };
  }, [calendarEvents]);

  // ========================================================================
  // Auto-Refresh
  // ========================================================================

  const enableAutoRefresh = useCallback((intervalMs = DEFAULT_AUTO_REFRESH_INTERVAL) => {
    setIsAutoRefreshEnabled(true);
    currentAutoRefreshInterval.current = intervalMs;
  }, []);

  const disableAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(false);
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (isAutoRefreshEnabled && googleAuthState === 'signedIn') {
      autoRefreshIntervalRef.current = setInterval(() => {
        refreshCalendarEvents(true);
      }, currentAutoRefreshInterval.current);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, googleAuthState, refreshCalendarEvents]);

  // ========================================================================
  // Context Value
  // ========================================================================

  const value = useMemo<CalendarContextValue>(
    () => ({
      // Core State
      calendarEvents,
      googleAuthState,
      loadingState,
      error,

      // Setters
      setCalendarEvents,
      setGoogleAuthState,

      // Actions
      refreshCalendarEvents,
      fetchEventsForRange,
      clearError,
      retryLastOperation,

      // Optimistic Updates
      addEventOptimistically,
      updateEventOptimistically,
      removeEventOptimistically,

      // Filtering & Queries
      getEventsByDate,
      getEventsByDateRange,
      getFilteredEvents,
      searchEvents,

      // Date Utilities
      getTodayEvents,
      getUpcomingEvents,
      getEventsForWeek,

      // Stats
      stats,

      // Cache Info
      lastFetchedAt,
      isCacheStale,

      // Auto-refresh
      enableAutoRefresh,
      disableAutoRefresh,
      isAutoRefreshEnabled,
    }),
    [
      calendarEvents,
      googleAuthState,
      loadingState,
      error,
      setCalendarEvents,
      setGoogleAuthState,
      refreshCalendarEvents,
      fetchEventsForRange,
      clearError,
      retryLastOperation,
      addEventOptimistically,
      updateEventOptimistically,
      removeEventOptimistically,
      getEventsByDate,
      getEventsByDateRange,
      getFilteredEvents,
      searchEvents,
      getTodayEvents,
      getUpcomingEvents,
      getEventsForWeek,
      stats,
      lastFetchedAt,
      isCacheStale,
      enableAutoRefresh,
      disableAutoRefresh,
      isAutoRefreshEnabled,
    ]
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};

// ============================================================================
// Hooks
// ============================================================================

export const useCalendar = (): CalendarContextValue => {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return ctx;
};

/**
 * Hook to get events for a specific date with automatic memoization
 */
export const useEventsForDate = (date: Date): GoogleCalendarEvent[] => {
  const { getEventsByDate } = useCalendar();
  return useMemo(() => getEventsByDate(date), [getEventsByDate, date]);
};

/**
 * Hook to get today's events with automatic updates
 */
export const useTodayEvents = (): GoogleCalendarEvent[] => {
  const { getTodayEvents } = useCalendar();
  return useMemo(() => getTodayEvents(), [getTodayEvents]);
};

/**
 * Hook to get upcoming events
 */
export const useUpcomingEvents = (days = 7): GoogleCalendarEvent[] => {
  const { getUpcomingEvents } = useCalendar();
  return useMemo(() => getUpcomingEvents(days), [getUpcomingEvents, days]);
};

/**
 * Hook to search events
 */
export const useEventSearch = (query: string): GoogleCalendarEvent[] => {
  const { searchEvents } = useCalendar();
  return useMemo(() => searchEvents(query), [searchEvents, query]);
};

/**
 * Hook to get calendar stats
 */
export const useCalendarStats = (): CalendarStats => {
  const { stats } = useCalendar();
  return stats;
};

/**
 * Hook for calendar loading state
 */
export const useCalendarLoading = (): {
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  error: CalendarError | null;
} => {
  const { loadingState, error } = useCalendar();
  return {
    isLoading: loadingState === 'loading',
    isRefreshing: loadingState === 'refreshing',
    hasError: loadingState === 'error',
    error,
  };
};
