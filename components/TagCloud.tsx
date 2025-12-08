import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tag, FeedItem } from '../types';
import { getTagColor } from './icons';

interface TagCloudProps {
  /** Available tags */
  tags: Tag[];
  /** Items to calculate tag frequency from */
  items: FeedItem[];
  /** Callback when a tag is clicked */
  onTagClick: (tagName: string) => void;
  /** Currently selected tag (if any) */
  selectedTag?: string;
  /** Maximum number of tags to show */
  maxTags?: number;
  /** Minimum font size in pixels */
  minFontSize?: number;
  /** Maximum font size in pixels */
  maxFontSize?: number;
  /** Show tag count badge */
  showCount?: boolean;
}

interface SizedTag extends Tag {
  fontSize: number;
  count: number;
  opacity: number;
}

const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  items,
  onTagClick,
  selectedTag,
  maxTags = 20,
  minFontSize = 12,
  maxFontSize = 28,
  showCount = false,
}) => {
  // Calculate how often each tag appears
  const tagFrequencies = useMemo(() => {
    const frequencies = new Map<string, number>();
    items.forEach(item => {
      item.tags.forEach(tag => {
        frequencies.set(tag.id, (frequencies.get(tag.id) || 0) + 1);
      });
    });
    return frequencies;
  }, [items]);

  // Calculate sized tags with font size based on frequency
  const sizedTags = useMemo((): SizedTag[] => {
    if (tagFrequencies.size === 0) return [];

    const counts: number[] = Array.from(tagFrequencies.values());
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    return tags
      .map(tag => {
        const count = tagFrequencies.get(tag.id) || 0;
        if (count === 0) return null;

        // Calculate font size based on frequency
        let fontSize = minFontSize;
        if (maxCount > minCount) {
          const scale = (count - minCount) / (maxCount - minCount);
          fontSize = minFontSize + scale * (maxFontSize - minFontSize);
        } else if (maxCount > 0) {
          fontSize = (minFontSize + maxFontSize) / 2;
        }

        // Calculate opacity (more frequent = more opaque)
        const opacity = 0.5 + (count / maxCount) * 0.5;

        return {
          ...tag,
          fontSize,
          count,
          opacity,
        };
      })
      .filter((tag): tag is SizedTag => tag !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxTags);
  }, [tags, tagFrequencies, maxTags, minFontSize, maxFontSize]);

  const handleTagClick = useCallback((tagName: string) => {
    onTagClick(tagName);
  }, [onTagClick]);

  if (sizedTags.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-[var(--text-secondary)] text-sm">
        אין תגיות להצגה
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-wrap justify-center items-center gap-3 p-4 max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {sizedTags.map((tag, index) => {
          const colors = getTagColor(tag.name);
          const isSelected = selectedTag === tag.name;

          return (
            <motion.button
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: index * 0.03,
              }}
              onClick={() => handleTagClick(tag.name)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                transition-all duration-200 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-[var(--dynamic-accent-start)]/50
                ${isSelected
                  ? 'ring-2 ring-[var(--dynamic-accent-start)] shadow-lg'
                  : 'hover:shadow-md'
                }
              `}
              style={{
                fontSize: `${tag.fontSize}px`,
                color: isSelected ? '#fff' : colors.textColor,
                backgroundColor: isSelected
                  ? 'var(--dynamic-accent-start)'
                  : `${colors.textColor}15`,
                fontWeight: 600,
                opacity: isSelected ? 1 : tag.opacity,
              }}
              aria-pressed={isSelected}
              aria-label={`תגית ${tag.name}, ${tag.count} פריטים`}
            >
              <span className="relative">
                {tag.name}
              </span>

              {/* Count badge */}
              {showCount && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${colors.textColor}20`,
                    color: isSelected ? '#fff' : colors.textColor,
                    fontSize: `${Math.max(tag.fontSize * 0.5, 10)}px`,
                  }}
                >
                  {tag.count}
                </span>
              )}

              {/* Shine effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none opacity-0"
                whileHover={{ opacity: 1 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                }}
              />
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default React.memo(TagCloud);
