import React, { useMemo } from 'react';
import { PersonalItem } from '../../types';
import { CalendarIcon, ClockIcon, AlertIcon } from '../icons';
import TaskItem from '../TaskItem';

interface TodayViewProps {
  tasks: PersonalItem[];
  onTaskClick: (task: PersonalItem) => void;
  onUpdateTask: (id: string, updates: Partial<PersonalItem>) => void;
  onDeleteTask: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
}

const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  onContextMenu,
}) => {
  const { overdueTasks, morningTasks, afternoonTasks, eveningTasks, noTimeTasks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const categorized = {
      overdueTasks: [] as PersonalItem[],
      morningTasks: [] as PersonalItem[],
      afternoonTasks: [] as PersonalItem[],
      eveningTasks: [] as PersonalItem[],
      noTimeTasks: [] as PersonalItem[],
    };

    tasks.forEach(task => {
      if (task.type !== 'task' || task.isCompleted) return;

      // Check if overdue
      if (task.dueDate && todayStr && task.dueDate < todayStr) {
        categorized.overdueTasks.push(task);
        return;
      }

      // Check if today
      if (task.dueDate === todayStr) {
        if (!task.dueTime) {
          categorized.noTimeTasks.push(task);
        } else {
          const hour = parseInt((task.dueTime || '00:00').split(':')[0] || '0');
          if (hour < 12) categorized.morningTasks.push(task);
          else if (hour < 17) categorized.afternoonTasks.push(task);
          else categorized.eveningTasks.push(task);
        }
      }
    });

    return categorized;
  }, [tasks]);

  const totalToday =
    morningTasks.length + afternoonTasks.length + eveningTasks.length + noTimeTasks.length;

  const Section = ({
    title,
    icon,
    tasks,
    color,
  }: {
    title: string;
    icon: React.ReactNode;
    tasks: PersonalItem[];
    color: string;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-6 animate-slide-up-stagger">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              item={task}
              index={index}
              onSelect={item => onTaskClick(item)}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="themed-card p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 font-heading">היום</h1>
            <p className="text-muted">
              {new Date().toLocaleDateString('he-IL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[var(--dynamic-accent-start)]">
              {totalToday}
            </div>
            <div className="text-xs text-muted">משימות להיום</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {totalToday === 0 && overdueTasks.length === 0 && (
        <div className="themed-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
            <CalendarIcon className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">הכל נקי! 🎉</h3>
          <p className="text-muted">אין משימות להיום. זמן מעולה לתכנן את המחר.</p>
        </div>
      )}

      {/* Overdue Section */}
      <Section
        title="באיחור"
        icon={<AlertIcon className="w-4 h-4 text-red-400" />}
        tasks={overdueTasks}
        color="bg-red-500/20"
      />

      {/* Morning Section */}
      <Section
        title="בוקר (06:00-12:00)"
        icon={<ClockIcon className="w-4 h-4 text-yellow-400" />}
        tasks={morningTasks}
        color="bg-yellow-500/20"
      />

      {/* Afternoon Section */}
      <Section
        title="צהריים (12:00-17:00)"
        icon={<ClockIcon className="w-4 h-4 text-orange-400" />}
        tasks={afternoonTasks}
        color="bg-orange-500/20"
      />

      {/* Evening Section */}
      <Section
        title="ערב (17:00-23:00)"
        icon={<ClockIcon className="w-4 h-4 text-blue-400" />}
        tasks={eveningTasks}
        color="bg-blue-500/20"
      />

      {/* No Time Section */}
      <Section
        title="ללא שעה"
        icon={<CalendarIcon className="w-4 h-4 text-muted" />}
        tasks={noTimeTasks}
        color="bg-white/5"
      />
    </div>
  );
};

export default TodayView;
