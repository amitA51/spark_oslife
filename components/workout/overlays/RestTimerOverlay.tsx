// RestTimerOverlay - Premium rest timer countdown between sets
import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestTimer } from '../hooks/useWorkoutTimer';
import { HAPTIC_PATTERNS } from '../core/workoutTypes';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

export interface NextExerciseInfo {
    name: string;
    sets: number;
    targetReps?: number;
    targetWeight?: number;
}

interface RestTimerOverlayProps {
    active: boolean;
    endTime: number | null;
    oledMode?: boolean;
    nextExercise?: NextExerciseInfo | null;
    onSkip: () => void;
    onAddTime: (seconds: number) => void;
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
 * RestTimerOverlay - Full-screen rest timer
 * Features:
 * - Isolated timer updates (no parent re-renders)
 * - Pulsing animation
 * - Quick time adjustments (+30, -10)
 * - OLED mode support
 */
const RestTimerOverlay = memo<RestTimerOverlayProps>(({
    active,
    endTime,
    oledMode = false,
    nextExercise,
    onSkip,
    onAddTime,
}) => {
    const { formatted, progress } = useRestTimer(endTime, active);

    const handleSkip = useCallback(() => {
        triggerHaptic();
        onSkip();
    }, [onSkip]);

    const handleAddTime = useCallback((seconds: number) => {
        triggerHaptic();
        onAddTime(seconds);
    }, [onAddTime]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 backdrop-blur-[20px] z-[10000] flex items-center justify-center"
                    style={{
                        background: oledMode ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,0.95)'
                    }}
                >
                    <div className="flex flex-col items-center">
                        {/* Timer Circle */}
                        <div className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] flex items-center justify-center">
                            {/* Animated border ring */}
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className="absolute inset-0 rounded-full border-4 border-[var(--cosmos-accent-primary)] opacity-30"
                            />

                            {/* Progress ring (SVG) */}
                            <svg
                                className="absolute inset-0 w-full h-full -rotate-90"
                                viewBox="0 0 100 100"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="rgba(99, 102, 241, 0.2)"
                                    strokeWidth="3"
                                />
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="var(--cosmos-accent-primary)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={283} // 2 * π * 45
                                    strokeDashoffset={283 * (1 - progress / 100)}
                                    transition={{ duration: 0.1 }}
                                    style={{
                                        filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))',
                                    }}
                                />
                            </svg>

                            {/* Timer Display */}
                            <span className="text-7xl sm:text-8xl font-black tabular-nums text-[var(--cosmos-text-primary)] drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                                {formatted}
                            </span>
                        </div>

                        {/* Label */}
                        <div className="text-[var(--cosmos-accent-primary)] tracking-[0.25em] font-bold text-sm mt-4 mb-8 uppercase">
                            מנוחה
                        </div>

                        {/* Skip Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSkip}
                            className="px-10 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold tracking-wider uppercase min-h-[48px]"
                        >
                            דלג
                        </motion.button>

                        {/* Time Adjustment Buttons */}
                        <div className="flex gap-4 mt-8">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAddTime(-10)}
                                className="w-14 h-14 rounded-2xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-primary)] flex items-center justify-center text-sm font-bold transition-all hover:bg-[var(--cosmos-glass-highlight)]"
                            >
                                -10
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAddTime(30)}
                                className="w-14 h-14 rounded-2xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-primary)] flex items-center justify-center text-sm font-bold transition-all hover:bg-[var(--cosmos-glass-highlight)]"
                            >
                                +30
                            </motion.button>
                        </div>

                        {/* Next Exercise Preview */}
                        {nextExercise && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-10 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-[280px] text-center"
                            >
                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                                    התרגיל הבא
                                </div>
                                <div className="text-lg font-bold text-white mb-2">
                                    {nextExercise.name}
                                </div>
                                <div className="flex items-center justify-center gap-3 text-sm text-white/60">
                                    <span>{nextExercise.sets} סטים</span>
                                    {nextExercise.targetReps && (
                                        <>
                                            <span className="text-white/30">•</span>
                                            <span>{nextExercise.targetReps} חזרות</span>
                                        </>
                                    )}
                                    {nextExercise.targetWeight && (
                                        <>
                                            <span className="text-white/30">•</span>
                                            <span>{nextExercise.targetWeight} ק״ג</span>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

RestTimerOverlay.displayName = 'RestTimerOverlay';

export default RestTimerOverlay;
