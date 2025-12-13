/**
 * Premium UI Enhancement Components for Item Creation Form
 * 
 * These components were extracted from ItemCreationForm.tsx to improve
 * maintainability and support reuse.
 */

import React, { useState, useEffect } from 'react';
import { SparklesIcon, CloseIcon, CloudIcon } from '../icons';
import { useDebounce } from '../../hooks/useDebounce';
import { aiSuggestionsService } from '../../services/aiSuggestionsService';
import type { AddableType } from '../../types';

// ============================================================================
// Auto-Save Indicator
// ============================================================================

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
    status: AutoSaveStatus;
}

/**
 * A visual indicator showing the current auto-save status.
 * Displays different states: idle (hidden), saving, saved, or error.
 */
export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status }) => {
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

// ============================================================================
// AI Suggestions Panel
// ============================================================================

interface AISuggestionsPanelProps {
    itemType: AddableType;
    title: string;
    content: string;
    onSuggestionSelect: (suggestion: string, field: 'title' | 'content') => void;
    isVisible: boolean;
}

/**
 * A panel that displays AI-generated suggestions based on the current item type
 * and title. Uses debouncing to prevent excessive API calls.
 */
export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
    itemType,
    title,
    content: _content, // Reserved for future content-based suggestions
    onSuggestionSelect,
    isVisible,
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedTitle = useDebounce(title, 800);

    useEffect(() => {
        if (!isVisible) return;

        setIsLoading(true);
        try {
            // Get category-specific suggestions from AI service
            const categorySuggestions = aiSuggestionsService.getCategorySuggestions(itemType);
            const titleSuggestions = debouncedTitle.length > 2
                ? aiSuggestionsService.getTitleSuggestions(debouncedTitle)
                : [];

            // Combine and format suggestions
            const combinedSuggestions = [
                ...titleSuggestions.slice(0, 2),
                ...categorySuggestions.slice(0, 3).map(s => s.text),
            ].filter(Boolean);

            setSuggestions([...new Set(combinedSuggestions)].slice(0, 5));
        } catch (error) {
            console.warn('Failed to get AI suggestions:', error);
            setSuggestions([]);
        } finally {
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

// ============================================================================
// Keyboard Shortcuts Hint Modal
// ============================================================================

interface KeyboardShortcutsHintProps {
    isVisible: boolean;
    onClose: () => void;
}

interface ShortcutItem {
    keys: string[];
    action: string;
}

const KEYBOARD_SHORTCUTS: ShortcutItem[] = [
    { keys: ['Cmd/Ctrl', 'Enter'], action: 'שמור ושלח' },
    { keys: ['Cmd/Ctrl', 'S'], action: 'שמור טיוטה' },
    { keys: ['Escape'], action: 'סגור' },
    { keys: ['Tab'], action: 'שדה הבא' },
    { keys: ['Cmd/Ctrl', 'B'], action: 'הדגשה' },
    { keys: ['Cmd/Ctrl', 'I'], action: 'נטוי' },
];

/**
 * A modal overlay that displays available keyboard shortcuts for the form.
 * Can be dismissed by clicking outside or pressing the close button.
 */
export const KeyboardShortcutsHint: React.FC<KeyboardShortcutsHintProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1d24]/95 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400">⌨️</span>
                        קיצורי מקלדת
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    {KEYBOARD_SHORTCUTS.map(({ keys, action }, index) => (
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

// ============================================================================
// Premium Input Styles (exported for reuse)
// ============================================================================

/**
 * Premium input styling classes for consistent form field appearance.
 * Use with Tailwind CSS.
 */
export const premiumInputStyles = `
  w-full bg-black/30 text-white p-5 rounded-2xl
  border border-white/10
  focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)]
  placeholder-white/30
  transition-all duration-300
  hover:border-white/20 hover:bg-black/40
  backdrop-blur-sm
  text-lg
`;
