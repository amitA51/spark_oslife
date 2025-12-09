// WorkoutHeader - Premium header with isolated timer display
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SettingsIcon, CheckCircleIcon, SparklesIcon } from '../../icons';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { HAPTIC_PATTERNS } from '../core/workoutTypes';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface WorkoutHeaderProps {
    startTimestamp: number;
    totalPausedTime: number;
    isPaused: boolean;
    currentExerciseName: string;
    onFinish: () => void;
    onOpenSettings: () => void;
    onOpenTutorial: () => void;
    onOpenAICoach: () => void;
}

// ============================================================
// CONSTANTS
// ============================================================

const DOUBLE_TAP_TIMEOUT = 2000;

// ============================================================
// HAPTIC HELPER
// ============================================================

const triggerHaptic = (pattern: readonly number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([...pattern]);
    }
};

// ============================================================
// TIMER DISPLAY (Isolated re-renders)
// ============================================================

interface TimerDisplayProps {
    startTimestamp: number;
    totalPausedTime: number;
    isPaused: boolean;
    currentExerciseName: string;
    totalVolume?: number; // Total volume lifted in kg
}

/**
 * Timer display with isolated state
 * Only this component re-renders every second - NOT the parent
 */
const TimerDisplay = memo<TimerDisplayProps>(({
    startTimestamp,
    totalPausedTime,
    isPaused,
    currentExerciseName,
    totalVolume = 0,
}) => {
    const { seconds, formatted } = useWorkoutTimer({ startTimestamp, totalPausedTime, isPaused });

    // Estimate calories: ~5 MET for weight training, assuming 70kg body weight
    // Formula: Calories = MET × Weight(kg) × Time(hours)
    // Plus bonus from volume lifted (approx 0.001 cal per kg lifted)
    const durationHours = seconds / 3600;
    const baseCalories = 5 * 70 * durationHours;
    const volumeBonus = totalVolume * 0.001;
    const estimatedCalories = Math.round(baseCalories + volumeBonus);

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="workout-timer-breathe relative"
        >
            {/* Outer Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] opacity-20 blur-xl" />

            {/* Timer Container */}
            <div className="relative workout-glass-premium rounded-2xl px-6 py-3 workout-pulse-glow">
                {/* Top Shine Line */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Timer Value */}
                <div className="flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight workout-gradient-text-accent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        {formatted}
                    </span>

                    {/* Calorie Estimate (shows after 1 min) */}
                    {seconds > 60 && (
                        <div className="text-[10px] text-orange-400/80 font-medium mt-0.5">
                            ~{estimatedCalories} קלוריות
                        </div>
                    )}

                    {/* Current Exercise Name */}
                    {currentExerciseName && (
                        <motion.div
                            key={currentExerciseName}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 text-[11px] text-[var(--cosmos-text-muted)] max-w-[180px] truncate font-medium tracking-wide uppercase"
                        >
                            {currentExerciseName}
                        </motion.div>
                    )}
                </div>

                {/* Bottom Gradient Line */}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--cosmos-accent-primary)]/30 to-transparent" />
            </div>
        </motion.div>
    );
});

TimerDisplay.displayName = 'TimerDisplay';

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * Premium Workout Header
 * Features:
 * - Isolated timer (no parent re-renders)
 * - Double-tap exit protection
 * - AI Coach button
 * - Settings & Tutorial access
 */
const WorkoutHeader = memo<WorkoutHeaderProps>(({
    startTimestamp,
    totalPausedTime,
    isPaused,
    currentExerciseName,
    onFinish,
    onOpenSettings,
    onOpenTutorial,
    onOpenAICoach,
}) => {
    // Double-tap exit state
    const [exitPending, setExitPending] = useState(false);
    const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle finish button tap - requires double-tap to exit
    const handleFinishTap = useCallback(() => {
        if (exitPending) {
            // Second tap within timeout - actually exit
            if (exitTimeoutRef.current) {
                clearTimeout(exitTimeoutRef.current);
                exitTimeoutRef.current = null;
            }
            setExitPending(false);
            onFinish();
        } else {
            // First tap - show "tap again" state
            setExitPending(true);
            triggerHaptic(HAPTIC_PATTERNS.TAP);

            // Reset after timeout
            exitTimeoutRef.current = setTimeout(() => {
                setExitPending(false);
                exitTimeoutRef.current = null;
            }, DOUBLE_TAP_TIMEOUT);
        }
    }, [exitPending, onFinish]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (exitTimeoutRef.current) {
                clearTimeout(exitTimeoutRef.current);
            }
        };
    }, []);

    return (
        <header className="flex justify-between items-center mb-6 pt-[env(safe-area-inset-top,20px)]">
            {/* Finish Button - Premium Style with Double-Tap Protection */}
            <motion.button
                onClick={handleFinishTap}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={exitPending ? { scale: [1, 1.05, 1] } : {}}
                transition={exitPending ? { duration: 0.5, repeat: Infinity } : {}}
                className={`
          group flex items-center gap-2 
          px-4 py-2.5 rounded-xl 
          font-semibold text-sm tracking-wide 
          transition-all duration-300
          min-h-[44px]
          ${exitPending
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:from-emerald-500/20 hover:to-green-500/20'
                    }
        `}
            >
                <CheckCircleIcon className={`w-4 h-4 transition-transform ${exitPending ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{exitPending ? 'לחץ שוב' : 'סיים'}</span>
            </motion.button>

            {/* Timer Display (Isolated) */}
            <TimerDisplay
                startTimestamp={startTimestamp}
                totalPausedTime={totalPausedTime}
                isPaused={isPaused}
                currentExerciseName={currentExerciseName}
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
                {/* AI Coach Button */}
                <motion.button
                    type="button"
                    onClick={onOpenAICoach}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                    title="AI Coach"
                >
                    <SparklesIcon className="w-5 h-5" />
                </motion.button>

                {/* Tutorial Button */}
                <motion.button
                    type="button"
                    onClick={onOpenTutorial}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-[var(--cosmos-text-muted)] hover:text-white hover:border-[var(--cosmos-accent-primary)]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    title="Tutorial"
                >
                    <span className="text-sm font-serif italic font-bold">i</span>
                </motion.button>

                {/* Settings Button */}
                <motion.button
                    type="button"
                    onClick={onOpenSettings}
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-[var(--cosmos-text-muted)] hover:text-white hover:border-[var(--cosmos-accent-primary)]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    title="Settings"
                >
                    <SettingsIcon className="w-5 h-5" />
                </motion.button>
            </div>
        </header>
    );
});

WorkoutHeader.displayName = 'WorkoutHeader';

export default WorkoutHeader;
