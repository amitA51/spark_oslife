import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import type { AppSettings, ThemeSettings, UiDensity, AnimationIntensity } from '../../types';
import { loadSettings, saveSettings } from '../../services/settingsService';
import { auth } from '../../config/firebase';
import { syncSettings, getCloudSettings } from '../../services/firestoreService';
import { onAuthStateChanged } from 'firebase/auth';

export interface SettingsContextValue {
  settings: AppSettings;
  theme: ThemeSettings;
  uiDensity: UiDensity;
  animationIntensity: AnimationIntensity;
  isSyncing: boolean;
  lastSyncTime: string | null;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  setUiDensity: (density: UiDensity) => void;
  setAnimationIntensity: (value: AnimationIntensity) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export interface SettingsProviderProps {
  children: ReactNode;
}

// Debounce delay for cloud sync (2 seconds)
const CLOUD_SYNC_DEBOUNCE_MS = 2000;

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    settings.lastSyncTime || null
  );

  // Refs for debouncing and preventing sync loops
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetFlagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingFromCloud = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      if (resetFlagTimerRef.current) {
        clearTimeout(resetFlagTimerRef.current);
      }
    };
  }, []);

  // Save locally immediately, sync to cloud with debounce
  useEffect(() => {
    // Always save to localStorage immediately
    saveSettings(settings);

    // Skip cloud sync if we're currently loading from cloud (prevents sync loop)
    if (isLoadingFromCloud.current) {
      return;
    }

    // Cloud sync with debounce (only if user is logged in)
    const currentUser = auth?.currentUser;
    if (currentUser) {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(async () => {
        // Guard: Don't update state if component unmounted
        if (!mountedRef.current) return;

        try {
          setIsSyncing(true);
          await syncSettings(currentUser.uid, settings);

          // Guard: Check again after async operation
          if (!mountedRef.current) return;

          const now = new Date().toISOString();
          setLastSyncTime(now);
          // Update lastSyncTime in settings (without triggering another sync)
          isLoadingFromCloud.current = true;
          setSettings(prev => ({ ...prev, lastSyncTime: now }));

          // Clear previous reset timer if exists
          if (resetFlagTimerRef.current) {
            clearTimeout(resetFlagTimerRef.current);
          }
          resetFlagTimerRef.current = setTimeout(() => {
            isLoadingFromCloud.current = false;
          }, 100);
        } catch (error) {
          console.error('Failed to sync settings to cloud:', error);
        } finally {
          if (mountedRef.current) {
            setIsSyncing(false);
          }
        }
      }, CLOUD_SYNC_DEBOUNCE_MS);
    }

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [settings]);

  // Load settings from cloud on auth state change
  useEffect(() => {
    if (!auth) return;

    const cloudResetTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Guard: Don't update state if component unmounted
      if (!mountedRef.current) return;

      if (user) {
        try {
          const cloudSettings = await getCloudSettings(user.uid);

          // Guard: Check again after async operation
          if (!mountedRef.current) return;

          if (cloudSettings) {
            // Mark that we're loading from cloud to prevent sync loop
            isLoadingFromCloud.current = true;

            // Merge cloud settings with local (cloud takes precedence)
            setSettings(prev => ({
              ...prev,
              ...cloudSettings,
              // Ensure we keep local-only runtime values
              lastSyncTime: new Date().toISOString(),
            }));
            setLastSyncTime(new Date().toISOString());

            // Reset the flag after a short delay
            if (cloudResetTimerRef.current) {
              clearTimeout(cloudResetTimerRef.current);
            }
            cloudResetTimerRef.current = setTimeout(() => {
              isLoadingFromCloud.current = false;
            }, 100);
          }
        } catch (error) {
          console.error('Failed to load settings from cloud:', error);
        }
      }
    });

    return () => {
      unsubscribe();
      if (cloudResetTimerRef.current) {
        clearTimeout(cloudResetTimerRef.current);
      }
    };
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const updateTheme = useCallback((updates: Partial<ThemeSettings>) => {
    setSettings(prev => ({
      ...prev,
      themeSettings: {
        ...prev.themeSettings,
        ...updates,
      },
    }));
  }, []);

  const setUiDensity = useCallback((density: UiDensity) => {
    setSettings(prev => ({
      ...prev,
      uiDensity: density,
    }));
  }, []);

  const setAnimationIntensity = useCallback((value: AnimationIntensity) => {
    setSettings(prev => ({
      ...prev,
      animationIntensity: value,
    }));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      theme: settings.themeSettings,
      uiDensity: settings.uiDensity,
      animationIntensity: settings.animationIntensity,
      isSyncing,
      lastSyncTime,
      updateSettings,
      updateTheme,
      setUiDensity,
      setAnimationIntensity,
    }),
    [settings, isSyncing, lastSyncTime, updateSettings, updateTheme, setUiDensity, setAnimationIntensity]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};
