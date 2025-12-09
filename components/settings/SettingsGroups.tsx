import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon } from '../icons';
import { CATEGORIES, SettingsCategory } from './settingsRegistry';

interface SettingsGroupsProps {
    onSelectCategory: (category: SettingsCategory) => void;
}

// Group categories into logical sections
const GROUPS = [
    {
        title: 'התאמה אישית',
        categories: ['profile', 'appearance', 'behavior'] as SettingsCategory[],
    },
    {
        title: 'ממשק ופעולות',
        categories: ['interface', 'focus', 'workout'] as SettingsCategory[],
    },
    {
        title: 'חיבורים ונתונים',
        categories: ['ai', 'sync', 'data'] as SettingsCategory[],
    },
    {
        title: 'מידע',
        categories: ['about'] as SettingsCategory[],
    },
];

const SettingsGroups: React.FC<SettingsGroupsProps> = ({ onSelectCategory }) => {
    const getCategoryInfo = (id: SettingsCategory) => CATEGORIES.find(c => c.id === id);

    return (
        <div className="space-y-6">
            {GROUPS.map((group, groupIndex) => (
                <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                        delay: groupIndex * 0.1,
                    }}
                    className="space-y-2"
                >
                    {/* Group Title */}
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-4">
                        {group.title}
                    </h3>

                    {/* Grouped Card - iOS Style */}
                    <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden">
                        {group.categories.map((categoryId, index) => {
                            const category = getCategoryInfo(categoryId);
                            if (!category) return null;

                            const isLast = index === group.categories.length - 1;

                            return (
                                <motion.button
                                    key={category.id}
                                    whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                    onClick={() => {
                                        onSelectCategory(category.id);
                                        navigator.vibrate?.(10);
                                    }}
                                    className={`
                    w-full flex items-center gap-4 px-4 py-4
                    transition-colors duration-150
                    hover:bg-white/[0.06] active:bg-white/[0.1]
                    ${!isLast ? 'border-b border-white/[0.06]' : ''}
                  `}
                                >
                                    {/* Icon with gradient background */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg
                               shadow-md flex-shrink-0"
                                        style={{
                                            background: `linear-gradient(135deg, ${category.gradient[0]}, ${category.gradient[1]})`,
                                            boxShadow: `0 2px 10px ${category.gradient[0]}30`
                                        }}
                                    >
                                        {category.icon}
                                    </div>

                                    {/* Title */}
                                    <span className="flex-1 text-right text-white font-medium text-[15px]">
                                        {category.title}
                                    </span>

                                    {/* Count badge */}
                                    <span className="text-xs text-[var(--text-tertiary)] bg-white/[0.06] px-2 py-0.5 rounded-full">
                                        {category.count}
                                    </span>

                                    {/* Chevron */}
                                    <ChevronLeftIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default SettingsGroups;
