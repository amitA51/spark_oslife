
import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import type { PersonalItem, SwipeAction } from '../types';
import { TrashIcon, CheckCircleIcon, PlayIcon, CalendarIcon, StopwatchIcon } from './icons';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import { AppContext } from '../state/AppContext';

interface TaskItemProps {
  item: PersonalItem;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onDelete: (id: string) => void;
  onSelect: (item: PersonalItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
  onStartFocus: (item: PersonalItem) => void;
  index: number;
}

const CustomCheckbox: React.FC<{ checked: boolean; onToggle: () => void; title: string }> = ({ checked, onToggle, title }) => {
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
            className={`relative h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 transform active:scale-90
                ${checked ? 'bg-[var(--accent-gradient)] shadow-[0_0_12px_var(--dynamic-accent-glow)]' : 'bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)]'}
                ${isAnimating ? 'animate-check-bounce' : ''}
            `}
            aria-label={`סמן את ${title} כ${checked ? 'לא הושלם' : 'הושלם'}`}
            aria-checked={checked}
            role="checkbox"
        >
           {checked && <CheckCircleIcon className="w-9 h-9 text-white" />}
        </button>
    );
};

const TaskItem: React.FC<TaskItemProps> = ({ item, onUpdate, onDelete, onSelect, onContextMenu, onStartFocus, index }) => {
  const { state } = useContext(AppContext);
  const { triggerHaptic } = useHaptics();
  const { playSuccess, playToggle } = useSound();
  const { swipeRightAction, swipeLeftAction } = state.settings;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const swipeThreshold = 100; // Distance to trigger action
  
  const handleToggle = useCallback(() => {
    triggerHaptic('light');
    
    const isCompleting = !item.isCompleted;
    if (isCompleting) {
        playSuccess();
    } else {
        playToggle(false);
    }

    onUpdate(item.id, {
      isCompleted: !item.isCompleted,
      lastCompleted: !item.isCompleted ? new Date().toISOString() : undefined,
    });
  }, [item.id, item.isCompleted, onUpdate, triggerHaptic, playSuccess, playToggle]);

  const handleStartFocusSession = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onStartFocus(item);
  }, [item, onStartFocus]);

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('heavy');
    onDelete(item.id);
  }, [item.id, onDelete, triggerHaptic]);

  const handleDeferToTomorrow = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('light');

    const baseDate = item.dueDate ? new Date(item.dueDate) : new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    const tomorrowStr = baseDate.toISOString().split('T')[0];

    onUpdate(item.id, { dueDate: tomorrowStr });
  }, [item.id, item.dueDate, onUpdate, triggerHaptic]);

  const executeSwipeAction = (action: SwipeAction) => {
      if (action === 'complete') handleToggle();
      else if (action === 'delete') handleDelete();
      else if (action === 'postpone') handleDeferToTomorrow();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - touchStartX.current;
      
      // Limit drag to reasonable bounds
      if (Math.abs(diff) < 200) {
          setSwipeOffset(diff);
      }
  };

  const handleTouchEnd = () => {
      if (touchStartX.current === null) return;
      
      if (swipeOffset > swipeThreshold) { // Swiped Right
          if (swipeRightAction !== 'none') {
            executeSwipeAction(swipeRightAction);
          }
      } else if (swipeOffset < -swipeThreshold) { // Swiped Left
          if (swipeLeftAction !== 'none') {
            executeSwipeAction(swipeLeftAction);
          }
      }
      
      setSwipeOffset(0);
      touchStartX.current = null;
  };

  const getActionColor = (action: SwipeAction) => {
      switch(action) {
          case 'complete': return 'bg-[var(--success)]';
          case 'delete': return 'bg-[var(--danger)]';
          case 'postpone': return 'bg-[var(--warning)]';
          default: return 'bg-transparent';
      }
  };

  const getActionIcon = (action: SwipeAction) => {
      switch(action) {
          case 'complete': return <CheckCircleIcon className="w-6 h-6 text-white" />;
          case 'delete': return <TrashIcon className="w-6 h-6 text-white" />;
          case 'postpone': return <CalendarIcon className="w-6 h-6 text-white" />;
          default: return null;
      }
  };

  const completedCount = item.subTasks?.filter(st => st.isCompleted).length || 0;
  const totalCount = item.subTasks?.length || 0;

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'border-l-[var(--danger)]';
      case 'medium': return 'border-l-[var(--dynamic-accent-start)]';
      case 'low': return 'border-l-[var(--text-secondary)]';
      default: return 'border-l-transparent';
    }
  };

  const getRelativeDueDate = (dueDate?: string) => {
      if (!dueDate) return null;
      const due = new Date(dueDate);
      const now = new Date();
      now.setHours(0,0,0,0);
      due.setHours(23,59,59,999);
      
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

      if (diffDays < 0) return <span className="text-[var(--danger)]">עבר הזמן</span>;
      if (diffDays === 0) return <span className="text-[var(--warning)]">היום</span>;
      if (diffDays === 1) return <span className="text-[var(--dynamic-accent-highlight)]">מחר</span>;
      return <span className="text-[var(--text-secondary)]">בעוד {diffDays} ימים</span>;
  };

  const relativeDue = getRelativeDueDate(item.dueDate);
  const subTasksProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] mb-3">
        {/* Swipe Backgrounds */}
        <div className={`absolute inset-0 flex items-center justify-start pl-6 transition-opacity duration-200 ${getActionColor(swipeRightAction)} ${swipeOffset > 0 ? 'opacity-100' : 'opacity-0'}`}>
            {getActionIcon(swipeRightAction)}
        </div>
        <div className={`absolute inset-0 flex items-center justify-end pr-6 transition-opacity duration-200 ${getActionColor(swipeLeftAction)} ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}>
            {getActionIcon(swipeLeftAction)}
        </div>

        {/* Main Item Content */}
        <div
            onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button') && swipeOffset === 0) {
                onSelect(item, e);
                }
            }}
            onContextMenu={(e) => onContextMenu(e, item)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`group relative themed-card p-4 flex items-start gap-4 border-l-4 transition-transform duration-200 ease-out ${getPriorityColor(item.priority)} ${item.isCompleted ? 'task-completed completed-item' : ''} cursor-pointer active:scale-97 animate-item-enter-fi mb-0 rounded-[1.25rem]`}
            style={{ 
                transform: `translateX(${swipeOffset}px)`, 
                animationDelay: `${index * 50}ms` 
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(item, e);
                }
            }}
            aria-label={`פרטי משימה: ${item.title}`}
        >
        <CustomCheckbox checked={!!item.isCompleted} onToggle={handleToggle} title={item.title} />

        <div className="flex-1 overflow-hidden pt-0.5">
            <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
                <p className={`relative task-text text-lg text-[var(--text-primary)] transition-colors truncate ${item.isCompleted ? 'text-[var(--text-secondary)]' : ''}`}>
                {item.title}
                </p>
                {totalCount > 0 && !item.isCompleted && (
                    <span className="text-xs text-[var(--text-secondary)] font-mono shrink-0">
                        ({completedCount}/{totalCount})
                    </span>
                )}
            </div>
            {item.priority === 'high' && !item.isCompleted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--danger)]/15 text-[var(--danger)] font-semibold shrink-0">
                חשוב
                </span>
            )}
            </div>

            {item.dueDate && (
            <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                <CalendarIcon className="w-3 h-3" />
                {relativeDue}
                {item.dueTime && ` · ${item.dueTime}`}
                </span>
            </div>
            )}

            {totalCount > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                className="h-full rounded-full bg-[var(--dynamic-accent-start)] transition-all"
                style={{ width: `${subTasksProgress}%` }}
                />
            </div>
            )}
        </div>

        <div className="flex flex-col items-center justify-start gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
            onClick={handleStartFocusSession}
            className="text-[var(--text-secondary)] hover:text-[var(--accent-highlight)]"
            aria-label={`התחל סשן פוקוס עבור: ${item.title}`}
            >
            <PlayIcon className="h-5 w-5" />
            </button>
            <button
            onClick={handleDeferToTomorrow}
            className="text-[var(--text-secondary)] hover:text-[var(--dynamic-accent-highlight)]"
            aria-label={`דחה את המשימה ${item.title} למחר`}
            >
            <CalendarIcon className="h-5 w-5" />
            </button>
            <button
            onClick={handleDelete}
            className="text-[var(--text-secondary)] hover:text-[var(--danger)]"
            aria-label={`מחק משימה: ${item.title}`}
            >
            <TrashIcon className="h-5 w-5" />
            </button>
        </div>
        </div>
    </div>
  );
};

export default React.memo(TaskItem);
