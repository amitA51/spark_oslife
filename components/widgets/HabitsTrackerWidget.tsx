import React, { useMemo } from 'react';
import BaseWidget from './BaseWidget';
import { DumbbellIcon, CheckCircleIcon, CircleIcon, FlameIcon } from '../icons';
import { PersonalItem } from '../../types';
import { useData } from '../../src/contexts/DataContext';
import { todayKey } from '../../utils/dateUtils';

interface HabitsTrackerWidgetProps {
  onHabitClick?: (habit: PersonalItem) => void;
  onHabitToggle?: (habitId: string) => void;
}

const HabitsTrackerWidget: React.FC<HabitsTrackerWidgetProps> = ({
  onHabitClick,
  onHabitToggle,
}) => {
  const { personalItems } = useData();

  const habits = useMemo(() => {
    return personalItems
      .filter(item => item.type === 'habit')
      .sort((a, b) => {
        // Sort by completion status (incomplete first) then by title
        const today = todayKey();
        const aCompleted = a.completionHistory?.some(h => h.date === today) ? 1 : 0;
        const bCompleted = b.completionHistory?.some(h => h.date === today) ? 1 : 0;
        if (aCompleted !== bCompleted) return aCompleted - bCompleted;
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [personalItems]);

  const isCompletedToday = (habit: PersonalItem) => {
    const today = todayKey();
    return habit.completionHistory?.some(h => h.date === today);
  };

  const getStreak = (habit: PersonalItem) => {
    return habit.streak || 0;
  };

  return (
    <BaseWidget title="מעקב הרגלים" icon={<DumbbellIcon className="w-5 h-5" />} size="medium">
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)]">
          <DumbbellIcon className="w-12 h-12 mb-2 opacity-20" />
          <p>אין הרגלים פעילים</p>
          <p className="text-xs mt-1">צור הרגל חדש כדי להתחיל לעקוב</p>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => {
            const completed = isCompletedToday(habit);
            return (
              <div
                key={habit.id}
                onClick={() => onHabitClick?.(habit)}
                className={`
                                    flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group
                                    ${completed
                    ? 'bg-[var(--success)]/10 border border-[var(--success)]/20'
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
                  }
                                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onHabitToggle?.(habit.id);
                    }}
                    className={`
                                            p-1 rounded-full transition-colors flex-shrink-0
                                            ${completed
                        ? 'text-[var(--success)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }
                                        `}
                  >
                    {completed ? (
                      <CheckCircleIcon className="w-6 h-6" filled />
                    ) : (
                      <CircleIcon className="w-6 h-6" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`font-medium truncate ${completed ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}
                    >
                      {habit.title}
                    </p>
                    {habit.frequency && (
                      <p className="text-xs text-[var(--text-secondary)]">{habit.frequency}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                  <FlameIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{getStreak(habit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BaseWidget>
  );
};

export default HabitsTrackerWidget;
