/**
 * Life Correlations Engine
 * Analyzes user behavior patterns and finds correlations between different life areas
 *
 * Example insights:
 * - "You complete 30% fewer tasks on days you skip your morning coffee habit"
 * - "Your productivity increases by 45% on days with workout sessions"
 * - "You're more likely to journal when you get 7+ hours of sleep"
 */

import type { PersonalItem } from '../types';
import { toDateKey } from '../utils/dateUtils';

// ========================================
// Types
// ========================================

export interface EventLog {
  id: string;
  timestamp: Date;
  eventType:
  | 'habit_completed'
  | 'task_completed'
  | 'workout_completed'
  | 'journal_entry'
  | 'spark_created'
  | 'focus_session';
  itemId: string;
  itemTitle: string;
  metadata?: Record<string, any>;
}

export interface Correlation {
  id: string;
  variable1: string;
  variable2: string;
  correlationScore: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  sampleSize: number;
  confidenceLevel: number;
  insight: string;
  lastUpdated: Date;
}

export interface Pattern {
  id: string;
  type: 'streak' | 'time_of_day' | 'day_of_week';
  title: string;
  description: string;
  frequency: number;
  lastSeen: Date;
}

// ========================================
// Event Logging
// ========================================

const EVENT_LOG_KEY = 'spark_event_log';

export const logEvent = (event: Omit<EventLog, 'id' | 'timestamp'>): void => {
  try {
    const eventLog = getEventLog();
    const newEvent: EventLog = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    eventLog.push(newEvent);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const filteredEvents = eventLog.filter(e => new Date(e.timestamp) > ninetyDaysAgo);

    localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(filteredEvents));
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};

export const getEventLog = (): EventLog[] => {
  try {
    const stored = localStorage.getItem(EVENT_LOG_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
  } catch (error) {
    console.error('Failed to retrieve event log:', error);
    return [];
  }
};

// ========================================
// Correlation Analysis
// ========================================

/**
 * Calculate Pearson correlation coefficient between two time series
 * @returns Correlation coefficient (-1 to 1)
 */
const calculateCorrelation = (
  series1: { date: string; value: number }[],
  series2: { date: string; value: number }[]
): number => {
  // Align both series by date
  const dates = new Set([...series1.map(s => s.date), ...series2.map(s => s.date)]);
  const aligned: { x: number; y: number }[] = [];

  dates.forEach(date => {
    const val1 = series1.find(s => s.date === date)?.value ?? 0;
    const val2 = series2.find(s => s.date === date)?.value ?? 0;
    aligned.push({ x: val1, y: val2 });
  });

  if (aligned.length < 3) return 0;

  const meanX = aligned.reduce((sum, p) => sum + p.x, 0) / aligned.length;
  const meanY = aligned.reduce((sum, p) => sum + p.y, 0) / aligned.length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  aligned.forEach(({ x, y }) => {
    const dx = x - meanX;
    const dy = y - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  });

  if (denomX === 0 || denomY === 0) return 0;

  return numerator / Math.sqrt(denomX * denomY);
};

/**
 * Find correlations between habits and task completion
 */
export const findHabitTaskCorrelations = (personalItems: PersonalItem[]): Correlation[] => {
  const correlations: Correlation[] = [];
  const eventLog = getEventLog();

  const habits = personalItems.filter(item => item.type === 'habit');

  habits.forEach(habit => {
    const habitSeries: { date: string; value: number }[] = [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return toDateKey(d);
    });

    last30Days.forEach(date => {
      const completed = eventLog.some(
        e =>
          e.eventType === 'habit_completed' &&
          e.itemId === habit.id &&
          toDateKey(new Date(e.timestamp)) === date
      );
      if (date) habitSeries.push({ date, value: completed ? 1 : 0 });
    });

    const taskSeries: { date: string; value: number }[] = [];
    last30Days.forEach(date => {
      const count = eventLog.filter(
        e =>
          e.eventType === 'task_completed' &&
          toDateKey(new Date(e.timestamp)) === date
      ).length;
      if (date) taskSeries.push({ date, value: count });
    });

    const score = calculateCorrelation(habitSeries, taskSeries);
    const absScore = Math.abs(score);

    if (absScore > 0.3) {
      const strength: 'weak' | 'moderate' | 'strong' =
        absScore > 0.7 ? 'strong' : absScore > 0.5 ? 'moderate' : 'weak';

      const direction: 'positive' | 'negative' = score > 0 ? 'positive' : 'negative';

      let insight = '';
      if (direction === 'positive') {
        insight = `בימים שאתה משלים "${habit.title}", אתה נוטה להשלים ${Math.round(absScore * 100)}% יותר משימות.`;
      } else {
        insight = `בימים שאתה משלים "${habit.title}", אתה נוטה להשלים ${Math.round(absScore * 100)}% פחות משימות.`;
      }

      correlations.push({
        id: `corr-${habit.id}-tasks`,
        variable1: habit.title || 'Untitled',
        variable2: 'השלמת משימות',
        correlationScore: score,
        strength,
        direction,
        sampleSize: last30Days.length,
        confidenceLevel: Math.min(absScore * 100, 95),
        insight,
        lastUpdated: new Date(),
      });
    }
  });

  return correlations.sort((a, b) => Math.abs(b.correlationScore) - Math.abs(a.correlationScore));
};

/**
 * Detect behavior patterns
 */
export const detectPatterns = (personalItems: PersonalItem[]): Pattern[] => {
  const patterns: Pattern[] = [];
  const eventLog = getEventLog();

  if (eventLog.length === 0) return patterns;

  // Pattern 1: Peak productivity hour
  const hourlyActivity: Record<number, number> = {};
  eventLog.forEach(e => {
    const hour = new Date(e.timestamp).getHours();
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
  });

  const peakHourEntry = Object.entries(hourlyActivity).sort((a, b) => b[1] - a[1])[0];
  if (peakHourEntry && peakHourEntry[1] > 5) {
    const hour = parseInt(peakHourEntry[0]);
    const timeLabel = hour < 12 ? 'בבוקר' : hour < 18 ? 'אחר הצהריים' : 'בערב';

    patterns.push({
      id: 'pattern-peak-hour',
      type: 'time_of_day',
      title: `שעת השיא שלך: ${hour}:00`,
      description: `אתה הכי פעיל ב-${hour}:00 ${timeLabel}. ${peakHourEntry[1]} אירועים נרשמו בשעה זו.`,
      frequency: peakHourEntry[1] / eventLog.length,
      lastSeen: new Date(),
    });
  }

  // Pattern 2: Best day of week
  const dayActivity: Record<number, number> = {};
  eventLog.forEach(e => {
    const day = new Date(e.timestamp).getDay();
    dayActivity[day] = (dayActivity[day] || 0) + 1;
  });

  const bestDayEntry = Object.entries(dayActivity).sort((a, b) => b[1] - a[1])[0];
  if (bestDayEntry && bestDayEntry[1] > 10) {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayIndex = parseInt(bestDayEntry[0]);

    patterns.push({
      id: 'pattern-best-day',
      type: 'day_of_week',
      title: `יום ${dayNames[dayIndex]} הוא הטוב ביותר`,
      description: `אתה מסיים הכי הרבה משימות ביום ${dayNames[dayIndex]}. ${bestDayEntry[1]} פעולות בסך הכל.`,
      frequency: bestDayEntry[1] / eventLog.length,
      lastSeen: new Date(),
    });
  }

  // Pattern 3: Habit streaks
  const habits = personalItems.filter(item => item.type === 'habit');
  habits.forEach(habit => {
    const habitEvents = eventLog
      .filter(e => e.eventType === 'habit_completed' && e.itemId === habit.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (habitEvents.length > 0) {
      let streak = 1;
      for (let i = 0; i < habitEvents.length - 1; i++) {
        const current = new Date(habitEvents[i]?.timestamp || '');
        const next = new Date(habitEvents[i + 1]?.timestamp || '');
        const dayDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          streak++;
        } else {
          break;
        }
      }

      if (streak >= 3) {
        patterns.push({
          id: `pattern-streak-${habit.id}`,
          type: 'streak',
          title: `רצף של ${streak} ימים: ${habit.title}`,
          description: `שמרת על רצף של ${streak} ימים ב-"${habit.title}". המשך כך!`,
          frequency: streak / 30,
          lastSeen: new Date(),
        });
      }
    }
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
};

/**
 * Get insights summary for dashboard
 */
export const getInsightsSummary = (personalItems: PersonalItem[]) => {
  const correlations = findHabitTaskCorrelations(personalItems);
  const patterns = detectPatterns(personalItems);

  return {
    correlations: correlations.slice(0, 3),
    patterns: patterns.slice(0, 3),
    totalEvents: getEventLog().length,
    lastAnalysis: new Date(),
  };
};
