import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AddableType } from '../../types';
import { SparklesIcon, MicrophoneIcon, CloseIcon } from '../icons';
import { useHaptics } from '../../hooks/useHaptics';

interface SmartSearchBarProps {
  onCreateItem: (type: AddableType, data?: any) => void;
  onVoiceInput: () => void;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
}

interface ParsedIntent {
  type: AddableType;
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  confidence: number;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  onCreateItem,
  onVoiceInput,
  isExpanded,
  onToggleExpand,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<ParsedIntent[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerHaptic } = useHaptics();

  const parseIntent = useCallback((text: string): ParsedIntent[] => {
    if (!text.trim()) return [];

    const lowerText = text.toLowerCase();
    const results: ParsedIntent[] = [];

    const taskKeywords = ['remind', 'todo', 'task', 'call', 'email', 'meeting', 'buy'];
    const isTask = taskKeywords.some(kw => lowerText.includes(kw));

    const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
    const timeMatch = text.match(timeRegex);
    const dueTime = timeMatch ? timeMatch[0] : undefined;

    const tomorrow = lowerText.includes('tomorrow');
    const today = lowerText.includes('today');
    const nextWeek = lowerText.includes('next week');
    
    let dueDate: string | undefined;
    const now = new Date();
    if (tomorrow) {
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      dueDate = tomorrowDate.toISOString().split('T')[0];
    } else if (today) {
      dueDate = now.toISOString().split('T')[0];
    } else if (nextWeek) {
      const nextWeekDate = new Date(now);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      dueDate = nextWeekDate.toISOString().split('T')[0];
    }

    const isImportant = lowerText.includes('important') || lowerText.includes('urgent');
    const priority = isImportant ? 'high' : 'medium';

    let title = text
      .replace(timeRegex, '')
      .replace(/\b(tomorrow|today|next week|important|urgent)\b/gi, '')
      .trim();

    if (isTask) {
      results.push({
        type: 'task',
        title: title || text,
        dueDate,
        dueTime,
        priority: priority as 'low' | 'medium' | 'high',
        confidence: 0.9,
      });
    }

    if (lowerText.includes('note') || lowerText.includes('write')) {
      results.push({
        type: 'note',
        title: title || text,
        confidence: 0.7,
      });
    }

    if (lowerText.includes('http') || lowerText.includes('www.')) {
      results.push({
        type: 'link',
        title: title || text,
        confidence: 0.95,
      });
    }

    if (lowerText.includes('idea') || lowerText.includes('thought')) {
      results.push({
        type: 'idea',
        title: title || text,
        confidence: 0.8,
      });
    }

    if (results.length === 0) {
      results.push({
        type: 'spark',
        title: text,
        confidence: 0.5,
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (input.trim()) {
        setIsAnalyzing(true);
        const parsed = parseIntent(input);
        setSuggestions(parsed);
        setSelectedIndex(0);
        setIsAnalyzing(false);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input, parseIntent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
      triggerHaptic('light');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      triggerHaptic('light');
    } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInput('');
      setSuggestions([]);
      onToggleExpand(false);
    }
  };

  const handleSelectSuggestion = (suggestion: ParsedIntent) => {
    triggerHaptic('medium');
    const { type, title, ...data } = suggestion;
    onCreateItem(type, { title, ...data });
    setInput('');
    setSuggestions([]);
    onToggleExpand(false);
  };

  const getTypeLabel = (type: AddableType): string => {
    const labels: Record<AddableType, string> = {
      spark: 'ספארק',
      task: 'משימה',
      note: 'פתק',
      link: 'קישור',
      idea: 'רעיון',
      habit: 'הרגל',
      book: 'ספר',
      workout: 'אימון',
      goal: 'פרויקט',
      journal: 'יומן',
      learning: 'למידה',
      roadmap: 'מפת דרכים',
      ticker: 'מניה/מטבע',
      gratitude: 'הכרת תודה',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: AddableType): string => {
    const colors: Record<AddableType, string> = {
      spark: 'from-cyan-500 to-violet-500',
      task: 'from-emerald-500 to-green-600',
      note: 'from-amber-500 to-yellow-500',
      link: 'from-blue-400 to-blue-600',
      idea: 'from-yellow-400 to-amber-500',
      habit: 'from-pink-500 to-rose-500',
      book: 'from-purple-400 to-violet-500',
      workout: 'from-pink-500 to-fuchsia-600',
      goal: 'from-teal-400 to-cyan-500',
      journal: 'from-fuchsia-400 to-pink-500',
      learning: 'from-sky-400 to-blue-500',
      roadmap: 'from-blue-500 to-indigo-600',
      ticker: 'from-gray-400 to-gray-600',
      gratitude: 'from-amber-500 to-orange-500',
    };
    return colors[type] || 'from-cyan-500 to-violet-500';
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 mb-6">
      <div
        className={`relative transition-all duration-300 ease-out-expo ${
          isExpanded ? 'scale-100' : 'scale-95'
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 ${
            isExpanded
              ? 'bg-white/10 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
              : 'bg-white/5 border border-white/10 shadow-lg'
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 opacity-0 transition-opacity duration-300 ${
              isExpanded ? 'opacity-100 animate-gradient-flow' : ''
            }`}
            style={{
              backgroundSize: '200% 200%',
            }}
          />

          <div className="relative flex items-center gap-3 p-4">
            <div
              className={`flex-shrink-0 transition-all duration-300 ${
                isAnalyzing ? 'animate-pulse-glow' : ''
              }`}
            >
              <SparklesIcon
                className={`w-6 h-6 transition-all duration-300 ${
                  isExpanded
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                    : 'text-white/40'
                }`}
              />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={() => onToggleExpand(true)}
              onKeyDown={handleKeyDown}
              placeholder="תאר מה תרצה ליצור..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-base font-medium focus:outline-none"
              autoComplete="off"
              dir="auto"
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onVoiceInput();
                }}
                className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/50 transition-all active:scale-95 group relative overflow-hidden"
                aria-label="קלט קולי"
              >
                <MicrophoneIcon className="w-5 h-5 relative z-10" />
                <span className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-75 transition-opacity rounded-xl animate-ping" />
              </button>

              {input && (
                <button
                  onClick={() => {
                    setInput('');
                    setSuggestions([]);
                    triggerHaptic('light');
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-95"
                  aria-label="נקה"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {suggestions.length > 0 && isExpanded && (
            <div className="border-t border-white/10 bg-black/20 backdrop-blur-md">
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full text-right p-3 rounded-xl transition-all duration-200 group ${
                      index === selectedIndex
                        ? 'bg-white/15 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex-shrink-0 px-3 py-1 rounded-lg bg-gradient-to-r ${getTypeColor(
                          suggestion.type
                        )} text-white text-xs font-bold shadow-lg`}
                      >
                        {getTypeLabel(suggestion.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate" dir="auto">
                          {suggestion.title}
                        </div>
                        {(suggestion.dueDate || suggestion.dueTime || suggestion.priority) && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                            {suggestion.dueDate && <span>📅 {suggestion.dueDate}</span>}
                            {suggestion.dueTime && <span>🕐 {suggestion.dueTime}</span>}
                            {suggestion.priority === 'high' && (
                              <span className="text-red-400">⚠️ חשוב</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full transition-all ${
                              i < Math.floor(suggestion.confidence * 3)
                                ? 'bg-cyan-400 shadow-[0_0_4px_rgba(0,240,255,0.6)]'
                                : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-white/5 bg-black/30">
                <div className="flex items-center justify-center gap-4 text-xs text-white/40">
                  <span>↑↓ לניווט</span>
                  <span>Enter לבחירה</span>
                  <span>Esc לסגירה</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isExpanded && (
        <div className="text-center mt-3 animate-fade-in">
          <p className="text-xs text-white/40">
            נסה: "תזכיר לי להתקשר למנהל מחר ב-15:00 חשוב"
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;