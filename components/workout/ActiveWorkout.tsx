import React, { useState, useCallback } from 'react';
import { PersonalItem, WorkoutSession, WorkoutGoal, PersonalExercise } from '../../types';
import { DumbbellIcon, CheckCircleIcon, CloseIcon, AddIcon } from '../icons';
// import './ActiveWorkout.css'; // Removed in favor of Tailwind
import ExerciseSelector from './ExerciseSelector';
import QuickExerciseForm from './QuickExerciseForm';
import ExerciseLibraryTab from './ExerciseLibraryTab';
import PRHistoryTab from './PRHistoryTab';
import AnalyticsDashboard from './AnalyticsDashboard';
import WorkoutGoalSelector from './WorkoutGoalSelector';
import WarmupCooldownFlow from './WarmupCooldownFlow';
import WaterReminderToast from './WaterReminderToast';
import ExerciseTutorial from './ExerciseTutorial';
import PRCelebration from './PRCelebration';
import WorkoutSummary from './WorkoutSummary';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveWorkout } from './useActiveWorkout';
import {
  createWorkoutTemplate,
  getWorkoutSessions,
  getPersonalExercises,
} from '../../services/dataService';
import { getExerciseNames } from '../../services/prService';
import WorkoutHeader from './WorkoutHeader';
import CurrentExercise from './CurrentExercise';
import ExerciseList from './ExerciseList';

// --- Sub-Components ---

const ParticleExplosion = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            scale: Math.random() * 2,
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: ['#6366f1', '#06b6d4', '#a855f7', '#10b981'][Math.floor(Math.random() * 4)],
          }}
        />
      ))}
    </div>
  );
};

// --- Main Component ---

interface ActiveWorkoutProps {
  item: PersonalItem;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onExit: () => void;
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ item, onUpdate, onExit }) => {
  const { state, dispatch, formatTime, finishWorkout, getPRForExercise, workoutStats } =
    useActiveWorkout(item, onUpdate, onExit);

  // Always go through a defensive alias for workout settings to survive malformed/legacy state
  const workoutSettings = state.appSettings?.workoutSettings || {};

  // OLED Mode: Pure black (#000) for OLED screens to save battery
  const bgPrimary = workoutSettings.oledMode ? '#000000' : 'var(--cosmos-bg-primary)';



  // Defensive normalization: filter out exercises without valid names
  // This ensures invalid/empty exercises from legacy state are ignored
  const exercises = Array.isArray(state?.exercises)
    ? state.exercises.filter(ex => ex.name && ex.name.trim())
    : [];
  const [showSummary, setShowSummary] = useState(false);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
  const [settingsTab, setSettingsTab] = useState<'general' | 'library' | 'prs' | 'analytics'>(
    'general'
  );
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [personalExerciseLibrary, setPersonalExerciseLibrary] = useState<PersonalExercise[]>([]);
  const [finishIntent, setFinishIntent] = useState<'normal' | 'cancel'>('normal');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // --- Flow Logic ---

  // Load exercise name suggestions from history & personal library (for premium inline renaming)
  React.useEffect(() => {
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

  // Auto-open exercise selector when starting a completely new workout (no exercises yet)
  React.useEffect(() => {
    if (
      exercises.length === 0 &&
      !state.showExerciseSelector &&
      !state.showQuickForm &&
      !state.showGoalSelector &&
      !state.showWarmup &&
      !state.showCooldown
    ) {
      dispatch({ type: 'OPEN_SELECTOR' });
    }
  }, [
    exercises.length,
    state.showExerciseSelector,
    state.showQuickForm,
    state.showGoalSelector,
    state.showWarmup,
    state.showCooldown,
    dispatch,
  ]);

  // Initial Check: Goal -> Warmup (pro-friendly: only prompt if no default goal set)
  React.useEffect(() => {
    // Only show the goal selector automatically if the user hasn't set a default goal yet
    if (
      state.workoutTimer < 2 &&
      !state.showGoalSelector &&
      !state.showWarmup &&
      !workoutSettings.defaultWorkoutGoal
    ) {
      dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'goal', isOpen: true } });
    }
    // We intentionally keep this effect running only on mount to avoid re-opening mid-workout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoalSelect = (goal: WorkoutGoal) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultWorkoutGoal: goal } });
    dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'goal', isOpen: false } });

    // Next: Warmup (respect both enableWarmup flag and warmupPreference when possible)
    const warmupSettings = workoutSettings;
    const warmupPreference = warmupSettings?.warmupPreference || 'ask';
    const warmupEnabled = warmupSettings?.enableWarmup !== false && warmupPreference !== 'never';

    if (warmupEnabled) {
      setTimeout(
        () => dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: true } }),
        300
      );
    }
  };

  const handleFinishRequest = async () => {
    const cdSettings = workoutSettings;
    const cooldownPreference = cdSettings?.cooldownPreference || 'ask';
    const cooldownEnabled = cdSettings?.enableCooldown && cooldownPreference !== 'never';

    if (cooldownEnabled) {
      dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'cooldown', isOpen: true } });
    } else {
      const session = await finishWorkout();
      if (session) {
        setCompletedSession(session);
        setShowSummary(true);
      }
    }
  };

  const handleSaveAsTemplate = () => {
    if (!completedSession) return;

    const defaultName = item.title || 'My Workout';
    setTemplateName(defaultName);
    setTemplateError(null);
    setShowTemplateModal(true);
  };

  const handleConfirmSaveTemplate = async () => {
    if (!completedSession) return;

    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setTemplateError('נא להכניס שם לתבנית');
      return;
    }

    try {
      setIsSavingTemplate(true);
      await createWorkoutTemplate({
        name: trimmedName,
        // Use the completed session data to build a proper WorkoutTemplate
        exercises: completedSession.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          targetRestTime: ex.targetRestTime,
          tempo: ex.tempo,
          notes: ex.notes,
          tutorialText: ex.tutorialText,
          sets: ex.sets.map(set => ({
            reps: set.reps,
            weight: set.weight,
          })),
        })),
        muscleGroups: Array.from(
          new Set(
            completedSession.exercises
              .map(ex => ex.muscleGroup)
              .filter((g): g is string => Boolean(g))
          )
        ),
        isBuiltin: false,
      });
      setIsSavingTemplate(false);
      setShowTemplateModal(false);
      setTemplateError(null);
    } catch (error) {
      console.error('Failed to save template', error);
      setIsSavingTemplate(false);
      setTemplateError('שגיאה בשמירת התבנית, נסה שוב');
    }
  };

  const currentExercise =
    typeof state.currentExerciseIndex === 'number' &&
      state.currentExerciseIndex >= 0 &&
      state.currentExerciseIndex < exercises.length
      ? exercises[state.currentExerciseIndex]
      : undefined;

  const activeSetIndex = currentExercise?.sets?.findIndex(s => !s.completedAt) ?? -1;
  const displaySetIndex =
    activeSetIndex === -1 ? currentExercise?.sets?.length || 0 : activeSetIndex;
  const currentSet = currentExercise?.sets?.[displaySetIndex] || { reps: 0, weight: 0 };

  // Calculate Progress (centralized in useActiveWorkout)
  const progress = workoutStats.progressPercent;

  // --- useCallback Handlers (CRITICAL for React.memo) ---

  const handleUpdateSet = useCallback(
    (field: 'weight' | 'reps', value: number) => {
      dispatch({ type: 'UPDATE_SET', payload: { field, value } });
    },
    [dispatch]
  );

  const handleCompleteSet = useCallback(() => {
    dispatch({ type: 'COMPLETE_SET' });
  }, [dispatch]);

  const handleOpenNumpad = useCallback(
    (target: 'weight' | 'reps') => {
      dispatch({ type: 'OPEN_NUMPAD', payload: target });
    },
    [dispatch]
  );

  const handleChangeExercise = useCallback(
    (index: number) => {
      dispatch({ type: 'CHANGE_EXERCISE', payload: index });
    },
    [dispatch]
  );

  const handleOpenDrawer = useCallback(() => {
    dispatch({ type: 'TOGGLE_DRAWER', payload: true });
  }, [dispatch]);

  const handleRenameExercise = useCallback(
    (name: string) => {
      const index = state.currentExerciseIndex;
      dispatch({ type: 'RENAME_EXERCISE', payload: { index, name } });

      // If this name matches a personal exercise in the user's library,
      // also apply its metadata (muscle group, tempo, default rest, tutorial) to the current exercise.
      const matchingTemplate = personalExerciseLibrary.find(pe => pe.name === name);
      if (matchingTemplate) {
        dispatch({
          type: 'UPDATE_EXERCISE_META',
          payload: {
            index,
            muscleGroup: matchingTemplate.muscleGroup,
            tempo: matchingTemplate.tempo,
            targetRestTime: matchingTemplate.defaultRestTime,
            tutorialText: matchingTemplate.tutorialText,
          },
        });
      }
    },
    [dispatch, state.currentExerciseIndex, personalExerciseLibrary]
  );

  const handleOpenSettings = useCallback(() => {
    dispatch({ type: 'TOGGLE_SETTINGS', payload: true });
  }, [dispatch]);

  const handleOpenTutorial = useCallback(() => {
    if (currentExercise) {
      dispatch({ type: 'SHOW_TUTORIAL', payload: currentExercise.name });
    }
  }, [dispatch, currentExercise?.name]);

  // PR Info
  const prInfo = React.useMemo(() => {
    if (!currentExercise) return '';
    const pr = getPRForExercise(currentExercise.name);
    if (!pr) return 'NO PR YET — MAKE HISTORY!';
    return `PR: ${pr.maxWeight}kg × ${pr.maxWeightReps} • 1RM: ~${pr.oneRepMax}kg`;
  }, [currentExercise?.name, getPRForExercise]);

  // --- Renderers ---

  if (!currentExercise) {
    return (
      <div className="fixed inset-0 text-[var(--cosmos-text-primary)] font-sans overflow-y-auto overscroll-contain z-[9999] flex flex-col items-center justify-center p-6 text-center transition-colors duration-500" style={{ background: bgPrimary }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]" />
        <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-15 pointer-events-none z-0 animate-[cosmos-breathe_20s_ease-in-out_infinite_alternate] bg-[radial-gradient(circle_at_50%_50%,var(--cosmos-accent-primary)_0%,transparent_50%),radial-gradient(circle_at_10%_20%,var(--cosmos-accent-secondary)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,var(--cosmos-accent-cyan)_0%,transparent_40%)]" />

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
            onClick={() => dispatch({ type: 'OPEN_SELECTOR' })}
            className="w-full h-14 min-h-[56px] rounded-2xl bg-[var(--cosmos-accent-primary)] text-white font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all active:scale-95 mb-4 flex items-center justify-center gap-2"
            animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 35px rgba(99,102,241,0.6)', '0 0 20px rgba(99,102,241,0.4)'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <span className="text-xl">+</span> בחר תרגיל
          </motion.button>
          <button
            onClick={() => {
              setFinishIntent('cancel');
              setShowFinishConfirm(true);
            }}
            className="text-sm text-[var(--cosmos-text-muted)] hover:text-white transition-colors min-h-[44px] px-4"
          >
            ביטול
          </button>
        </motion.div>

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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 text-[var(--cosmos-text-primary)] font-sans overflow-y-auto overscroll-contain z-[9999] flex flex-col transition-colors duration-500" style={{ background: bgPrimary }}>
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]" />
      <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-15 pointer-events-none z-0 animate-[cosmos-breathe_20s_ease-in-out_infinite_alternate] bg-[radial-gradient(circle_at_50%_50%,var(--cosmos-accent-primary)_0%,transparent_50%),radial-gradient(circle_at_10%_20%,var(--cosmos-accent-secondary)_0%,transparent_40%),radial-gradient(circle_at_90%_80%,var(--cosmos-accent-cyan)_0%,transparent_40%)]" />

      {/* Progress Bar */}
      <div
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[var(--cosmos-accent-cyan)] to-[var(--cosmos-accent-primary)] shadow-[0_0_10px_var(--cosmos-accent-cyan)] z-[100] transition-all duration-500"
        style={{ width: `${progress}%` }}
      />

      {state.showConfetti && <ParticleExplosion />}

      <div className="relative z-10 flex-1 flex flex-col px-4 py-4 sm:px-6 sm:py-6 max-w-[600px] mx-auto w-full">
        {/* WorkoutHeader Component */}
        <WorkoutHeader
          seconds={state.workoutTimer}
          formatTime={formatTime}
          currentExerciseName={currentExercise.name}
          onFinish={() => {
            setFinishIntent('normal');
            setShowFinishConfirm(true);
          }}
          onOpenSettings={handleOpenSettings}
          onOpenTutorial={handleOpenTutorial}
        />

        {/* CurrentExercise Component */}
        <CurrentExercise
          exercise={currentExercise}
          displaySetIndex={displaySetIndex}
          currentSet={currentSet}
          previousData={state.previousExerciseData}
          prInfo={prInfo}
          onUpdateSet={handleUpdateSet}
          onCompleteSet={handleCompleteSet}
          onOpenNumpad={handleOpenNumpad}
          onRenameExercise={handleRenameExercise}
          nameSuggestions={nameSuggestions}
        />

        {/* ExerciseList Component */}
        <div className="mt-auto w-full flex flex-col gap-3 sm:gap-4 pt-6 sm:pt-8 pb-[env(safe-area-inset-bottom,16px)]">
          <ExerciseList
            exercises={state.exercises}
            currentIndex={state.currentExerciseIndex}
            onChangeExercise={handleChangeExercise}
            onOpenDrawer={handleOpenDrawer}
            onAddExercise={() => dispatch({ type: 'OPEN_SELECTOR' })}
          />

          <div className="flex justify-between items-center text-[11px] text-[var(--cosmos-text-muted)] px-1">
            <span>
              {workoutStats.completedSets}/{workoutStats.totalSets} sets completed
            </span>
            {workoutStats.totalVolume > 0 && (
              <span>{workoutStats.totalVolume.toLocaleString()} kg volume</span>
            )}
          </div>
        </div>
      </div>

      {/* --- Overlays --- */}

      {/* Rest Timer */}
      <AnimatePresence>
        {!!state.restTimer?.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-[20px] z-[10000] flex items-center justify-center"
            style={{ background: workoutSettings.oledMode ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,0.95)' }}
          >
            <div className="flex flex-col items-center">
              <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full border-4 border-[var(--cosmos-accent-primary)] opacity-30"
                />
                <span className="text-8xl font-extrabold tabular-nums text-[var(--cosmos-text-primary)] drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                  {formatTime(state.restTimer?.timeLeft ?? 0)}
                </span>
              </div>
              <div className="text-[var(--cosmos-accent-primary)] tracking-[0.2em] font-bold text-sm mt-4 mb-8">
                RESTING
              </div>

              <button
                onClick={() => dispatch({ type: 'SKIP_REST' })}
                className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold tracking-wider"
              >
                SKIP
              </button>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => dispatch({ type: 'ADD_REST_TIME', payload: -10 })}
                  className="w-10 h-10 rounded-xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-primary)] flex items-center justify-center transition-all hover:bg-[var(--cosmos-glass-highlight)] active:scale-90"
                >
                  -10
                </button>
                <button
                  onClick={() => dispatch({ type: 'ADD_REST_TIME', payload: 30 })}
                  className="w-10 h-10 rounded-xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-primary)] flex items-center justify-center transition-all hover:bg-[var(--cosmos-glass-highlight)] active:scale-90"
                >
                  +30
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Numpad */}
      <AnimatePresence>
        {state.numpad && state.numpad.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-[20px] z-[10000] flex items-end"
            onClick={() => dispatch({ type: 'CLOSE_NUMPAD' })}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-[var(--cosmos-bg-primary)] border-t border-[var(--cosmos-glass-border)] rounded-t-[32px] p-8 max-h-[85vh] overflow-y-auto shadow-[0_-10px_50px_rgba(0,0,0,0.6)] text-[var(--cosmos-text-primary)] pb-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-sm text-[var(--cosmos-text-muted)] uppercase tracking-widest mb-2">
                  {state.numpad.target}
                </div>
                <div className="text-5xl font-bold text-[var(--cosmos-accent-cyan)]">
                  {state.numpad.value || '0'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {(state.numpad.target === 'weight'
                  ? [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0]
                  : [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
                ).map(n => (
                  <button
                    key={n}
                    onClick={() => dispatch({ type: 'NUMPAD_INPUT', payload: n.toString() })}
                    className="h-16 rounded-2xl bg-[var(--cosmos-glass-bg)] text-2xl font-medium active:bg-[var(--cosmos-glass-highlight)] transition-colors"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => dispatch({ type: 'NUMPAD_DELETE' })}
                  className="h-16 rounded-2xl bg-[var(--cosmos-glass-bg)] text-[var(--cosmos-accent-danger)] flex items-center justify-center active:bg-[var(--cosmos-glass-highlight)]"
                >
                  ⌫
                </button>
              </div>
              <button
                onClick={() => dispatch({ type: 'NUMPAD_SUBMIT' })}
                className="w-full max-w-xs h-14 rounded-2xl bg-[var(--cosmos-accent-primary)] text-white font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:brightness-110 transition-all active:scale-95 mt-6 mx-auto block"
              >
                CONFIRM
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {state.showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-[20px] z-[10000] flex items-end"
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: false })}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-[var(--cosmos-bg-primary)] border-t border-[var(--cosmos-glass-border)] rounded-t-[32px] p-8 max-h-[85vh] overflow-y-auto shadow-[0_-10px_50px_rgba(0,0,0,0.6)] text-[var(--cosmos-text-primary)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-[var(--cosmos-glass-border)] rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Settings</h3>
                <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', payload: false })}>
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-6 mb-6 border-b border-[var(--cosmos-glass-border)]">
                <button
                  onClick={() => setSettingsTab('general')}
                  className={`pb-3 px-1 text-sm font-bold tracking-wider transition-colors relative ${settingsTab === 'general' ? 'text-white' : 'text-[var(--cosmos-text-muted)] hover:text-white/80'}`}
                >
                  GENERAL
                  {settingsTab === 'general' && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cosmos-accent-primary)]"
                    />
                  )}
                </button>
                <button
                  onClick={() => setSettingsTab('library')}
                  className={`pb-3 px-1 text-sm font-bold tracking-wider transition-colors relative ${settingsTab === 'library' ? 'text-white' : 'text-[var(--cosmos-text-muted)] hover:text-white/80'}`}
                >
                  LIBRARY
                  {settingsTab === 'library' && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cosmos-accent-primary)]"
                    />
                  )}
                </button>
                <button
                  onClick={() => setSettingsTab('prs')}
                  className={`pb-3 px-1 text-sm font-bold tracking-wider transition-colors relative ${settingsTab === 'prs' ? 'text-white' : 'text-[var(--cosmos-text-muted)] hover:text-white/80'}`}
                >
                  RECORDS
                  {settingsTab === 'prs' && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cosmos-accent-primary)]"
                    />
                  )}
                </button>
                <button
                  onClick={() => setSettingsTab('analytics')}
                  className={`pb-3 px-1 text-sm font-bold tracking-wider transition-colors relative ${settingsTab === 'analytics' ? 'text-white' : 'text-[var(--cosmos-text-muted)] hover:text-white/80'}`}
                >
                  ANALYTICS
                  {settingsTab === 'analytics' && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cosmos-accent-primary)]"
                    />
                  )}
                </button>
              </div>

              {settingsTab === 'general' ? (
                <div className="space-y-6">
                  {/* Workout goal & flow */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[var(--cosmos-accent-primary)] uppercase tracking-wider">
                      Workout Goal
                    </h4>
                    <p className="text-xs text-[var(--cosmos-text-muted)]">
                      מגדיר את סוג האימון ברירת המחדל ומסדר את תפריט התרגילים כך שהתרגילים
                      הרלוונטיים יופיעו למעלה.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'strength', label: 'Strength' },
                        { id: 'hypertrophy', label: 'Hypertrophy' },
                        { id: 'endurance', label: 'Endurance' },
                        { id: 'flexibility', label: 'Mobility' },
                        { id: 'general', label: 'General' },
                      ].map(goalOption => {
                        const selected =
                          (workoutSettings.defaultWorkoutGoal || 'general') === goalOption.id;
                        return (
                          <button
                            key={goalOption.id}
                            type="button"
                            onClick={() =>
                              dispatch({
                                type: 'UPDATE_SETTINGS',
                                payload: { defaultWorkoutGoal: goalOption.id as any },
                              })
                            }
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold tracking-[0.14em] uppercase transition-all text-center ${selected
                              ? 'bg-[var(--cosmos-accent-primary)] text-black border-transparent shadow-[0_0_18px_rgba(129,140,248,0.6)]'
                              : 'bg-[var(--cosmos-card-bg)] border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-accent-primary)]/60 hover:text-white'
                              }`}
                          >
                            {goalOption.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[var(--cosmos-accent-primary)] uppercase tracking-wider">
                      Preferences
                    </h4>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span>Haptic Feedback</span>
                        <span className="text-[11px] text-[var(--cosmos-text-muted)]">
                          רטט קצר בסיום סט או במעבר מנוחה.
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_SETTINGS',
                            payload: { hapticsEnabled: !workoutSettings.hapticsEnabled },
                          })
                        }
                        className={`w-12 h-7 rounded-full transition-colors ${workoutSettings.hapticsEnabled ? 'bg-[var(--cosmos-accent-success)]' : 'bg-white/10'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${workoutSettings.hapticsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span>Keep Screen Awake</span>
                        <span className="text-[11px] text-[var(--cosmos-text-muted)]">
                          מונע נעילת מסך בזמן האימון (שימושי בחדר כושר).
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_SETTINGS',
                            payload: { keepAwake: !workoutSettings.keepAwake },
                          })
                        }
                        className={`w-12 h-7 rounded-full transition-colors ${workoutSettings.keepAwake ? 'bg-[var(--cosmos-accent-success)]' : 'bg-white/10'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${workoutSettings.keepAwake ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[var(--cosmos-glass-border)]">
                    <h4 className="text-sm font-bold text-[var(--cosmos-accent-primary)] uppercase tracking-wider">
                      Visual Theme
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'deepCosmos', label: 'Deep Cosmos' },
                        { id: 'fireEnergy', label: 'Fire Energy' },
                        { id: 'natureFocus', label: 'Nature Focus' },
                        { id: 'pureLight', label: 'Pure Light' },
                      ].map(theme => (
                        <button
                          key={theme.id}
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_SETTINGS',
                              payload: { selectedTheme: theme.id as any },
                            })
                          }
                          className={`py-3 rounded-lg border text-sm font-medium capitalize transition-all ${workoutSettings.selectedTheme === theme.id ? 'bg-[var(--cosmos-accent-primary)] border-transparent text-white shadow-lg scale-105' : 'border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-muted)] hover:bg-white/5'}`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[var(--cosmos-glass-border)]">
                    <h4 className="text-sm font-bold text-[var(--cosmos-accent-primary)] uppercase tracking-wider">
                      Timers
                    </h4>
                    <div>
                      <label className="block text-sm text-[var(--cosmos-text-muted)] mb-2">
                        Default Rest Time (seconds)
                      </label>
                      <div className="flex gap-2">
                        {[30, 60, 90, 120].map(t => (
                          <button
                            key={t}
                            onClick={() =>
                              dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultRestTime: t } })
                            }
                            className={`flex-1 py-2 rounded-lg border ${workoutSettings.defaultRestTime === t ? 'bg-[var(--cosmos-accent-primary)] border-transparent text-white' : 'border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-muted)]'}`}
                          >
                            {t}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Warmup / Cooldown flow preferences for advanced users */}
                  <div className="space-y-4 pt-4 border-t border-[var(--cosmos-glass-border)]">
                    <h4 className="text-sm font-bold text-[var(--cosmos-accent-primary)] uppercase tracking-wider">
                      Warmup &amp; Cooldown Flow
                    </h4>
                    <p className="text-xs text-[var(--cosmos-text-muted)]">
                      Fine-tune how often the app suggests guided warmup and cooldown blocks during
                      your session.
                    </p>

                    {/* Warmup preference */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Warmup</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--cosmos-text-muted)]">
                          FLOW
                        </span>
                      </div>
                      <div className="inline-flex bg-white/5 rounded-full p-0.5 text-[10px] w-full max-w-xs">
                        {[
                          { value: 'always', label: 'ALWAYS' },
                          { value: 'ask', label: 'ASK' },
                          { value: 'never', label: 'NEVER' },
                        ].map(option => {
                          const selected =
                            (workoutSettings.warmupPreference || 'ask') === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: 'UPDATE_SETTINGS',
                                  payload: { warmupPreference: option.value as any },
                                })
                              }
                              className={`flex-1 px-2.5 py-1.5 rounded-full font-semibold tracking-wide transition-colors ${selected ? 'bg-[var(--cosmos-accent-primary)] text-black shadow-[0_0_18px_rgba(129,140,248,0.6)]' : 'text-[var(--cosmos-text-muted)] hover:text-white'}`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cooldown preference */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cooldown</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--cosmos-text-muted)]">
                          FLOW
                        </span>
                      </div>
                      <div className="inline-flex bg-white/5 rounded-full p-0.5 text-[10px] w-full max-w-xs">
                        {[
                          { value: 'always', label: 'ALWAYS' },
                          { value: 'ask', label: 'ASK' },
                          { value: 'never', label: 'NEVER' },
                        ].map(option => {
                          const selected =
                            (workoutSettings.cooldownPreference || 'ask') === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: 'UPDATE_SETTINGS',
                                  payload: { cooldownPreference: option.value as any },
                                })
                              }
                              className={`flex-1 px-2.5 py-1.5 rounded-full font-semibold tracking-wide transition-colors ${selected ? 'bg-[var(--cosmos-accent-secondary)] text-black shadow-[0_0_18px_rgba(236,72,153,0.6)]' : 'text-[var(--cosmos-text-muted)] hover:text-white'}`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[var(--cosmos-glass-border)]">
                    <h4 className="text-sm font-bold text-[var(--cosmos-accent-primary)] uppercase tracking-wider">
                      Reminders
                    </h4>

                    {/* Daily workout reminder */}
                    <div className="flex justify-between items-center">
                      <span>Daily Workout Reminder</span>
                      <button
                        onClick={() => {
                          if (
                            !workoutSettings.workoutRemindersEnabled &&
                            typeof Notification !== 'undefined' &&
                            'requestPermission' in Notification
                          ) {
                            Notification.requestPermission();
                          }
                          dispatch({
                            type: 'UPDATE_SETTINGS',
                            payload: {
                              workoutRemindersEnabled: !workoutSettings.workoutRemindersEnabled,
                            },
                          });
                        }}
                        className={`w-12 h-7 rounded-full transition-colors ${workoutSettings.workoutRemindersEnabled ? 'bg-[var(--cosmos-accent-success)]' : 'bg-white/10'}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${workoutSettings.workoutRemindersEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {workoutSettings.workoutRemindersEnabled && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--cosmos-text-muted)]">Time</span>
                          <input
                            type="time"
                            value={workoutSettings.workoutReminderTime || '08:00'}
                            onChange={e =>
                              dispatch({
                                type: 'UPDATE_SETTINGS',
                                payload: { workoutReminderTime: e.target.value },
                              })
                            }
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white outline-none focus:border-[var(--cosmos-accent-primary)]"
                          />
                        </div>
                        <div>
                          <span className="text-sm text-[var(--cosmos-text-muted)] block mb-2">
                            Days
                          </span>
                          <div className="flex justify-between">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                              const isSelected = workoutSettings.reminderDays?.includes(i);
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    const currentDays = workoutSettings.reminderDays || [];
                                    const newDays = isSelected
                                      ? currentDays.filter(d => d !== i)
                                      : [...currentDays, i];
                                    dispatch({
                                      type: 'UPDATE_SETTINGS',
                                      payload: { reminderDays: newDays },
                                    });
                                  }}
                                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-[var(--cosmos-accent-primary)] text-white' : 'bg-white/5 text-[var(--cosmos-text-muted)] hover:bg-white/10'}`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hydration reminders during workout */}
                    <div className="mt-6 space-y-3 border-t border-[var(--cosmos-glass-border)] pt-4">
                      <div className="flex justify-between items-center">
                        <span>Hydration during workout</span>
                        <button
                          onClick={() => {
                            dispatch({
                              type: 'UPDATE_SETTINGS',
                              payload: {
                                waterReminderEnabled: !workoutSettings.waterReminderEnabled,
                              },
                            });
                          }}
                          className={`w-12 h-7 rounded-full transition-colors ${workoutSettings.waterReminderEnabled ? 'bg-[var(--cosmos-accent-success)]' : 'bg-white/10'}`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${workoutSettings.waterReminderEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>

                      {workoutSettings.waterReminderEnabled && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <span className="text-sm text-[var(--cosmos-text-muted)] block mb-1">
                            Interval (minutes)
                          </span>
                          <div className="flex gap-2">
                            {[15, 20, 30].map(min => (
                              <button
                                key={min}
                                onClick={() =>
                                  dispatch({
                                    type: 'UPDATE_SETTINGS',
                                    payload: { waterReminderInterval: min },
                                  })
                                }
                                className={`flex-1 py-2 rounded-lg border ${workoutSettings.waterReminderInterval === min ? 'bg-[var(--cosmos-accent-primary)] border-transparent text-white' : 'border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-muted)] hover:bg-white/5'}`}
                              >
                                {min}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : settingsTab === 'library' ? (
                <div className="h-[60vh]">
                  <ExerciseLibraryTab />
                </div>
              ) : settingsTab === 'prs' ? (
                <div className="h-[60vh]">
                  <PRHistoryTab />
                </div>
              ) : (
                <div className="h-[60vh]">
                  <AnalyticsDashboard />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Drawer */}
      <AnimatePresence>
        {state.isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-[20px] z-[10000] flex items-end"
            onClick={() => dispatch({ type: 'TOGGLE_DRAWER', payload: false })}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-[var(--cosmos-bg-primary)] border-t border-[var(--cosmos-glass-border)] rounded-t-[32px] p-8 max-h-[85vh] overflow-y-auto shadow-[0_-10px_50px_rgba(0,0,0,0.6)] text-[var(--cosmos-text-primary)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-[var(--cosmos-glass-border)] rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-6 px-2">Workout Plan</h3>
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      dispatch({ type: 'CHANGE_EXERCISE', payload: i });
                      dispatch({ type: 'TOGGLE_DRAWER', payload: false });
                    }}
                    className={`p-4 rounded-xl flex justify-between items-center cursor-pointer transition-colors ${i === state.currentExerciseIndex ? 'bg-[var(--cosmos-accent-primary)]/10 text-[var(--cosmos-accent-primary)] border border-[var(--cosmos-accent-primary)]/20' : 'hover:bg-[var(--cosmos-glass-bg)] text-[var(--cosmos-text-muted)]'}`}
                  >
                    <span className="font-medium">
                      {i + 1}. {ex.name}
                    </span>
                    <span className="text-xs opacity-60">
                      {(ex.sets || []).filter(s => s.completedAt).length}/{(ex.sets || []).length}{' '}
                      Sets
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  // Close the drawer and open the selector in a single, smooth step
                  dispatch({ type: 'TOGGLE_DRAWER', payload: false });
                  setTimeout(() => dispatch({ type: 'OPEN_SELECTOR' }), 10);
                }}
                className="w-full py-4 mt-6 border border-dashed border-[var(--cosmos-glass-border)] rounded-xl text-[var(--cosmos-text-muted)] hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <AddIcon className="w-5 h-5" /> Add Exercise
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
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

      {/* New Modals */}
      <AnimatePresence>
        {state.showGoalSelector && (
          <WorkoutGoalSelector
            currentGoal={workoutSettings.defaultWorkoutGoal}
            onSelect={handleGoalSelect}
            onClose={() =>
              dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'goal', isOpen: false } })
            }
          />
        )}

        {state.showWarmup && (
          <WarmupCooldownFlow
            type="warmup"
            onComplete={() =>
              dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: false } })
            }
            onSkip={() =>
              dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'warmup', isOpen: false } })
            }
          />
        )}
        {state.showCooldown && (
          <WarmupCooldownFlow
            type="cooldown"
            onComplete={async () => {
              dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'cooldown', isOpen: false } });
              const session = await finishWorkout();
              if (session) {
                setCompletedSession(session);
                setShowSummary(true);
              }
            }}
            onSkip={async () => {
              dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'cooldown', isOpen: false } });
              const session = await finishWorkout();
              if (session) {
                setCompletedSession(session);
                setShowSummary(true);
              }
            }}
          />
        )}
        {state.showTutorial && state.tutorialExercise && (
          <ExerciseTutorial
            exerciseName={state.tutorialExercise}
            customNotes={
              state.exercises.find(ex => ex.name === state.tutorialExercise)?.tutorialText ||
              state.exercises.find(ex => ex.name === state.tutorialExercise)?.notes
            }
            onClose={() =>
              dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'tutorial', isOpen: false } })
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && completedSession && (
          <WorkoutSummary
            session={completedSession}
            onClose={() => {
              setShowSummary(false);
              onExit();
            }}
            onSaveAsTemplate={handleSaveAsTemplate}
          />
        )}
      </AnimatePresence>

      {/* Finish workout confirmation */}
      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-[20px] z-[11000] flex items-center justify-center"
            onClick={() => setShowFinishConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm mx-4 bg-[var(--cosmos-bg-primary)] border border-[var(--cosmos-glass-border)] rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)] text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--cosmos-accent-primary)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-7 h-7 text-[var(--cosmos-accent-primary)]" />
              </div>
              <h2 className="text-xl font-bold mb-2">לסיים את האימון?</h2>
              <p className="text-sm text-[var(--cosmos-text-muted)] mb-6">
                {finishIntent === 'normal'
                  ? 'נשמור את כל התרגילים והסטים שביצעת ונציג לך סיכום מפורט.'
                  : 'נשמור את מצב האימון הנוכחי ונסגור את המסך.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 h-11 rounded-2xl bg-transparent border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-muted)] font-medium hover:text-[var(--cosmos-text-primary)] hover:border-[var(--cosmos-text-primary)] transition-all active:scale-95"
                >
                  ביטול
                </button>
                <button
                  onClick={async () => {
                    if (finishIntent === 'normal') {
                      await handleFinishRequest();
                    } else {
                      const session = await finishWorkout();
                      if (session) {
                        onExit();
                      }
                    }
                    setShowFinishConfirm(false);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-[var(--cosmos-accent-primary)] text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:brightness-110 transition-all active:scale-95"
                >
                  כן, לסיים
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save as template modal */}
      <AnimatePresence>
        {showTemplateModal && completedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-[20px] z-[11000] flex items-center justify-center"
            onClick={() => {
              if (!isSavingTemplate) {
                setShowTemplateModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm mx-4 bg-[var(--cosmos-bg-primary)] border border-[var(--cosmos-glass-border)] rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)] text-center"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">שמירת תבנית אימון</h2>
              <p className="text-sm text-[var(--cosmos-text-muted)] mb-4">
                שמור את האימון שביצעת כתבנית שתוכל לפתוח בלחיצה אחת בפעם הבאה.
              </p>
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-[var(--cosmos-glass-border)] text-sm outline-none focus:border-[var(--cosmos-accent-primary)] mb-2"
                placeholder="שם התבנית"
                autoFocus
              />
              {templateError && (
                <div className="text-xs text-[var(--cosmos-accent-danger)] mb-2">
                  {templateError}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    if (!isSavingTemplate) {
                      setShowTemplateModal(false);
                    }
                  }}
                  className="flex-1 h-11 rounded-2xl bg-transparent border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-muted)] font-medium hover:text-[var(--cosmos-text-primary)] hover:border-[var(--cosmos-text-primary)] transition-all active:scale-95"
                >
                  ביטול
                </button>
                <button
                  onClick={handleConfirmSaveTemplate}
                  disabled={isSavingTemplate}
                  className="flex-1 h-11 rounded-2xl bg-[var(--cosmos-accent-primary)] text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingTemplate ? 'שומר...' : 'שמור תבנית'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WaterReminderToast
        isVisible={state.showWaterReminder}
        onDismiss={() =>
          dispatch({ type: 'SET_MODAL_STATE', payload: { modal: 'water', isOpen: false } })
        }
      />

      {/* PR Celebration */}
      <PRCelebration
        isVisible={!!state.showPRCelebration}
        pr={state.showPRCelebration}
        onDismiss={() => dispatch({ type: 'HIDE_PR_CELEBRATION' })}
      />
    </div>
  );
};

export default ActiveWorkout;
