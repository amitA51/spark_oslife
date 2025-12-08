import { WorkoutSession } from '../types';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0-100
  target: number;
}

/**
 * Calculate current and longest workout streak
 */
export const calculateStreak = (sessions: WorkoutSession[]): StreakInfo => {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  // Sort sessions by date
  const sortedSessions = sessions
    .filter(s => s.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (sortedSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  // Group by day
  const workoutDays = new Set<string>();
  sortedSessions.forEach(session => {
    const date = new Date(session.startTime);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    workoutDays.add(dayKey);
  });

  const uniqueDays = Array.from(workoutDays).sort();

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  // Calculate longest streak
  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = parseDayKey(uniqueDays[i - 1] || '');
    const currDate = parseDayKey(uniqueDays[i] || '');
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak
  const lastDay = uniqueDays[uniqueDays.length - 1];
  if (lastDay === todayKey || lastDay === yesterdayKey) {
    currentStreak = 1;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const prevDate = parseDayKey(uniqueDays[i] || '');
      const currDate = parseDayKey(uniqueDays[i + 1] || '');
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: sortedSessions[sortedSessions.length - 1]?.startTime || null,
  };
};

/**
 * Get all achievements with progress
 */
export const getAchievements = (
  sessions: WorkoutSession[],
  streakInfo: StreakInfo
): Achievement[] => {
  const totalWorkouts = sessions.filter(s => s.endTime).length;
  const totalVolume = sessions.reduce((sum, session) => {
    return (
      sum +
      session.exercises.reduce((exSum, ex) => {
        return (
          exSum +
          ex.sets.reduce((setSum, set) => {
            if (set.completedAt && set.weight && set.reps) {
              return setSum + set.weight * set.reps;
            }
            return setSum;
          }, 0)
        );
      }, 0)
    );
  }, 0);

  return [
    {
      id: 'first_workout',
      name: 'First Steps',
      description: 'Complete your first workout',
      icon: '🎯',
      progress: totalWorkouts >= 1 ? 100 : 0,
      target: 1,
      unlockedAt: totalWorkouts >= 1 ? sessions[0]?.startTime : undefined,
    },
    {
      id: 'warrior_10',
      name: 'Warrior',
      description: 'Complete 10 workouts',
      icon: '⚔️',
      progress: Math.min(100, (totalWorkouts / 10) * 100),
      target: 10,
      unlockedAt: totalWorkouts >= 10 ? sessions[9]?.startTime : undefined,
    },
    {
      id: 'champion_50',
      name: 'Champion',
      description: 'Complete 50 workouts',
      icon: '🏆',
      progress: Math.min(100, (totalWorkouts / 50) * 100),
      target: 50,
      unlockedAt: totalWorkouts >= 50 ? sessions[49]?.startTime : undefined,
    },
    {
      id: 'legend_100',
      name: 'Legend',
      description: 'Complete 100 workouts',
      icon: '👑',
      progress: Math.min(100, (totalWorkouts / 100) * 100),
      target: 100,
      unlockedAt: totalWorkouts >= 100 ? sessions[99]?.startTime : undefined,
    },
    {
      id: 'consistency_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      progress: Math.min(100, (streakInfo.longestStreak / 7) * 100),
      target: 7,
      unlockedAt:
        streakInfo.longestStreak >= 7 ? sessions[sessions.length - 1]?.startTime : undefined,
    },
    {
      id: 'consistency_30',
      name: 'Iron Will',
      description: 'Maintain a 30-day streak',
      icon: '💎',
      progress: Math.min(100, (streakInfo.longestStreak / 30) * 100),
      target: 30,
      unlockedAt:
        streakInfo.longestStreak >= 30 ? sessions[sessions.length - 1]?.startTime : undefined,
    },
    {
      id: 'volume_10000',
      name: 'Heavy Lifter',
      description: 'Lift 10,000kg total volume',
      icon: '💪',
      progress: Math.min(100, (totalVolume / 10000) * 100),
      target: 10000,
      unlockedAt: totalVolume >= 10000 ? sessions[sessions.length - 1]?.startTime : undefined,
    },
    {
      id: 'volume_100000',
      name: 'Mountain Mover',
      description: 'Lift 100,000kg total volume',
      icon: '⛰️',
      progress: Math.min(100, (totalVolume / 100000) * 100),
      target: 100000,
      unlockedAt: totalVolume >= 100000 ? sessions[sessions.length - 1]?.startTime : undefined,
    },
  ].sort((a, b) => {
    // Sort unlocked first, then by progress
    if (a.progress === 100 && b.progress !== 100) return -1;
    if (a.progress !== 100 && b.progress === 100) return 1;
    return b.progress - a.progress;
  });
};

// Helper
const parseDayKey = (dayKey: string): Date => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year || 0, month || 0, day || 1);
};
