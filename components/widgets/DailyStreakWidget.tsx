import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../src/contexts/DataContext';
import { toDateKey, todayKey } from '../../utils/dateUtils';

interface DailyStreakWidgetProps {
    compact?: boolean;
}

const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({ compact = false }) => {
    const { personalItems } = useData();
    const [showCelebration, setShowCelebration] = useState(false);

    const streakData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all completed tasks from the last 30 days
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const completedDates = new Set<string>();

        personalItems.forEach(item => {
            if (item.type === 'task' && item.isCompleted && item.lastCompleted) {
                const completedDate = new Date(item.lastCompleted);
                completedDate.setHours(0, 0, 0, 0);
                if (completedDate >= thirtyDaysAgo) {
                    completedDates.add(toDateKey(completedDate));
                }
            }

            // Also count habits
            if (item.type === 'habit' && item.lastCompleted) {
                const completedDate = new Date(item.lastCompleted);
                completedDate.setHours(0, 0, 0, 0);
                if (completedDate >= thirtyDaysAgo) {
                    completedDates.add(toDateKey(completedDate));
                }
            }
        });

        // Calculate current streak
        let streak = 0;
        let checkDate = new Date(today);

        // Check if today has completions, if not start from yesterday
        const todayStr = todayKey();
        if (!completedDates.has(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (completedDates.has(toDateKey(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Generate last 7 days for mini calendar
        const last7Days: { date: string; hasActivity: boolean }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = toDateKey(d);
            last7Days.push({
                date: dateStr,
                hasActivity: completedDates.has(dateStr),
            });
        }

        return { streak, last7Days, todayHasActivity: completedDates.has(todayStr) };
    }, [personalItems]);

    // Show celebration for milestone streaks
    useEffect(() => {
        if (streakData.streak > 0 && streakData.streak % 7 === 0) {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [streakData.streak]);

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <span
                    className={`text-lg ${streakData.streak > 0 ? 'animate-streak-fire' : ''}`}
                    role="img"
                    aria-label="flame"
                >
                    🔥
                </span>
                <span className="text-sm font-bold text-white">{streakData.streak}</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass-subtle rounded-2xl p-4 border border-white/10"
        >
            {/* Celebration overlay */}
            {showCelebration && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-2xl backdrop-blur-sm z-10"
                >
                    <div className="text-center">
                        <span className="text-4xl animate-bounce-in">🎉</span>
                        <p className="text-lg font-bold text-white mt-2">
                            {streakData.streak} ימים ברצף!
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`text-3xl ${streakData.streak > 0 ? 'animate-streak-fire' : 'opacity-50'}`}
                    >
                        🔥
                    </div>
                    <div>
                        <motion.p
                            key={streakData.streak}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-3xl font-bold text-white font-heading"
                        >
                            {streakData.streak}
                        </motion.p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">ימים ברצף</p>
                    </div>
                </div>

                {streakData.todayHasActivity && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400">היום בוצע</span>
                    </div>
                )}
            </div>

            {/* Mini calendar - last 7 days */}
            <div className="flex gap-1.5 justify-between">
                {streakData.last7Days.map((day, index) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('he-IL', { weekday: 'narrow' });
                    const isToday = index === 6;

                    return (
                        <motion.div
                            key={day.date}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex flex-col items-center gap-1"
                        >
                            <span className="text-[10px] text-gray-500">{dayName}</span>
                            <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                  ${day.hasActivity
                                        ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30'
                                        : 'bg-white/5 border border-white/10'}
                  ${isToday ? 'ring-2 ring-white/20' : ''}
                `}
                            >
                                {day.hasActivity && (
                                    <span className="text-xs">🔥</span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Motivational text based on streak */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-xs text-center text-gray-400 italic"
            >
                {streakData.streak === 0 && 'התחל את הרצף שלך היום! 💪'}
                {streakData.streak > 0 && streakData.streak < 3 && 'התחלה נהדרת! המשך כך 🌱'}
                {streakData.streak >= 3 && streakData.streak < 7 && 'בונה תנופה! אתה על הגל 🚀'}
                {streakData.streak >= 7 && streakData.streak < 14 && 'שבוע שלם! אתה מכונה 🔥'}
                {streakData.streak >= 14 && streakData.streak < 30 && 'חודש כמעט שלם! אלוף 🏆'}
                {streakData.streak >= 30 && 'אגדה חיה! 30+ ימים ברצף! 👑'}
            </motion.p>
        </motion.div>
    );
};

export default DailyStreakWidget;
