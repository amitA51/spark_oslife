import React from 'react';
import type { FeedItem } from '../../types';
import { FeedIcon, ClockIcon } from '../icons';
import { motion } from 'framer-motion';

interface QuickReadCardProps {
    item: FeedItem;
    index: number;
    onSelect: (item: FeedItem) => void;
}

const getFaviconUrl = (link: string) => {
    try {
        const url = new URL(link);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch (e) {
        return '';
    }
};

import DOMPurify from 'dompurify';

const calculateReadingTime = (content: string): number => {
    if (!content) return 1;
    // Sanitize and strip HTML tags to get pure text
    const clean = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
    const words = clean.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
};

const QuickReadCard: React.FC<QuickReadCardProps> = ({ item, index, onSelect }) => {
    const faviconUrl = item.link ? getFaviconUrl(item.link) : '';
    const readingTime = calculateReadingTime(item.content || '');

    const timeAgo = (() => {
        const now = new Date();
        const created = new Date(item.createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}ד'`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}ש'`;
        return `${Math.floor(diffHours / 24)}י'`;
    })();

    return (
        <motion.button
            onClick={() => onSelect(item)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={`
        w-full text-right p-3 rounded-xl
        bg-white/[0.02] hover:bg-white/[0.05]
        border border-white/[0.05] hover:border-white/[0.1]
        transition-all duration-200
        active:scale-[0.98]
        group
        ${item.is_read ? 'opacity-50' : ''}
      `}
        >
            <div className="flex items-start gap-3">
                {/* Favicon */}
                <div className="relative flex-shrink-0 mt-0.5">
                    {faviconUrl ? (
                        <img src={faviconUrl} alt="" className="w-5 h-5 rounded" loading="lazy" />
                    ) : (
                        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
                            <FeedIcon className="w-3 h-3 text-white/40" />
                        </div>
                    )}
                    {!item.is_read && (
                        <span
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: 'var(--dynamic-accent-start)',
                                boxShadow: '0 0 6px var(--dynamic-accent-glow)'
                            }}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-[var(--dynamic-accent-start)] transition-colors">
                        {item.title}
                    </h4>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/40">
                        <span>{timeAgo}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>{readingTime} דק'</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.button>
    );
};

// Quick Read List Widget
interface QuickReadListProps {
    items: FeedItem[];
    onSelectItem: (item: FeedItem) => void;
    maxItems?: number;
}

export const QuickReadList: React.FC<QuickReadListProps> = ({
    items,
    onSelectItem,
    maxItems = 5
}) => {
    const rssItems = items
        .filter(item => item.type === 'rss' && !item.is_read)
        .slice(0, maxItems);

    if (rssItems.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-white/80">קריאה מהירה</h3>
                <span className="text-[10px] text-white/40">
                    {rssItems.length} פריטים
                </span>
            </div>
            <div className="space-y-2">
                {rssItems.map((item, index) => (
                    <QuickReadCard
                        key={item.id}
                        item={item}
                        index={index}
                        onSelect={onSelectItem}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuickReadCard;
