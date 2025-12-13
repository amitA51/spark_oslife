import React, { useRef, useState, useMemo, useCallback } from 'react';
import type { FeedItem } from '../types';
import { SparklesIcon, FeedIcon, CheckCircleIcon, BrainCircuitIcon, LinkIcon, ClockIcon, BookmarkIcon } from './icons';
import { getTagColor } from './icons';
import { useHaptics } from '../hooks/useHaptics';
import { UltraCard } from './ui/UltraCard';

interface FeedCardProps {
  item: FeedItem;
  index: number;
  onSelect: (item: FeedItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onLongPress: (item: FeedItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FeedItem) => void;
  isInSelectionMode: boolean;
  isSelected: boolean;
  onMarkAsRead?: (item: FeedItem) => void;
  onToggleSave?: (item: FeedItem) => void;
  priority?: boolean;
}

// Extract image from content or use og:image
const extractImageFromContent = (content: string, link?: string): string | null => {
  const imgMatch = content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    const src = imgMatch[1];
    if (!src.includes('pixel') && !src.includes('tracking') && !src.includes('1x1')) {
      return src;
    }
  }
  const mediaMatch = content?.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]) return mediaMatch[1];
  return null;
};

const calculateReadingTime = (content: string): number => {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, Math.min(minutes, 30));
};

const getFaviconUrl = (link: string) => {
  try {
    const url = new URL(link);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch (e) {
    return '';
  }
};

const FeedCard: React.FC<FeedCardProps> = ({
  item,
  index,
  onSelect,
  onLongPress,
  onContextMenu,
  isInSelectionMode,
  isSelected,
  onMarkAsRead,
  onToggleSave,
  priority = false,
}) => {
  const { triggerHaptic } = useHaptics();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const swipeThreshold = 80;

  const thumbnailUrl = useMemo(() => extractImageFromContent(item.content || '', item.link), [item.content, item.link]);
  const readingTime = useMemo(() => calculateReadingTime(item.content || ''), [item.content]);
  const showImage = thumbnailUrl && !imageError && item.type === 'rss';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !e.touches[0]) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(diff) < 150) setSwipeOffset(diff);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;
    if (swipeOffset > swipeThreshold) {
      if (onMarkAsRead && !item.is_read) {
        triggerHaptic('light');
        onMarkAsRead(item);
      }
    } else if (swipeOffset < -swipeThreshold) {
      if (onToggleSave) {
        triggerHaptic('light');
        onToggleSave(item);
      }
    }
    setSwipeOffset(0);
    touchStartX.current = null;
  }, [swipeOffset, swipeThreshold, item, onMarkAsRead, onToggleSave, triggerHaptic]);

  const sourceText = useMemo(() => {
    if (item.type === 'rss' && item.link) return new URL(item.link).hostname.replace('www.', '');
    if (item.type === 'spark') return item.source === 'AI_GENERATED' ? 'Spark AI' : 'ספארק אישי';
    if (item.type === 'mentor') return item.title.split(':')[0] || 'מנטור';
    return 'לא ידוע';
  }, [item]);

  const TypeIcon = useMemo(() => {
    if (item.type === 'rss') return FeedIcon;
    if (item.type === 'spark') return item.source === 'AI_GENERATED' ? BrainCircuitIcon : SparklesIcon;
    return BrainCircuitIcon;
  }, [item.type, item.source]);

  const faviconUrl = item.type === 'rss' && item.link ? getFaviconUrl(item.link) : null;

  const timeAgo = useMemo(() => {
    const diffMs = new Date().getTime() - new Date(item.createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דק'`;
    if (diffHours < 24) return `לפני ${diffHours} שע'`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return new Date(item.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }, [item.createdAt]);

  const contentSnippet = item.summary_ai || item.content?.split('\n')[0]?.replace(/<[^>]*>?/gm, '') || '';

  // Use UltraCard for the base styling
  return (
    <div className="relative mb-3 touch-pan-y">
      {/* Swipe Indicators */}
      <div className={`absolute inset-0 flex items-center justify-start pl-6 transition-opacity duration-200 bg-emerald-500/10 text-emerald-400 rounded-3xl ${swipeOffset > 0 ? 'opacity-100' : 'opacity-0'}`}>
        <CheckCircleIcon className="w-6 h-6" />
        <span className="mr-2 text-sm font-medium">נקרא</span>
      </div>
      <div className={`absolute inset-0 flex items-center justify-end pr-6 transition-opacity duration-200 bg-amber-500/10 text-amber-400 rounded-3xl ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}>
        <span className="ml-2 text-sm font-medium">שמור</span>
        <BookmarkIcon className="w-6 h-6" />
      </div>

      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => !isInSelectionMode && onSelect(item, e)}
        onContextMenu={(e) => onContextMenu(e, item)}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="transition-transform duration-200 ease-out"
      >
        <UltraCard
          variant="glass"
          glowColor={item.isImportant ? 'gold' : 'neutral'}
          className={`
             p-0 border-white/5 
             ${isInSelectionMode ? 'opacity-90' : ''} 
             ${item.is_read ? 'opacity-70 bg-black/20' : 'bg-black/40'}
             ${isSelected ? 'ring-2 ring-[var(--dynamic-accent-start)]' : ''}
          `}
          noPadding
        >
          {showImage && (
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={thumbnailUrl}
                alt=""
                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading={priority ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-medium text-white border border-white/10 uppercase tracking-wider">
                  {sourceText}
                </span>
              </div>
            </div>
          )}

          <div className="p-5">
            {!showImage && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <TypeIcon className="w-5 h-5 text-white/50" />
                  )}
                  <span className="text-xs font-medium text-white/60">{sourceText}</span>
                  <span className="text-[10px] text-white/30">• {timeAgo}</span>
                </div>
                {item.type === 'rss' && (
                  <div className="flex items-center gap-1 text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    <ClockIcon className="w-3 h-3" />
                    {readingTime} דק'
                  </div>
                )}
              </div>
            )}

            <h3 className={`text-lg font-bold leading-tight mb-2 ${item.is_read ? 'text-white/60' : 'text-white'}`}>
              {item.title}
            </h3>

            {contentSnippet && (
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                {contentSnippet.substring(0, 140)}...
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-2">
                {item.tags.slice(0, 2).map(tag => {
                  const colors = getTagColor(tag.name);
                  return (
                    <span
                      key={tag.id}
                      className="text-[10px] px-2 py-1 rounded-md font-medium"
                      style={{ backgroundColor: colors.backgroundColor, color: colors.textColor }}
                    >
                      #{tag.name}
                    </span>
                  )
                })}
              </div>

              <div className="flex gap-2">
                {item.link && (
                  <button className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <LinkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unread dot */}
          {!item.is_read && (
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--color-accent-cyan)]" />
          )}

          {/* Selection Checkmark Overlay */}
          {isInSelectionMode && (
            <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent-cyan border-accent-cyan' : 'border-white/30 bg-black/30'}`}>
                {isSelected && <CheckCircleIcon className="w-6 h-6 text-white" />}
              </div>
            </div>
          )}
        </UltraCard>
      </div>
    </div>
  );
};

export default React.memo(FeedCard);
