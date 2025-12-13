import React, { useMemo } from 'react';
import type { PersonalItem } from '../../types';
import { useData } from '../../src/contexts/DataContext';
import { BanIcon, CheckCircleIcon, SparklesIcon } from '../icons';

interface AntiGoalsWidgetProps {
    onSelect?: (item: PersonalItem) => void;
}

const isDateToday = (isoDate: string | undefined): boolean => {
    if (!isoDate) return false;
    const date = new Date(isoDate);
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
};

const AntiGoalsWidget: React.FC<AntiGoalsWidgetProps> = ({ onSelect }) => {
    const { personalItems } = useData();

    const antiGoals = useMemo(() =>
        personalItems.filter(item => item.type === 'antigoal'),
        [personalItems]
    );

    const stats = useMemo(() => {
        let checkedInToday = 0;
        let totalAvoidanceDays = 0;
        let longestCurrentStreak = 0;

        antiGoals.forEach(item => {
            const data = item.antiGoalData;
            if (isDateToday(data?.lastCheckIn)) {
                checkedInToday++;
            }
            totalAvoidanceDays += data?.totalAvoidedDays || 0;

            // Calculate current streak
            const slipHistory = data?.slipHistory ?? [];
            const lastSlipDate = slipHistory.length > 0
                ? new Date(slipHistory[slipHistory.length - 1]?.date ?? item.createdAt)
                : new Date(item.createdAt);
            const currentStreak = Math.floor(
                (new Date().getTime() - lastSlipDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (currentStreak > longestCurrentStreak) {
                longestCurrentStreak = currentStreak;
            }
        });

        return {
            total: antiGoals.length,
            checkedInToday,
            needsCheckIn: antiGoals.length - checkedInToday,
            totalAvoidanceDays,
            longestCurrentStreak,
        };
    }, [antiGoals]);

    if (antiGoals.length === 0) {
        return null; // Don't show widget if no anti-goals
    }

    const allCheckedIn = stats.needsCheckIn === 0;

    return (
        <div className="themed-card p-4 bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <BanIcon className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">אנטי-יעדים</h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {stats.total} פריטים פעילים
                        </p>
                    </div>
                </div>

                {/* Status badge */}
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${allCheckedIn
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {allCheckedIn ? (
                        <>
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            הכל מעודכן
                        </>
                    ) : (
                        <>
                            {stats.needsCheckIn} דורשים צ'ק-אין
                        </>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-emerald-400">
                        {stats.longestCurrentStreak}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                        ימי רצף
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                        <SparklesIcon className="w-4 h-4" />
                        {stats.totalAvoidanceDays}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                        סה"כ ימים
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-cyan-400">
                        {stats.checkedInToday}/{stats.total}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                        צ'ק-אין היום
                    </div>
                </div>
            </div>

            {/* Quick list of anti-goals needing attention */}
            {stats.needsCheckIn > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                        דורשים צ'ק-אין:
                    </p>
                    <div className="space-y-1">
                        {antiGoals
                            .filter(item => !isDateToday(item.antiGoalData?.lastCheckIn))
                            .slice(0, 3)
                            .map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelect?.(item)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                    <span className="text-sm text-white truncate flex-1">
                                        {item.title}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(AntiGoalsWidget);
