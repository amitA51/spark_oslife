import React, { useMemo } from 'react';
import type { UniversalSearchResult, PersonalItem, FeedItem, GoogleCalendarEvent } from '../types';
import { 
    CheckCircleIcon, ClipboardListIcon, LinkIcon, BookOpenIcon, DumbbellIcon, TargetIcon, 
    SparklesIcon, FeedIcon, BrainCircuitIcon, UserIcon, LightbulbIcon, RoadmapIcon, SummarizeIcon,
    GoogleCalendarIcon
} from './icons';

interface SearchResultItemProps {
    result: UniversalSearchResult;
    query: string;
}

// Function to escape special characters for use in a regular expression
const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const Highlight: React.FC<{ text: string, query: string }> = ({ text, query }) => {
    if (!query || !text) return <>{text}</>;
    const escapedQuery = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-[var(--dynamic-accent-highlight)]/50 text-white px-0 rounded-sm">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const getIconForType = (type: UniversalSearchResult['type']) => {
    const className = "w-5 h-5 text-gray-400";
    switch(type) {
        case 'task': return <CheckCircleIcon className={className} />;
        case 'note': return <ClipboardListIcon className={className} />;
        case 'link': return <LinkIcon className={className} />;
        case 'book': return <BookOpenIcon className={className} />;
        case 'workout': return <DumbbellIcon className={className} />;
        case 'goal': return <TargetIcon className={className} />;
        case 'spark': return <SparklesIcon className={className} />;
        case 'rss': return <FeedIcon className={className} />;
        case 'mentor': return <BrainCircuitIcon className={className} />;
        case 'journal': return <UserIcon className={className} />;
        case 'idea': return <LightbulbIcon className={className} />;
        case 'roadmap': return <RoadmapIcon className={className} />;
        case 'learning': return <SummarizeIcon className={className} />;
        case 'calendar': return <GoogleCalendarIcon className={className} />;
        default: return <SparklesIcon className={className} />;
    }
};

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, query }) => {
    
    const formattedDate = useMemo(() => {
        const d = new Date(result.date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'היום';
        if (d.toDateString() === yesterday.toDateString()) return 'אתמול';
        return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }, [result.date]);

    const handleClick = () => {
        // Here you would implement navigation to the item's detail view.
        // This is a placeholder for now.
        console.log("Navigate to item:", result.item);
        if (result.type === 'calendar') {
             window.open((result.item as GoogleCalendarEvent).htmlLink, '_blank');
        } else {
             alert(`Placeholder: Open detail for ${result.title}`);
        }
    };
    
    return (
        <button onClick={handleClick} className="w-full text-right themed-card p-4 hover:border-[var(--dynamic-accent-start)]/50 transition-all">
            <div className="flex items-start gap-3">
                <div className="mt-1">{getIconForType(result.type)}</div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                        <h4 className="font-semibold text-white truncate"><Highlight text={result.title} query={query} /></h4>
                        <span className="text-xs text-gray-500 font-mono shrink-0">{formattedDate}</span>
                    </div>
                    {result.content && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                           <Highlight text={result.content} query={query} />
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
};

export default SearchResultItem;