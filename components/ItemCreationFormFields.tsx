/**
 * ItemCreationForm Field Components
 * Extracted sub-components for form fields used in the item creation form
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
    LinkIcon,
    CloseIcon,
    SparklesIcon,
    CloudIcon,
    BookOpenIcon,
} from './icons';
import LoadingSpinner from './LoadingSpinner';
import { MarkdownToolbar } from './details/common';
import type { AddableType } from '../types';

// --- Premium Input Styles ---
export const premiumInputStyles = `
  w-full bg-black/30 text-white p-4 rounded-xl
  border border-white/10
  focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)]
  placeholder-white/30
  transition-all duration-300
  hover:border-white/20 hover:bg-black/40
  backdrop-blur-sm
`;

// --- AutoSave Indicator ---
export const AutoSaveIndicator: React.FC<{ status: 'idle' | 'saving' | 'saved' | 'error' }> = ({ status }) => {
    if (status === 'idle') return null;

    return (
        <div className="flex items-center gap-2 text-xs font-medium animate-in fade-in-0 slide-in-from-right-2 duration-300">
            {status === 'saving' && (
                <>
                    <div className="w-3 h-3 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                    <span className="text-white/50">שומר...</span>
                </>
            )}
            {status === 'saved' && (
                <>
                    <CloudIcon className="w-4 h-4 text-green-400" />
                    <span className="text-green-400/80">נשמר</span>
                </>
            )}
            {status === 'error' && (
                <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400/80">שגיאה בשמירה</span>
                </>
            )}
        </div>
    );
};

// --- AI Suggestions Panel ---
export interface AISuggestionsPanelProps {
    itemType: AddableType;
    title: string;
    content: string;
    onSuggestionSelect: (suggestion: string, field: 'title' | 'content') => void;
    isVisible: boolean;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
    itemType,
    title,
    content,
    onSuggestionSelect,
    isVisible,
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedTitle = useDebounce(title, 1000);

    useEffect(() => {
        if (debouncedTitle && debouncedTitle.length > 3 && isVisible) {
            setIsLoading(true);
            setSuggestions([
                `הוסף פרטים נוספים על "${debouncedTitle}"`,
                `הגדר תאריך יעד למשימה`,
                `חלק את זה לתתי-משימות`,
            ]);
            setIsLoading(false);
        }
    }, [debouncedTitle, itemType, isVisible]);

    if (!isVisible || suggestions.length === 0) return null;

    return (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400">הצעות AI</span>
                {isLoading && <div className="w-3 h-3 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />}
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onSuggestionSelect(suggestion, 'content')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 border border-white/5 hover:border-white/20"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Keyboard Shortcuts Hint ---
export interface KeyboardShortcutsHintProps {
    isVisible: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsHint: React.FC<KeyboardShortcutsHintProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    const shortcuts = [
        { keys: ['Cmd/Ctrl', 'Enter'], action: 'שמור ושלח' },
        { keys: ['Cmd/Ctrl', 'S'], action: 'שמור טיוטה' },
        { keys: ['Escape'], action: 'סגור' },
        { keys: ['Tab'], action: 'שדה הבא' },
        { keys: ['Cmd/Ctrl', 'B'], action: 'הדגשה' },
        { keys: ['Cmd/Ctrl', 'I'], action: 'נטוי' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200" onClick={onClose}>
            <div
                className="bg-[#1a1d24]/95 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400">⌨️</span>
                        קיצורי מקלדת
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    {shortcuts.map(({ keys, action }, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <span className="text-white/70 text-sm">{action}</span>
                            <div className="flex gap-1">
                                {keys.map((key, i) => (
                                    <kbd key={i} className="px-2 py-1 text-xs font-mono bg-white/10 rounded-md text-white/80 border border-white/20">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Simple Form Fields (Title + Content) ---
export interface SimpleFormFieldsProps {
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
    isSpark = false,
}) => {
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const handleInsert = (startSyntax: string, endSyntax: string = '') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText;
        let selectionStart;
        let selectionEnd;

        if (selectedText) {
            newText = `${text.substring(0, start)}${startSyntax}${selectedText}${endSyntax}${text.substring(end)}`;
            selectionStart = start + startSyntax.length;
            selectionEnd = end + startSyntax.length;
        } else {
            newText = `${text.substring(0, start)}${startSyntax}${endSyntax}${text.substring(start)}`;
            selectionStart = start + startSyntax.length;
            selectionEnd = selectionStart;
        }

        setContent(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = selectionStart;
            textarea.selectionEnd = selectionEnd;
        }, 0);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Title Section - Massive & Clean */}
            <div className="group relative">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={titlePlaceholder}
                    className="w-full bg-transparent text-4xl sm:text-5xl font-black text-white placeholder-white/20 focus:outline-none focus:placeholder-white/10 transition-all leading-tight tracking-tight"
                    required={titleRequired}
                    autoFocus
                />
                <div className="h-1 w-20 bg-[var(--dynamic-accent-start)] rounded-full mt-4 opacity-50 group-focus-within:w-full group-focus-within:opacity-100 transition-all duration-500 ease-out" />

                {/* Character count indicator */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-medium text-white/20 font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">
                    {title.length > 0 && `${title.length}/100`}
                </div>
            </div>

            {/* Content Section - Editorial Style */}
            <div className="group relative">
                <div className="min-h-[200px] relative">
                    <MarkdownToolbar onInsert={handleInsert} />
                    <textarea
                        ref={contentRef}
                        dir="auto"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={contentPlaceholder}
                        className="w-full bg-transparent text-white/90 text-xl leading-relaxed p-0 mt-4 focus:outline-none resize-y min-h-[300px] placeholder-white/20 transition-all font-serif"
                        required={contentRequired}
                    />
                </div>
                {/* Subtle Word Count */}
                <div className="absolute -bottom-6 left-0 text-[10px] text-white/20 font-medium tracking-widest uppercase opacity-0 group-focus-within:opacity-100 transition-opacity">
                    {content.split(/\s+/).filter(Boolean).length} WORDS
                </div>
            </div>
        </div>
    );
};

// --- Link Fields ---
export interface LinkFieldsProps {
    url: string;
    setUrl: (v: string) => void;
    isFetching: boolean;
}

export const LinkFields: React.FC<LinkFieldsProps> = ({
    url,
    setUrl,
    isFetching,
}) => (
    <div className="group space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
        <label className="text-xs font-bold text-white/60 uppercase tracking-wider block transition-colors group-focus-within:text-cyan-400">
            Link to Save
        </label>
        <div className="relative">
            <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/20 text-3xl font-bold text-blue-400 placeholder-white/10 p-4 rounded-2xl border-2 border-white/5 focus:border-blue-500/50 focus:bg-black/40 focus:outline-none transition-all"
                autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {isFetching ? (
                    <LoadingSpinner className="w-6 h-6 text-blue-400" />
                ) : (
                    <LinkIcon className="w-6 h-6 text-white/20" />
                )}
            </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30 px-1">
            <SparklesIcon className="w-3 h-3" />
            <span>Magic: Title & Content will be auto-generated</span>
        </div>
    </div>
);

// --- Task Fields ---
export interface TaskFieldsProps {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
        <div className="grid grid-cols-2 gap-4">
            <div className="group">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block group-focus-within:text-white/80 transition-colors">
                    Due Date
                </label>
                <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group-focus-within:ring-2 ring-white/10">
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full bg-transparent p-4 text-white text-lg font-medium outline-none z-10 relative [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                    />
                </div>
            </div>
            {setDueTime && (
                <div className="group">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block group-focus-within:text-white/80 transition-colors">
                        Time
                    </label>
                    <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group-focus-within:ring-2 ring-white/10">
                        <input
                            type="time"
                            value={dueTime || ''}
                            onChange={e => setDueTime(e.target.value)}
                            className="w-full bg-transparent p-4 text-white text-lg font-medium outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                        />
                    </div>
                </div>
            )}
        </div>

        {priority && setPriority && (
            <div className="space-y-3">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block">
                    Priority
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {(['low', 'medium', 'high'] as const).map(p => {
                        const isSelected = priority === p;
                        let colorClass = "bg-white/5 border-white/10 text-white/50 hover:bg-white/10";
                        if (isSelected) {
                            if (p === 'low') colorClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                            if (p === 'medium') colorClass = "bg-amber-500/20 border-amber-500 text-amber-400";
                            if (p === 'high') colorClass = "bg-rose-500/20 border-rose-500 text-rose-400";
                        }
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`py-3 rounded-xl border text-sm font-bold transition-all duration-300 scale-100 active:scale-95 ${colorClass} ${isSelected ? 'shadow-[0_0_20px_-5px_currentColor]' : ''}`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
);

// --- Book Fields ---
export interface BookFieldsProps {
    author: string;
    setAuthor: (v: string) => void;
    totalPages: string;
    setTotalPages: (v: string) => void;
}

export const BookFields: React.FC<BookFieldsProps> = ({
    author,
    setAuthor,
    totalPages,
    setTotalPages,
}) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <div className="md:col-span-2 group">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block group-focus-within:text-white/80 transition-colors">
                Author
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xl p-4 rounded-xl focus:outline-none focus:bg-black/40 focus:border-white/20 transition-all font-medium placeholder-white/10"
                    placeholder="Who wrote it?"
                />
            </div>
        </div>
        <div className="group">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block group-focus-within:text-white/80 transition-colors">
                Pages
            </label>
            <div className="relative">
                <input
                    type="number"
                    value={totalPages}
                    onChange={e => setTotalPages(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xl p-4 rounded-xl focus:outline-none focus:bg-black/40 focus:border-white/20 transition-all font-mono placeholder-white/10"
                    placeholder="0"
                />
                <BookOpenIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
            </div>
        </div>
    </div>
);

// --- Journal Fields (Atmospheric/Personal) ---
export interface JournalFieldsProps {
    title: string;
    setTitle: (v: string) => void;
    content: string;
    setContent: (v: string) => void;
    mood?: string;
    setMood?: (v: string) => void;
}

const moodOptions = [
    { value: 'great', emoji: '😊', label: 'מעולה', color: 'from-emerald-500 to-teal-500' },
    { value: 'good', emoji: '🙂', label: 'טוב', color: 'from-green-500 to-lime-500' },
    { value: 'neutral', emoji: '😐', label: 'סביר', color: 'from-gray-400 to-slate-500' },
    { value: 'bad', emoji: '😔', label: 'לא טוב', color: 'from-amber-500 to-orange-500' },
    { value: 'terrible', emoji: '😢', label: 'קשה', color: 'from-rose-500 to-red-500' },
];

export const JournalFields: React.FC<JournalFieldsProps> = ({
    title,
    setTitle,
    content,
    setContent,
    mood,
    setMood,
}) => {
    const today = new Date();
    const dateString = today.toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Date Display - Elegant Header */}
            <div className="text-center space-y-2 pb-4 border-b border-white/5">
                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em]">יומן אישי</p>
                <p className="text-lg text-white/60 font-serif">{dateString}</p>
            </div>

            {/* Mood Selector */}
            {setMood && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider block text-center">איך אני מרגיש/ה?</label>
                    <div className="flex justify-center gap-3">
                        {moodOptions.map(m => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => setMood(m.value)}
                                className={`relative p-3 rounded-2xl transition-all duration-300 ${mood === m.value
                                    ? `bg-gradient-to-br ${m.color} shadow-lg scale-110`
                                    : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                                    }`}
                            >
                                <span className="text-2xl">{m.emoji}</span>
                                {mood === m.value && (
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/60 whitespace-nowrap">{m.label}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Title - "Dear Diary" style */}
            <div className="group relative pt-4">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="כותרת הרשומה..."
                    className="w-full bg-transparent text-3xl sm:text-4xl font-bold text-white placeholder-white/20 focus:outline-none transition-all text-center font-serif italic"
                    autoFocus
                />
            </div>

            {/* Content - Intimate journaling area */}
            <div className="group relative">
                <textarea
                    dir="auto"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="היום קרה לי משהו מעניין..."
                    className="w-full bg-transparent text-white/90 text-lg leading-loose p-0 focus:outline-none resize-none min-h-[300px] placeholder-white/20 font-serif"
                    rows={12}
                />
                <div className="absolute -bottom-6 left-0 text-[10px] text-white/20 font-medium tracking-widest uppercase opacity-0 group-focus-within:opacity-100 transition-opacity">
                    {content.split(/\s+/).filter(Boolean).length} מילים
                </div>
            </div>
        </div>
    );
};

// --- Idea Fields (Brainstorming Vibe) ---
export interface IdeaFieldsProps {
    title: string;
    setTitle: (v: string) => void;
    content: string;
    setContent: (v: string) => void;
}

export const IdeaFields: React.FC<IdeaFieldsProps> = ({
    title,
    setTitle,
    content,
    setContent,
}) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero Icon */}
        <div className="flex justify-center">
            <div className="relative">
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">💡</span>
                </div>
            </div>
        </div>

        {/* Big Idea Title */}
        <div className="group relative text-center">
            <label className="text-xs font-bold text-amber-400/80 uppercase tracking-[0.2em] block mb-4">THE BIG IDEA</label>
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="מה הרעיון הגדול?"
                className="w-full bg-transparent text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 placeholder-white/20 focus:outline-none text-center tracking-tight"
                autoFocus
            />
            <div className="h-1 mx-auto w-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full mt-4 opacity-50 group-focus-within:w-full group-focus-within:opacity-100 transition-all duration-500" />
        </div>

        {/* Elaboration */}
        <div className="group relative">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-3">פירוט והרחבה</label>
            <textarea
                dir="auto"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="תאר את הרעיון... מה הפוטנציאל? מה הצעדים הראשונים?"
                className="w-full bg-white/5 text-white/90 text-lg leading-relaxed p-5 rounded-2xl border border-white/10 focus:outline-none focus:bg-black/40 focus:border-amber-500/50 resize-none min-h-[200px] placeholder-white/20 transition-all"
                rows={8}
            />
        </div>
    </div>
);

// --- Note Fields (Quick/Minimal) ---
export interface NoteFieldsProps {
    title: string;
    setTitle: (v: string) => void;
    content: string;
    setContent: (v: string) => void;
}

export const NoteFields: React.FC<NoteFieldsProps> = ({
    title,
    setTitle,
    content,
    setContent,
}) => {
    const contentRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Minimal Title */}
            <div className="group relative">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="כותרת קצרה..."
                    className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white placeholder-white/30 focus:outline-none transition-all border-b border-white/10 pb-3 focus:border-white/30"
                    autoFocus
                />
            </div>

            {/* Distraction-free writing area */}
            <div className="group relative">
                <textarea
                    ref={contentRef}
                    dir="auto"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="כתוב את ההערה שלך..."
                    className="w-full bg-transparent text-white/90 text-lg leading-relaxed p-0 focus:outline-none resize-none min-h-[250px] placeholder-white/30"
                    rows={10}
                />
            </div>

            {/* Minimal footer hint */}
            <div className="text-center text-xs text-white/20 pt-4 border-t border-white/5">
                ✨ שמור מחשבות, רשימות, או כל דבר שעולה לך לראש
            </div>
        </div>
    );
};

// --- Learning Fields (Topic/Source/Insights) ---
export interface LearningFieldsProps {
    title: string;
    setTitle: (v: string) => void;
    content: string;
    setContent: (v: string) => void;
    source?: string;
    setSource?: (v: string) => void;
}

export const LearningFields: React.FC<LearningFieldsProps> = ({
    title,
    setTitle,
    content,
    setContent,
    source,
    setSource,
}) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header with Icon */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-xl">📚</span>
            </div>
            <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">למידה חדשה</p>
                <p className="text-white/50 text-sm">תעד את מה שלמדת</p>
            </div>
        </div>

        {/* Topic Title */}
        <div className="group relative">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">נושא</label>
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="על מה למדת?"
                className="w-full bg-transparent text-3xl sm:text-4xl font-black text-white placeholder-white/20 focus:outline-none transition-all"
                autoFocus
            />
            <div className="h-0.5 w-16 bg-indigo-500 rounded-full mt-3 opacity-50 group-focus-within:w-full group-focus-within:opacity-100 transition-all duration-500" />
        </div>

        {/* Source Input */}
        {setSource && (
            <div className="group">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2 group-focus-within:text-indigo-400 transition-colors">מקור</label>
                <input
                    type="text"
                    value={source || ''}
                    onChange={e => setSource(e.target.value)}
                    placeholder="ספר, קורס, מאמר, פודקאסט..."
                    className="w-full bg-white/5 text-lg text-white p-4 rounded-xl border border-white/10 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 transition-all placeholder-white/20"
                />
            </div>
        )}

        {/* Key Insights */}
        <div className="group relative">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2 group-focus-within:text-indigo-400 transition-colors">תובנות מפתח</label>
            <textarea
                dir="auto"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="מה התובנות העיקריות שלך? מה השתנה בחשיבה שלך?"
                className="w-full bg-white/5 text-white/90 text-lg leading-relaxed p-5 rounded-2xl border border-white/10 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 resize-none min-h-[200px] placeholder-white/20 transition-all"
                rows={8}
            />
        </div>
    </div>
);
