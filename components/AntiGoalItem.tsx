import React, { useState, useCallback, useMemo } from 'react';
import type { PersonalItem } from '../types';
import { BanIcon, CheckCircleIcon, TrashIcon, AlertTriangleIcon, SparklesIcon } from './icons';
import { useHaptics } from '../hooks/useHaptics';

interface AntiGoalItemProps {
    item: PersonalItem;
    onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
    onDelete: (id: string) => void;
    onSelect: (item: PersonalItem, event: React.MouseEvent) => void;
    onContextMenu: (event: React.MouseEvent, item: PersonalItem) => void;
    index: number;
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

const calculateAvoidanceDays = (lastSlip: string | undefined, slipHistory: { date: string }[]): number => {
    // If no slips, calculate from creation or first checkIn
    if (!lastSlip && slipHistory.length === 0) {
        return 0;
    }

    // Find the most recent slip
    const lastSlipDate = lastSlip
        ? new Date(lastSlip)
        : slipHistory.length > 0
            ? new Date(slipHistory[slipHistory.length - 1]?.date ?? new Date())
            : new Date();

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastSlipDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const AntiGoalItem: React.FC<AntiGoalItemProps> = ({
    item,
    onUpdate,
    onDelete,
    onSelect,
    onContextMenu,
    index,
}) => {
    const [justCheckedIn, setJustCheckedIn] = useState(false);
    const [isStrugglingMode, setIsStrugglingMode] = useState(false);
    const { triggerHaptic } = useHaptics();

    const antiGoalData = item.antiGoalData;
    const checkedInToday = isDateToday(antiGoalData?.lastCheckIn);

    // Calculate avoidance days from slip history
    const lastSlipDate = antiGoalData?.slipHistory?.length
        ? antiGoalData.slipHistory[antiGoalData.slipHistory.length - 1]?.date
        : item.createdAt;
    const avoidanceDays = useMemo(() =>
        calculateAvoidanceDays(lastSlipDate, antiGoalData?.slipHistory || []),
        [lastSlipDate, antiGoalData?.slipHistory]
    );

    // Progress towards longest streak
    const longestStreak = antiGoalData?.longestStreak || 0;
    const progressToRecord = longestStreak > 0
        ? Math.min(100, (avoidanceDays / longestStreak) * 100)
        : 100;
    const isNewRecord = avoidanceDays > longestStreak && avoidanceDays > 0;

    const handleCheckIn = useCallback(() => {
        triggerHaptic('medium');
        setJustCheckedIn(true);
        setTimeout(() => setJustCheckedIn(false), 800);

        const now = new Date().toISOString();
        const newTotalAvoidedDays = (antiGoalData?.totalAvoidedDays || 0) + 1;
        const newLongestStreak = avoidanceDays > longestStreak ? avoidanceDays : longestStreak;

        onUpdate(item.id, {
            antiGoalData: {
                ...antiGoalData,
                triggers: antiGoalData?.triggers || [],
                alternativeActions: antiGoalData?.alternativeActions || [],
                slipHistory: antiGoalData?.slipHistory || [],
                longestStreak: newLongestStreak,
                totalAvoidedDays: newTotalAvoidedDays,
                dailyCheckIn: antiGoalData?.dailyCheckIn ?? true,
                lastCheckIn: now,
            },
        });
    }, [item.id, antiGoalData, avoidanceDays, longestStreak, onUpdate, triggerHaptic]);

    const handleSlip = useCallback((severity: 'minor' | 'major') => {
        triggerHaptic('heavy');
        const now = new Date().toISOString();

        const newSlipEvent = {
            id: `slip-${Date.now()}`,
            date: now,
            severity,
        };

        // Update longest streak if current streak was longer
        const newLongestStreak = avoidanceDays > longestStreak ? avoidanceDays : longestStreak;

        onUpdate(item.id, {
            antiGoalData: {
                ...antiGoalData,
                triggers: antiGoalData?.triggers || [],
                alternativeActions: antiGoalData?.alternativeActions || [],
                slipHistory: [...(antiGoalData?.slipHistory || []), newSlipEvent],
                longestStreak: newLongestStreak,
                totalAvoidedDays: antiGoalData?.totalAvoidedDays || 0,
                dailyCheckIn: antiGoalData?.dailyCheckIn ?? true,
                lastCheckIn: now,
            },
        });
        setIsStrugglingMode(false);
    }, [item.id, antiGoalData, avoidanceDays, longestStreak, onUpdate, triggerHaptic]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic('heavy');
        onDelete(item.id);
    }, [item.id, onDelete, triggerHaptic]);

    // Determine styling based on state
    const getBgClass = () => {
        if (justCheckedIn) return 'bg-green-500/20 border-green-500/50';
        if (checkedInToday) return 'bg-emerald-500/10 border-emerald-500/30';
        if (isNewRecord) return 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30';
        return 'border-red-500/20 bg-red-900/5';
    };

    return (
        <div
            onClick={(e) => onSelect(item, e)}
            onContextMenu={(e) => onContextMenu(e, item)}
            className={`group relative themed-card p-4 transition-all duration-300 ease-[var(--fi-cubic-bezier)] cursor-pointer active:scale-97 animate-item-enter-fi ${getBgClass()}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Celebration sparkles on check-in */}
            {justCheckedIn && Array.from({ length: 7 }).map((_, i) => (
                <div
                    key={i}
                    className="celebrate-sparkle"
                    style={{
                        top: `${Math.random() * 80 + 10}%`,
                        left: `${Math.random() * 80 + 10}%`,
                        animationDelay: `${Math.random() * 0.2}s`,
                        width: `${Math.random() * 6 + 6}px`,
                        height: `${Math.random() * 6 + 6}px`,
                    }}
                />
            ))}

            {/* New Record Badge */}
            {isNewRecord && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                    🏆 שיא חדש!
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {/* Icon with avoidance counter */}
                    <div className="relative">
                        {/* Progress ring */}
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-white/10"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                stroke="url(#antigoal-gradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${(progressToRecord / 100) * 150.8} 150.8`}
                                className="transition-all duration-700"
                            />
                            <defs>
                                <linearGradient id="antigoal-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10B981" />
                                    <stop offset="100%" stopColor="#34D399" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BanIcon className="w-6 h-6 text-red-400" />
                        </div>

                        {/* Days counter badge */}
                        <span
                            className="absolute -bottom-1 -right-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full min-w-[1.5rem] h-6 px-1.5 flex items-center justify-center border-2 border-[var(--bg-card)] shadow-lg"
                            style={{ boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}
                        >
                            {avoidanceDays}d
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        <p className="text-lg font-semibold text-white truncate">
                            {item.title}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {checkedInToday
                                ? '✅ צ\'ק-אין להיום בוצע!'
                                : avoidanceDays > 0
                                    ? `🛡️ נמנע כבר ${avoidanceDays} ימים`
                                    : '💪 בוא נתחיל היום!'}
                        </p>
                        {antiGoalData?.motivation && (
                            <p className="text-xs text-[var(--text-secondary)]/70 mt-1 truncate">
                                💡 {antiGoalData.motivation}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {isStrugglingMode ? (
                        <div className="flex flex-col gap-1 animate-in fade-in-0 slide-in-from-right-2 duration-200">
                            <span className="text-[10px] text-red-400 text-center">מה קרה?</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSlip('minor');
                                    }}
                                    className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded hover:bg-yellow-500/30 transition-colors"
                                >
                                    קטנה
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSlip('major');
                                    }}
                                    className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/30 transition-colors"
                                >
                                    גדולה
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsStrugglingMode(false);
                                    }}
                                    className="bg-white/5 text-white/50 text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Struggling button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsStrugglingMode(true);
                                }}
                                className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all transform hover:scale-110 active:scale-95 bg-white/5 hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
                                title="מתקשה"
                            >
                                <AlertTriangleIcon className="w-5 h-5" />
                            </button>

                            {/* Check-in button */}
                            {antiGoalData?.dailyCheckIn !== false && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckIn();
                                    }}
                                    disabled={checkedInToday}
                                    className={`relative w-14 h-14 flex items-center justify-center rounded-full transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${checkedInToday
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-[var(--bg-secondary)] hover:bg-emerald-500/20 text-[var(--text-primary)] hover:text-emerald-400'
                                        }`}
                                    aria-label={checkedInToday ? 'צ\'ק-אין בוצע' : 'בצע צ\'ק-אין'}
                                >
                                    {checkedInToday && (
                                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                                    )}
                                    <CheckCircleIcon className="w-8 h-8" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            {(longestStreak > 0 || (antiGoalData?.totalAvoidedDays || 0) > 0) && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                    {longestStreak > 0 && (
                        <span className="flex items-center gap-1">
                            <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                            שיא: {longestStreak} ימים
                        </span>
                    )}
                    {(antiGoalData?.totalAvoidedDays || 0) > 0 && (
                        <span className="flex items-center gap-1">
                            🛡️ סה"כ: {antiGoalData?.totalAvoidedDays} ימים
                        </span>
                    )}
                    {(antiGoalData?.slipHistory?.length || 0) > 0 && (
                        <span className="flex items-center gap-1 text-red-400/70">
                            מעידות: {antiGoalData?.slipHistory?.length}
                        </span>
                    )}
                </div>
            )}

            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 left-2 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all transform hover:scale-110 flex-shrink-0 opacity-0 group-hover:opacity-100"
                aria-label="מחק"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export default React.memo(AntiGoalItem);
