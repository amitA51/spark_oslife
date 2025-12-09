// Workout Module - Main exports
// This is the new modular architecture

// Main Component
export { default as ActiveWorkout } from './ActiveWorkoutNew';

// Core
export * from './core';

// Hooks (exclude duplicates from core)
export { useWorkoutTimer, useRestTimer, formatTime } from './hooks/useWorkoutTimer';
export { usePreviousData } from './hooks/usePreviousData';
export { usePersonalRecords } from './hooks/usePersonalRecords';

// Components
export * from './components';

// Overlays
export * from './overlays';

// Types (from main types.ts)
export type {
    Exercise,
    WorkoutSet,
    WorkoutSession,
    WorkoutGoal,
    WorkoutTemplate,
    PersonalExercise,
    AppSettings
} from '../../types';

// Legacy exports (for backwards compatibility during migration)
export { default as WorkoutSummary } from './WorkoutSummary';
export { default as PRCelebration } from './PRCelebration';
export { default as ExerciseSelector } from './ExerciseSelector';
export { default as WarmupCooldownFlow } from './WarmupCooldownFlow';
export { default as WorkoutGoalSelector } from './WorkoutGoalSelector';
export { default as ExerciseTutorial } from './ExerciseTutorial';
export { default as AICoach } from './AICoach';
export { default as QuickExerciseForm } from './QuickExerciseForm';
export { default as WorkoutHistoryScreen } from './WorkoutHistoryScreen';

// History Hook
export { useWorkoutHistory } from './hooks/useWorkoutHistory';
export type { WorkoutHistoryStats, UseWorkoutHistoryResult } from './hooks/useWorkoutHistory';
