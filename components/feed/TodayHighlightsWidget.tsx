import React, { useMemo } from 'react';
import type { FeedItem } from '../../types';
import { TrendingUpIcon, ChevronLeftIcon, StarIcon } from '../icons';
import { motion } from 'framer-motion';
import { UltraCard } from '../ui/UltraCard';

interface TodayHighlightsWidgetProps {
    items: FeedItem[];
    onSelectItem: (item: FeedItem) => void;
}

// Extract image from content
const extractImage = (content: string): string | null => {
    const imgMatch = content?.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1] && !imgMatch[1].includes('pixel') && !imgMatch[1].includes('1x1')) {
        return imgMatch[1];
    }
    return null;
};

const TodayHighlightsWidget: React.FC<TodayHighlightsWidgetProps> = ({ items, onSelectItem }) => {
    // Get today's items that are important or have images
    const highlights = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return items
            .filter(item => {
                const itemDate = new Date(item.createdAt);
                const hasImage = extractImage(item.content || '');
                const isRecent = itemDate >= today;
                return (item.isImportant || hasImage) && (isRecent || item.isImportant);
            })
            .slice(0, 5);
    }, [items]);

    if (highlights.length === 0) return null;

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div
                        className="p-1.5 rounded-lg border"
                        style={{
                            background: 'linear-gradient(135deg, var(--dynamic-accent-start)20, var(--dynamic-accent-end)20)',
                            borderColor: 'var(--dynamic-accent-start)30'
                        }}
                    >
                        <TrendingUpIcon className="w-4 h-4" style={{ color: 'var(--dynamic-accent-start)' }} />
                    </div>
                    <h3 className="text-sm font-bold text-white/90">הדגשות היום</h3>
                </div>
                <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                    עוד
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Horizontal Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {highlights.map((item, index) => {
                    const imageUrl = extractImage(item.content || '');

                    return (
                        <div key={item.id} className="snap-start flex-shrink-0">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className="w-[280px] h-[160px]"
                            >
                                <UltraCard
                                    onClick={() => onSelectItem(item)}
                                    variant="glass"
                                    glowColor={item.isImportant ? 'gold' : 'neutral'}
                                    className="w-full h-full p-0 overflow-hidden group cursor-pointer border-white/5"
                                    noPadding
                                    hoverEffect
                                >
                                    {/* Background Image or Gradient */}
                                    {imageUrl ? (
                                        <>
                                            <img
                                                src={imageUrl}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]">
                                            <div
                                                className="absolute inset-0 opacity-20"
                                                style={{
                                                    backgroundImage: `radial-gradient(circle at 30% 50%, var(--dynamic-accent-start) 0%, transparent 50%)`
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                        {/* Important Star */}
                                        {item.isImportant && (
                                            <div
                                                className="absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm border border-yellow-500/30 bg-yellow-500/10"
                                            >
                                                <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
                                            </div>
                                        )}

                                        {/* Title */}
                                        <h4 className="text-[15px] font-bold text-white line-clamp-2 leading-snug mb-2 group-hover:text-[var(--dynamic-accent-start)] transition-colors">
                                            {item.title}
                                        </h4>

                                        {/* Source */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium text-white/60 uppercase tracking-wide">
                                                {item.type === 'rss' && item.link
                                                    ? new URL(item.link).hostname.replace('www.', '')
                                                    : item.type === 'spark' ? 'ספארק' : 'פריט'
                                                }
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-white/30" />
                                            <span className="text-[11px] text-white/40">
                                                {new Date(item.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </UltraCard>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(TodayHighlightsWidget);
