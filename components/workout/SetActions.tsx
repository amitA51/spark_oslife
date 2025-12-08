import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSet } from '../../types';
import { CopyIcon, EditIcon, CloseIcon } from '../icons';
import './workout-premium.css';

interface SetActionsProps {
    currentSet: WorkoutSet;
    setIndex: number;
    previousSet?: WorkoutSet;
    onCopyFromPrevious: () => void;
    onUpdateNotes: (notes: string) => void;
    onUpdateRPE: (rpe: number) => void;
    onDuplicateSet: () => void;
}

/**
 * SetActions - Quick actions for the current set
 * Includes copy, notes, RPE, and duplicate functionality
 */
const SetActions: React.FC<SetActionsProps> = ({
    currentSet,
    setIndex,
    previousSet,
    onCopyFromPrevious,
    onUpdateNotes,
    onUpdateRPE,
    onDuplicateSet,
}) => {
    const [showNotes, setShowNotes] = useState(false);
    const [showRPE, setShowRPE] = useState(false);
    const [notesValue, setNotesValue] = useState(currentSet.notes || '');

    const handleSaveNotes = useCallback(() => {
        onUpdateNotes(notesValue);
        setShowNotes(false);
    }, [notesValue, onUpdateNotes]);

    const rpeColors: Record<number, string> = {
        1: 'bg-green-500/20 text-green-400 border-green-500/30',
        2: 'bg-green-500/20 text-green-400 border-green-500/30',
        3: 'bg-green-500/20 text-green-400 border-green-500/30',
        4: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
        5: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        6: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        7: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        8: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        9: 'bg-red-500/20 text-red-400 border-red-500/30',
        10: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const rpeDescriptions: Record<number, string> = {
        1: 'מאוד קל',
        2: 'קל',
        3: 'קל יחסית',
        4: 'בינוני-קל',
        5: 'בינוני',
        6: 'בינוני-קשה',
        7: 'קשה',
        8: 'קשה מאוד',
        9: 'כמעט מקסימום',
        10: 'מקסימום',
    };

    return (
        <div className="space-y-3">
            {/* Quick Actions Row */}
            <div className="flex flex-wrap gap-2 justify-center">
                {/* Copy from Previous */}
                {previousSet && (previousSet.weight || previousSet.reps) && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCopyFromPrevious}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-[var(--cosmos-accent-primary)]/10 hover:border-[var(--cosmos-accent-primary)]/30 hover:text-white transition-all"
                    >
                        <CopyIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">העתק סט קודם</span>
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-lg">
                            {previousSet.weight}kg × {previousSet.reps}
                        </span>
                    </motion.button>
                )}

                {/* Duplicate Set */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDuplicateSet}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                >
                    <span className="text-lg">➕</span>
                    <span className="text-sm font-medium">שכפל סט</span>
                </motion.button>

                {/* Notes Toggle */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNotes(!showNotes)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${currentSet.notes
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                >
                    <EditIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        {currentSet.notes ? 'ערוך הערה' : 'הוסף הערה'}
                    </span>
                </motion.button>

                {/* RPE Toggle */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRPE(!showRPE)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${currentSet.rpe
                            ? rpeColors[currentSet.rpe] || 'bg-white/5 border-white/10'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                >
                    <span className="text-lg">💪</span>
                    <span className="text-sm font-medium">
                        {currentSet.rpe ? `RPE ${currentSet.rpe}` : 'RPE'}
                    </span>
                </motion.button>
            </div>

            {/* Notes Overlay */}
            <AnimatePresence>
                {showNotes && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                                    <EditIcon className="w-4 h-4" />
                                    הערה לסט {setIndex + 1}
                                </h4>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowNotes(false)}
                                    className="p-1 rounded-lg hover:bg-white/10"
                                >
                                    <CloseIcon className="w-4 h-4 text-white/50" />
                                </motion.button>
                            </div>

                            <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="הוסף הערה לסט הזה..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:border-[var(--cosmos-accent-primary)] outline-none"
                            />

                            <div className="flex gap-2 justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowNotes(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 text-white/60"
                                >
                                    ביטול
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveNotes}
                                    className="px-4 py-2 rounded-xl bg-[var(--cosmos-accent-primary)] text-white font-bold"
                                >
                                    שמור
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RPE Selector */}
            <AnimatePresence>
                {showRPE && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                                    <span className="text-lg">💪</span>
                                    מידת מאמץ (RPE)
                                </h4>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowRPE(false)}
                                    className="p-1 rounded-lg hover:bg-white/10"
                                >
                                    <CloseIcon className="w-4 h-4 text-white/50" />
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                                    <motion.button
                                        key={rpe}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            onUpdateRPE(rpe);
                                            setShowRPE(false);
                                        }}
                                        className={`py-3 rounded-xl font-bold text-lg border transition-all ${currentSet.rpe === rpe
                                                ? rpeColors[rpe]
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {rpe}
                                    </motion.button>
                                ))}
                            </div>

                            {currentSet.rpe && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 text-center"
                                >
                                    <span className={`text-sm font-medium ${rpeColors[currentSet.rpe]?.split(' ')[1] || 'text-white/60'
                                        }`}>
                                        {rpeDescriptions[currentSet.rpe]}
                                    </span>
                                </motion.div>
                            )}

                            <p className="text-xs text-white/30 text-center mt-4">
                                RPE (Rate of Perceived Exertion) - מציין כמה קשה היה הסט מ-1 (קל) עד 10 (מקסימום)
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SetActions;
