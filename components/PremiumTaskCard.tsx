import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PersonalItem } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';
import {
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  GripVerticalIcon,
  ClockIcon,
  EyeOffIcon,
} from './icons';
import { useHaptics } from '../hooks/useHaptics';

interface PremiumTaskCardProps {
  item: PersonalItem;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onDelete: (id: string) => void;
  onSelect: (item: PersonalItem) => void;
  onReschedule?: (item: PersonalItem) => void;
  onHide?: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const PremiumTaskCard: React.FC<PremiumTaskCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onSelect,
  onReschedule,
  onHide,
  isDragging,
  dragHandleProps,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [showActions, setShowActions] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const titleRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHaptics();
  const { settings } = useSettings();
  const { swipeRightAction, swipeLeftAction } = settings;

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(titleRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (editedTitle?.trim() && editedTitle !== item.title) {
      onUpdate(item.id, { title: editedTitle.trim() });
      triggerHaptic('light');
    } else {
      setEditedTitle(item.title);
    }
    setIsEditing(false);
  }, [editedTitle, item.id, item.title, onUpdate, triggerHaptic]);

  const handleCancel = useCallback(() => {
    setEditedTitle(item.title);
    setIsEditing(false);
  }, [item.title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleComplete = useCallback(() => {
    onUpdate(item.id, {
      isCompleted: !item.isCompleted,
      lastCompleted: !item.isCompleted ? new Date().toISOString() : undefined,
    });
    triggerHaptic('medium');
  }, [item.id, item.isCompleted, onUpdate, triggerHaptic]);

  const handleDeleteClick = useCallback(() => {
    if (window.confirm('למחוק משימה זו?')) {
      onDelete(item.id);
      triggerHaptic('heavy');
    }
  }, [item.id, onDelete, triggerHaptic]);

  const getPriorityColor = () => {
    switch (item.priority) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_-4px_rgba(248,113,113,0.3)]';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_-4px_rgba(251,191,36,0.3)]';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_-4px_rgba(96,165,250,0.3)]';
      default:
        return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getPriorityLabel = () => {
    switch (item.priority) {
      case 'high':
        return 'P1';
      case 'medium':
        return 'P2';
      case 'low':
        return 'P3';
      default:
        return null;
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    return time.substring(0, 5);
  };

  return (
    <div className="relative group mb-2">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-end px-4 gap-2 rounded-xl bg-[var(--bg-secondary)] border border-white/5">
        {onHide && (
          <button
            onClick={() => onHide(item.id)}
            className="flex flex-col items-center justify-center w-12 h-full text-white/40 hover:text-white transition-colors"
          >
            <EyeOffIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">הסתר</span>
          </button>
        )}
        <button
          onClick={handleDeleteClick}
          className="flex flex-col items-center justify-center w-12 h-full text-red-400/60 hover:text-red-400 transition-colors"
        >
          <TrashIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">מחק</span>
        </button>
      </div>

      {/* Foreground Card */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: -150,
          right: swipeRightAction !== 'none' ? 150 : 0
        }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          const threshold = 100;

          // Right Swipe
          if (info.offset.x > threshold && swipeRightAction !== 'none') {
            if (swipeRightAction === 'complete') handleComplete();
            else if (swipeRightAction === 'delete') handleDeleteClick();
            else if (swipeRightAction === 'postpone' && onReschedule) onReschedule(item);
            setDragOffset(0);
            return;
          }

          // Left Swipe
          if (info.offset.x < -threshold && swipeLeftAction !== 'none') {
            if (swipeLeftAction === 'complete') handleComplete();
            else if (swipeLeftAction === 'delete') handleDeleteClick();
            else if (swipeLeftAction === 'postpone' && onReschedule) onReschedule(item);
            setDragOffset(0);
            return;
          }

          // Default Reveal Behavior (if no action triggered)
          if (info.offset.x < -75) {
            setDragOffset(-140);
          } else {
            setDragOffset(0);
          }
        }}
        animate={{ x: dragOffset }}
        className={`
                    relative bg-[var(--bg-card)]/90 backdrop-blur-sm rounded-xl border border-white/5
                    transition-colors duration-300 z-10
                    hover:border-[var(--dynamic-accent-start)]/30
                    hover:shadow-lg hover:shadow-[var(--dynamic-accent-start)]/5
                    ${isDragging ? 'opacity-50 scale-95 shadow-xl ring-2 ring-[var(--dynamic-accent-start)]/50' : ''}
                    ${item.isCompleted ? 'opacity-50 grayscale-[0.5]' : ''}
                `}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-start gap-3 p-3.5">
          <div
            {...(dragHandleProps || {})}
            className={`flex-shrink-0 cursor-grab active:cursor-grabbing text-white/20 hover:text-white transition-colors mt-1 ${showActions || isDragging ? 'opacity-100' : 'opacity-0'}`}
          >
            <GripVerticalIcon className="w-4 h-4" />
          </div>

          <button onClick={handleComplete} className="flex-shrink-0 mt-0.5 group/check">
            <div
              className={`
                            w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                            ${item.isCompleted
                  ? 'bg-[var(--success)] border-[var(--success)] scale-100'
                  : 'border-white/20 group-hover/check:border-[var(--dynamic-accent-start)] group-hover/check:bg-[var(--dynamic-accent-start)]/10'
                }
                        `}
            >
              {item.isCompleted && <CheckCircleIcon className="w-3 h-3 text-white" />}
            </div>
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-white font-medium outline-none bg-white/5 px-2 py-1 rounded border border-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)] text-base leading-relaxed"
              >
                {editedTitle}
              </div>
            ) : (
              <div
                onClick={() => !item.isCompleted && setIsEditing(true)}
                className={`
                                    text-white/90 font-medium cursor-pointer transition-all duration-200 text-base leading-relaxed
                                    ${item.isCompleted ? 'line-through text-white/40' : 'hover:text-[var(--dynamic-accent-start)]'}
                                `}
              >
                {item.title}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {getPriorityLabel() && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${getPriorityColor()}`}
                >
                  {getPriorityLabel()}
                </span>
              )}
              {item.dueTime && (
                <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  <ClockIcon className="w-3 h-3" />
                  {formatTime(item.dueTime)}
                </span>
              )}
              {item.dueDate && item.dueDate !== new Date().toISOString().split('T')[0] && (
                <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(item.dueDate).toLocaleDateString('he-IL', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          <div
            className={`
                        flex items-center gap-1 flex-shrink-0 transition-all duration-300 
                        ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                    `}
          >
            <button
              onClick={() => onSelect(item)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="ערוך פרטים"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            {onReschedule && (
              <button
                onClick={() => onReschedule(item)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                title="תזמן מחדש"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
              title="מחק"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(PremiumTaskCard);
