import React from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, SettingsCategory } from './settingsRegistry';

interface SettingsGridProps {
    onSelectCategory: (category: SettingsCategory) => void;
    activeCategory?: SettingsCategory;
}

const SettingsGrid: React.FC<SettingsGridProps> = ({ onSelectCategory, activeCategory }) => {
    return (
        <div className="space-y-4">
            {/* Section Title */}
            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">
                📂 כל הקטגוריות
            </h3>

            {/* Grid of Categories */}
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category, index) => {
                    const isActive = activeCategory === category.id;

                    return (
                        <motion.button
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 25,
                                delay: index * 0.05,
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                onSelectCategory(category.id);
                                navigator.vibrate?.(10);
                            }}
                            className={`
                relative overflow-hidden p-4 rounded-2xl text-right
                transition-all duration-300
                ${isActive
                                    ? 'ring-2 ring-[var(--dynamic-accent-start)] shadow-[0_0_30px_var(--dynamic-accent-glow)]'
                                    : 'hover:shadow-lg'
                                }
              `}
                            style={{
                                background: `linear-gradient(135deg, ${category.gradient[0]}15, ${category.gradient[1]}08)`,
                                border: `1px solid ${isActive ? category.gradient[0] : `${category.gradient[0]}30`}`,
                            }}
                        >
                            {/* Glow effect */}
                            <div
                                className="absolute top-0 left-0 w-20 h-20 rounded-full blur-3xl opacity-30"
                                style={{ background: category.gradient[0] }}
                            />

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Icon */}
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3
                             shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${category.gradient[0]}, ${category.gradient[1]})`,
                                        boxShadow: `0 4px 20px ${category.gradient[0]}40`
                                    }}
                                >
                                    {category.icon}
                                </div>

                                {/* Title & Count */}
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-semibold text-[15px]">
                                        {category.title}
                                    </span>
                                    <span
                                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: `${category.gradient[0]}20`,
                                            color: category.gradient[0]
                                        }}
                                    >
                                        {category.count}
                                    </span>
                                </div>
                            </div>

                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeCategory"
                                    className="absolute inset-0 rounded-2xl pointer-events-none"
                                    style={{
                                        border: `2px solid ${category.gradient[0]}`,
                                        boxShadow: `inset 0 0 20px ${category.gradient[0]}20`
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default SettingsGrid;
