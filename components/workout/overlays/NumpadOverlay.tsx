// NumpadOverlay - Premium number input for weight/reps
import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HAPTIC_PATTERNS } from '../core/workoutTypes';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface NumpadOverlayProps {
    isOpen: boolean;
    target: 'weight' | 'reps' | null;
    value: string;
    onInput: (digit: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
    onClose: () => void;
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
 * NumpadOverlay - Full numpad for precise input
 * Features:
 * - Weight mode (with decimal)
 * - Reps mode (integers only)
 * - Haptic on every tap
 * - Premium spring animation
 */
const NumpadOverlay = memo<NumpadOverlayProps>(({
    isOpen,
    target,
    value,
    onInput,
    onDelete,
    onSubmit,
    onClose,
}) => {
    const handleInput = useCallback((digit: string) => {
        triggerHaptic();
        onInput(digit);
    }, [onInput]);

    const handleDelete = useCallback(() => {
        triggerHaptic();
        onDelete();
    }, [onDelete]);

    const handleSubmit = useCallback(() => {
        triggerHaptic();
        onSubmit();
    }, [onSubmit]);

    // Number pad keys - weight allows decimal, reps doesn't
    const keys = target === 'weight'
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0]
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0];

    const label = target === 'weight' ? 'משקל (ק״ג)' : 'חזרות';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/85 backdrop-blur-[20px] z-[10000] flex items-end"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full bg-[var(--cosmos-bg-primary)] border-t border-[var(--cosmos-glass-border)] rounded-t-[32px] p-6 pb-10 max-h-[85vh] overflow-y-auto shadow-[0_-10px_50px_rgba(0,0,0,0.6)] text-[var(--cosmos-text-primary)]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle Bar */}
                        <div className="w-12 h-1 bg-[var(--cosmos-glass-border)] rounded-full mx-auto mb-6" />

                        {/* Label and Value Display */}
                        <div className="text-center mb-6">
                            <div className="text-sm text-[var(--cosmos-text-muted)] uppercase tracking-widest mb-2">
                                {label}
                            </div>
                            <div className="text-5xl font-black text-[var(--cosmos-accent-cyan)] tabular-nums min-h-[60px]">
                                {value || '0'}
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex gap-2 justify-center mb-4 max-w-xs mx-auto">
                            {(target === 'weight' ? [60, 80, 100, 120] : [6, 8, 10, 12]).map((preset) => (
                                <motion.button
                                    key={preset}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        triggerHaptic();
                                        onInput(String(preset));
                                        onSubmit();
                                    }}
                                    className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
                                >
                                    {preset}{target === 'weight' ? '' : 'x'}
                                </motion.button>
                            ))}
                        </div>

                        {/* Number Grid */}
                        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                            {keys.map((key, index) => (
                                key !== null ? (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleInput(String(key))}
                                        className="h-16 rounded-2xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-2xl font-semibold active:bg-[var(--cosmos-glass-highlight)] transition-colors"
                                    >
                                        {key}
                                    </motion.button>
                                ) : (
                                    <div key={index} /> // Empty placeholder
                                )
                            ))}

                            {/* Delete Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDelete}
                                className="h-16 rounded-2xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-accent-danger)] flex items-center justify-center text-2xl active:bg-[var(--cosmos-glass-highlight)]"
                            >
                                ⌫
                            </motion.button>
                        </div>

                        {/* Confirm Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            className="w-full max-w-xs h-14 rounded-2xl bg-[var(--cosmos-accent-primary)] text-white font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:brightness-110 transition-all mt-6 mx-auto block"
                        >
                            אישור
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

NumpadOverlay.displayName = 'NumpadOverlay';

export default NumpadOverlay;
