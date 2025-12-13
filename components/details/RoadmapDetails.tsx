import React, { useState, useMemo, useCallback, useEffect, useRef, DragEvent } from 'react';
import { useUI } from '../../src/contexts/UIContext';
import { PersonalItem, RoadmapPhase, RoadmapTask, Attachment } from '../../types';
import {
  DragHandleIcon,
  AddIcon,
  TrashIcon,
  SparklesIcon,
  CopyIcon,
  LayoutDashboardIcon,
  ListIcon,
  getFileIcon,
  CalendarIcon,
  DownloadIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
} from '../icons';
import DailyProgressCircle from '../DailyProgressCircle';
import LoadingSpinner from '../LoadingSpinner';
import FileUploader from '../FileUploader';
import '../../styles/roadmap-premium.css';
import { useDebounce } from '../../hooks/useDebounce';
import { sampleRoadmapData } from '../../services/mockData';

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
  });
};

// --- Types ---
type RoadmapViewMode = 'list' | 'kanban' | 'timeline';
type Status = 'pending' | 'active' | 'completed';
type ActiveTab = 'tasks' | 'notes' | 'files' | 'analytics' | 'ai';

interface RoadmapScreenProps {
  item: PersonalItem;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// --- Helpers ---


// --- Sub Components ---

const Confetti: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 40 }).map((_, i) => (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${Math.random() * 100}% `,
          transform: `rotate(${Math.random() * 360}deg)`,
          animation: `confetti - fall ${Math.random() * 2 + 3}s ${Math.random() * 2}s linear forwards`,
        }}
      />
    ))}
  </div>
);

const TaskItem: React.FC<{ task: RoadmapTask; onToggle: () => void }> = ({ task, onToggle }) => (
  <button
    type="button"
    className={`roadmap-task-item ${task.isCompleted ? 'completed' : ''}`}
    onClick={onToggle}
  >
    <input
      type="checkbox"
      checked={task.isCompleted}
      onChange={onToggle}
      className="roadmap-task-checkbox"
      aria-label={task.title}
      onClick={e => e.stopPropagation()}
    />
    <span
      className={`flex-1 text-sm transition-all ${task.isCompleted ? 'text-muted line-through opacity-60' : 'text-primary'}`}
    >
      {task.title}
    </span>
  </button>
);

const TasksTab: React.FC<{
  stage: RoadmapPhase;
  onUpdate: (updates: Partial<RoadmapPhase>) => void;
}> = ({ stage, onUpdate }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pendingTasks = useMemo(() => stage.tasks.filter(t => !t.isCompleted), [stage.tasks]);
  const completedTasks = useMemo(() => stage.tasks.filter(t => t.isCompleted), [stage.tasks]);

  const handleToggleTask = (taskId: string) => {
    const updated = stage.tasks.map(t =>
      t.id === taskId
        ? {
          ...t,
          isCompleted: !t.isCompleted,
          completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
        }
        : t
    );
    onUpdate({ tasks: updated });
  };

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    const newTask: RoadmapTask = {
      id: `task - ${Date.now()} -${Math.random().toString(36).slice(2, 8)} `,
      title,
      isCompleted: false,
      order: stage.tasks.length,
    };
    onUpdate({ tasks: [...stage.tasks, newTask] });
    setNewTaskTitle('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <div className="space-y-3">
      {/* Pending */}
      {pendingTasks.length > 0 && (
        <div className="space-y-1">
          {pendingTasks.map(task => (
            <TaskItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
          ))}
        </div>
      )}

      {/* Completed collapsible */}
      {completedTasks.length > 0 && (
        <details className="group" open={completedTasks.length < 5}>
          <summary className="cursor-pointer text-xs text-muted hover:text-secondary py-2 select-none">
            משימות שהושלמו ({completedTasks.length})
          </summary>
          <div className="space-y-1 mt-1">
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />
            ))}
          </div>
        </details>
      )}

      {/* Add task */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
        <input
          ref={inputRef}
          className="flex-1 bg-black/30 rounded-full px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)] transition-shadow"
          placeholder="הוסף משימה חדשה..."
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim()}
          className="p-2.5 rounded-full bg-[var(--dynamic-accent-start)]/90 hover:bg-[var(--dynamic-accent-start)] disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold transition-all active:scale-95"
        >
          <AddIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const NotesTab: React.FC<{
  stage: RoadmapPhase;
  onUpdate: (updates: Partial<RoadmapPhase>) => void;
  showToast: (msg: string) => void;
}> = ({ stage, onUpdate, showToast }) => {
  const [content, setContent] = useState(stage.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const debouncedContent = useDebounce(content, 900);

  useEffect(() => {
    if (debouncedContent === stage.notes) return;
    setIsSaving(true);
    onUpdate({ notes: debouncedContent });

    const t = setTimeout(() => {
      setIsSaving(false);
      showToast('הפתק נשמר ✅');
    }, 250);

    return () => clearTimeout(t);
  }, [debouncedContent, stage.notes, onUpdate, showToast]);

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={10}
        className="w-full bg-black/30 text-primary text-sm p-4 rounded-xl focus:ring-2 focus:ring-[var(--dynamic-accent-start)] focus:outline-none placeholder:text-muted resize-none transition-shadow"
        placeholder="כתוב כאן את המחשבות, המסקנות וההערות לשלב הזה... (נשמר אוטומטית)"
      />
      <div className="flex justify-between items-center text-xs text-muted">
        <span className="flex items-center gap-2 min-h-[1rem]">
          {isSaving && (
            <>
              <span className="inline-block w-1.5 h-1.5 bg-[var(--dynamic-accent-start)] rounded-full animate-pulse" />
              שומר...
            </>
          )}
        </span>
        <span>{content.length} תווים</span>
      </div>
    </div>
  );
};

const FilesTab: React.FC<{
  stage: RoadmapPhase;
  onUpdate: (updates: Partial<RoadmapPhase>) => void;
}> = ({ stage, onUpdate }) => {
  const hasFiles = stage.attachments && stage.attachments.length > 0;

  const handleFileSelect = (file: Attachment) => {
    const newAttachments = [...(stage.attachments || []), file];
    onUpdate({ attachments: newAttachments });
  };

  const handleDeleteFile = (fileId: string) => {
    const newAttachments = stage.attachments.filter(f => f.id !== fileId);
    onUpdate({ attachments: newAttachments });
  };

  return (
    <div className="space-y-4">
      <FileUploader onFileSelect={handleFileSelect} label="הוסף קובץ לשלב" />

      {!hasFiles ? (
        <div className="text-center text-muted py-4 space-y-2">
          <p className="text-xs">עדיין אין קבצים. העלה קובץ כדי להתחיל.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stage.attachments.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-black/30 hover:bg-black/40 text-sm text-primary transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <a
                  href={file.url}
                  download={file.name}
                  className="truncate font-medium hover:underline block"
                >
                  {file.name}
                </a>
                <p className="text-xs text-muted">
                  {Math.round(file.size / 1024)}kb · {file.mimeType}
                </p>
              </div>
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SimpleBarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-40 p-3 bg-black/20 rounded-xl">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] transition-all duration-500 hover:opacity-100"
              style={{
                height: `${(d.value / maxValue) * 100}% `,
                opacity: 0.7,
              }}
              title={`${d.label}: ${d.value} `}
            />
          </div>
          <span className="text-xs text-muted font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsTab: React.FC<{ stage: RoadmapPhase }> = ({ stage }) => {
  const chartData = useMemo(() => {
    // Initialize array for weeks
    const weeksMap = new Map<string, number>();
    const startDate = stage.startDate ? new Date(stage.startDate) : new Date();

    // Group completed tasks by week relative to start
    stage.tasks.forEach(task => {
      if (task.isCompleted && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const diffTime = Math.abs(completedDate.getTime() - startDate.getTime());
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        const weekLabel = `ש' ${diffWeeks + 1}`;
        weeksMap.set(weekLabel, (weeksMap.get(weekLabel) || 0) + 1);
      }
    });

    // Ensure we have at least 'This Week' or some data
    const sortedWeeks = Array.from(weeksMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        const wa = parseInt(a.label.replace(/\D/g, '')) || 0;
        const wb = parseInt(b.label.replace(/\D/g, '')) || 0;
        return wa - wb;
      });

    // If empty, show placeholder zero data or current week
    if (sortedWeeks.length === 0) {
      return [{ label: 'השבוע', value: 0 }];
    }

    // Take last 7 weeks max
    return sortedWeeks.slice(-7);
  }, [stage.tasks, stage.startDate]);

  const stats = useMemo(() => {
    const totalTasks = stage.tasks.length;
    const completed = stage.tasks.filter(t => t.isCompleted).length;
    const remaining = totalTasks - completed;
    const progress =
      totalTasks > 0
        ? Math.round((completed / totalTasks) * 100)
        : stage.status === 'completed'
          ? 100
          : 0;

    return { progress, totalTasks, completed, remaining };
  }, [stage.tasks, stage.status]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-muted mb-1">התקדמות</p>
          <p className="text-2xl font-bold text-primary">{stats.progress}%</p>
          <div className="mt-2 h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-gradient)] transition-all duration-500"
              style={{ width: `${stats.progress}% ` }}
            />
          </div>
        </div>
        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-muted mb-1">זמן מוערך</p>
          <p className="text-2xl font-bold text-primary">{stage.estimatedHours}</p>
          <p className="text-xs text-muted mt-1">שעות</p>
        </div>
        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-muted mb-1">נותרו</p>
          <p className="text-2xl font-bold text-primary">{stats.remaining}</p>
          <p className="text-xs text-muted mt-1">משימות</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-muted mb-3">פעילות שבועית (משימות שהושלמו)</h4>
        <SimpleBarChart data={chartData} />
      </div>
    </div>
  );
};

const AiInsightsTab: React.FC<{
  stage: RoadmapPhase;
  onUpdate: (updates: Partial<RoadmapPhase>) => void;
  showToast: (msg: string) => void;
}> = ({ stage, onUpdate, showToast }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!stage.tasks.length && !stage.notes) {
      showToast('אין מספיק מידע לניתוח השלב כרגע.');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const pendingTasks = stage.tasks.filter(t => !t.isCompleted);
      const completedCount = stage.tasks.filter(t => t.isCompleted).length;

      const summary = stage.notes
        ? stage.notes
          .split('\n')
          .filter(l => l.trim())
          .slice(0, 2)
          .join(' ')
          .slice(0, 180) + '...'
        : `בשלב זה ${completedCount} מתוך ${stage.tasks.length} משימות הושלמו.המיקוד כעת הוא במשימות שנותרו.`;

      const actions =
        pendingTasks.length > 0
          ? pendingTasks.slice(0, 3).map(t => t.title)
          : ['לתכנן את הצעדים הבאים', 'לסקור את התקדמות השלב', 'לעדכן את לוח הזמנים וההיקף'];

      const quotes = [
        'התקדמות קטנה וקבועה טובה יותר מקפיצה חד פעמית.',
        'הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.',
        'הצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם.',
        'כל מסע ארוך מתחיל בצעד ראשון.',
        'התמדה היא המפתח להשגת כל מטרה.',
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];

      onUpdate({
        aiSummary: summary,
        aiActions: actions,
        aiQuote: quote,
      });

      setIsGenerating(false);
      showToast('תובנות AI עודכנו ✨');
    }, 1300);
  };

  const hasInsights =
    !!stage.aiSummary || !!(stage.aiActions && stage.aiActions.length) || !!stage.aiQuote;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <h4 className="font-semibold text-sm text-secondary">תובנות AI לשלב</h4>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold bg-[var(--dynamic-accent-start)]/10 text-[var(--dynamic-accent-start)] hover:bg-[var(--dynamic-accent-start)]/20 disabled:opacity-50 transition-all active:scale-95"
        >
          <SparklesIcon className={`w - 4 h - 4 ${isGenerating ? 'animate-spin' : ''} `} />
          {isGenerating ? 'מנתח...' : 'נתח שלב'}
        </button>
      </div>

      {!hasInsights && !isGenerating && (
        <div className="text-center py-8 text-muted text-sm">
          <SparklesIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>עדיין אין תובנות AI</p>
          <p className="text-xs mt-1">לחץ על "נתח שלב" כדי ליצור תובנות</p>
        </div>
      )}

      {isGenerating && (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="text-sm text-muted mt-3">מנתח את השלב...</p>
        </div>
      )}

      {hasInsights && !isGenerating && (
        <>
          <div>
            <h5 className="font-semibold text-xs text-muted mb-2">סיכום AI</h5>
            <p className="text-sm text-primary bg-black/30 p-4 rounded-lg leading-relaxed">
              {stage.aiSummary}
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-xs text-muted mb-2">פעולות מומלצות</h5>
            <ul className="space-y-2">
              {stage.aiActions?.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-primary bg-black/30 p-3 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)] flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-xs text-muted mb-2">מוטיבציה</h5>
            <blockquote className="text-sm text-primary bg-black/30 p-4 rounded-lg border-r-4 border-[var(--dynamic-accent-start)] italic">
              "{stage.aiQuote}"
            </blockquote>
          </div>
        </>
      )}
    </div>
  );
};

const OverallProgressSummary: React.FC<{ progress: number; text: string }> = ({
  progress,
  text,
}) => (
  <div className="themed-card flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm">
    <DailyProgressCircle percentage={progress} size={72} />
    <div className="space-y-1 flex-1 text-right">
      <h2 className="text-xl font-bold text-primary">
        {progress === 100 ? '🎉 השלמת את המטרה!' : `${Math.round(progress)}% יותר קרוב למטרה!`}
      </h2>
      <p className="text-sm text-secondary">{text}</p>
    </div>
  </div>
);

interface StageCardProps {
  stage: RoadmapPhase;
  onUpdate: (updates: Partial<RoadmapPhase>) => void;
  onDelete: () => void;
  showToast: (msg: string) => void;
  enableDrag: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnter: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const StageCard: React.FC<StageCardProps> = ({
  stage,
  onUpdate,
  onDelete,
  showToast,
  enableDrag,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}) => {
  const [isExpanded, setIsExpanded] = useState(stage.status === 'active');
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
  const [showConfetti, setShowConfetti] = useState(false);

  const { progress, status, statusColor, isCompleted, completedTasks, totalTasks } = useMemo(() => {
    const completed = stage.tasks.filter(t => t.isCompleted).length;
    const total = stage.tasks.length;
    const prog = total > 0 ? (completed / total) * 100 : stage.status === 'completed' ? 100 : 0;
    const hasCompleted = prog === 100 && total > 0;

    let currentStatus: Status = stage.status;
    if (hasCompleted && stage.status !== 'completed') currentStatus = 'completed';
    else if (prog > 0 && stage.status === 'pending') currentStatus = 'active';

    const statusMap: Record<Status, { label: string; color: string }> = {
      completed: { label: 'הושלם ✓', color: '#10B981' },
      active: { label: 'פעיל', color: '#3B82F6' },
      pending: { label: 'ממתין', color: '#6B7280' },
    };

    return {
      progress: prog,
      isCompleted: hasCompleted,
      status: statusMap[currentStatus].label,
      statusColor: statusMap[currentStatus].color,
      completedTasks: completed,
      totalTasks: total,
    };
  }, [stage.tasks, stage.status]);

  useEffect(() => {
    if (isCompleted && stage.status !== 'completed') {
      onUpdate({ status: 'completed' });
      setShowConfetti(true);
      showToast('ציון דרך הושג! 🎉');
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isCompleted, stage.status, onUpdate, showToast]);

  const tabs: { id: ActiveTab; label: string; badge?: number }[] = useMemo(
    () => [
      {
        id: 'tasks',
        label: 'משימות',
        badge: totalTasks > 0 ? totalTasks : undefined,
      },
      { id: 'notes', label: 'פתקים' },
      { id: 'files', label: 'קבצים', badge: stage.attachments?.length },
      { id: 'analytics', label: 'ניתוח' },
      { id: 'ai', label: 'AI' },
    ],
    [totalTasks, stage.attachments?.length]
  );

  return (
    <div
      className={`roadmap-stage-card ${stage.status === 'active' ? 'active' : ''} ${stage.status === 'completed' ? 'completed' : ''} ${isDragging ? 'opacity-70' : ''}`}
      draggable={enableDrag}
      onDragStart={enableDrag ? e => onDragStart(e, stage.id) : undefined}
      onDragEnter={enableDrag ? e => onDragEnter(e, stage.id) : undefined}
      onDragEnd={enableDrag ? onDragEnd : undefined}
    >
      {showConfetti && <Confetti />}

      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full p-5 cursor-pointer text-right"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--dynamic-accent-start)]/15 border-2 flex-shrink-0 transition-all"
              style={{ borderColor: `${statusColor} 40` }}
            >
              <span className="text-lg font-bold text-primary">{stage.order + 1}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-primary truncate">
                  {stage.title}
                </h3>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{
                    backgroundColor: `${statusColor} 20`,
                    color: statusColor,
                  }}
                >
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                {stage.startDate && stage.endDate && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(stage.startDate).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    –{' '}
                    {new Date(stage.endDate).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
                <span className="font-medium">
                  {completedTasks}/{totalTasks} משימות
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enableDrag && (
              <span
                className="p-1 text-muted hover:text-secondary cursor-grab active:cursor-grabbing"
                onClick={e => e.stopPropagation()}
              >
                <DragHandleIcon className="w-4 h-4" />
              </span>
            )}
            <ChevronLeftIcon
              className={`w-6 h-6 text-muted transition-transform duration-300 ${isExpanded ? '-rotate-90' : 'rotate-0'}`}
            />
          </div>
        </div>

        {stage.description && (
          <p className="mt-3 mr-[52px] text-sm text-muted leading-relaxed line-clamp-2">
            {stage.description}
          </p>
        )}

        <div className="mt-4 mr-[52px]">
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[var(--accent-gradient)] h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}% ` }}
            />
          </div>
          <p className="text-xs text-muted mt-1.5 font-medium">{Math.round(progress)}% הושלם</p>
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '2000px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="border-t border-[var(--border-primary)] px-4 flex items-center gap-2 overflow-x-auto bg-black/40 scrollbar-thin">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={e => {
                e.stopPropagation();
                setActiveTab(tab.id);
              }}
              className={`relative py-3 px-3 text-sm font-semibold shrink-0 border-b-2 transition-all ${activeTab === tab.id
                ? 'text-primary border-[var(--dynamic-accent-start)]'
                : 'text-muted border-transparent hover:text-primary hover:border-muted'
                }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-[var(--dynamic-accent-start)] text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
          <div className="mr-auto flex items-center gap-2 pr-2">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-full hover:bg-red-500/10 transition-colors"
            >
              מחק
            </button>
          </div>
        </div>

        <div className="p-5 bg-black/30">
          {activeTab === 'tasks' && (
            <TasksTab stage={stage} onUpdate={updates => onUpdate({ ...stage, ...updates })} />
          )}
          {activeTab === 'notes' && (
            <NotesTab
              stage={stage}
              onUpdate={updates => onUpdate({ ...stage, ...updates })}
              showToast={showToast}
            />
          )}
          {activeTab === 'files' && (
            <FilesTab stage={stage} onUpdate={updates => onUpdate({ ...stage, ...updates })} />
          )}
          {activeTab === 'analytics' && <AnalyticsTab stage={stage} />}
          {activeTab === 'ai' && (
            <AiInsightsTab
              stage={stage}
              onUpdate={updates => onUpdate({ ...stage, ...updates })}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const RoadmapScreen: React.FC<RoadmapScreenProps> = ({ item, onUpdate, onDelete, onClose }) => {
  const { setHasUnsavedChanges } = useUI();
  const today = new Date();
  const [phases, setPhases] = useState<RoadmapPhase[]>(
    item.phases && item.phases.length > 0
      ? [...item.phases].sort((a, b) => a.order - b.order)
      : sampleRoadmapData
  );
  const [toastMessage, setToastMessage] = useState('');
  const [viewMode, setViewMode] = useState<RoadmapViewMode>('list');
  const [draggingPhaseId, setDraggingPhaseId] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(''), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Warn about unsaved changes
  useEffect(() => {
    const originalPhases =
      item.phases && item.phases.length > 0
        ? [...item.phases].sort((a, b) => a.order - b.order)
        : sampleRoadmapData;

    const isDirty = JSON.stringify(phases) !== JSON.stringify(originalPhases);

    setHasUnsavedChanges(isDirty);

    return () => {
      setHasUnsavedChanges(false);
    };
  }, [phases, item.phases, setHasUnsavedChanges]);

  // נעילת גלילת body בזמן שהמודאל פתוח
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const updatePhases = (newPhases: RoadmapPhase[], toastMsg?: string) => {
    const sorted = newPhases.map((p, i) => ({ ...p, order: i }));
    setPhases(sorted);
    onUpdate(item.id, { phases: sorted });
    if (toastMsg) showToast(toastMsg);
  };

  const handleAddPhase = () => {
    const idx = phases.length;
    const lastPhase = phases[phases.length - 1];
    const start = lastPhase
      ? addDays(new Date(lastPhase.endDate || lastPhase.startDate || today), 1)
      : addDays(today, idx * 2);
    const end = addDays(start, 2);

    const newPhase: RoadmapPhase = {
      id: `phase - ${Date.now()} -${Math.random().toString(36).slice(2, 9)} `,
      title: `שלב ${idx + 1} `,
      description: 'תאר את המטרות והפעולות של שלב זה',
      duration: '2 days',
      startDate: formatDate(start),
      endDate: formatDate(end),
      notes: '',
      tasks: [],
      order: idx,
      attachments: [],
      status: 'pending',
      dependencies: [],
      estimatedHours: 4,
    };

    updatePhases([...phases, newPhase], 'שלב חדש נוסף');
  };

  const handleDeletePhase = (phaseId: string) => {
    updatePhases(
      phases.filter(p => p.id !== phaseId),
      'השלב נמחק'
    );
  };

  const handleUpdatePhase = (phaseId: string, updates: Partial<RoadmapPhase>) => {
    updatePhases(phases.map(p => (p.id === phaseId ? { ...p, ...updates } : p)));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingPhaseId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault();
    if (!draggingPhaseId || draggingPhaseId === overId) return;
    const current = [...phases];
    const fromIndex = current.findIndex(p => p.id === draggingPhaseId);
    const toIndex = current.findIndex(p => p.id === overId);
    if (fromIndex === -1 || toIndex === -1) return;

    const updated = [...current];
    const [moved] = updated.splice(fromIndex, 1);
    if (moved) {
      updated.splice(toIndex, 0, moved);
    }
    updatePhases(updated);
  };

  const handleDragEnd = () => {
    setDraggingPhaseId(null);
  };

  const { overallProgress, motivationalText, stats } = useMemo(() => {
    const allTasks = phases.flatMap(p => p.tasks);
    const completedPhases = phases.filter(p => p.status === 'completed').length;

    if (allTasks.length === 0) {
      return {
        overallProgress: 0,
        motivationalText: 'בוא נתחיל! הוסף משימות לשלבים כדי לעקוב אחרי ההתקדמות.',
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          totalPhases: phases.length,
          completedPhases,
        },
      };
    }

    const completedTasks = allTasks.filter(t => t.isCompleted).length;
    const progress = (completedTasks / allTasks.length) * 100;

    let text = 'בוא נתחיל! יש לך תוכנית טובה.';
    if (progress > 0 && progress < 25) text = '🚀 התחלה מצוינת, המשך כך.';
    if (progress >= 25 && progress < 50) text = '💪 התקדמות יפה, אתה על המסלול הנכון.';
    if (progress >= 50 && progress < 75) text = '🔥 יותר ממחצית הדרך מאחוריך.';
    if (progress >= 75 && progress < 100) text = '⭐ כמעט שם, עוד קצת דחיפה אחרונה.';
    if (progress === 100) text = '🎉 מדהים, השלמת את כל המטרות של מפת הדרכים הזו.';

    return {
      overallProgress: progress,
      motivationalText: text,
      stats: {
        totalTasks: allTasks.length,
        completedTasks,
        totalPhases: phases.length,
        completedPhases,
      },
    };
  }, [phases]);

  const groupedByStatus = useMemo(() => {
    const groups: Record<Status, RoadmapPhase[]> = {
      pending: [],
      active: [],
      completed: [],
    };
    phases.forEach(p => {
      groups[p.status].push(p);
    });
    return groups;
  }, [phases]);

  const timelinePhases = useMemo(
    () =>
      [...phases].sort((a, b) => {
        if (!a.startDate || !b.startDate) return a.order - b.order;
        return a.startDate.localeCompare(b.startDate);
      }),
    [phases]
  );

  const totalEstimatedHours = useMemo(
    () => phases.reduce((sum, p) => sum + (p.estimatedHours || 0), 0),
    [phases]
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 roadmap-modal-overlay"
      onClick={onClose}
    >
      <div className="bg-[#05060a] w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center shrink-0 bg-black/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
              aria-label="חזור"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex flex-col gap-0.5 text-right">
              <p className="text-xs font-semibold text-[var(--dynamic-accent-highlight)] uppercase tracking-wide">
                מפת דרכים
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate max-w-[50vw] sm:max-w-[60vw]">
                {item.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => showToast('הועתק ללוח (תממש אחר כך)')}
              className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
              aria-label="העתק"
            >
              <CopyIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => showToast('ייצוא יתממש בהמשך...')}
              className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
              aria-label="ייצא"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm('למחוק את מפת הדרכים הזו?')) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="p-2 rounded-full text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-95"
              aria-label="מחק"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 pb-24">
          <OverallProgressSummary progress={overallProgress} text={motivationalText} />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-right">
              <p className="text-xs text-gray-400 mb-0.5">שלבים</p>
              <p className="text-2xl font-bold text-white">
                {stats.completedPhases}/{stats.totalPhases}
              </p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-right">
              <p className="text-xs text-gray-400 mb-0.5">משימות</p>
              <p className="text-2xl font-bold text-white">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-right">
              <p className="text-xs text-gray-400 mb-0.5">התקדמות</p>
              <p className="text-2xl font-bold text-white">{Math.round(overallProgress)}%</p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-right">
              <p className="text-xs text-gray-400 mb-0.5">זמן מוערך</p>
              <p className="text-2xl font-bold text-white">{totalEstimatedHours}ש'</p>
            </div>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddPhase}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-95"
            >
              <AddIcon className="w-4 h-4" />
              הוסף שלב חדש
            </button>

            <div className="inline-flex items-center rounded-full bg-white/5 p-1 text-xs font-semibold text-gray-300">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                <ListIcon className="w-3 h-3" />
                רשימה
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${viewMode === 'kanban' ? 'bg-black text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                <LayoutDashboardIcon className="w-3 h-3" />
                קאנבן
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${viewMode === 'timeline' ? 'bg-black text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                <CalendarIcon className="w-3 h-3" />
                ציר זמן
              </button>
            </div>
          </div>

          {/* Empty state */}
          {phases.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                <LayoutDashboardIcon className="w-10 h-10 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">אין שלבים עדיין</h3>
                <p className="text-sm text-gray-400">התחל בבניית מפת הדרכים שלך</p>
              </div>
              <button
                type="button"
                onClick={handleAddPhase}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-[var(--dynamic-accent-start)] hover:bg-[var(--dynamic-accent-start)]/90 text-black transition-all active:scale-95"
              >
                <AddIcon className="w-5 h-5" />
                הוסף שלב ראשון
              </button>
            </div>
          )}

          {/* Views */}
          {viewMode === 'list' && phases.length > 0 && (
            <div className="space-y-3">
              {phases.map(phase => (
                <StageCard
                  key={phase.id}
                  stage={phase}
                  onUpdate={updates => handleUpdatePhase(phase.id, updates)}
                  onDelete={() => handleDeletePhase(phase.id)}
                  showToast={showToast}
                  enableDrag={true}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingPhaseId === phase.id}
                />
              ))}
            </div>
          )}

          {viewMode === 'kanban' && phases.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.entries(groupedByStatus) as [Status, RoadmapPhase[]][]).map(
                ([statusKey, items]) => {
                  const labelMap: Record<Status, string> = {
                    pending: 'ממתינים',
                    active: 'פעילים',
                    completed: 'הושלמו',
                  };
                  return (
                    <div
                      key={statusKey}
                      className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white">{labelMap[statusKey]}</h3>
                        <span className="text-xs text-gray-400">{items.length}</span>
                      </div>
                      <div className="space-y-3">
                        {items.map(phase => (
                          <StageCard
                            key={phase.id}
                            stage={phase}
                            onUpdate={updates => handleUpdatePhase(phase.id, updates)}
                            onDelete={() => handleDeletePhase(phase.id)}
                            showToast={showToast}
                            enableDrag={false}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={handleDragEnd}
                            isDragging={false}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {viewMode === 'timeline' && phases.length > 0 && (
            <div className="space-y-4">
              {timelinePhases.map(phase => (
                <div key={phase.id} className="relative pl-4">
                  <div className="absolute right-1 top-3 w-1 h-full bg-white/10 rounded-full" />
                  <div className="relative z-10">
                    <StageCard
                      stage={phase}
                      onUpdate={updates => handleUpdatePhase(phase.id, updates)}
                      onDelete={() => handleDeletePhase(phase.id)}
                      showToast={showToast}
                      enableDrag={false}
                      onDragStart={handleDragStart}
                      onDragEnter={handleDragEnter}
                      onDragEnd={handleDragEnd}
                      isDragging={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
            <div className="roadmap-toast bg-black/90 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold py-3 px-5 rounded-full flex items-center gap-2 shadow-2xl">
              <CheckCircleIcon className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
              {toastMessage}
            </div>
          </div>
        )}

        {/* FAB – AI לכל הרודמאפ (בינתיים טוסט בלבד) */}
        <button
          onClick={() => showToast('כאן AI יסכם את כל מפת הדרכים כשחובר ל־backend 🧠')}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-[var(--accent-gradient)] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="AI Summary"
        >
          <SparklesIcon className="w-7 h-7 text-white" />
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          background: linear-gradient(45deg, var(--dynamic-accent-start), var(--dynamic-accent-end));
          top: -10px;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default RoadmapScreen;
