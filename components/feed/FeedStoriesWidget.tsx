import React from 'react';
import type { FeedItem } from '../../types';
import { SparklesIcon, BrainCircuitIcon, ChevronLeftIcon } from '../icons';
import { motion } from 'framer-motion';

interface FeedStoriesWidgetProps {
    items: FeedItem[];
    onSelectItem: (item: FeedItem) => void;
}

const FeedStoriesWidget: React.FC<FeedStoriesWidgetProps> = ({ items, onSelectItem }) => {
    // Only show sparks
    const sparks = items.filter(item => item.type === 'spark').slice(0, 8);

    if (sparks.length === 0) return null;

    return (
        <div className="mb-6">
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
                        <SparklesIcon className="w-4 h-4" style={{ color: 'var(--dynamic-accent-start)' }} />
                    </div>
                    <h3 className="text-sm font-bold text-white/90">ספארקים אחרונים</h3>
                    {sparks.some(s => !s.is_read) && (
                        <span
                            className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            style={{
                                backgroundColor: 'var(--dynamic-accent-start)20',
                                color: 'var(--dynamic-accent-start)'
                            }}
                        >
                            {sparks.filter(s => !s.is_read).length} חדשים
                        </span>
                    )}
                </div>
                <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                    הכל
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {sparks.map((spark, index) => (
                    <motion.button
                        key={spark.id}
                        onClick={() => onSelectItem(spark)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`
                            relative flex-shrink-0 w-[100px] group
                            transition-transform duration-200
                            active:scale-95
                        `}
                    >
                        {/* Story Circle */}
                        <div
                            className="relative w-[72px] h-[72px] mx-auto mb-2 rounded-full p-[2px]"
                            style={{
                                background: !spark.is_read
                                    ? 'linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))'
                                    : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                            }}
                        >
                            <div className="w-full h-full rounded-full bg-[#13131A] flex items-center justify-center overflow-hidden">
                                {/* Icon based on source */}
                                <div
                                    className="p-3 rounded-full"
                                    style={{
                                        background: `linear-gradient(135deg, var(--dynamic-accent-start)20, var(--dynamic-accent-end)20)`
                                    }}
                                >
                                    {spark.source === 'AI_GENERATED' ? (
                                        <BrainCircuitIcon className="w-6 h-6" style={{ color: 'var(--dynamic-accent-start)' }} />
                                    ) : (
                                        <SparklesIcon className="w-6 h-6" style={{ color: 'var(--dynamic-accent-start)' }} />
                                    )}
                                </div>
                            </div>

                            {/* Unread Pulse */}
                            {!spark.is_read && (
                                <div className="absolute inset-0 rounded-full animate-pulse-slow">
                                    <div
                                        className="absolute inset-0 rounded-full blur-xl"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--dynamic-accent-start)30, var(--dynamic-accent-end)30)'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <p className={`
                            text-[11px] font-medium text-center line-clamp-2 leading-tight px-1
                            ${spark.is_read ? 'text-white/40' : 'text-white/80'}
                            group-hover:text-white transition-colors
                        `}>
                            {spark.title.length > 30 ? spark.title.substring(0, 30) + '...' : spark.title}
                        </p>
                    </motion.button>
                ))}

                {/* "Add Spark" Placeholder */}
                <div className="flex-shrink-0 w-[100px] flex flex-col items-center opacity-40 hover:opacity-70 transition-opacity">
                    <div
                        className="w-[72px] h-[72px] rounded-full border-2 border-dashed flex items-center justify-center mb-2"
                        style={{ borderColor: 'var(--dynamic-accent-start)40' }}
                    >
                        <span className="text-2xl" style={{ color: 'var(--dynamic-accent-start)50' }}>+</span>
                    </div>
                    <p className="text-[11px] text-white/30 text-center">הוסף ספארק</p>
                </div>
            </div>
        </div>
    );
};

export default React.memo(FeedStoriesWidget);
