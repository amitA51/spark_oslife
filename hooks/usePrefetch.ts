import { useEffect, useCallback, useRef } from 'react';
import type { Screen } from '../types';

const screenLoaders: Record<Screen, () => Promise<unknown>> = {
  today: () => import('../screens/HomeScreen'),
  dashboard: () => import('../screens/HomeScreen'),
  feed: () => import('../screens/FeedScreen'),
  calendar: () => import('../screens/CalendarScreen'),
  settings: () => import('../screens/SettingsScreen'),
  assistant: () => import('../screens/AssistantScreen'),
  library: () => import('../screens/LibraryScreen'),
  search: () => import('../screens/SearchScreen'),
  passwords: () => import('../screens/PasswordManagerScreen'),
  add: () => import('../screens/AddScreen'),
  investments: () => import('../screens/InvestmentsScreen'),
  views: () => import('../screens/ViewsScreen'),
  login: () => import('../screens/LoginScreen'),
  signup: () => import('../screens/SignupScreen'),
};

const prefetchedScreens = new Set<Screen>();

interface UsePrefetchOptions {
  screens: Screen[];
  delay?: number;
  enabled?: boolean;
}

interface UsePrefetchReturn {
  prefetchScreen: (screen: Screen) => Promise<void>;
  prefetchOnHover: (screen: Screen) => void;
  isPrefetched: (screen: Screen) => boolean;
}

export function usePrefetch({
  screens,
  delay = 2000,
  enabled = true,
}: UsePrefetchOptions): UsePrefetchReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchScreen = useCallback(async (screen: Screen): Promise<void> => {
    if (prefetchedScreens.has(screen)) {
      return;
    }

    const loader = screenLoaders[screen];
    if (!loader) {
      console.warn(`[usePrefetch] No loader found for screen: ${screen}`);
      return;
    }

    try {
      prefetchedScreens.add(screen);
      await loader();
    } catch (error) {
      prefetchedScreens.delete(screen);
      console.error(`[usePrefetch] Failed to prefetch screen: ${screen}`, error);
    }
  }, []);

  const prefetchOnHover = useCallback((screen: Screen): void => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      prefetchScreen(screen);
    }, 100);
  }, [prefetchScreen]);

  const isPrefetched = useCallback((screen: Screen): boolean => {
    return prefetchedScreens.has(screen);
  }, []);

  useEffect(() => {
    if (!enabled || screens.length === 0) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      const prefetchAll = async () => {
        for (const screen of screens) {
          if (!prefetchedScreens.has(screen)) {
            await prefetchScreen(screen);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
          prefetchAll();
        });
      } else {
        prefetchAll();
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [screens, delay, enabled, prefetchScreen]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    prefetchScreen,
    prefetchOnHover,
    isPrefetched,
  };
}

export function useNavPrefetch(): {
  onHover: (screen: Screen) => void;
  onLeave: () => void;
} {
  const { prefetchOnHover } = usePrefetch({ screens: [] });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onHover = useCallback((screen: Screen) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      prefetchOnHover(screen);
    }, 150);
  }, [prefetchOnHover]);

  const onLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  return { onHover, onLeave };
}

export default usePrefetch;