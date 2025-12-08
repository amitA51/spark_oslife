import { WorkoutSession } from '../types';

export interface VolumeDataPoint {
  date: string;
  totalVolume: number; // sum of (weight × reps) for all exercises
  sessionCount: number;
}

export interface StrengthProgressPoint {
  date: string;
  oneRepMax: number;
  weight: number;
  reps: number;
}

export interface FrequencyData {
  date: string;
  workoutCount: number;
}

/**
 * Calculate total volume per workout session
 */
export const calculateVolumeHistory = (sessions: WorkoutSession[]): VolumeDataPoint[] => {
  return sessions
    .filter(s => s.endTime) // Only completed sessions
    .map(session => {
      const totalVolume = session.exercises.reduce((sessionSum, exercise) => {
        const exerciseVolume = exercise.sets.reduce((setSum, set) => {
          if (set.completedAt && set.weight && set.reps) {
            return setSum + set.weight * set.reps;
          }
          return setSum;
        }, 0);
        return sessionSum + exerciseVolume;
      }, 0);

      return {
        date: session.startTime,
        totalVolume,
        sessionCount: 1,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculate strength progression for a specific exercise
 */
export const calculateStrengthProgression = (
  sessions: WorkoutSession[],
  exerciseName: string
): StrengthProgressPoint[] => {
  const progressPoints: StrengthProgressPoint[] = [];

  sessions
    .filter(s => s.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .forEach(session => {
      const exercise = session.exercises.find(ex => ex.name === exerciseName);
      if (!exercise) return;

      // Find best set in this session
      const bestSet = exercise.sets
        .filter(s => s.completedAt && s.weight && s.reps)
        .reduce((best, current) => {
          if (!best) return current;
          const currentOneRM = calculateOneRM(current.weight!, current.reps!);
          const bestOneRM = calculateOneRM(best.weight!, best.reps!);
          return currentOneRM > bestOneRM ? current : best;
        }, exercise.sets[0]);

      if (bestSet && bestSet.weight && bestSet.reps) {
        progressPoints.push({
          date: session.startTime,
          oneRepMax: calculateOneRM(bestSet.weight, bestSet.reps),
          weight: bestSet.weight,
          reps: bestSet.reps,
        });
      }
    });

  return progressPoints;
};

/**
 * Calculate workout frequency (sessions per week)
 */
export const calculateFrequency = (
  sessions: WorkoutSession[],
  weeks: number = 12
): FrequencyData[] => {
  const now = new Date();
  const startDate = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  // Group by week
  const weekMap = new Map<string, number>();

  sessions
    .filter(s => s.endTime && new Date(s.startTime) >= startDate)
    .forEach(session => {
      const sessionDate = new Date(session.startTime);
      const weekKey = getWeekKey(sessionDate);
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
    });

  // Convert to array and fill gaps
  const frequencyData: FrequencyData[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const weekKey = getWeekKey(weekDate);
    frequencyData.push({
      date: weekDate.toISOString(),
      workoutCount: weekMap.get(weekKey) || 0,
    });
  }

  return frequencyData;
};

/**
 * Get average volume per session over last N sessions
 */
export const getAverageVolume = (sessions: WorkoutSession[], lastN: number = 10): number => {
  const recentSessions = sessions.filter(s => s.endTime).slice(-lastN);

  if (recentSessions.length === 0) return 0;

  const totalVolume = recentSessions.reduce((sum, session) => {
    const sessionVolume = session.exercises.reduce((exSum, exercise) => {
      const exerciseVolume = exercise.sets.reduce((setSum, set) => {
        if (set.completedAt && set.weight && set.reps) {
          return setSum + set.weight * set.reps;
        }
        return setSum;
      }, 0);
      return exSum + exerciseVolume;
    }, 0);
    return sum + sessionVolume;
  }, 0);

  return Math.round(totalVolume / recentSessions.length);
};

// Helper functions
const calculateOneRM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

const getWeekKey = (date: Date): string => {
  const year = date.getFullYear();
  const weekNumber = getWeekNumber(date);
  return `${year}-W${weekNumber}`;
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
