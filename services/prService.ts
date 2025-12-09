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

// Rep-range specific PRs (3RM, 5RM, 10RM)
export interface RepRangePR {
  exerciseName: string;
  repRange: 3 | 5 | 10;
  weight: number;
  reps: number;
  date: string;
  estimatedMax: number; // Calculated from this rep range
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
 * Calculate rep-range specific PRs (3RM, 5RM, 10RM)
 */
export const calculateRepRangePRs = (
  sessions: WorkoutSession[]
): Map<string, RepRangePR[]> => {
  const repRanges: (3 | 5 | 10)[] = [3, 5, 10];
  const prMap = new Map<string, RepRangePR[]>();

  sessions.forEach(session => {
    session.exercises?.forEach(exercise => {
      exercise.sets?.forEach(set => {
        if (!set.completedAt || !set.weight || !set.reps) return;

        const exerciseName = exercise.name;
        if (!prMap.has(exerciseName)) {
          prMap.set(exerciseName, []);
        }

        const prs = prMap.get(exerciseName)!;

        // Check each rep range
        repRanges.forEach(targetReps => {
          // Only count if reps are >= target (e.g., 5+ reps for 5RM)
          if (set.reps >= targetReps) {
            const existingPR = prs.find(p => p.repRange === targetReps);
            const estimatedMax = calculate1RM(set.weight, set.reps);

            if (!existingPR || set.weight > existingPR.weight) {
              // Remove old PR for this range
              const filtered = prs.filter(p => p.repRange !== targetReps);
              filtered.push({
                exerciseName,
                repRange: targetReps,
                weight: set.weight,
                reps: set.reps,
                date: set.completedAt!,
                estimatedMax,
              });
              prMap.set(exerciseName, filtered);
            }
          }
        });
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

/**
 * Export workout history as CSV string
 */
export const exportWorkoutHistoryCSV = (sessions: WorkoutSession[]): string => {
  const rows: string[] = [];
  rows.push('Date,Exercise,Set,Weight (kg),Reps,Volume,1RM Estimate');

  sessions.forEach(session => {
    const date = session.startTime ? new Date(session.startTime).toLocaleDateString('he-IL') : '';

    session.exercises?.forEach(exercise => {
      exercise.sets?.forEach((set, setIndex) => {
        if (set.completedAt && set.weight && set.reps) {
          const volume = set.weight * set.reps;
          const oneRM = calculate1RM(set.weight, set.reps);
          rows.push(`${date},${exercise.name},${setIndex + 1},${set.weight},${set.reps},${volume},${oneRM}`);
        }
      });
    });
  });

  return rows.join('\n');
};

/**
 * Export workout history as JSON string
 */
export const exportWorkoutHistoryJSON = (sessions: WorkoutSession[]): string => {
  const exportData = sessions.map(session => ({
    date: session.startTime,
    duration: session.endTime && session.startTime
      ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
      : null,
    exercises: session.exercises?.map(ex => ({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets?.filter(s => s.completedAt).map(s => ({
        weight: s.weight,
        reps: s.reps,
        volume: (s.weight || 0) * (s.reps || 0),
        oneRM: calculate1RM(s.weight || 0, s.reps || 0),
      })),
    })),
  }));

  return JSON.stringify(exportData, null, 2);
};
