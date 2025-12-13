import React, { useState, useCallback, useRef } from 'react';
import type { PersonalItem, SwipeAction } from '../types';
import { TrashIcon, CheckCircleIcon, CalendarIcon } from './icons';
import { toDateKey } from '../utils/dateUtils';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import { useSettings } from '../src/contexts/SettingsContext';
import { UltraCard } from './ui/UltraCard';

interface TaskItemProps {
  item: PersonalItem;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onDelete: (id: string) => void;
  onSelect: (item: PersonalItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
  // onStartFocus removed - timer feature not used
  index: number;
}

const CustomCheckbox: React.FC<{ checked: boolean; onToggle: () => void; title: string }> = ({
  checked,
  onToggle,
  title,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ease-spring-soft
                ${checked ? 'bg-gradient-to-br from-accent-cyan to-accent-violet shadow-glow-cyan scale-110' : 'bg-white/5 border-2 border-white/20 hover:border-accent-cyan/50'}
                ${isAnimating ? 'animate-check-bounce' : ''}
            `}
      aria-label={`סמן את ${title} כ${checked ? 'לא הושלם' : 'הושלם'}`}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && <CheckCircleIcon className="w-4 h-4 text-cosmos-black" />}
    </button>
  );
};

const TaskItem: React.FC<TaskItemProps> = ({
  item,
  onUpdate,
  onDelete,
  onSelect,
  onContextMenu,
  index,
}) => {
  const { triggerHaptic } = useHaptics();
  const { playSuccess, playToggle } = useSound();
  const { settings } = useSettings();
  const { swipeRightAction, swipeLeftAction } = settings;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const isTogglingRef = useRef(false); // Guard against rapid double-taps
  const swipeThreshold = 100;

  const handleToggle = useCallback(() => {
    // Prevent rapid double-tap race condition
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    triggerHaptic('light');

    const isCompleting = !item.isCompleted;
    if (isCompleting) {
      playSuccess();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    } else {
      playToggle(false);
    }

    onUpdate(item.id, {
      isCompleted: !item.isCompleted,
      lastCompleted: !item.isCompleted ? new Date().toISOString() : undefined,
    });

    // Reset guard after a short delay to allow state to propagate
    setTimeout(() => { isTogglingRef.current = false; }, 300);
  }, [item.id, item.isCompleted, onUpdate, triggerHaptic, playSuccess, playToggle]);


  const handleDelete = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      triggerHaptic('heavy');
      onDelete(item.id);
    },
    [item.id, onDelete, triggerHaptic]
  );

  const handleDeferToTomorrow = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      triggerHaptic('light');

      const baseDate = item.dueDate ? new Date(item.dueDate) : new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      const tomorrowStr = toDateKey(baseDate);

      onUpdate(item.id, { dueDate: tomorrowStr });
    },
    [item.id, item.dueDate, onUpdate, triggerHaptic]
  );

  const executeSwipeAction = (action: SwipeAction) => {
    if (action === 'complete') handleToggle();
    else if (action === 'delete') handleDelete();
    else if (action === 'postpone') handleDeferToTomorrow();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !e.touches || !e.touches[0]) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    if (Math.abs(diff) < 200) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    if (swipeOffset > swipeThreshold) {
      if (swipeRightAction !== 'none') {
        executeSwipeAction(swipeRightAction);
      }
    } else if (swipeOffset < -swipeThreshold) {
      if (swipeLeftAction !== 'none') {
        executeSwipeAction(swipeLeftAction);
      }
    }

    setSwipeOffset(0);
    touchStartX.current = null;
  };

  const getActionColor = (action: SwipeAction) => {
    switch (action) {
      case 'complete': return 'bg-emerald-500/20 text-emerald-400';
      case 'delete': return 'bg-red-500/20 text-red-400';
      case 'postpone': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-transparent';
    }
  };

  const getActionIcon = (action: SwipeAction) => {
    switch (action) {
      case 'complete': return <CheckCircleIcon className="w-6 h-6" />;
      case 'delete': return <TrashIcon className="w-6 h-6" />;
      case 'postpone': return <CalendarIcon className="w-6 h-6" />;
      default: return null;
    }
  };

  const totalCount = item.subTasks?.length || 0;
  const completedCount = item.subTasks?.filter(st => st.isCompleted).length || 0;

  const getRelativeDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    due.setHours(23, 59, 59, 999);

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

    if (diffDays < 0) return <span className="text-red-400 font-medium">עבר הזמן</span>;
    if (diffDays === 0) return <span className="text-amber-400 font-medium">היום</span>;
    if (diffDays === 1) return <span className="font-medium" style={{ color: 'var(--dynamic-accent-start)' }}>מחר</span>;
    return <span className="text-gray-500">בעוד {diffDays} ימים</span>;
  };

  const relativeDue = getRelativeDueDate(item.dueDate);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3 group/item">
      {/* Swipe Backgrounds */}
      <div className={`absolute inset-0 flex items-center justify-start pl-6 transition-opacity duration-200 ${getActionColor(swipeRightAction)} ${swipeOffset > 0 ? 'opacity-100' : 'opacity-0'}`}>
        {getActionIcon(swipeRightAction)}
      </div>
      <div className={`absolute inset-0 flex items-center justify-end pr-6 transition-opacity duration-200 ${getActionColor(swipeLeftAction)} ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}>
        {getActionIcon(swipeLeftAction)}
      </div>

      {/* Celebration Particles */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full animate-celebration-particle"
              style={{
                backgroundColor: ['#00F0FF', '#7B61FF', '#FF006E', '#FFB800', '#10B981', '#F43F5E', '#8B5CF6', '#EC4899'][i],
                animationDelay: `${i * 0.05}s`,
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(${20 + Math.random() * 30}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Item Content */}
      <UltraCard
        variant="glass"
        onClick={e => {
          if (!(e.target as HTMLElement).closest('button') && swipeOffset === 0) {
            onSelect(item, e);
          }
        }}
        onContextMenu={e => onContextMenu(e, item)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          relative p-4 flex items-start gap-4 
          transition-all duration-300 ease-spring-soft
          hover:shadow-lg hover:-translate-y-1
          active:scale-[0.98] cursor-pointer
          ${item.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}
          rounded-2xl
        `}
        glowColor="neutral"
        noPadding
        style={{
          x: swipeOffset,
          animationDelay: `${index * 50}ms`,
        } as any}
        role="button"
        tabIndex={0}
      >
        <div className="pt-1">
          <CustomCheckbox
            checked={!!item.isCompleted}
            onToggle={handleToggle}
            title={item.title || ''}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-base font-medium leading-snug transition-colors ${item.isCompleted ? 'text-gray-500 line-through decoration-white/20' : 'text-white'}`}>
              {item.title}
            </p>
            {item.priority === 'high' && !item.isCompleted && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] mt-1.5" />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {item.dueDate && (
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                <CalendarIcon className="w-3 h-3 opacity-70" />
                {relativeDue}
                {item.dueTime && <span className="opacity-50">| {item.dueTime}</span>}
              </div>
            )}

            {totalCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-accent-cyan transition-all"
                    style={{
                      width: `${(completedCount / totalCount) * 100}%`,
                      transitionDuration: 'var(--transition-speed)'
                    }}
                  />
                </div>
                <span className="font-mono opacity-70">{completedCount}/{totalCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-cosmos-depth/90 backdrop-blur-sm rounded-xl p-1 border border-white/10 shadow-xl translate-x-4 group-hover/item:translate-x-0 ease-spring-soft" style={{ transitionDuration: 'var(--transition-speed)' }}>
          <button
            onClick={handleDeferToTomorrow}
            className="p-2 text-gray-400 hover:text-accent-violet hover:bg-white/5 rounded-lg transition-colors"
            title="דחה למחר"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="מחק"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </UltraCard>
    </div>
  );
};

export default React.memo(TaskItem);
