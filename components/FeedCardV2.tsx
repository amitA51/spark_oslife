
import React, { useState, useEffect, useRef, useContext } from 'react';
import type { FeedItem } from '../types';
import { SparklesIcon, FeedIcon, CheckCircleIcon, BrainCircuitIcon, LinkIcon } from './icons';
import { getTagColor } from './icons';
import { AppContext } from '../state/AppContext';

interface FeedCardV2Props {
  item: FeedItem;
  index: number;
  onSelect: (item: FeedItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onLongPress: (item: FeedItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FeedItem) => void;
  isInSelectionMode: boolean;
  isSelected: boolean;
}

const getFaviconUrl = (link: string) => {
    try {
        const url = new URL(link);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch (e) {
        return ''; 
    }
};

const FeedCardV2: React.FC<FeedCardV2Props> = ({ item, index, onSelect, onLongPress, onContextMenu, isInSelectionMode, isSelected }) => {
  const { state } = useContext(AppContext);
  const { cardStyle } = state.settings.themeSettings;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || cardStyle !== 'glass') return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, [cardStyle]);

  const contentSnippet = item.summary_ai || item.content.split('\n')[0].replace(/<[^>]*>?/gm, '');
  
  let sourceText: string;
  let TypeIcon: React.FC<any> = FeedIcon;
  
  if (item.type === 'rss' && item.link) {
    sourceText = new URL(item.link).hostname.replace('www.', '');
    TypeIcon = FeedIcon;
  } else if (item.type === 'spark') {
    sourceText = item.source === 'AI_GENERATED' ? 'Spark AI' : 'Personal Spark';
    TypeIcon = item.source === 'AI_GENERATED' ? BrainCircuitIcon : SparklesIcon;
  } else if (item.type === 'mentor') {
    sourceText = item.title.split(':')[0] || 'Mentor';
    TypeIcon = BrainCircuitIcon;
  } else {
    sourceText = 'Unknown';
  }
  
  const faviconUrl = item.type === 'rss' && item.link ? getFaviconUrl(item.link) : null;

  return (
    <div
      ref={cardRef}
      onClick={(e) => onSelect(item, e)}
      onContextMenu={(e) => { e.preventDefault(); isInSelectionMode ? onSelect(item, e) : onContextMenu(e, item); }}
      className={`group relative themed-card p-5 transition-all duration-300 ease-out cursor-pointer
        ${item.is_read && !isInSelectionMode ? 'opacity-60 grayscale-[0.4]' : ''}
        ${isSelected ? 'ring-2 ring-[var(--dynamic-accent-start)] bg-[var(--dynamic-accent-start)]/10' : ''}`}
      role="button"
      tabIndex={0}
      style={{ animationDelay: `${index * 50}ms` }}
    >
       {/* Selection Overlay */}
       {isInSelectionMode && (
          <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center rounded-[1.25rem] backdrop-blur-[1px]">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--dynamic-accent-start)] border-[var(--dynamic-accent-start)]' : 'border-white/50 bg-black/50'}`}>
                  {isSelected && <CheckCircleIcon className="w-5 h-5 text-white" />}
              </div>
          </div>
       )}

      <div className={`flex flex-col gap-3 relative z-10 ${isInSelectionMode ? 'opacity-40' : ''}`}>
        
        {/* Header: Source Metadata */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                {faviconUrl ? (
                    <img src={faviconUrl} alt="" className="w-6 h-6 rounded-full bg-white/5 p-0.5 shadow-sm" />
                ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 text-[var(--text-secondary)]">
                        <TypeIcon className="w-3.5 h-3.5" />
                    </div>
                )}
                <span className="text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">{sourceText}</span>
                {!item.is_read && <span className="w-2 h-2 bg-[var(--dynamic-accent-start)] rounded-full shadow-[0_0_8px_var(--dynamic-accent-start)] animate-pulse"></span>}
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] opacity-60 font-mono">
                {new Date(item.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
            </span>
        </div>

        {/* Title & Snippet */}
        <div>
             <h3 className={`text-lg font-bold text-[var(--text-primary)] leading-snug mb-2 group-hover:text-[var(--dynamic-accent-highlight)] transition-colors line-clamp-2 tracking-tight`}>
                {item.title}
             </h3>
             {contentSnippet && (
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-light opacity-90">
                    {contentSnippet}
                </p>
             )}
        </div>

        {/* Tags & Actions */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
             <div className="flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => {
                    const colors = getTagColor(tag.name);
                    return (
                        <span 
                            key={tag.id} 
                            className="text-[10px] font-bold px-2 py-1 rounded-md border border-white/5"
                            style={{ backgroundColor: `${colors.backgroundColor}`, color: colors.textColor }}
                        >
                            {tag.name}
                        </span>
                    );
                })}
             </div>
             {item.link && (
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 p-1.5 rounded-lg hover:bg-white/10">
                     <LinkIcon className="w-4 h-4 text-[var(--text-secondary)] hover:text-white" />
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedCardV2);
