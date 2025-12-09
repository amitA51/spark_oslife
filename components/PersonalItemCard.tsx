import React, { useMemo, useRef, useCallback } from 'react';
import type { PersonalItem } from '../types';
import { TrashIcon, CalendarIcon, CheckCircleIcon } from './icons';
import { PERSONAL_ITEM_TYPE_COLORS } from '../constants';
import { getIconForName } from './IconMap';

interface PersonalItemCardProps {
  item: PersonalItem;
  onSelect: (item: PersonalItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
  onDelete: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
  index: number;
  spaceColor?: string;
  onDragStart?: (event: React.DragEvent, item: PersonalItem) => void;
  onDragEnter?: (event: React.DragEvent, item: PersonalItem) => void;
  onDragEnd?: (event: React.DragEvent) => void;
  isDragging?: boolean;
  onLongPress: (item: PersonalItem) => void;
  isInSelectionMode: boolean;
  isSelected: boolean;
  searchQuery?: string;
}

const PersonalItemCard: React.FC<PersonalItemCardProps> = props => {
  const {
    item,
    onSelect,
    onUpdate,
    onDelete,
    onContextMenu,
    index,
    spaceColor,
    onDragStart,
    onDragEnter,
    onDragEnd,
    isDragging,
    onLongPress,
    isInSelectionMode,
    isSelected,
    searchQuery,
  } = props;

  const longPressTimerRef = useRef<number | null>(null);
  const wasLongPressedRef = useRef(false);

  const typeColor = PERSONAL_ITEM_TYPE_COLORS[item.type];
  const accentColor = spaceColor || typeColor;
  const Icon = item.icon ? getIconForName(item.icon) : getIconForName('sparkles');

  const handlePointerDown = useCallback(() => {
    wasLongPressedRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      if (!isInSelectionMode) {
        onLongPress(item);
        wasLongPressedRef.current = true;
      }
    }, 500);
  }, [item, onLongPress, isInSelectionMode]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (wasLongPressedRef.current) {
        e.preventDefault();
        return;
      }
      onSelect(item, e);
    },
    [onSelect, item]
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const highlightMatches = (text: string, query: string) => {
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-accent-cyan/30 text-white px-0.5 rounded-sm font-medium"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const previewContent = useMemo(() => {
    if (item.type === 'book') return item.author;
    if (item.type === 'roadmap') return `${item.phases?.length || 0} שלבים`;
    if (!item.content) return '';
    let content = item.content.split('\n')[0];
    content = (content || '').replace(/\[[x ]\]\s*/g, '');
    return content;
  }, [item.type, item.content, item.author, item.phases]);

  const isCompleted = item.isCompleted || item.status === 'done';
  const formattedDate = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
    : null;

  return (
    <div
      className={`group relative transition-all duration-base ease-spring-soft
            ${onDragStart ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} 
            ${isDragging ? 'opacity-50 scale-95' : ''} 
            ${isSelected ? 'ring-2 ring-accent-cyan shadow-glow-cyan' : ''}
            ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}
            rounded-xl
        `}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={handleClick}
      onContextMenu={e => {
        e.preventDefault();
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        isInSelectionMode ? onSelect(item, e) : onContextMenu(e, item);
      }}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      draggable={!!onDragStart}
      onDragStart={e => onDragStart && onDragStart(e, item)}
      onDragEnter={e => onDragEnter && onDragEnter(e, item)}
      onDragEnd={e => onDragEnd && onDragEnd(e)}
    >
      {/* Premium Card Background & Effects */}
      <div
        className="absolute inset-0 bg-cosmos-depth/80 backdrop-blur-md rounded-xl border border-white/5 transition-all duration-base ease-spring-soft group-hover:bg-cosmos-depth group-hover:border-white/10 group-hover:-translate-y-1 group-hover:shadow-lg"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3)' }}
      />

      {/* Selection Overlay */}
      {isInSelectionMode && (
        <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center rounded-xl backdrop-blur-[2px] transition-all duration-fast">
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-fast ease-spring-soft ${isSelected ? 'bg-accent-cyan border-accent-cyan scale-110' : 'border-white/50 bg-black/50'}`}
          >
            {isSelected && <CheckCircleIcon className="w-5 h-5 text-cosmos-black" />}
          </div>
        </div>
      )}

      <div className="relative z-10 flex p-5 gap-4 items-center">
        {/* Icon Container - Premium Depth */}
        <div
          className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-base ease-spring-soft group-hover:scale-105"
        >
          {/* Icon Background Layer - Enhanced Gradient */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}15 100%)` }}
          />

          {/* Inner Shadow/Depth Layer */}
          <div className="absolute inset-0 rounded-xl shadow-inner border border-white/10" />

          {/* The Icon */}
          <Icon
            className="w-6 h-6 relative z-10 drop-shadow-sm transition-transform duration-base ease-spring-soft group-hover:rotate-3"
            style={{ color: accentColor }}
          />

          {/* Priority Indicator */}
          {item.priority === 'high' && !isCompleted && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-cosmos-depth shadow-sm z-20 animate-pulse"></span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <h3
              className={`font-heading font-bold text-base leading-tight truncate tracking-tight text-gray-100 group-hover:text-white transition-colors duration-fast ${isCompleted ? 'line-through text-gray-500' : ''}`}
            >
              {highlightMatches(item.title || '', searchQuery || '')}
            </h3>

            {/* Hidden actions that appear on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-fast ease-out flex gap-1 translate-x-2 group-hover:translate-x-0">
              {['task', 'goal'].includes(item.type) && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onUpdate(item.id, { isCompleted: !item.isCompleted });
                  }}
                  className="p-1.5 bg-white/5 hover:bg-green-500/20 rounded-lg text-green-400 transition-all backdrop-blur-sm border border-transparent hover:border-green-500/30"
                  title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all backdrop-blur-sm border border-transparent hover:border-red-500/30"
                title="Delete item"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {(previewContent || formattedDate) && (
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-fast">
              {formattedDate && (
                <span
                  className={`flex items-center gap-1.5 ${new Date(item.dueDate!) < new Date() && !isCompleted ? 'text-red-400' : ''}`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                  {formattedDate}
                </span>
              )}
              {formattedDate && previewContent && (
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              )}
              {previewContent && (
                <span className="truncate max-w-[200px] opacity-80">
                  {highlightMatches(previewContent, searchQuery || '')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PersonalItemCard);
