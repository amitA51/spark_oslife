import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, ClockIcon, ChevronLeftIcon } from '../icons';
import { SettingItem, CATEGORIES, SettingsCategory, getCategoryInfo } from './settingsRegistry';

interface SettingsFavoritesProps {
    onSelectSetting: (setting: SettingItem) => void;
    onViewAll: () => void;
}

interface FavoriteSettingData {
    id: string;
    title: string;
    category: SettingsCategory;
    timestamp: number;
}

const SettingsFavorites: React.FC<SettingsFavoritesProps> = ({ onSelectSetting, onViewAll }) => {
    const [favorites, setFavorites] = useState<FavoriteSettingData[]>([]);
    const [recentSettings, setRecentSettings] = useState<FavoriteSettingData[]>([]);

    // Load favorites and recent from localStorage
    useEffect(() => {
        const savedFavorites = localStorage.getItem('settings_favorites');
        const savedRecent = localStorage.getItem('settings_recent');

        if (savedFavorites) {
            try {
                setFavorites(JSON.parse(savedFavorites));
            } catch {
                // Ignore
            }
        }

        if (savedRecent) {
            try {
                setRecentSettings(JSON.parse(savedRecent).slice(0, 5));
            } catch {
                // Ignore
            }
        }
    }, []);

    const handleRemoveFavorite = useCallback((id: string) => {
        const newFavorites = favorites.filter(f => f.id !== id);
        setFavorites(newFavorites);
        localStorage.setItem('settings_favorites', JSON.stringify(newFavorites));
        navigator.vibrate?.([10, 50, 10]);
    }, [favorites]);

    // Show section only if there are items
    if (favorites.length === 0 && recentSettings.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Favorites Section */}
            {favorites.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                            <StarIcon className="w-4 h-4 text-amber-400" />
                            מועדפים
                        </h3>
                        <button
                            onClick={onViewAll}
                            className="text-xs text-[var(--dynamic-accent-start)] hover:underline flex items-center gap-1"
                        >
                            הצג הכל
                            <ChevronLeftIcon className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Horizontal scroll container */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar snap-x snap-mandatory">
                        <AnimatePresence>
                            {favorites.map((fav, index) => {
                                const category = getCategoryInfo(fav.category);
                                return (
                                    <motion.button
                                        key={fav.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8, x: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onSelectSetting({
                                            id: fav.id,
                                            title: fav.title,
                                            category: fav.category,
                                            description: '',
                                            keywords: [],
                                            type: 'action'
                                        })}
                                        className="relative flex-shrink-0 snap-start
                               w-28 p-3 rounded-2xl text-center
                               bg-white/[0.05] border border-white/[0.08]
                               hover:bg-white/[0.1] hover:border-white/[0.15]
                               transition-all duration-200 active:scale-95
                               group"
                                    >
                                        {/* Remove button on hover */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFavorite(fav.id);
                                            }}
                                            className="absolute -top-1 -left-1 w-5 h-5 rounded-full
                                 bg-red-500/80 text-white text-xs
                                 opacity-0 group-hover:opacity-100
                                 transition-opacity flex items-center justify-center"
                                        >
                                            ×
                                        </button>

                                        {/* Icon */}
                                        <div
                                            className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-lg mb-2"
                                            style={{
                                                background: category
                                                    ? `linear-gradient(135deg, ${category.gradient[0]}30, ${category.gradient[1]}15)`
                                                    : 'rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {category?.icon || '⚙️'}
                                        </div>

                                        {/* Title */}
                                        <span className="text-sm text-white font-medium truncate block">
                                            {fav.title}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>

                        {/* Add placeholder if less than 3 favorites */}
                        {favorites.length < 3 && (
                            <div className="flex-shrink-0 w-28 p-3 rounded-2xl text-center
                              border-2 border-dashed border-white/[0.1]
                              flex flex-col items-center justify-center gap-2
                              text-[var(--text-tertiary)]">
                                <StarIcon className="w-5 h-5" />
                                <span className="text-xs">לחיצה ארוכה להוספה</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Settings Section */}
            {recentSettings.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2 px-1">
                        <ClockIcon className="w-4 h-4" />
                        נערכו לאחרונה
                    </h3>

                    <div className="space-y-1">
                        {recentSettings.slice(0, 3).map((setting, index) => {
                            const category = getCategoryInfo(setting.category);
                            return (
                                <motion.button
                                    key={`${setting.id}-${index}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onSelectSetting({
                                        id: setting.id,
                                        title: setting.title,
                                        category: setting.category,
                                        description: '',
                                        keywords: [],
                                        type: 'action'
                                    })}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl
                             bg-white/[0.03] hover:bg-white/[0.08]
                             border border-transparent hover:border-white/[0.08]
                             transition-all duration-200 active:scale-[0.99]"
                                >
                                    <span className="text-lg">{category?.icon || '⚙️'}</span>
                                    <span className="flex-1 text-right text-white font-medium">{setting.title}</span>
                                    <span className="text-xs text-[var(--text-tertiary)]">
                                        {formatTimeAgo(setting.timestamp)}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper to format relative time
function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'עכשיו';
    if (seconds < 3600) return `לפני ${Math.floor(seconds / 60)} דק'`;
    if (seconds < 86400) return `לפני ${Math.floor(seconds / 3600)} שע'`;
    return `לפני ${Math.floor(seconds / 86400)} ימים`;
}

export default SettingsFavorites;
