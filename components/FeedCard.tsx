import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { FeedItem } from '../types';
import { SparklesIcon, FeedIcon, CheckCircleIcon, BrainCircuitIcon, LinkIcon, ClockIcon, BookmarkIcon } from './icons';
import { getTagColor } from './icons';
import { useSettings } from '../src/contexts/SettingsContext';
import { useHaptics } from '../hooks/useHaptics';

interface FeedCardV2Props {
  item: FeedItem;
  index: number;
  onSelect: (item: FeedItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onLongPress: (item: FeedItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FeedItem) => void;
  isInSelectionMode: boolean;
  isSelected: boolean;
}

// Extract image from content or use og:image
const extractImageFromContent = (content: string, link?: string): string | null => {
  // Try to extract first image from HTML content
  const imgMatch = content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    // Filter out tiny tracking images
    const src = imgMatch[1];
    if (!src.includes('pixel') && !src.includes('tracking') && !src.includes('1x1')) {
      return src;
    }
  }

  // Try to extract from enclosure or media
  const mediaMatch = content?.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]) return mediaMatch[1];

  return null;
};

// Calculate reading time from content
const calculateReadingTime = (content: string): number => {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200); // Average reading speed
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

const FeedCardV2: React.FC<FeedCardV2Props> = ({
  item,
  index,
  onSelect,
  onLongPress,
  onContextMenu,
  isInSelectionMode,
  isSelected,
}) => {
  const { settings } = useSettings();
  const { cardStyle } = settings.themeSettings;
  const cardRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHaptics();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PERFORMANCE: Memoize expensive calculations
  const thumbnailUrl = useMemo(() => extractImageFromContent(item.content || '', item.link), [item.content, item.link]);
  const readingTime = useMemo(() => calculateReadingTime(item.content || ''), [item.content]);
  const showImage = thumbnailUrl && !imageError && item.type === 'rss';

  useEffect(() => {
    const card = cardRef.current;
    if (!card || cardStyle !== 'glass') return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    card.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [cardStyle]);

  // Handle long press for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      onLongPress(item);
    }, 500);
  }, [item, onLongPress, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // PERFORMANCE: Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const contentSnippet =
    item.summary_ai || item.content?.split('\n')[0]?.replace(/<[^>]*>?/gm, '') || '';

  let sourceText: string;
  let TypeIcon: React.FC<any> = FeedIcon;
  // Always use dynamic accent color from theme
  const accentColor = 'var(--dynamic-accent-start)';

  if (item.type === 'rss' && item.link) {
    sourceText = new URL(item.link).hostname.replace('www.', '');
    TypeIcon = FeedIcon;
  } else if (item.type === 'spark') {
    sourceText = item.source === 'AI_GENERATED' ? 'Spark AI' : 'ספארק אישי';
    TypeIcon = item.source === 'AI_GENERATED' ? BrainCircuitIcon : SparklesIcon;
  } else if (item.type === 'mentor') {
    sourceText = item.title.split(':')[0] || 'מנטור';
    TypeIcon = BrainCircuitIcon;
  } else {
    sourceText = 'לא ידוע';
  }

  const faviconUrl = item.type === 'rss' && item.link ? getFaviconUrl(item.link) : null;

  // PERFORMANCE: Memoize time ago formatting
  const timeAgo = useMemo(() => {
    const now = new Date();
    const created = new Date(item.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דק'`;
    if (diffHours < 24) return `לפני ${diffHours} שע'`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return created.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }, [item.createdAt]);

  return (
    <div
      ref={cardRef}
      onClick={e => onSelect(item, e)}
      onContextMenu={e => {
        e.preventDefault();
        isInSelectionMode ? onSelect(item, e) : onContextMenu(e, item);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`
        spark-card spark-card-interactive group
        ${item.is_read && !isInSelectionMode ? 'opacity-60' : ''}
        ${isSelected ? 'ring-2 ring-[var(--dynamic-accent-start)] bg-[var(--dynamic-accent-start)]/10 border-[var(--dynamic-accent-start)]/30' : ''}
      `}
      role="button"
      tabIndex={0}
      style={{
        animationDelay: `${index * 50}ms`,
        ['--accent-color' as any]: accentColor
      }}
    >
      {/* Gradient Glow Effect on Hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}10, transparent 40%)`
        }}
      />

      {/* Unread Indicator Bar */}
      {!item.is_read && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
          style={{
            background: `linear-gradient(90deg, transparent, var(--dynamic-accent-start), transparent)`
          }}
        />
      )}

      {/* Selection Overlay */}
      {isInSelectionMode && (
        <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center rounded-[1.5rem] backdrop-blur-[2px]">
          <div
            className={`
              w-10 h-10 rounded-full border-2 flex items-center justify-center 
              transition-all duration-200 ease-out
              ${isSelected
                ? 'bg-[var(--dynamic-accent-start)] border-[var(--dynamic-accent-start)] scale-110'
                : 'border-white/40 bg-black/40 hover:border-white/60'
              }
            `}
          >
            {isSelected && <CheckCircleIcon className="w-6 h-6 text-white" />}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`relative z-10 ${isInSelectionMode ? 'opacity-40' : ''}`}>

        {/* Image Thumbnail (if available) */}
        {showImage && (
          <div className="relative w-full h-40 overflow-hidden rounded-t-[1.5rem] -mt-px -mx-px">
            <img
              src={thumbnailUrl}
              alt=""
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`
                w-full h-full object-cover
                transition-all duration-500
                ${imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}
              `}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-transparent to-transparent" />

            {/* Floating Source Badge on Image */}
            <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              {faviconUrl ? (
                <img src={faviconUrl} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <TypeIcon className="w-3.5 h-3.5" style={{ color: accentColor }} />
              )}
              <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wide">
                {sourceText}
              </span>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className={`p-5 ${showImage ? 'pt-4' : ''}`}>
          {/* Header: Source Metadata (only if no image) */}
          {!showImage && (
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                {faviconUrl ? (
                  <div className="relative">
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-7 h-7 rounded-lg bg-white/5 p-0.5 shadow-sm"
                    />
                    {!item.is_read && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 0 8px ${accentColor}`
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <TypeIcon className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                )}
                <div className="flex flex-col">
                  <span
                    className="text-[11px] font-bold tracking-wider uppercase"
                    style={{ color: accentColor }}
                  >
                    {sourceText}
                  </span>
                  <span className="text-[10px] text-white/40 font-medium">
                    {timeAgo}
                  </span>
                </div>
              </div>

              {/* Reading Time Badge */}
              {item.type === 'rss' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                  <ClockIcon className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] font-medium text-white/50">
                    {readingTime} דק'
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Title & Snippet */}
          <div className="space-y-2">
            <h3 className={`
              text-[17px] font-bold text-white leading-snug 
              group-hover:text-[var(--dynamic-accent-start)]
              transition-colors duration-200
              line-clamp-2 tracking-tight
              ${item.is_read ? 'text-white/70' : ''}
            `}>
              {item.title}
            </h3>

            {contentSnippet && (
              <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed font-light">
                {contentSnippet.substring(0, 150)}
              </p>
            )}
          </div>

          {/* Footer: Tags, Time (if image), Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Time (shown here if image is present) */}
              {showImage && (
                <span className="text-[10px] text-white/40 font-medium mr-1">
                  {timeAgo}
                </span>
              )}

              {/* Tags */}
              {item.tags.slice(0, 2).map(tag => {
                const colors = getTagColor(tag.name);
                return (
                  <span
                    key={tag.id}
                    className="text-[10px] font-bold px-2 py-1 rounded-md border border-white/5 transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: colors.backgroundColor, color: colors.textColor }}
                  >
                    {tag.name}
                  </span>
                );
              })}

              {/* Reading time (if image shown) */}
              {showImage && item.type === 'rss' && (
                <div className="flex items-center gap-1 text-white/40">
                  <ClockIcon className="w-3 h-3" />
                  <span className="text-[10px] font-medium">{readingTime} דק'</span>
                </div>
              )}
            </div>

            {/* Action Hints */}
            <div className="flex items-center gap-1">
              {item.isImportant && (
                <div className="p-1.5 rounded-lg bg-yellow-500/10">
                  <BookmarkIcon className="w-4 h-4 text-yellow-400" />
                </div>
              )}
              {item.link && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10">
                  <LinkIcon className="w-4 h-4 text-white/40 group-hover:text-white/70" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Noise Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay rounded-[1.5rem]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};

export default React.memo(FeedCardV2);
