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
// TIMER DISPLAY TYPES
// ============================================================

interface TimerDisplayProps {
    startTimestamp: number;
    totalPausedTime: number;
    isPaused: boolean;
    currentExerciseName: string;
    totalVolume?: number;
    isResting?: boolean;
    restTimeLeft?: number;
}

/**
 * Dynamic Island Style Timer Display
 * Features:
 * - Floating pill design
 * - Transforms based on workout state (active/resting)
 * - Animated indicators
 * - Isolated re-renders (only this component updates each second)
 */
const TimerDisplay = memo<TimerDisplayProps>((props) => {
    const {
        startTimestamp,
        totalPausedTime,
        isPaused,
        currentExerciseName,
        totalVolume = 0,
        isResting = false,
        restTimeLeft = 0,
    } = props;

    const { seconds, formatted } = useWorkoutTimer({ startTimestamp, totalPausedTime, isPaused });

    // Format rest time
    const formatRestTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Estimate calories
    const durationHours = seconds / 3600;
    const baseCalories = 5 * 70 * durationHours;
    const volumeBonus = totalVolume * 0.001;
    const estimatedCalories = Math.round(baseCalories + volumeBonus);

    return (
        <motion.div
            layout
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
        >
            {/* Dynamic Island Pill */}
            <motion.div
                layout
                className={`
                    relative flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300
                    ${isResting
                        ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
                        : isPaused
                            ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                            : 'bg-black/40 border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                    }
                `}
            >
                {/* Status Indicator Dot */}
                <div className="relative flex items-center justify-center">
                    {isResting ? (
                        <motion.div
                            className="w-2.5 h-2.5 rounded-full bg-orange-500"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    ) : isPaused ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    ) : (
                        <motion.div
                            className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-center leading-none">
                    {/* Label */}
                    <span className={`text-[9px] uppercase font-bold tracking-[0.15em] mb-0.5 ${isResting ? 'text-orange-400/60' : isPaused ? 'text-yellow-400/60' : 'text-white/40'
                        }`}>
                        {isResting ? 'REST' : isPaused ? 'PAUSED' : 'WORKOUT'}
                    </span>

                    {/* Timer Value */}
                    <motion.span
                        key={isResting ? restTimeLeft : seconds}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`font-mono font-bold text-sm tracking-tight ${isResting ? 'text-orange-400' : isPaused ? 'text-yellow-400' : 'text-white'
                            }`}
                    >
                        {isResting ? formatRestTime(restTimeLeft) : formatted}
                    </motion.span>
                </div>

                {/* Calories Badge (shows after 1 min, not during rest) */}
                {!isResting && seconds > 60 && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[9px] text-orange-400/70 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full"
                    >
                        🔥 {estimatedCalories}
                    </motion.span>
                )}
            </motion.div>

            {/* Exercise Name (below pill, subtle) */}
            {currentExerciseName && !isResting && (
                <motion.div
                    key={currentExerciseName}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-2 text-[10px] text-white/30 font-medium tracking-wider uppercase"
                >
                    {currentExerciseName}
                </motion.div>
            )}
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
