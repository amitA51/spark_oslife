import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, XIcon, ClockIcon } from '../icons';
import { searchSettings, SettingItem, CATEGORIES, SettingsCategory } from './settingsRegistry';

interface SettingsSearchProps {
    onSelectSetting: (setting: SettingItem) => void;
    onSelectCategory: (category: SettingsCategory) => void;
}

const SettingsSearch: React.FC<SettingsSearchProps> = ({ onSelectSetting, onSelectCategory }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [results, setResults] = useState<SettingItem[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('settings_recent_searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved).slice(0, 5));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Search as user types
    useEffect(() => {
        if (query.trim()) {
            const searchResults = searchSettings(query);
            setResults(searchResults);
        } else {
            setResults([]);
        }
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsFocused(true);
            }
            if (e.key === 'Escape') {
                setIsFocused(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelectSetting = useCallback((setting: SettingItem) => {
        // Save to recent searches
        const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('settings_recent_searches', JSON.stringify(newRecent));

        setQuery('');
        setIsFocused(false);
        onSelectSetting(setting);

        // Haptic feedback
        navigator.vibrate?.(10);
    }, [query, recentSearches, onSelectSetting]);

    const handleClearSearch = useCallback(() => {
        setQuery('');
        inputRef.current?.focus();
    }, []);

    const getCategoryInfo = (categoryId: SettingsCategory) => {
        return CATEGORIES.find(c => c.id === categoryId);
    };

    const showDropdown = isFocused && (query.trim() || recentSearches.length > 0);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Search Input */}
            <motion.div
                className={`
          relative flex items-center gap-3 px-4 py-3.5
          bg-white/[0.06] backdrop-blur-xl
          border transition-all duration-300
          ${isFocused
                        ? 'border-[var(--dynamic-accent-start)]/50 shadow-[0_0_20px_var(--dynamic-accent-glow)] bg-white/[0.1]'
                        : 'border-white/[0.08] hover:border-white/[0.15]'
                    }
          rounded-2xl
        `}
                animate={{ scale: isFocused ? 1.01 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <SearchIcon className={`w-5 h-5 transition-colors ${isFocused ? 'text-[var(--dynamic-accent-start)]' : 'text-[var(--text-secondary)]'}`} />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="חיפוש הגדרות..."
                    className="flex-1 bg-transparent text-white placeholder:text-[var(--text-secondary)] outline-none text-[15px]"
                    dir="rtl"
                />

                {/* Keyboard shortcut hint */}
                {!isFocused && !query && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] font-mono">K</kbd>
                    </div>
                )}

                {/* Clear button */}
                {query && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={handleClearSearch}
                        className="p-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] transition-colors"
                    >
                        <XIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                    </motion.button>
                )}
            </motion.div>

            {/* Dropdown Results */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute z-50 top-full left-0 right-0 mt-2 p-2
                       bg-[var(--bg-card)]/95 backdrop-blur-2xl
                       border border-white/[0.1] rounded-2xl
                       shadow-[0_16px_48px_rgba(0,0,0,0.4)]
                       max-h-[60vh] overflow-y-auto overscroll-contain"
                    >
                        {/* Search Results */}
                        {results.length > 0 ? (
                            <div className="space-y-1">
                                <p className="text-xs text-[var(--text-secondary)] px-3 py-2 font-medium">
                                    תוצאות ({results.length})
                                </p>
                                {results.map((setting, index) => {
                                    const category = getCategoryInfo(setting.category);
                                    return (
                                        <motion.button
                                            key={setting.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => handleSelectSetting(setting)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl
                                 hover:bg-white/[0.08] active:scale-[0.98]
                                 transition-all duration-150 text-right"
                                        >
                                            {category && (
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${category.gradient[0]}20, ${category.gradient[1]}10)`,
                                                        border: `1px solid ${category.gradient[0]}30`
                                                    }}
                                                >
                                                    {category.icon}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{setting.title}</p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate">{setting.description}</p>
                                            </div>
                                            <span className="text-xs text-[var(--text-tertiary)] bg-white/[0.05] px-2 py-1 rounded-lg">
                                                {category?.title}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        ) : query.trim() ? (
                            <div className="py-8 text-center">
                                <p className="text-[var(--text-secondary)]">לא נמצאו תוצאות</p>
                                <p className="text-xs text-[var(--text-tertiary)] mt-1">נסה מילות חיפוש אחרות</p>
                            </div>
                        ) : null}

                        {/* Recent Searches */}
                        {!query.trim() && recentSearches.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-[var(--text-secondary)] px-3 py-2 font-medium flex items-center gap-2">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    חיפושים אחרונים
                                </p>
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setQuery(search)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl
                               hover:bg-white/[0.08] transition-colors text-right"
                                    >
                                        <ClockIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        <span className="text-[var(--text-secondary)]">{search}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Quick Category Access */}
                        {!query.trim() && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <p className="text-xs text-[var(--text-secondary)] px-3 py-2 font-medium">
                                    קטגוריות מהירות
                                </p>
                                <div className="flex flex-wrap gap-2 p-2">
                                    {CATEGORIES.slice(0, 6).map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setIsFocused(false);
                                                onSelectCategory(cat.id);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl
                                 bg-white/[0.05] hover:bg-white/[0.1]
                                 border border-white/[0.08] transition-all"
                                            style={{ borderColor: `${cat.gradient[0]}30` }}
                                        >
                                            <span>{cat.icon}</span>
                                            <span className="text-sm text-white">{cat.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsSearch;
