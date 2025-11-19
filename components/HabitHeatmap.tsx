
import React, { useMemo } from 'react';
import type { PersonalItem } from '../types';

interface HabitHeatmapProps {
    habits: PersonalItem[];
    personalItems: PersonalItem[];
}

const toISODateString = (date: Date): string => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

// Helper to get weeks for the calendar grid
const getCalendarGrid = (daysBack: number = 120) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysBack);
    
    // Adjust start date to the nearest Sunday to align grid
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    // Generate dates until today
    while (currentDate <= today) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ habits, personalItems }) => {
    const heatmapData = useMemo(() => {
        const dates = getCalendarGrid(140); // Roughly 5 months
        const completionMap = new Map<string, number>();
        
        if (habits.length === 0) return { weeks: [], maxHabits: 0 };

        // Build a map of date -> completion count
        personalItems.forEach(item => {
             if (item.type === 'habit' && item.completionHistory) {
                 item.completionHistory.forEach(h => {
                     const dateKey = toISODateString(new Date(h.date));
                     completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
                 });
             }
             // Check "lastCompleted" for legacy or single-day checks
             if (item.type === 'habit' && item.lastCompleted) {
                 const dateKey = toISODateString(new Date(item.lastCompleted));
                 // We only add if it wasn't already counted in history (prevents double counting if logic changes)
                 // For simplicity in this context, let's just trust history or lastCompleted.
                 // Assuming consistency: history is the source of truth.
             }
        });

        // Organize into columns (weeks)
        const weeks: { dates: { date: Date; count: number; dateString: string }[] }[] = [];
        let currentWeek: { date: Date; count: number; dateString: string }[] = [];

        dates.forEach(date => {
            if (currentWeek.length === 7) {
                weeks.push({ dates: currentWeek });
                currentWeek = [];
            }
            const dateString = toISODateString(date);
            const count = completionMap.get(dateString) || 0;
            currentWeek.push({ date, count, dateString });
        });
        if (currentWeek.length > 0) weeks.push({ dates: currentWeek });

        return { weeks, maxHabits: habits.length };
    }, [habits, personalItems]);

    const getColor = (count: number, max: number) => {
        if (count === 0) return 'bg-white/5';
        const intensity = Math.ceil((count / Math.max(1, max)) * 4);
        // Using Tailwind opacity modifiers on the accent color variable
        switch (intensity) {
            case 1: return 'bg-[var(--dynamic-accent-start)] opacity-40';
            case 2: return 'bg-[var(--dynamic-accent-start)] opacity-60';
            case 3: return 'bg-[var(--dynamic-accent-start)] opacity-80';
            case 4: return 'bg-[var(--dynamic-accent-start)] opacity-100 shadow-[0_0_8px_var(--dynamic-accent-glow)]';
            default: return 'bg-[var(--dynamic-accent-start)] opacity-20';
        }
    };

    return (
        <div className="p-4 w-full overflow-x-auto" style={{scrollbarWidth: 'none'}}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-white">מפת הרגלים</h3>
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                    <span>פחות</span>
                    <div className="w-2 h-2 rounded-[2px] bg-white/5"></div>
                    <div className="w-2 h-2 rounded-[2px] bg-[var(--dynamic-accent-start)] opacity-40"></div>
                    <div className="w-2 h-2 rounded-[2px] bg-[var(--dynamic-accent-start)] opacity-80"></div>
                    <div className="w-2 h-2 rounded-[2px] bg-[var(--dynamic-accent-start)] opacity-100"></div>
                    <span>יותר</span>
                </div>
            </div>
            
            <div className="flex gap-1 min-w-max pb-2">
                {heatmapData.weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                        {week.dates.map((day, dIndex) => (
                            <div
                                key={day.dateString}
                                className={`w-3 h-3 rounded-[2px] transition-all duration-500 hover:scale-125 hover:z-10 relative ${getColor(day.count, heatmapData.maxHabits)}`}
                                data-tooltip={`${day.count} הרגלים ב-${day.date.toLocaleDateString('he-IL', {day: 'numeric', month: 'short'})}`}
                            ></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HabitHeatmap;
