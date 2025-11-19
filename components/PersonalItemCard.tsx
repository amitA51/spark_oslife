
import React, { useMemo, useRef, useCallback, useContext } from 'react';
import type { PersonalItem } from '../types';
import { 
    TrashIcon, CalendarIcon, CheckCircleIcon 
} from './icons';
import { PERSONAL_ITEM_TYPE_COLORS } from '../constants';
import { AppContext } from '../state/AppContext';
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

const PersonalItemCard: React.FC<PersonalItemCardProps> = ({ 
    item, onSelect, onUpdate, onDelete, onContextMenu, index, spaceColor, 
    onDragStart, onDragEnter, onDragEnd, isDragging, onLongPress, 
    isInSelectionMode, isSelected, searchQuery 
}) => {
  const { state } = useContext(AppContext);
  const longPressTimerRef = useRef<any>(null);
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (wasLongPressedRef.current) {
        e.preventDefault();
        return;
    }
    onSelect(item, e);
  }, [onSelect, item]);

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
                    <mark key={i} className="bg-[var(--dynamic-accent-highlight)]/50 text-white px-0 rounded-sm">{part}</mark>
                ) : ( part )
            )}
        </>
    );
  };

  const previewContent = useMemo(() => {
    if (item.type === 'book') return item.author;
    if (item.type === 'roadmap') return `${item.phases?.length || 0} שלבים`;
    if (!item.content) return '';
    let content = item.content.split('\n')[0];
    content = content.replace(/\[[x ]\]\s*/g, '');
    return content;
  }, [item.type, item.content, item.author, item.phases]);

  const isCompleted = item.isCompleted || item.status === 'done';
  const formattedDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }) : null;

  return (
    <div 
        className={`group themed-card relative transition-all duration-300 ease-[var(--fi-cubic-bezier)]
            ${onDragStart ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} 
            ${isDragging ? 'opacity-50 scale-95' : ''} 
            ${isSelected ? 'ring-2 ring-[var(--dynamic-accent-start)]' : ''}
            ${isCompleted ? 'opacity-60 grayscale' : ''}
        `}
        style={{ animationDelay: `${index * 40}ms` }}
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); if(longPressTimerRef.current) clearTimeout(longPressTimerRef.current); isInSelectionMode ? onSelect(item, e) : onContextMenu(e, item); }}
        onMouseDown={handlePointerDown} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp} onTouchStart={handlePointerDown} onTouchEnd={handlePointerUp}
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart && onDragStart(e, item)}
        onDragEnter={(e) => onDragEnter && onDragEnter(e, item)}
        onDragEnd={(e) => onDragEnd && onDragEnd(e)}
    >
        {isInSelectionMode && (
            <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center rounded-[1.25rem] backdrop-blur-[1px]">
                 <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--dynamic-accent-start)] border-[var(--dynamic-accent-start)]' : 'border-white/50 bg-black/50'}`}>
                    {isSelected && <CheckCircleIcon className="w-5 h-5 text-white" />}
                </div>
            </div>
        )}

        <div className="flex p-4 gap-4 items-center">
            {/* Icon Container - Updated for premium feel */}
            <div 
                className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
                style={{ 
                    backgroundColor: `${accentColor}10`, // Subtle wash
                    color: accentColor,
                    border: `1px solid ${accentColor}20`
                }}
            >
                <Icon className="w-6 h-6 drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
                {item.priority === 'high' && !isCompleted && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--danger)] rounded-full border-2 border-[var(--bg-card)] shadow-sm"></span>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <h3 className={`font-bold text-[var(--text-primary)] text-[1.05rem] leading-tight truncate tracking-tight group-hover:text-[var(--dynamic-accent-highlight)] transition-colors ${isCompleted ? 'line-through text-[var(--text-secondary)]' : ''}`}>
                        {highlightMatches(item.title, searchQuery || '')}
                    </h3>
                    
                    {/* Hidden actions that appear on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 translate-x-2 group-hover:translate-x-0">
                        {['task', 'goal'].includes(item.type) && (
                             <button onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { isCompleted: !item.isCompleted }) }} className="p-1.5 bg-white/5 hover:bg-white/15 rounded-lg text-[var(--success)] transition-colors backdrop-blur-sm">
                                <CheckCircleIcon className="w-4 h-4"/>
                            </button>
                        )}
                         <button onClick={handleDelete} className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors backdrop-blur-sm">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                {(previewContent || formattedDate) && (
                    <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)] opacity-90">
                         {formattedDate && (
                            <span className={`flex items-center gap-1 ${new Date(item.dueDate!) < new Date() && !isCompleted ? 'text-[var(--danger)]' : ''}`}>
                                <CalendarIcon className="w-3 h-3 opacity-70"/>
                                {formattedDate}
                            </span>
                        )}
                        {formattedDate && previewContent && <span className="w-1 h-1 rounded-full bg-white/20"></span>}
                        {previewContent && (
                            <span className="truncate max-w-[200px]">{highlightMatches(previewContent, searchQuery || '')}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default React.memo(PersonalItemCard);
