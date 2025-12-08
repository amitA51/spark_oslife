import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSet } from '../../types';
import { CloseIcon, ClockIcon, TrophyIcon } from '../icons';
import * as dataService from '../../services/dataService';

interface PreviousDataOverlayProps {
    exerciseName: string;
    isOpen: boolean;
    onClose: () => void;
    onLoadValues: (weight: number, reps: number) => void;
}

interface HistoricalSession {
    date: string;
    sets: WorkoutSet[];
}

/**
 * PreviousDataOverlay - Shows historical data for an exercise
 * Allows loading previous values into current set
 */
const PreviousDataOverlay: React.FC<PreviousDataOverlayProps> = ({
    exerciseName,
    isOpen,
    onClose,
    onLoadValues,
}) => {
    const [history, setHistory] = useState<HistoricalSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [bestWeight, setBestWeight] = useState(0);
    const [bestReps, setBestReps] = useState(0);

    useEffect(() => {
        if (isOpen && exerciseName) {
            loadHistory();
        }
    }, [isOpen, exerciseName]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            // Load workout sessions
            const sessions = await dataService.getWorkoutSessions(50);

            // Filter sessions that contain this exercise
            const relevantSessions: HistoricalSession[] = [];
            let maxWeight = 0;
            let maxReps = 0;

            sessions.forEach(session => {
                const exercise = session.exercises.find(
                    ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
                );

                if (exercise && exercise.sets.length > 0) {
                    relevantSessions.push({
                        date: session.startTime,
                        sets: exercise.sets,
                    });

                    // Track best values
                    exercise.sets.forEach(set => {
                        if ((set.weight || 0) > maxWeight) {
                            maxWeight = set.weight || 0;
                        }
                        if ((set.reps || 0) > maxReps && (set.weight || 0) >= maxWeight * 0.8) {
                            maxReps = set.reps || 0;
                        }
                    });
                }
            });

            setHistory(relevantSessions.slice(0, 10)); // Last 10 sessions with this exercise
            setBestWeight(maxWeight);
            setBestReps(maxReps);
        } catch (error) {
            console.error('Failed to load exercise history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'היום';
        if (diffDays === 1) return 'אתמול';
        if (diffDays < 7) return `לפני ${diffDays} ימים`;

        return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[10001] flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-md bg-gradient-to-b from-[var(--cosmos-bg-secondary)] to-[var(--cosmos-bg-primary)] rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] overflow-hidden shadow-[0_-10px_60px_rgba(0,0,0,0.5)]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 border-b border-white/5">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{exerciseName}</h2>
                                <p className="text-sm text-white/50 mt-1">היסטוריית ביצועים</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
                            >
                                <CloseIcon className="w-5 h-5 text-white/70" />
                            </motion.button>
                        </div>

                        {/* Best Stats */}
                        {!loading && (bestWeight > 0 || bestReps > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 mt-4"
                            >
                                <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrophyIcon className="w-4 h-4 text-yellow-400" />
                                        <span className="text-xs text-yellow-400 font-semibold">שיא משקל</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{bestWeight}kg</span>
                                </div>
                                <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm">🔁</span>
                                        <span className="text-xs text-emerald-400 font-semibold">שיא חזרות</span>
                                    </div>
                                    <span className="text-2xl font-black text-white">{bestReps}</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-5 overflow-y-auto max-h-[55vh] overscroll-contain">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-10 h-10 border-2 border-[var(--cosmos-accent-primary)] border-t-transparent rounded-full"
                                />
                                <p className="mt-4 text-white/50 text-sm">טוען היסטוריה...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                <span className="text-4xl block mb-4">📊</span>
                                <p>אין היסטוריה עדיין</p>
                                <p className="text-sm mt-1">סיים סט ראשון כדי להתחיל לעקוב</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((session, sessionIndex) => (
                                    <motion.div
                                        key={session.date}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: sessionIndex * 0.05 }}
                                        className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
                                    >
                                        {/* Session Header */}
                                        <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4 text-white/40" />
                                                <span className="text-sm font-medium text-white/70">
                                                    {formatDate(session.date)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-white/40">
                                                {session.sets.length} סטים
                                            </span>
                                        </div>

                                        {/* Session Sets */}
                                        <div className="p-3 space-y-2">
                                            {session.sets.map((set, setIndex) => (
                                                <motion.button
                                                    key={setIndex}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => onLoadValues(set.weight || 0, set.reps || 0)}
                                                    className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-[var(--cosmos-accent-primary)]/10 border border-transparent hover:border-[var(--cosmos-accent-primary)]/30 transition-all flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                                                            {setIndex + 1}
                                                        </span>
                                                        <span className="font-bold text-white">
                                                            {set.weight || 0}kg × {set.reps || 0}
                                                        </span>
                                                        {set.rpe && (
                                                            <span className="text-xs text-white/40">
                                                                RPE {set.rpe}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -5 }}
                                                        whileHover={{ opacity: 1, x: 0 }}
                                                        className="text-xs text-[var(--cosmos-accent-primary)] font-semibold opacity-0 group-hover:opacity-100"
                                                    >
                                                        טען ערכים →
                                                    </motion.span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Safe Area */}
                    <div className="h-[env(safe-area-inset-bottom,0px)]" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PreviousDataOverlay;
