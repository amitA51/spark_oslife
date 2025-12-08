import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalItem } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';

interface HabitConsistencyChartProps {
  /** List of habit items */
  habits: PersonalItem[];
  /** All personal items to check completion history */
  personalItems: PersonalItem[];
  /** Title text */
  title?: string;
  /** Number of days to show */
  daysToShow?: number;
  /** Show average badge */
  showAverage?: boolean;
}

interface DayData {
  date: Date;
  label: string;
  percentage: number;
  completedCount: number;
  totalHabits: number;
  isToday: boolean;
}

const toISODateString = (date: Date): string => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0] || '';
};

const getConsistencyColor = (percentage: number): string => {
  if (percentage >= 100) return '#22c55e'; // Green - Perfect
  if (percentage >= 75) return '#3b82f6';  // Blue - Great
  if (percentage >= 50) return '#f59e0b';  // Amber - Good
  if (percentage >= 25) return '#f97316';  // Orange - Fair
  return '#ef4444';                        // Red - Needs work
};

const getConsistencyEmoji = (percentage: number): string => {
  if (percentage >= 100) return '🔥';
  if (percentage >= 75) return '⭐';
  if (percentage >= 50) return '💪';
  if (percentage >= 25) return '📈';
  return '💤';
};

const HabitConsistencyChart: React.FC<HabitConsistencyChartProps> = ({
  habits,
  personalItems,
  title = 'עקביות בהרגלים',
  daysToShow = 7,
  showAverage,
}) => {
  const { settings } = useSettings();
  const shouldShowAverage = showAverage ?? settings.visualSettings?.showStreaks ?? true;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo((): DayData[] => {
    if (habits.length === 0) return [];

    const today = new Date();
    const todayString = toISODateString(today);

    return Array.from({ length: daysToShow }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (daysToShow - 1 - i));
      const dateString = toISODateString(date);

      const completedOnDate = personalItems.filter(
        item =>
          item.type === 'habit' &&
          item.completionHistory?.some(h => toISODateString(new Date(h.date)) === dateString)
      ).length;

      const percentage = habits.length > 0 ? (completedOnDate / habits.length) * 100 : 0;

      return {
        date,
        label: dateString === todayString
          ? 'היום'
          : date.toLocaleDateString('he-IL', { weekday: 'short' }),
        percentage,
        completedCount: completedOnDate,
        totalHabits: habits.length,
        isToday: dateString === todayString,
      };
    });
  }, [habits, personalItems, daysToShow]);

  const averagePercentage = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.percentage, 0) / data.length);
  }, [data]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] && data[i].percentage > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [data]);

  if (habits.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">אין הרגלים להצגה</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>

        {/* Stats badges */}
        <div className="flex items-center gap-2">
          {shouldShowAverage && (
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                backgroundColor: `${getConsistencyColor(averagePercentage)}20`,
                color: getConsistencyColor(averagePercentage),
              }}
            >
              {averagePercentage}% ממוצע
            </span>
          )}
          {currentStreak > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
              🔥 {currentStreak} רצף
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-center justify-between gap-3">
        {data.map((day, i) => {
          const isHovered = hoveredIndex === i;
          const color = getConsistencyColor(day.percentage);

          return (
            <motion.div
              key={i}
              className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Circle container */}
              <div className="relative w-10 h-10">
                {/* Background circle */}
                <div className="absolute inset-0 rounded-full bg-white/[0.05]" />

                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={100}
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - day.percentage }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 4px ${color}50)` }}
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    className="text-xs font-bold"
                    style={{ color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08 + 0.3 }}
                  >
                    {day.percentage >= 100 ? '✓' : `${Math.round(day.percentage)}%`}
                  </motion.span>
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      className="absolute -top-14 left-1/2 -translate-x-1/2 z-20"
                    >
                      <div className="bg-[var(--bg-primary)] border border-white/10 text-xs p-2 rounded-xl shadow-xl whitespace-nowrap">
                        <div className="flex items-center gap-1 mb-1">
                          <span>{getConsistencyEmoji(day.percentage)}</span>
                          <span className="font-bold" style={{ color }}>
                            {Math.round(day.percentage)}%
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)]">
                          {day.completedCount}/{day.totalHabits} הרגלים
                        </p>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-primary)] border-r border-b border-white/10 rotate-45" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Day label */}
              <span
                className={`
                  text-xs font-medium transition-colors duration-200
                  ${day.isToday
                    ? 'text-[var(--dynamic-accent-start)]'
                    : isHovered
                      ? 'text-white'
                      : 'text-[var(--text-secondary)]'
                  }
                `}
              >
                {day.label}
              </span>

              {/* Today indicator */}
              {day.isToday && (
                <motion.div
                  className="w-1 h-1 rounded-full bg-[var(--dynamic-accent-start)]"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default React.memo(HabitConsistencyChart);
