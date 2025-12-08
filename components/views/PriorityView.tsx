import React, { useMemo } from 'react';
import { PersonalItem } from '../../types';
import { AlertIcon, ChevronLeftIcon } from '../icons';
import TaskItem from '../TaskItem';

interface PriorityViewProps {
  tasks: PersonalItem[];
  onTaskClick: (task: PersonalItem) => void;
  onUpdateTask: (id: string, updates: Partial<PersonalItem>) => void;
  onDeleteTask: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
}

const PriorityView: React.FC<PriorityViewProps> = ({
  tasks,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  onContextMenu,
}) => {
  const { highPriority, mediumPriority, lowPriority, noPriority } = useMemo(() => {
    const categorized = {
      highPriority: [] as PersonalItem[],
      mediumPriority: [] as PersonalItem[],
      lowPriority: [] as PersonalItem[],
      noPriority: [] as PersonalItem[],
    };

    tasks.forEach(task => {
      if (task.type !== 'task' || task.isCompleted) return;

      switch (task.priority) {
        case 'high':
          categorized.highPriority.push(task);
          break;
        case 'medium':
          categorized.mediumPriority.push(task);
          break;
        case 'low':
          categorized.lowPriority.push(task);
          break;
        default:
          categorized.noPriority.push(task);
      }
    });

    // Sort within each priority by due date
    const sortByDueDate = (a: PersonalItem, b: PersonalItem) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    };

    categorized.highPriority.sort(sortByDueDate);
    categorized.mediumPriority.sort(sortByDueDate);
    categorized.lowPriority.sort(sortByDueDate);
    categorized.noPriority.sort(sortByDueDate);

    return categorized;
  }, [tasks]);

  const PrioritySection = ({
    title,
    subtitle,
    tasks,
    color,
    bgColor,
    borderColor,
  }: {
    title: string;
    subtitle: string;
    tasks: PersonalItem[];
    color: string;
    bgColor: string;
    borderColor: string;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-6">
        <div
          className={`flex items-center gap-3 mb-3 p-3 rounded-xl border ${borderColor} ${bgColor}`}
        >
          <div className={`p-2 rounded-lg ${color}`}>
            <AlertIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{tasks.length}</span>
            <ChevronLeftIcon className="w-4 h-4 text-muted" />
          </div>
        </div>
        <div className="space-y-2 pr-4">
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

  const totalTasks =
    highPriority.length + mediumPriority.length + lowPriority.length + noPriority.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="themed-card p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 font-heading">לפי עדיפות</h1>
            <p className="text-muted">מסודר לפי דחיפות ותאריך יעד</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{highPriority.length}</div>
              <div className="text-[10px] text-muted">דחוף</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{mediumPriority.length}</div>
              <div className="text-[10px] text-muted">בינוני</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{lowPriority.length}</div>
              <div className="text-[10px] text-muted">נמוך</div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {totalTasks === 0 && (
        <div className="themed-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
            <AlertIcon className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">אין משימות פתוחות</h3>
          <p className="text-muted">כל המשימות הושלמו!</p>
        </div>
      )}

      {/* P1 - High Priority */}
      <PrioritySection
        title="P1 - דחוף"
        subtitle="משימות קריטיות הדורשות תשומת לב מיידית"
        tasks={highPriority}
        color="bg-red-500/20 text-red-400"
        bgColor="bg-red-500/5"
        borderColor="border-red-500/20"
      />

      {/* P2 - Medium Priority */}
      <PrioritySection
        title="P2 - בינוני"
        subtitle="משימות חשובות לטיפול קרוב"
        tasks={mediumPriority}
        color="bg-yellow-500/20 text-yellow-400"
        bgColor="bg-yellow-500/5"
        borderColor="border-yellow-500/20"
      />

      {/* P3 - Low Priority */}
      <PrioritySection
        title="P3 - נמוך"
        subtitle="משימות שניתן לדחות במידת הצורך"
        tasks={lowPriority}
        color="bg-blue-500/20 text-blue-400"
        bgColor="bg-blue-500/5"
        borderColor="border-blue-500/20"
      />

      {/* No Priority */}
      {noPriority.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <PrioritySection
            title="ללא עדיפות"
            subtitle="משימות שטרם קיבלו סיווג"
            tasks={noPriority}
            color="bg-white/5 text-muted"
            bgColor="bg-white/5"
            borderColor="border-white/10"
          />
        </div>
      )}
    </div>
  );
};

export default PriorityView;
