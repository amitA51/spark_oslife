// ActiveWorkout - Main workout component that composes everything
// This replaces the old 1295-line monolithic ActiveWorkout.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PersonalItem, WorkoutSession, WorkoutGoal, PersonalExercise } from '../../types';

// Core
import { WorkoutProvider } from './core/WorkoutProvider';
import {
    useWorkoutState,
    useWorkoutDispatch,
    useWorkoutDerived
} from './core/WorkoutContext';

// Components
import {
    WorkoutHeader,
    ExerciseDisplay,
    ExerciseNav,
    ProgressBar
} from './components';

// Overlays
import {
    RestTimerOverlay,
    NumpadOverlay,
    ConfirmExitOverlay,
    WorkoutSettingsOverlay
} from './overlays';

// Hooks
import { usePersonalRecords } from './hooks/usePersonalRecords';
import { formatTime } from './hooks/useWorkoutTimer';

// Existing components we preserve
import ExerciseSelector from './ExerciseSelector';
import QuickExerciseForm from './QuickExerciseForm';
import WorkoutSummary from './WorkoutSummary';
import PRCelebration from './PRCelebration';
import WarmupCooldownFlow from './WarmupCooldownFlow';
import WorkoutGoalSelector from './WorkoutGoalSelector';
import ExerciseTutorial from './ExerciseTutorial';
import AICoach from './AICoach';
import WaterReminderToast from './WaterReminderToast';
import ExerciseReorder from './ExerciseReorder';

// Services
import {
    getWorkoutSessions,
    getPersonalExercises,
    saveWorkoutSession,
    createWorkoutTemplate
} from '../../services/dataService';
import { getExerciseNames } from '../../services/prService';

// Icons
import { DumbbellIcon } from '../icons';

// CSS
import './workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface ActiveWorkoutProps {
    item: PersonalItem;
    onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
    onExit: () => void;
}

// ============================================================
// PARTICLE EXPLOSION (Celebration)
// ============================================================

const ParticleExplosion = React.memo(() => {
    const particles = useMemo(() =>
        [...Array(20)].map(() => ({
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            scale: Math.random() * 2,
            color: ['#6366f1', '#06b6d4', '#a855f7', '#10b981'][Math.floor(Math.random() * 4)],
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center overflow-hidden">
            {particles.map((particle, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                    animate={{
                        opacity: 0,
                        x: particle.x,
                        y: particle.y,
                        scale: particle.scale,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ background: particle.color }}
                />
            ))}
        </div>
    );
});

ParticleExplosion.displayName = 'ParticleExplosion';

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
    oledMode: boolean;
    onAddExercise: () => void;
    onCancel: () => void;
}

const EmptyState = React.memo<EmptyStateProps>(({ oledMode, onAddExercise, onCancel }) => (
    <div
        className="fixed inset-0 text-[var(--cosmos-text-primary)] font-sans overflow-y-auto overscroll-contain z-[9999] flex flex-col items-center justify-center p-6 text-center transition-colors duration-500"
        style={{ background: oledMode ? '#000000' : 'var(--cosmos-bg-primary)' }}
    >
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')]" />

        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center max-w-sm px-4"
        >
            <motion.div
                className="w-24 h-24 rounded-full bg-[var(--cosmos-accent-primary)]/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
                <DumbbellIcon className="w-10 h-10 text-[var(--cosmos-accent-primary)]" />
            </motion.div>

            <h1 className="text-3xl font-bold mb-2">בוא נתחיל! 💪</h1>
            <p className="text-[var(--cosmos-text-muted)] mb-8 text-center leading-relaxed">
                בחר את התרגיל הראשון שלך כדי להתחיל את האימון
            </p>

            <motion.button
                onClick={onAddExercise}
                className="w-full h-14 min-h-[56px] rounded-2xl bg-[var(--cosmos-accent-primary)] text-white font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all active:scale-95 mb-4 flex items-center justify-center gap-2"
                animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 35px rgba(99,102,241,0.6)', '0 0 20px rgba(99,102,241,0.4)'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
                <span className="text-xl">+</span> בחר תרגיל
            </motion.button>

            <button
                onClick={onCancel}
                className="text-sm text-[var(--cosmos-text-muted)] hover:text-white transition-colors min-h-[44px] px-4"
            >
                ביטול
            </button>
        </motion.div>
    </div>
));

EmptyState.displayName = 'EmptyState';

// ============================================================
// MAIN WORKOUT CONTENT
// ============================================================

const WorkoutContent: React.FC<{
    item: PersonalItem;
    onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
    onExit: () => void;
}> = ({ item, onUpdate, onExit }) => {
    const state = useWorkoutState();
    const dispatch = useWorkoutDispatch();
    const derived = useWorkoutDerived();

    // Local state
    const [showSummary, setShowSummary] = useState(false);
    const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [finishIntent, setFinishIntent] = useState<'finish' | 'cancel'>('finish');
    const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
    const [personalExerciseLibrary, setPersonalExerciseLibrary] = useState<PersonalExercise[]>([]);
    const [showWaterReminder, setShowWaterReminder] = useState(false);

    // Settings
    const workoutSettings = state.appSettings?.workoutSettings || {} as Record<string, unknown>;
    const bgPrimary = (workoutSettings.oledMode as boolean) ? '#000000' : 'var(--cosmos-bg-primary)';

    // PR tracking
    const { getPRForExercise } = usePersonalRecords(
        state.exercises,
        state.currentExerciseIndex
    );

    // Load exercise suggestions
    useEffect(() => {
        const loadNames = async () => {
            try {
                const [sessions, personalExercises] = await Promise.all([
                    getWorkoutSessions(100),
                    getPersonalExercises().catch(() => []),
                ]);
                const historyNames = getExerciseNames(sessions);
                const libraryNames = Array.from(
                    new Set((personalExercises as PersonalExercise[]).map(ex => ex.name).filter(Boolean))
                );
                setPersonalExerciseLibrary(personalExercises as PersonalExercise[]);
                setNameSuggestions(Array.from(new Set([...historyNames, ...libraryNames])).sort());
            } catch (error) {
                console.error('Failed to load exercise name suggestions', error);
            }
        };
        loadNames();
    }, []);

    // Workout start flow - runs on mount
    useEffect(() => {
        const elapsed = Math.floor((Date.now() - state.startTimestamp) / 1000);
        if (elapsed > 10) return; // Only run on fresh workout start

        const warmupPreference = workoutSettings.warmupPreference || 'ask';
        const hasGoal = !!workoutSettings.defaultWorkoutGoal;

        // If no goal set, show goal selector first (warmup will trigger after goal selection)
        if (!hasGoal && !state.showGoalSelector && !state.showWarmup) {
            dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'goal', isOpen: true } });
            return;
        }

        // If goal is already set, check warmup preference directly
        if (hasGoal && warmupPreference !== 'never' && !state.showWarmup && !state.showExerciseSelector) {
            // Show warmup flow
            dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: true } });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle goal selection - optionally trigger warmup
    const handleGoalSelect = useCallback((goal: WorkoutGoal) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultWorkoutGoal: goal } });
        dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'goal', isOpen: false } });

        // Check warmup preference
        const warmupPreference = workoutSettings.warmupPreference || 'ask';
        if (warmupPreference === 'always') {
            setTimeout(() => {
                dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: true } });
            }, 300);
        } else if (warmupPreference === 'ask') {
            // Could show a prompt here, for now let's trigger warmup
            setTimeout(() => {
                dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: true } });
            }, 300);
        }
        // 'never' - do nothing
    }, [dispatch, workoutSettings.warmupPreference]);

    // Auto-open exercise selector when no exercises
    useEffect(() => {
        if (
            state.exercises.length === 0 &&
            !state.showExerciseSelector &&
            !state.showQuickForm &&
            !state.showGoalSelector &&
            !state.showWarmup &&
            !state.showCooldown
        ) {
            dispatch({ type: 'OPEN_SELECTOR' });
        }
    }, [state.exercises.length, state.showExerciseSelector, state.showQuickForm, state.showGoalSelector, state.showWarmup, state.showCooldown, dispatch]);

    // Water reminder every 15 minutes if enabled
    useEffect(() => {
        if (!workoutSettings.workoutRemindersEnabled) return;

        const WATER_INTERVAL = 15 * 60 * 1000; // 15 minutes
        const interval = setInterval(() => {
            setShowWaterReminder(true);
        }, WATER_INTERVAL);

        return () => clearInterval(interval);
    }, [workoutSettings.workoutRemindersEnabled]);

    // PR info for current exercise
    const prInfo = useMemo(() => {
        if (!derived.currentExercise) return '';
        const pr = getPRForExercise(derived.currentExercise.name);
        if (!pr) return 'NO PR YET — MAKE HISTORY!';
        return `PR: ${pr.maxWeight}kg × ${pr.maxWeightReps} • 1RM: ~${pr.oneRepMax}kg`;
    }, [derived.currentExercise, getPRForExercise]);

    // Workout stats for confirm dialog
    const workoutStats = useMemo(() => {
        const elapsed = Math.floor((Date.now() - state.startTimestamp - state.totalPausedTime) / 1000);
        return {
            completedSets: derived.completedSetsCount,
            totalVolume: derived.totalVolume,
            duration: formatTime(elapsed),
        };
    }, [state.startTimestamp, state.totalPausedTime, derived.completedSetsCount, derived.totalVolume]);

    // Handlers
    const handleUpdateSet = useCallback((field: 'weight' | 'reps', value: number) => {
        dispatch({ type: 'UPDATE_SET', payload: { field, value } });
    }, [dispatch]);

    const handleCompleteSet = useCallback(() => {
        dispatch({ type: 'COMPLETE_SET' });
    }, [dispatch]);

    const handleOpenNumpad = useCallback((target: 'weight' | 'reps') => {
        dispatch({ type: 'OPEN_NUMPAD', payload: target });
    }, [dispatch]);

    const handleRenameExercise = useCallback((name: string) => {
        dispatch({ type: 'RENAME_EXERCISE', payload: { index: state.currentExerciseIndex, name } });

        // Apply library metadata if match found
        const match = personalExerciseLibrary.find(pe => pe.name === name);
        if (match) {
            dispatch({
                type: 'UPDATE_EXERCISE_META',
                payload: {
                    index: state.currentExerciseIndex,
                    muscleGroup: match.muscleGroup,
                    tempo: match.tempo,
                    targetRestTime: match.defaultRestTime,
                    tutorialText: match.tutorialText,
                },
            });
        }
    }, [dispatch, state.currentExerciseIndex, personalExerciseLibrary]);

    const handleFinishRequest = useCallback(() => {
        // Check cooldown preference
        const cooldownPreference = workoutSettings.cooldownPreference || 'ask';

        if (cooldownPreference === 'always' || cooldownPreference === 'ask') {
            // Show cooldown flow first
            dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'cooldown', isOpen: true } });
        } else {
            // Skip cooldown, go straight to confirm
            setFinishIntent('finish');
            setShowFinishConfirm(true);
        }
    }, [dispatch, workoutSettings.cooldownPreference]);

    const handleConfirmFinish = useCallback(async () => {
        setShowFinishConfirm(false);

        if (finishIntent === 'cancel') {
            localStorage.removeItem('active_workout_v3_state');
            onExit();
            return;
        }

        // Save session
        try {
            const elapsed = Math.floor((Date.now() - state.startTimestamp - state.totalPausedTime) / 1000);

            const session: WorkoutSession = {
                id: `session_${Date.now()}`,
                workoutItemId: item.id,
                startTime: new Date(state.startTimestamp).toISOString(),
                endTime: new Date().toISOString(),
                goalType: workoutSettings.defaultWorkoutGoal,
                exercises: state.exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.filter(s => s.completedAt),
                })),
            };

            await saveWorkoutSession(session);

            onUpdate(item.id, {
                exercises: session.exercises,
                workoutDuration: elapsed,
                workoutEndTime: session.endTime,
                isActiveWorkout: false,
            });

            localStorage.removeItem('active_workout_v3_state');
            setCompletedSession(session);
            setShowSummary(true);
        } catch (e) {
            console.error('Failed to save workout:', e);
        }
    }, [finishIntent, state, item.id, workoutSettings.defaultWorkoutGoal, onUpdate, onExit]);

    // If showing summary
    if (showSummary && completedSession) {
        return (
            <WorkoutSummary
                session={completedSession}
                onClose={onExit}
                onSaveAsTemplate={async () => {
                    const defaultName = completedSession.exercises?.[0]?.name || 'My Workout';
                    await createWorkoutTemplate({
                        name: defaultName,
                        exercises: (completedSession.exercises || []).map(ex => ({
                            id: ex.id,
                            name: ex.name,
                            muscleGroup: ex.muscleGroup,
                            targetRestTime: ex.targetRestTime,
                            tempo: ex.tempo,
                            sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight })),
                        })),
                        muscleGroups: Array.from(new Set((completedSession.exercises || []).map(e => e.muscleGroup).filter(Boolean) as string[])),
                        isBuiltin: false,
                    });
                }}
            />
        );
    }

    // If no current exercise OR exercise has no name, show empty state with selector
    if (!derived.currentExercise || !derived.currentExercise.name?.trim()) {
        return (
            <>
                <EmptyState
                    oledMode={!!workoutSettings.oledMode}
                    onAddExercise={() => dispatch({ type: 'OPEN_SELECTOR' })}
                    onCancel={() => {
                        setFinishIntent('cancel');
                        setShowFinishConfirm(true);
                    }}
                />

                {state.showExerciseSelector && (
                    <ExerciseSelector
                        onSelect={ex => dispatch({ type: 'ADD_EXERCISE', payload: ex })}
                        onClose={() => dispatch({ type: 'CLOSE_SELECTOR' })}
                        onCreateNew={() => dispatch({ type: 'OPEN_QUICK_FORM' })}
                        goal={workoutSettings.defaultWorkoutGoal}
                    />
                )}

                {state.showQuickForm && (
                    <QuickExerciseForm
                        onAdd={ex => dispatch({ type: 'ADD_EXERCISE', payload: ex })}
                        onClose={() => dispatch({ type: 'CLOSE_QUICK_FORM' })}
                    />
                )}
            </>
        );
    }

    // Main workout UI
    return (
        <div
            className="fixed inset-0 text-[var(--cosmos-text-primary)] font-sans overflow-y-auto overscroll-contain z-[9999] flex flex-col transition-colors duration-500"
            style={{ background: bgPrimary }}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')]" />

            {/* Progress Bar */}
            <ProgressBar progress={derived.progressPercent} />

            {/* Confetti */}
            {state.showConfetti && <ParticleExplosion />}

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col px-4 py-4 sm:px-6 sm:py-6 max-w-[600px] mx-auto w-full">
                {/* Header */}
                <WorkoutHeader
                    startTimestamp={state.startTimestamp}
                    totalPausedTime={state.totalPausedTime}
                    isPaused={state.isPaused}
                    currentExerciseName={derived.currentExercise.name}
                    onFinish={handleFinishRequest}
                    onOpenSettings={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: true })}
                    onOpenTutorial={() => dispatch({ type: 'SHOW_TUTORIAL', payload: derived.currentExercise?.name || '' })}
                    onOpenAICoach={() => dispatch({ type: 'OPEN_AI_COACH' })}
                />

                {/* Exercise Display */}
                <ExerciseDisplay
                    exercise={derived.currentExercise}
                    displaySetIndex={derived.activeSetIndex}
                    currentSet={derived.currentSet}
                    prInfo={prInfo}
                    onUpdateSet={handleUpdateSet}
                    onCompleteSet={handleCompleteSet}
                    onOpenNumpad={handleOpenNumpad}
                    onRenameExercise={handleRenameExercise}
                    nameSuggestions={nameSuggestions}
                />

                {/* Navigation */}
                <div className="mt-auto w-full flex flex-col gap-3 pt-6 pb-[env(safe-area-inset-bottom,16px)]">
                    <ExerciseNav
                        exercises={state.exercises}
                        currentIndex={state.currentExerciseIndex}
                        onChangeExercise={idx => dispatch({ type: 'CHANGE_EXERCISE', payload: idx })}
                        onOpenDrawer={() => dispatch({ type: 'TOGGLE_DRAWER', payload: true })}
                        onAddExercise={() => dispatch({ type: 'OPEN_SELECTOR' })}
                    />

                    {/* Stats Row */}
                    <div className="flex justify-between items-center text-[11px] text-[var(--cosmos-text-muted)] px-1">
                        <span>
                            {derived.completedSetsCount}/{derived.totalSets} sets completed
                        </span>
                        {derived.totalVolume > 0 && (
                            <span>{derived.totalVolume.toLocaleString()} kg volume</span>
                        )}
                    </div>
                </div>
            </div>

            {/* === OVERLAYS === */}

            {/* Rest Timer */}
            <RestTimerOverlay
                active={state.restTimer.active}
                endTime={state.restTimer.endTime}
                oledMode={workoutSettings.oledMode}
                onSkip={() => dispatch({ type: 'SKIP_REST' })}
                onAddTime={seconds => dispatch({ type: 'ADD_REST_TIME', payload: seconds })}
            />

            {/* Numpad */}
            <NumpadOverlay
                isOpen={state.numpad.isOpen}
                target={state.numpad.target}
                value={state.numpad.value}
                onInput={digit => dispatch({ type: 'NUMPAD_INPUT', payload: digit })}
                onDelete={() => dispatch({ type: 'NUMPAD_DELETE' })}
                onSubmit={() => dispatch({ type: 'NUMPAD_SUBMIT' })}
                onClose={() => dispatch({ type: 'CLOSE_NUMPAD' })}
            />

            {/* Confirm Exit */}
            <ConfirmExitOverlay
                isOpen={showFinishConfirm}
                intent={finishIntent}
                workoutStats={workoutStats}
                onConfirm={handleConfirmFinish}
                onCancel={() => setShowFinishConfirm(false)}
            />

            {/* Settings Overlay */}
            <WorkoutSettingsOverlay
                isOpen={state.showSettings}
                settings={workoutSettings}
                onClose={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: false })}
                onUpdateSetting={(key, value) => dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })}
            />

            {/* Exercise List Drawer */}
            {state.isDrawerOpen && (
                <ExerciseReorder
                    exercises={state.exercises}
                    currentIndex={state.currentExerciseIndex}
                    onReorder={(newOrder) => dispatch({ type: 'REORDER_EXERCISES', payload: newOrder })}
                    onSelectExercise={(idx) => {
                        dispatch({ type: 'CHANGE_EXERCISE', payload: idx });
                        dispatch({ type: 'TOGGLE_DRAWER', payload: false });
                    }}
                    onDeleteExercise={(idx) => dispatch({ type: 'REMOVE_EXERCISE', payload: idx })}
                    onClose={() => dispatch({ type: 'TOGGLE_DRAWER', payload: false })}
                />
            )}
            {/* Exercise Selector */}
            {state.showExerciseSelector && (
                <ExerciseSelector
                    onSelect={ex => dispatch({ type: 'ADD_EXERCISE', payload: ex })}
                    onClose={() => dispatch({ type: 'CLOSE_SELECTOR' })}
                    onCreateNew={() => dispatch({ type: 'OPEN_QUICK_FORM' })}
                    goal={workoutSettings.defaultWorkoutGoal}
                />
            )}

            {/* Quick Exercise Form */}
            {state.showQuickForm && (
                <QuickExerciseForm
                    onAdd={ex => dispatch({ type: 'ADD_EXERCISE', payload: ex })}
                    onClose={() => dispatch({ type: 'CLOSE_QUICK_FORM' })}
                />
            )}

            {/* Goal Selector */}
            {state.showGoalSelector && (
                <WorkoutGoalSelector
                    onSelect={(goal: WorkoutGoal) => handleGoalSelect(goal)}
                    onClose={() => dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'goal', isOpen: false } })}
                />
            )}

            {/* Warmup Flow */}
            {state.showWarmup && (
                <WarmupCooldownFlow
                    type="warmup"
                    onComplete={() => {
                        dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: false } });
                        // After warmup, open exercise selector if no exercises
                        if (state.exercises.length === 0) {
                            setTimeout(() => dispatch({ type: 'OPEN_SELECTOR' }), 300);
                        }
                    }}
                    onSkip={() => {
                        dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: false } });
                        // After skip, open exercise selector if no exercises
                        if (state.exercises.length === 0) {
                            setTimeout(() => dispatch({ type: 'OPEN_SELECTOR' }), 300);
                        }
                    }}
                />
            )}

            {/* Cooldown Flow */}
            {state.showCooldown && (
                <WarmupCooldownFlow
                    type="cooldown"
                    onComplete={() => {
                        dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'cooldown', isOpen: false } });
                        // After cooldown, show finish confirm
                        setFinishIntent('finish');
                        setShowFinishConfirm(true);
                    }}
                    onSkip={() => {
                        dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'cooldown', isOpen: false } });
                        // After skip, show finish confirm
                        setFinishIntent('finish');
                        setShowFinishConfirm(true);
                    }}
                />
            )}

            {/* Tutorial */}
            {state.showTutorial && state.tutorialExercise && (
                <ExerciseTutorial
                    exerciseName={state.tutorialExercise}
                    onClose={() => dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'tutorial', isOpen: false } })}
                />
            )}

            {/* AI Coach */}
            {state.showAICoach && derived.currentExercise && (
                <AICoach
                    currentExercise={derived.currentExercise}
                    onClose={() => dispatch({ type: 'CLOSE_AI_COACH' })}
                />
            )}

            {/* PR Celebration */}
            {state.showPRCelebration && (
                <PRCelebration
                    isVisible={!!state.showPRCelebration}
                    pr={state.showPRCelebration}
                    onDismiss={() => dispatch({ type: 'HIDE_PR_CELEBRATION' })}
                />
            )}

            {/* Water Reminder Toast */}
            <WaterReminderToast
                isVisible={showWaterReminder}
                onDismiss={() => setShowWaterReminder(false)}
            />
        </div>
    );
};

// ============================================================
// MAIN EXPORT
// ============================================================

/**
 * ActiveWorkout - Main workout component
 * Uses the new modular architecture with:
 * - WorkoutProvider for state management
 * - Isolated timer rendering (no parent re-renders)
 * - onPointerDown for instant button response
 * - Split overlays for better performance
 */
const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ item, onUpdate, onExit }) => {
    return (
        <WorkoutProvider item={item} onUpdate={onUpdate as (id: string, updates: Record<string, unknown>) => void} onExit={onExit}>
            <WorkoutContent item={item} onUpdate={onUpdate} onExit={onExit} />
        </WorkoutProvider>
    );
};

export default ActiveWorkout;
