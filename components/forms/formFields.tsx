/**
 * Form Field Components
 * 
 * Extracted from ItemCreationForm.tsx for better modularity.
 * Contains reusable field components for item creation forms.
 */

import React, { useRef } from 'react';
import { LinkIcon } from '../icons';
import LoadingSpinner from '../LoadingSpinner';
import { premiumInputStyles, inputStyles } from './formHelpers';

// --- Simple Form Fields (Title + Content) ---

interface SimpleFormFieldsProps {
    title: string;
    setTitle: (v: string) => void;
    content: string;
    setContent: (v: string) => void;
    titlePlaceholder?: string;
    contentPlaceholder?: string;
    titleRequired?: boolean;
    contentRequired?: boolean;
    isSpark?: boolean;
}

export const SimpleFormFields: React.FC<SimpleFormFieldsProps> = ({
    title,
    setTitle,
    content,
    setContent,
    titlePlaceholder = 'כותרת',
    contentPlaceholder = 'תוכן...',
    titleRequired = false,
    contentRequired = false,
}) => {
    const contentRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className="space-y-6">
            <div className="group relative">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-cyan-400">
                    {titlePlaceholder}
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={titlePlaceholder}
                        className={`${premiumInputStyles} text-lg font-bold pr-4`}
                        required={titleRequired}
                        autoFocus
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono">
                        {title.length > 0 && `${title.length}/100`}
                    </div>
                </div>
                {title.length > 80 && (
                    <p className="text-[10px] text-yellow-400/70 mt-1.5 animate-in fade-in-0 duration-200">
                        הכותרת ארוכה - שקול לקצר לקריאות טובה יותר
                    </p>
                )}
            </div>

            <div className="group relative">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-cyan-400">
                    {contentPlaceholder}
                </label>
                <div className="border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all duration-300 bg-black/20 hover:border-white/20 backdrop-blur-sm">
                    {/* Markdown toolbar placeholder - handleInsert is available for future use */}
                    <textarea
                        ref={contentRef}
                        dir="auto"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={contentPlaceholder}
                        className="w-full bg-transparent text-white p-4 focus:outline-none resize-y min-h-[250px] sm:min-h-[300px] placeholder-white/30 transition-all text-base"
                        required={contentRequired}
                    />
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-t border-white/5">
                        <span className="text-[10px] text-white/30 font-mono">
                            {content.split(/\s+/).filter(Boolean).length} מילים
                        </span>
                        <span className="text-[10px] text-white/30">
                            Markdown נתמך
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Link Fields ---

interface LinkFieldsProps {
    url: string;
    setUrl: (v: string) => void;
    isFetching: boolean;
}

export const LinkFields: React.FC<LinkFieldsProps> = ({ url, setUrl, isFetching }) => (
    <div className="group">
        <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-accent">
            כתובת URL
        </label>
        <div className="relative">
            <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`${inputStyles} pl-10`}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                {isFetching ? (
                    <LoadingSpinner className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
                ) : (
                    <LinkIcon className="w-5 h-5" />
                )}
            </div>
        </div>
        <p className="text-[10px] text-secondary mt-1.5 opacity-70 px-1">
            הכותרת והתוכן יתמלאו אוטומטית מתוך הקישור
        </p>
    </div>
);

// --- Task Fields ---

interface TaskFieldsProps {
    dueDate: string;
    setDueDate: (v: string) => void;
    dueTime?: string;
    setDueTime?: (v: string) => void;
    priority?: string;
    setPriority?: (v: 'low' | 'medium' | 'high') => void;
}

export const TaskFields: React.FC<TaskFieldsProps> = ({
    dueDate,
    setDueDate,
    dueTime,
    setDueTime,
    priority,
    setPriority,
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/5 p-4 rounded-xl border border-white/5">
        <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                תאריך יעד
            </label>
            <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={inputStyles}
                style={{ colorScheme: 'dark' }}
            />
        </div>
        {setDueTime && (
            <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                    שעה
                </label>
                <input
                    type="time"
                    value={dueTime || ''}
                    onChange={e => setDueTime(e.target.value)}
                    className={inputStyles}
                    style={{ colorScheme: 'dark' }}
                />
            </div>
        )}
        {priority && setPriority && (
            <div className="md:col-span-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                    עדיפות
                </label>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
                    {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${priority === p ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-secondary'}`}
                        >
                            {p === 'low' ? 'נמוכה' : p === 'medium' ? 'בינונית' : 'גבוהה'}
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// --- Book Fields ---

interface BookFieldsProps {
    author: string;
    setAuthor: (v: string) => void;
    totalPages: string;
    setTotalPages: (v: string) => void;
}

export const BookFields: React.FC<BookFieldsProps> = ({ author, setAuthor, totalPages, setTotalPages }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                מחבר
            </label>
            <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className={inputStyles}
                placeholder="שם המחבר"
            />
        </div>
        <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
                מספר עמודים
            </label>
            <input
                type="number"
                value={totalPages}
                onChange={e => setTotalPages(e.target.value)}
                className={inputStyles}
                placeholder="0"
            />
        </div>
    </div>
);
