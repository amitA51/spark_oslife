import React, { useMemo } from 'react';
import type { PersonalItem } from '../types';

interface WeeklyTasksChartProps {
    tasks: PersonalItem[];
}

const toISODateString = (date: Date): string => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

const WeeklyTasksChart: React.FC<WeeklyTasksChartProps> = ({ tasks }) => {
    const taskData = useMemo(() => {
        const today = new Date();
        const days = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            return {
                date,
                dateString: toISODateString(date),
                label: i === 0 ? 'היום' : date.toLocaleDateString('he-IL', { weekday: 'short' }),
                pending: 0,
                completed: 0,
            };
        });

        tasks.forEach(task => {
            if (task.dueDate) {
                const day = days.find(d => d.dateString === task.dueDate);
                if (day) {
                    if (task.isCompleted) {
                        day.completed++;
                    } else {
                        day.pending++;
                    }
                }
            }
        });
        
        return days;
    }, [tasks]);

    const maxTasks = Math.max(...taskData.map(d => d.pending + d.completed), 1);

    return (
        <div className="p-4">
            <h3 className="text-base font-semibold text-white mb-4">משימות לשבוע הקרוב</h3>
            <div className="flex items-end justify-between gap-2 h-40">
                {taskData.map((day, i) => {
                    const total = day.pending + day.completed;
                    const pendingHeight = (day.pending / maxTasks) * 100;
                    const completedHeight = (day.completed / maxTasks) * 100;

                    return (
                        <div key={day.dateString} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                             <div className="w-full h-full flex flex-col-reverse relative group">
                                <div 
                                    className="w-full bg-[var(--dynamic-accent-start)]/30 rounded-t-md animate-bar-grow" 
                                    style={{ height: `${pendingHeight}%`, animationDelay: `${i * 50}ms` }}
                                ></div>
                                <div 
                                    className="w-full bg-[var(--success)]/40 rounded-t-md animate-bar-grow" 
                                    style={{ height: `${completedHeight}%`, animationDelay: `${i * 50}ms` }}
                                ></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[var(--bg-card)] text-xs p-1 px-2 rounded-md whitespace-nowrap shadow-lg">
                                    <p>ממתינות: {day.pending}</p>
                                    <p>הושלמו: {day.completed}</p>
                                </div>
                            </div>
                            <span className="text-xs text-[var(--text-secondary)]">{day.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default WeeklyTasksChart;
