// Workout Provider - Main provider component with all workout logic
import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useImmerReducer } from 'use-immer';
import {
    WorkoutState,
    WorkoutProviderProps,
    WorkoutDerivedValue,
    createInitialState,
    HAPTIC_PATTERNS
} from './workoutTypes';
import { workoutReducer } from './workoutReducer';
import {
    WorkoutStateProvider,
    WorkoutDispatchProvider,
    WorkoutDerivedProvider
} from './WorkoutContext';
import { AppSettings } from '../../../types';
import { getThemeVariables } from '../themes';
// Data service imports moved to ActiveWorkoutNew.tsx
// PR service imports removed - used in ActiveWorkoutNew.tsx instead

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'active_workout_v3_state';
const REST_TIMER_SYNC_INTERVAL = 1000;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const loadAppSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem('appSettings');
        if (!stored) return {} as AppSettings;
        const parsed = JSON.parse(stored);
        return parsed && typeof parsed === 'object' ? parsed : {} as AppSettings;
    } catch {
        return {} as AppSettings;
    }
};

const triggerHaptic = (pattern: readonly number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([...pattern]);
    }
};

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export const WorkoutProvider: React.FC<WorkoutProviderProps> = ({
    item,
    onUpdate,
    onExit,
    children,
}) => {
    // Load saved state or create new
    const loadState = useCallback((): WorkoutState | null => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch {
            console.error('Failed to load workout state');
        }
        return null;
    }, []);

    // Initialize state
    const [state, dispatch] = useImmerReducer(
        workoutReducer,
        null,
        () => {
            const savedState = loadState();
            const appSettings = loadAppSettings();

            if (savedState) {
                return {
                    ...createInitialState([], 0, appSettings),
                    ...savedState,
                    appSettings,
                    isPaused: true,
                    lastPauseTimestamp: Date.now(),
                    pendingHaptic: null,
                };
            }

            return createInitialState(
                // Filter out any exercises without valid names
                (item.exercises || []).filter(ex => ex.name?.trim()),
                item.workoutDuration || 0,
                appSettings
            );
        }
    );

    // ============================================================
    // PERSISTENCE
    // ============================================================

    const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Debounced persistence
        if (persistTimeoutRef.current) {
            clearTimeout(persistTimeoutRef.current);
        }

        persistTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.error('Failed to persist workout state:', e);
            }
        }, 500);

        return () => {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
            }
        };
    }, [state]);

    // ============================================================
    // REST TIMER SYNC (Isolated - only updates rest timer)
    // ============================================================

    useEffect(() => {
        if (!state.restTimer.active) return;

        const interval = setInterval(() => {
            dispatch({ type: 'SYNC_REST_TIMER' });
        }, REST_TIMER_SYNC_INTERVAL);

        return () => clearInterval(interval);
    }, [state.restTimer.active, dispatch]);

    // ============================================================
    // HAPTIC FEEDBACK
    // ============================================================

    useEffect(() => {
        if (!state.pendingHaptic) return;

        const pattern = state.pendingHaptic === 'SET_COMPLETE'
            ? HAPTIC_PATTERNS.SET_COMPLETE
            : HAPTIC_PATTERNS.REST_END;

        triggerHaptic(pattern);
        dispatch({ type: 'CLEAR_PENDING_HAPTIC' });
    }, [state.pendingHaptic, dispatch]);

    // ============================================================
    // THEME APPLICATION
    // ============================================================

    useEffect(() => {
        const themeId = state.appSettings?.workoutSettings?.selectedTheme || 'deepCosmos';
        try {
            const variables = getThemeVariables(themeId);
            const root = document.documentElement;
            Object.entries(variables).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
            document.body.setAttribute('data-theme', themeId);
        } catch (e) {
            console.error('Failed to apply theme:', e);
        }

        return () => {
            document.body.removeAttribute('data-theme');
        };
    }, [state.appSettings?.workoutSettings?.selectedTheme]);

    // ============================================================
    // SETTINGS PERSISTENCE (Save to main appSettings in localStorage)
    // ============================================================

    useEffect(() => {
        const workoutSettings = state.appSettings?.workoutSettings;
        if (!workoutSettings) return;

        try {
            const existingSettings = localStorage.getItem('appSettings');
            const parsed = existingSettings ? JSON.parse(existingSettings) : {};

            const updated = {
                ...parsed,
                workoutSettings: {
                    ...(parsed.workoutSettings || {}),
                    ...workoutSettings,
                },
            };

            localStorage.setItem('appSettings', JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to persist workout settings:', e);
        }
    }, [state.appSettings?.workoutSettings]);

    // ============================================================
    // WAKE LOCK
    // ============================================================

    useEffect(() => {

        if (!state.appSettings?.workoutSettings?.keepAwake) return;

        let wakeLock: WakeLockSentinel | null = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                }
            } catch (e) {
                console.warn('Wake lock not supported:', e);
            }
        };

        requestWakeLock();

        return () => {
            wakeLock?.release();
        };
    }, [state.appSettings?.workoutSettings?.keepAwake]);

    // ============================================================
    // DERIVED VALUES (Memoized)
    // ============================================================

    const derived = useMemo<WorkoutDerivedValue>(() => {
        const currentExercise = state.exercises[state.currentExerciseIndex];

        if (!currentExercise) {
            return {
                currentExercise: undefined,
                activeSetIndex: 0,
                currentSet: { reps: 0, weight: 0 },
                completedSetsCount: 0,
                totalSets: 0,
                totalVolume: 0,
                progressPercent: 0,
            };
        }

        const activeSetIndex = currentExercise.sets.findIndex(s => !s.completedAt);
        const displaySetIndex = activeSetIndex === -1 ? currentExercise.sets.length : activeSetIndex;
        const currentSet = currentExercise.sets[displaySetIndex] || { reps: 0, weight: 0 };

        // Calculate stats
        let completedSetsCount = 0;
        let totalSets = 0;
        let totalVolume = 0;

        state.exercises.forEach(ex => {
            ex.sets.forEach(set => {
                totalSets++;
                if (set.completedAt) {
                    completedSetsCount++;
                    totalVolume += (set.weight || 0) * (set.reps || 0);
                }
            });
        });

        const progressPercent = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;

        return {
            currentExercise,
            activeSetIndex: displaySetIndex,
            currentSet,
            completedSetsCount,
            totalSets,
            totalVolume,
            progressPercent,
        };
    }, [state.exercises, state.currentExerciseIndex]);

    // Note: finishWorkout logic is handled directly in ActiveWorkoutNew.tsx

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <WorkoutStateProvider value={state}>
            <WorkoutDispatchProvider value={dispatch}>
                <WorkoutDerivedProvider value={derived}>
                    {children}
                </WorkoutDerivedProvider>
            </WorkoutDispatchProvider>
        </WorkoutStateProvider>
    );
};

export default WorkoutProvider;
