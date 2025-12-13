import React, { useMemo, useState, useCallback } from 'react';
import { PersonalItem } from '../types';
import TaskItem from './TaskItem';
import HabitItem from './HabitItem';
import AnimatedProgressRing from './AnimatedProgressRing';
import Section from './Section';
import { AnimatePresence, motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import { useData } from '../src/contexts/DataContext';
import { isHabitForToday } from '../hooks/useTodayItems';
import { toDateKey } from '../utils/dateUtils';

interface TodayViewProps {
  tasks: PersonalItem[];
  onUpdateItem: (id: string, updates: Partial<PersonalItem>) => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (item: PersonalItem) => void;
  onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
  onStartFocus: (item: PersonalItem) => void;
  onRollOverTasks: () => void;
  overdueTasksCount: number;
}

const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onUpdateItem,
  onDeleteItem,
  onSelectItem,
  onContextMenu,
  onStartFocus,
  onRollOverTasks,
  overdueTasksCount,
}) => {
  const { personalItems } = useData();
  // Use enhanced haptics with selection effect
  const { hapticSelection } = useHaptics();
  // Use enhanced sounds
  const { playClick } = useSound();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate 7 days for weekly planner
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateStr = toDateKey(selectedDate);
  const todayStr = toDateKey(today);
  const isToday = selectedDateStr === todayStr;

  // Get tasks for selected date
  const { dateTasks, overdueTasks, completedTasks, stats } = useMemo(() => {
    const selected: PersonalItem[] = [];
    const overdue: PersonalItem[] = [];
    const completed: PersonalItem[] = [];

    tasks.forEach(task => {
      if (task.isCompleted) {
        if (task.lastCompleted && new Date(task.lastCompleted).toDateString() === selectedDate.toDateString()) {
          completed.push(task);
        }
        return;
      }

      if (!task.dueDate) {
        if (isToday) selected.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (task.dueDate === selectedDateStr) {
        selected.push(task);
      } else if (dueDate < today && isToday) {
        overdue.push(task);
      }
    });

    // Sort by priority
    const sortByPriority = (a: PersonalItem, b: PersonalItem) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority || 'medium'] - order[b.priority || 'medium']);
    };
    selected.sort(sortByPriority);
    overdue.sort(sortByPriority);

    const totalTasks = selected.length + overdue.length;
    const completedCount = completed.length;
    const percentage = totalTasks + completedCount > 0
      ? Math.round((completedCount / (totalTasks + completedCount)) * 100) : 0;

    return { dateTasks: selected, overdueTasks: overdue, completedTasks: completed, stats: { total: totalTasks, completed: completedCount, percentage } };
  }, [tasks, selectedDate, selectedDateStr, todayStr, isToday, today]);

  // Get habits (only show on today)
  const habits = useMemo(() => {
    if (!isToday) return [];
    return personalItems.filter(item => item.type === 'habit' && isHabitForToday(item));
  }, [personalItems, isToday]);

  const handleDateSelect = useCallback((date: Date) => {
    hapticSelection();
    playClick();
    setSelectedDate(date);
  }, [hapticSelection, playClick]);

  const formatDayLabel = (date: Date) => {
    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return dayNames[date.getDay()];
  };

  return (
    <div className="space-y-4">
      {/* Weekly Planner - Compact */}
      <div className="glass-subtle rounded-2xl p-3 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">תכנון שבועי</span>
            {isToday && stats.total > 0 && (
              <span className="text-[10px] bg-accent-cyan/20 text-accent-cyan px-2 py-0.5 rounded-full">
                {stats.completed}/{stats.total + stats.completed}
              </span>
            )}
          </div>
          <AnimatedProgressRing percentage={stats.percentage} size={36} strokeWidth={4} />
        </div>

        <div className="flex gap-1.5">
          {weekDays.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasks.filter(t => t.dueDate === dateStr && !t.isCompleted);
            const isSelectedDay = date.toDateString() === selectedDate.toDateString();
            const isTodayDay = date.toDateString() === today.toDateString();

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateSelect(date)}
                className={`flex-1 py-2 rounded-xl text-center transition-all ${isSelectedDay
                  ? 'bg-gradient-to-br from-accent-cyan/30 to-accent-violet/30 border border-accent-cyan/40'
                  : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
              >
                <span className={`text-[10px] block ${isSelectedDay ? 'text-accent-cyan' : 'text-gray-500'}`}>
                  {formatDayLabel(date)}
                </span>
                <span className={`text-sm font-bold block ${isSelectedDay ? 'text-white' : isTodayDay ? 'text-accent-cyan' : 'text-gray-300'
                  }`}>
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${isSelectedDay ? 'bg-accent-cyan' : 'bg-gray-500'
                    }`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Label (only if not today) */}
      {!isToday && (
        <div className="flex items-center justify-between px-1">
          <button onClick={() => setSelectedDate(new Date())} className="text-xs text-accent-cyan">
            ← חזור להיום
          </button>
          <span className="text-sm font-medium text-white">
            {selectedDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}

      {/* Overdue Tasks (only on Today) */}
      {isToday && overdueTasks.length > 0 && (
        <Section
          componentId="overdue"
          title={`באיחור (${overdueTasks.length})`}
          count={overdueTasks.length}
          isCollapsible={true}
          isExpanded={true}
          onToggle={() => { }}
          className="border-r-2 border-red-500/40 pr-3 bg-red-500/5 rounded-l-xl"
        >
          <div className="flex justify-end mb-2">
            <button onClick={onRollOverTasks} className="text-[10px] text-accent-cyan hover:underline">
              גלגל להיום
            </button>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task, index) => (
              <TaskItem key={task.id} item={task} onUpdate={onUpdateItem} onDelete={onDeleteItem}
                onSelect={onSelectItem} onContextMenu={onContextMenu} index={index} />
            ))}
          </div>
        </Section>
      )}

      {/* Tasks for Selected Day */}
      <Section
        componentId="tasks"
        title={isToday ? 'משימות היום' : 'משימות'}
        count={dateTasks.length}
        isCollapsible={false}
        isExpanded={true}
        onToggle={() => { }}
        emptyMessage="הוסף משימות כדי להתחיל"
      >
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {dateTasks.map((task, index) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}>
                <TaskItem item={task} onUpdate={onUpdateItem} onDelete={onDeleteItem}
                  onSelect={onSelectItem} onContextMenu={onContextMenu} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>

      {/* Habits (only on Today) */}
      {isToday && habits.length > 0 && (
        <Section
          componentId="habits"
          title="הרגלים קבועים"
          count={habits.length}
          isCollapsible={false}
          isExpanded={true}
          onToggle={() => { }}
        >
          <div className="space-y-2">
            {habits.map((habit, index) => (
              <HabitItem key={habit.id} item={habit} onUpdate={onUpdateItem} onDelete={onDeleteItem}
                onSelect={onSelectItem} onContextMenu={onContextMenu} index={index} />
            ))}
          </div>
        </Section>
      )}

      {/* Completed (collapsed) */}
      {completedTasks.length > 0 && (
        <Section
          componentId="completed"
          title="הושלמו"
          count={completedTasks.length}
          isCollapsible={true}
          isExpanded={false}
          onToggle={() => { }}
          className="opacity-60"
        >
          <div className="space-y-2">
            {completedTasks.map((task, index) => (
              <TaskItem key={task.id} item={task} onUpdate={onUpdateItem} onDelete={onDeleteItem}
                onSelect={onSelectItem} onContextMenu={onContextMenu} index={index} />
            ))}
          </div>
        </Section>
      )}

      {/* Empty State */}
      {dateTasks.length === 0 && overdueTasks.length === 0 && habits.length === 0 && (
        <div className="text-center py-12">
          <span className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 mx-auto"><span className="text-2xl text-white/30">○</span></span>
          <p className="text-gray-400 text-sm">{isToday ? 'היום פנוי. הוסף משימות או הרגלים.' : 'אין משימות ליום זה'}</p>
        </div>
      )}
    </div>
  );
};

export default TodayView;
