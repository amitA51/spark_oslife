/**
 * Form Creation Helper Components
 * 
 * Extracted from ItemCreationForm.tsx for better modularity.
 * Contains reusable UI components for form creation.
 */

import React, { useState, useEffect } from 'react';
import { SparklesIcon, CloseIcon } from '../icons';
// TODO: Re-enable when getAISuggestions is implemented
// import * as geminiService from '../../services/geminiService';
import { useDebounce } from '../../hooks/useDebounce';
import type { AddableType } from '../../types';

// --- Auto-Save Indicator ---

interface AutoSaveIndicatorProps {
    status: 'idle' | 'saving' | 'saved' | 'error';
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status }) => {
    if (status === 'idle') return null;

    const messages = {
        saving: { text: 'שומר...', color: 'text-blue-400', icon: '🔄' },
        saved: { text: 'נשמר', color: 'text-green-400', icon: '✓' },
        error: { text: 'שגיאה בשמירה', color: 'text-red-400', icon: '⚠️' },
    };

    const { text, color, icon } = messages[status];

    return (
        <div className={`flex items-center gap-1.5 text-xs ${color} animate-in fade-in-0 duration-200`}>
            <span>{icon}</span>
            <span>{text}</span>
        </div>
    );
};

// --- AI Suggestions Panel ---

interface AISuggestionsPanelProps {
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
    const [isLoading, _setIsLoading] = useState(false);
    const debouncedTitle = useDebounce(title, 1500);

    useEffect(() => {
        if (!debouncedTitle || !isVisible || debouncedTitle.length < 5) {
            setSuggestions([]);
            return;
        }

        // TODO: Implement getAISuggestions in geminiService
        // This feature requires an AI function that doesn't exist yet
        // For now, we'll keep suggestions empty
        setSuggestions([]);

        /* Future implementation:
        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const result = await geminiService.getAISuggestions(itemType, debouncedTitle, content);
                const combinedSuggestions = [
                    ...(result.tags || []),
                    ...(result.nextSteps || []),
                    ...(result.relatedConcepts || []),
                ].filter(Boolean);

                setSuggestions([...new Set(combinedSuggestions)].slice(0, 5));
            } catch (error) {
                console.warn('Failed to get AI suggestions:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
        */
    }, [debouncedTitle, itemType, content, isVisible]);

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

// --- Keyboard Shortcuts Hint Modal ---

interface KeyboardShortcutsHintProps {
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

// --- Premium Input Styles (shared constant) ---

export const premiumInputStyles = `
  w-full bg-black/30 text-white p-4 rounded-xl
  border border-white/10
  focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)]
  placeholder-white/30
  transition-all duration-300
  hover:border-white/20 hover:bg-black/40
  backdrop-blur-sm
`;

export const inputStyles = `
  w-full p-3 rounded-xl text-white
  bg-black/20 border border-white/10
  focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50
  placeholder-white/30 transition-all
`;
