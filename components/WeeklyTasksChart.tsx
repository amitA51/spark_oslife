import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalItem } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';

interface WeeklyTasksChartProps {
  /** Tasks to display */
  tasks: PersonalItem[];
  /** Title text */
  title?: string;
  /** Number of days to show */
  daysToShow?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Callback when a day is clicked */
  onDayClick?: (date: Date, tasks: PersonalItem[]) => void;
}

interface DayData {
  date: Date;
  dateString: string;
  label: string;
  isToday: boolean;
  pending: number;
  completed: number;
  tasks: PersonalItem[];
}

const toISODateString = (date: Date): string => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0] || '';
};

const WeeklyTasksChart: React.FC<WeeklyTasksChartProps> = ({
  tasks,
  title = 'משימות לשבוע הקרוב',
  daysToShow = 7,
  showLegend,
  onDayClick,
}) => {
  const { settings } = useSettings();
  const shouldShowLegend = showLegend ?? settings.visualSettings?.showLegends ?? true;

  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const taskData = useMemo((): DayData[] => {
    const today = new Date();
    const todayString = toISODateString(today);

    const days = Array.from({ length: daysToShow }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = toISODateString(date);

      return {
        date,
        dateString,
        label: i === 0 ? 'היום' : i === 1 ? 'מחר' : date.toLocaleDateString('he-IL', { weekday: 'short' }),
        isToday: dateString === todayString,
        pending: 0,
        completed: 0,
        tasks: [] as PersonalItem[],
      };
    });

    tasks.forEach(task => {
      if (task.dueDate) {
        const day = days.find(d => d.dateString === task.dueDate);
        if (day) {
          day.tasks.push(task);
          if (task.isCompleted) {
            day.completed++;
          } else {
            day.pending++;
          }
        }
      }
    });

    return days;
  }, [tasks, daysToShow]);

  const maxTasks = useMemo(() =>
    Math.max(...taskData.map(d => d.pending + d.completed), 1),
    [taskData]
  );

  const totalPending = useMemo(() =>
    taskData.reduce((sum, d) => sum + d.pending, 0),
    [taskData]
  );

  const totalCompleted = useMemo(() =>
    taskData.reduce((sum, d) => sum + d.completed, 0),
    [taskData]
  );

  const handleDayClick = useCallback((day: DayData) => {
    setSelectedDay(selectedDay === day.dateString ? null : day.dateString);
    if (onDayClick) {
      onDayClick(day.date, day.tasks);
    }
  }, [selectedDay, onDayClick]);

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

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)]">
            {totalPending} ממתינות
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
            {totalCompleted} הושלמו
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-2 h-40 mb-3">
        {taskData.map((day, i) => {
          const total = day.pending + day.completed;
          const pendingHeight = (day.pending / maxTasks) * 100;
          const completedHeight = (day.completed / maxTasks) * 100;
          const isHovered = hoveredDay === day.dateString;
          const isSelected = selectedDay === day.dateString;

          return (
            <motion.div
              key={day.dateString}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer"
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoveredDay(day.dateString)}
              onMouseLeave={() => setHoveredDay(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-full h-full flex flex-col-reverse relative">
                {/* Bars container */}
                <div className="relative w-full flex flex-col-reverse">
                  {/* Pending bar */}
                  <motion.div
                    className="w-full rounded-t-lg"
                    style={{
                      background: isSelected
                        ? 'var(--dynamic-accent-start)'
                        : 'linear-gradient(to top, var(--dynamic-accent-start)/40, var(--dynamic-accent-end)/40)',
                    }}
                    initial={{ height: 0 }}
                    animate={{
                      height: `${pendingHeight}%`,
                      opacity: isHovered ? 1 : 0.8,
                    }}
                    transition={{
                      height: { duration: 0.5, delay: i * 0.05, ease: 'easeOut' },
                      opacity: { duration: 0.2 },
                    }}
                  />

                  {/* Completed bar */}
                  <motion.div
                    className="w-full rounded-t-lg"
                    style={{
                      background: isSelected
                        ? '#22c55e'
                        : 'linear-gradient(to top, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5))',
                    }}
                    initial={{ height: 0 }}
                    animate={{
                      height: `${completedHeight}%`,
                      opacity: isHovered ? 1 : 0.8,
                    }}
                    transition={{
                      height: { duration: 0.5, delay: i * 0.05 + 0.1, ease: 'easeOut' },
                      opacity: { duration: 0.2 },
                    }}
                  />
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && total > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
                    >
                      <div className="bg-[var(--bg-primary)] border border-white/10 text-xs p-2 px-3 rounded-xl shadow-xl backdrop-blur-xl">
                        <p className="text-[var(--dynamic-accent-start)] font-medium">
                          ממתינות: {day.pending}
                        </p>
                        <p className="text-emerald-400 font-medium">
                          הושלמו: {day.completed}
                        </p>
                        {/* Arrow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-primary)] border-r border-b border-white/10 rotate-45" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state indicator */}
                {total === 0 && (
                  <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full bg-white/10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.05 }}
                  />
                )}
              </div>

              {/* Day label */}
              <span
                className={`
                  text-xs font-medium transition-colors duration-200
                  ${day.isToday
                    ? 'text-[var(--dynamic-accent-start)]'
                    : isHovered || isSelected
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
                  className="w-1.5 h-1.5 rounded-full bg-[var(--dynamic-accent-start)]"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      {shouldShowLegend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4 pt-2 border-t border-white/5"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[var(--dynamic-accent-start)]/40 to-[var(--dynamic-accent-end)]/40" />
            <span className="text-xs text-[var(--text-secondary)]">ממתינות</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500/50 to-emerald-400/50" />
            <span className="text-xs text-[var(--text-secondary)]">הושלמו</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default React.memo(WeeklyTasksChart);
