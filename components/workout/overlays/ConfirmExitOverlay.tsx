// ConfirmExitOverlay - Confirmation dialog for finishing/canceling workout
import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DumbbellIcon, CloseIcon } from '../../icons';
import { HAPTIC_PATTERNS } from '../core/workoutTypes';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface ConfirmExitOverlayProps {
    isOpen: boolean;
    intent: 'finish' | 'cancel';
    workoutStats: {
        completedSets: number;
        totalVolume: number;
        duration: string;
    };
    onConfirm: () => void;
    onCancel: () => void;
    onSaveAsTemplate?: () => void;
}

// ============================================================
// HAPTIC HELPER
// ============================================================

const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(HAPTIC_PATTERNS.TAP);
    }
};

// ============================================================
// COMPONENT
// ============================================================

/**
 * ConfirmExitOverlay - Confirmation for finishing/canceling workout
 * Features:
 * - Shows workout stats
 * - Option to save as template
 * - Cancel protection
 */
const ConfirmExitOverlay = memo<ConfirmExitOverlayProps>(({
    isOpen,
    intent,
    workoutStats,
    onConfirm,
    onCancel,
    onSaveAsTemplate,
}) => {
    const handleConfirm = useCallback(() => {
        triggerHaptic();
        onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        triggerHaptic();
        onCancel();
    }, [onCancel]);

    const isFinishing = intent === 'finish';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/85 backdrop-blur-[20px] z-[10001] flex items-center justify-center p-4"
                    onClick={handleCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-sm bg-[var(--cosmos-bg-primary)] border border-[var(--cosmos-glass-border)] rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isFinishing
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {isFinishing ? (
                                    <DumbbellIcon className="w-8 h-8" />
                                ) : (
                                    <CloseIcon className="w-8 h-8" />
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-center mb-2">
                            {isFinishing ? 'סיים אימון?' : 'לבטל אימון?'}
                        </h3>

                        {/* Description */}
                        <p className="text-[var(--cosmos-text-muted)] text-center text-sm mb-4">
                            {isFinishing
                                ? 'האימון יישמר בהיסטוריה שלך'
                                : 'כל ההתקדמות תאבד'
                            }
                        </p>

                        {/* Stats (only for finishing) */}
                        {isFinishing && (
                            <div className="bg-[var(--cosmos-glass-bg)] rounded-2xl p-4 mb-4 grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-[var(--cosmos-accent-primary)]">
                                        {workoutStats.completedSets}
                                    </div>
                                    <div className="text-[10px] text-[var(--cosmos-text-muted)] uppercase">סטים</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-[var(--cosmos-accent-cyan)]">
                                        {workoutStats.totalVolume.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-[var(--cosmos-text-muted)] uppercase">ק״ג</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-[var(--cosmos-accent-secondary)]">
                                        {workoutStats.duration}
                                    </div>
                                    <div className="text-[10px] text-[var(--cosmos-text-muted)] uppercase">זמן</div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirm}
                                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all ${isFinishing
                                    ? 'bg-emerald-500 hover:bg-emerald-400'
                                    : 'bg-red-500 hover:bg-red-400'
                                    }`}
                            >
                                {isFinishing ? 'סיים ושמור' : 'בטל אימון'}
                            </motion.button>

                            {isFinishing && onSaveAsTemplate && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onSaveAsTemplate}
                                    className="w-full py-3.5 rounded-2xl font-bold bg-[var(--cosmos-accent-primary)]/20 text-[var(--cosmos-accent-primary)] border border-[var(--cosmos-accent-primary)]/40 hover:bg-[var(--cosmos-accent-primary)]/30 transition-all"
                                >
                                    שמור כתבנית
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCancel}
                                className="w-full py-3.5 rounded-2xl font-semibold text-[var(--cosmos-text-muted)] hover:text-white hover:bg-white/5 transition-all"
                            >
                                חזור
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

ConfirmExitOverlay.displayName = 'ConfirmExitOverlay';

export default ConfirmExitOverlay;
