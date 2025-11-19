import React, { useMemo } from 'react';
import type { PersonalItem } from '../types';

interface HabitConsistencyChartProps {
    habits: PersonalItem[];
    personalItems: PersonalItem[];
}

const toISODateString = (date: Date): string => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

const HabitConsistencyChart: React.FC<HabitConsistencyChartProps> = ({ habits, personalItems }) => {
    const data = useMemo(() => {
        if (habits.length === 0) return [];

        const today = new Date();
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const dateString = toISODateString(date);

            const completedOnDate = personalItems.filter(item => 
                item.type === 'habit' && 
                item.completionHistory?.some(h => toISODateString(new Date(h.date)) === dateString)
            ).length;

            const percentage = (completedOnDate / habits.length) * 100;
            return {
                label: date.toLocaleDateString('he-IL', { weekday: 'short' }),
                percentage,
            };
        });
    }, [habits, personalItems]);

    return (
        <div className="p-4">
            <h3 className="text-base font-semibold text-white mb-4">עקביות בהרגלים</h3>
             <div className="flex items-center justify-between gap-2">
                {data.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[var(--bg-secondary)] relative"
                        >
                            <div 
                                className="absolute inset-0 rounded-full bg-[var(--accent-gradient)] opacity-80"
                                style={{
                                    height: `${day.percentage}%`,
                                    bottom: 0,
                                    top: 'auto',
                                    transition: 'height 0.5s ease-out',
                                    animationDelay: `${i*50}ms`
                                }}
                            ></div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[var(--bg-card)] text-xs p-1 px-2 rounded-md whitespace-nowrap shadow-lg">
                                {Math.round(day.percentage)}%
                            </div>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">{day.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HabitConsistencyChart;
