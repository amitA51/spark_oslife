import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../state/AppContext';
import BaseWidget from './BaseWidget';
import { TargetIcon } from '../icons';

const ProductivityStatsWidget: React.FC = () => {
    const { state } = useContext(AppContext);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

        // Today's stats
        const todayTasks = state.personalItems.filter(item =>
            item.type === 'task' && item.dueDate === today
        );
        const todayCompleted = todayTasks.filter(t => t.isCompleted).length;
        const todayTotal = todayTasks.length;

        // This week's stats
        const weekTasks = state.personalItems.filter(item =>
            item.type === 'task' &&
            item.dueDate &&
            item.dueDate >= thisWeekStartStr
        );
        const weekCompleted = weekTasks.filter(t => t.isCompleted).length;
        const weekTotal = weekTasks.length;

        // Habits
        const activeHabits = state.personalItems.filter(item =>
            item.type === 'habit'
        ).length;

        // Completion rate
        const completionRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

        return {
            todayCompleted,
            todayTotal,
            weekCompleted,
            weekTotal,
            activeHabits,
            completionRate,
        };
    }, [state.personalItems]);

    const getCompletionColor = (rate: number) => {
        if (rate >= 80) return 'text-green-400';
        if (rate >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <BaseWidget
            title="סטטיסטיקות"
            icon={<TargetIcon className="w-5 h-5" />}
            size="small"
        >
            <div className="space-y-4">
                {/* Completion Rate Circle */}
                <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="var(--bg-tertiary)"
                                strokeWidth="8"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="var(--dynamic-accent-start)"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - stats.completionRate / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${getCompletionColor(stats.completionRate)}`}>
                                {stats.completionRate}%
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">השלמה</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">
                            {stats.todayCompleted}/{stats.todayTotal}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                            משימות היום
                        </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">
                            {stats.weekCompleted}/{stats.weekTotal}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                            שבוע זה
                        </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center col-span-2">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">
                            {stats.activeHabits}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                            הרגלים פעילים
                        </div>
                    </div>
                </div>

                {/* Motivational Message */}
                {stats.completionRate === 100 && stats.todayTotal > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                        <p className="text-sm text-green-400 font-medium">
                            🎉 יום מושלם! כל המשימות הושלמו!
                        </p>
                    </div>
                )}
                {stats.completionRate >= 50 && stats.completionRate < 100 && stats.todayTotal > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                        <p className="text-sm text-yellow-400 font-medium">
                            💪 עבודה טובה! המשך כך!
                        </p>
                    </div>
                )}
            </div>
        </BaseWidget>
    );
};

export default ProductivityStatsWidget;
