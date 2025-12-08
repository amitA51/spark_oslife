import { WorkoutSession, WorkoutSet } from '../types';

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  maxWeightReps: number; // Reps at max weight
  oneRepMax: number; // Calculated 1RM
  volumePR: number; // Best single set volume (weight × reps)
  date: string;
  setData: WorkoutSet;
}

export interface ExercisePRHistory {
  exerciseName: string;
  records: PersonalRecord[];
}

/**
 * Calculate 1RM using Epley formula: weight × (1 + reps/30)
 */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

/**
 * Extract all PRs from workout history
 */
export const calculatePRsFromHistory = (
  sessions: WorkoutSession[]
): Map<string, PersonalRecord> => {
  const prMap = new Map<string, PersonalRecord>();

  sessions.forEach(session => {
    session.exercises?.forEach(exercise => {
      exercise.sets?.forEach(set => {
        if (!set.completedAt || !set.weight || !set.reps) return;

        const exerciseName = exercise.name;
        const currentPR = prMap.get(exerciseName);

        const oneRepMax = calculate1RM(set.weight, set.reps);
        const volume = set.weight * set.reps;

        // Check if this is a new PR
        const isNewPR =
          !currentPR ||
          set.weight > currentPR.maxWeight ||
          (set.weight === currentPR.maxWeight && set.reps > currentPR.maxWeightReps) ||
          oneRepMax > currentPR.oneRepMax;

        if (isNewPR) {
          prMap.set(exerciseName, {
            exerciseName,
            maxWeight: set.weight,
            maxReps: set.reps,
            maxWeightReps: set.reps,
            oneRepMax,
            volumePR: volume,
            date: set.completedAt,
            setData: set,
          });
        }
      });
    });
  });

  return prMap;
};

/**
 * Check if a set is a new PR compared to existing PR
 */
export const isNewPR = (set: WorkoutSet, currentPR: PersonalRecord | undefined): boolean => {
  if (!set.weight || !set.reps || !set.completedAt) return false;
  if (!currentPR) return true;

  const newOneRM = calculate1RM(set.weight, set.reps);

  return (
    set.weight > currentPR.maxWeight ||
    (set.weight === currentPR.maxWeight && set.reps > currentPR.maxWeightReps) ||
    newOneRM > currentPR.oneRepMax
  );
};

/**
 * Get PR display text for UI
 */
export const getPRDisplayText = (pr: PersonalRecord | undefined): string => {
  if (!pr) return 'No PR yet';
  return `${pr.maxWeight}kg × ${pr.maxWeightReps} (1RM: ~${pr.oneRepMax}kg)`;
};

/**
 * Get all exercise names from history
 */
export const getExerciseNames = (sessions: WorkoutSession[]): string[] => {
  const names = new Set<string>();
  sessions.forEach(session => {
    session.exercises?.forEach(ex => names.add(ex.name));
  });
  return Array.from(names).sort();
};
