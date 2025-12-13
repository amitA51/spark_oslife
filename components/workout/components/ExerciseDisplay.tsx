// ExerciseDisplay - Shows current exercise name, set count, and badges
import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheckIcon, TrophyIcon } from '../../icons';
import { Exercise, WorkoutSet } from '../../../types';
import SetInputCard from './SetInputCard';
import SwipeComplete from './SwipeComplete';
import { usePreviousData } from '../hooks/usePreviousData';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface ExerciseDisplayProps {
    exercise: Exercise;
    displaySetIndex: number;
    currentSet: WorkoutSet;
    prInfo: string;
    onUpdateSet: (field: 'weight' | 'reps', value: number) => void;
    onCompleteSet: () => void;
    onOpenNumpad: (target: 'weight' | 'reps') => void;
    onRenameExercise: (name: string) => void;
    nameSuggestions?: string[];
    // Phase 3: Notes & RPE
    onUpdateNotes?: (notes: string) => void;
    onUpdateRPE?: (rpe: number | null) => void;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ExerciseDisplay - Premium exercise view with inputs
 * Features:
 * - Exercise name editing
 * - Set count badge
 * - Weight/reps input cards
 * - Swipe to complete
 * - PR display
 * - Ghost values from previous workout
 */
const ExerciseDisplay = memo<ExerciseDisplayProps>(({
    exercise,
    displaySetIndex,
    currentSet,
    prInfo,
    onUpdateSet,
    onCompleteSet,
    onOpenNumpad,
    onRenameExercise,
    nameSuggestions = [],
    onUpdateNotes,
    onUpdateRPE,
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(exercise.name || '');

    // Fetch ghost values
    const { previousSets } = usePreviousData(exercise.name);
    const previousSet = previousSets?.[displaySetIndex];

    const showGhostWeight = !currentSet.weight && !!previousSet?.weight;
    const showGhostReps = !currentSet.reps && !!previousSet?.reps;

    // Completed sets count
    const completedSetsCount = exercise.sets?.filter(s => s.completedAt).length || 0;

    // Last completed set in this exercise (for copy button)
    const lastCompletedSet = exercise.sets?.filter(s => s.completedAt).slice(-1)[0];

    // PR detection
    const hasPR = prInfo && !prInfo.includes('NO PR');

    // Handle name submit
    const handleNameSubmit = useCallback(() => {
        const trimmed = tempName.trim();
        if (trimmed) {
            onRenameExercise(trimmed);
        }
        setIsEditingName(false);
    }, [tempName, onRenameExercise]);

    // Handle copy last set
    const handleCopyLastSet = useCallback(() => {
        if (lastCompletedSet) {
            onUpdateSet('weight', lastCompletedSet.weight || 0);
            onUpdateSet('reps', lastCompletedSet.reps || 0);
        }
    }, [lastCompletedSet, onUpdateSet]);

    // Sync temp name when exercise changes
    React.useEffect(() => {
        setTempName(exercise.name || '');
        setIsEditingName(false);
    }, [exercise.id, exercise.name]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col items-center justify-center gap-5 px-2"
            >
                {/* Exercise Name Section */}
                <div className="text-center w-full">
                    {isEditingName ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 mb-2"
                        >
                            <input
                                value={tempName}
                                onChange={e => setTempName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleNameSubmit();
                                    if (e.key === 'Escape') setIsEditingName(false);
                                }}
                                placeholder="שם התרגיל"
                                autoFocus
                                className="w-full max-w-xs mx-auto px-4 py-3 rounded-2xl bg-[var(--cosmos-card-bg)] border border-[var(--cosmos-accent-primary)]/50 text-center text-lg font-semibold outline-none shadow-[0_0_20px_rgba(99,102,241,0.2)] workout-input-focus"
                            />

                            {/* Suggestions */}
                            {nameSuggestions.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                                    {nameSuggestions.slice(0, 6).map(name => (
                                        <motion.button
                                            key={name}
                                            type="button"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                onRenameExercise(name);
                                                setIsEditingName(false);
                                            }}
                                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-[var(--cosmos-accent-primary)] hover:text-black hover:border-transparent transition-all"
                                        >
                                            {name}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-4 text-sm">
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    className="px-4 py-1.5 rounded-lg text-[var(--cosmos-text-muted)] hover:text-white hover:bg-white/5 transition-all min-h-[44px]"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={handleNameSubmit}
                                    className="px-4 py-1.5 rounded-lg bg-[var(--cosmos-accent-primary)] text-black font-semibold hover:brightness-110 transition-all min-h-[44px]"
                                >
                                    שמור
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <motion.h2
                                className="text-3xl sm:text-4xl font-black text-center leading-tight workout-gradient-text-accent"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {exercise.name || 'תרגיל ללא שם'}
                            </motion.h2>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsEditingName(true)}
                                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-[var(--cosmos-text-muted)] flex items-center justify-center text-sm hover:bg-[var(--cosmos-accent-primary)]/20 hover:text-white hover:border-[var(--cosmos-accent-primary)]/50 transition-all"
                                title="שנה שם"
                            >
                                ✎
                            </motion.button>
                        </div>
                    )}

                    {/* Badges Row */}
                    <div className="mt-4 flex gap-2 justify-center flex-wrap">
                        {/* Set Counter Badge */}
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[var(--cosmos-accent-primary)]/15 to-[var(--cosmos-accent-primary)]/5 border border-[var(--cosmos-accent-primary)]/30 workout-pulse-glow"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <span className="text-[var(--cosmos-accent-primary)] font-black text-sm tracking-wider">
                                סט {displaySetIndex + 1}
                            </span>
                            <span className="text-[var(--cosmos-text-muted)] text-xs">/</span>
                            <span className="text-[var(--cosmos-text-muted)] text-sm">{exercise.sets?.length || 0}</span>
                        </motion.div>

                        {/* Completed Sets Badge */}
                        {completedSetsCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
                            >
                                <CheckCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold text-xs">{completedSetsCount} הושלמו</span>
                            </motion.div>
                        )}

                        {/* Tempo Badge */}
                        {exercise.tempo && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30"
                            >
                                <span className="text-cyan-400 font-bold text-sm tracking-widest font-mono">
                                    {exercise.tempo}
                                </span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Input Cards */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <SetInputCard
                        label="חזרות"
                        value={currentSet.reps || 0}
                        ghostValue={previousSet?.reps}
                        showGhost={showGhostReps}
                        icon={<span className="text-sm">🔄</span>}
                        incrementAmount={1}
                        onTap={() => onOpenNumpad('reps')}
                        onIncrement={() => onUpdateSet('reps', (currentSet.reps || 0) + 1)}
                        onDecrement={() => onUpdateSet('reps', Math.max(0, (currentSet.reps || 0) - 1))}
                    />
                    <SetInputCard
                        label="משקל (ק״ג)"
                        value={currentSet.weight || 0}
                        ghostValue={previousSet?.weight}
                        showGhost={showGhostWeight}
                        incrementAmount={2.5}
                        onTap={() => onOpenNumpad('weight')}
                        onIncrement={() => onUpdateSet('weight', (currentSet.weight || 0) + 2.5)}
                        onDecrement={() => onUpdateSet('weight', Math.max(0, (currentSet.weight || 0) - 2.5))}
                    />
                </div>

                {/* Notes & RPE Quick Actions */}
                {(onUpdateNotes || onUpdateRPE) && (
                    <div className="flex gap-3 w-full max-w-md">
                        {onUpdateNotes && (
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const note = prompt('הערה לסט:', currentSet.notes || '');
                                    if (note !== null) onUpdateNotes(note);
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${currentSet.notes
                                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <span>📝</span>
                                <span className="text-xs font-medium">
                                    {currentSet.notes ? 'יש הערה' : 'הוסף הערה'}
                                </span>
                            </motion.button>
                        )}
                        {onUpdateRPE && (
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const rpeStr = prompt('דרג מאמץ (1-10):', currentSet.rpe?.toString() || '');
                                    if (rpeStr !== null) {
                                        const rpe = parseInt(rpeStr, 10);
                                        onUpdateRPE(isNaN(rpe) ? null : Math.min(10, Math.max(1, rpe)));
                                    }
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${currentSet.rpe
                                        ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <span>💪</span>
                                <span className="text-xs font-medium">
                                    {currentSet.rpe ? `RPE ${currentSet.rpe}` : 'RPE'}
                                </span>
                            </motion.button>
                        )}
                    </div>
                )}

                {/* Copy Last Set Button */}
                {lastCompletedSet && (
                    <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-[var(--cosmos-accent-primary)]/30 transition-all group"
                        onClick={handleCopyLastSet}
                    >
                        <span className="text-[var(--cosmos-accent-primary)] font-semibold text-xs tracking-wider group-hover:text-white transition-colors">
                            📋 העתק סט קודם
                        </span>
                        <span className="font-mono text-[11px] text-white/50 bg-white/5 px-2 py-0.5 rounded-lg">
                            {lastCompletedSet.weight || 0}kg × {lastCompletedSet.reps || 0}
                        </span>
                    </motion.button>
                )}

                {/* PR Display */}
                <motion.div
                    className={`text-xs font-medium px-4 py-2 rounded-xl ${hasPR
                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                        : 'bg-white/5 border border-white/5'
                        }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {hasPR ? (
                        <span className="flex items-center gap-2">
                            <TrophyIcon className="w-4 h-4 text-yellow-400 workout-fire-effect" />
                            <span className="workout-pr-badge font-semibold">{prInfo}</span>
                        </span>
                    ) : (
                        <span className="text-[var(--cosmos-text-muted)]">
                            🎯 {prInfo}
                        </span>
                    )}
                </motion.div>

                {/* Swipe Complete */}
                <div className="w-full max-w-md">
                    <SwipeComplete onComplete={onCompleteSet} />
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

ExerciseDisplay.displayName = 'ExerciseDisplay';

export default ExerciseDisplay;
