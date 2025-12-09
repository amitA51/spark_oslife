// SwipeComplete - Premium swipe-to-complete button for finishing sets
import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { CheckCheckIcon } from '../../icons';
import { HAPTIC_PATTERNS } from '../core/workoutTypes';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface SwipeCompleteProps {
    onComplete: () => void;
    onUndo?: () => void;
    disabled?: boolean;
}

// ============================================================
// HAPTIC HELPER
// ============================================================

const triggerHaptic = (pattern: readonly number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([...pattern]);
    }
};

// ============================================================
// CONSTANTS
// ============================================================

const UNDO_TIMEOUT = 3000; // 3 seconds to undo

// ============================================================
// COMPONENT
// ============================================================

/**
 * Premium swipe-to-complete button
 * Features:
 * - Spring physics for premium feel
 * - Shine animation
 * - Haptic feedback on drag and complete
 * - Success animation
 * - 3-second undo window
 */
const SwipeComplete = memo<SwipeCompleteProps>(({ onComplete, onUndo, disabled = false }) => {
    const x = useMotionValue(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showUndo, setShowUndo] = useState(false);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Transform for background fill
    const backgroundOpacity = useTransform(x, [0, 200], [0, 0.4]);
    const textOpacity = useTransform(x, [0, 100], [1, 0]);
    const checkScale = useTransform(x, [0, 150, 200], [1, 1.1, 1.2]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        };
    }, []);

    // Haptic on drag start
    const handleDragStart = useCallback(() => {
        if (disabled) return;
        triggerHaptic(HAPTIC_PATTERNS.TAP);
    }, [disabled]);

    // Handle drag end - check if complete
    const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
        if (disabled) return;

        if (info.offset.x > 100) {
            // Complete!
            setIsCompleting(true);
            triggerHaptic(HAPTIC_PATTERNS.SUCCESS);
            onComplete();

            // Show undo button
            if (onUndo) {
                setShowUndo(true);
                undoTimeoutRef.current = setTimeout(() => {
                    setShowUndo(false);
                    undoTimeoutRef.current = null;
                }, UNDO_TIMEOUT);
            }

            // Reset after animation
            setTimeout(() => {
                setIsCompleting(false);
                x.set(0);
            }, 800);
        } else {
            // Snap back
            x.set(0);
        }
    }, [disabled, onComplete, onUndo, x]);

    // Handle undo
    const handleUndo = useCallback(() => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }
        setShowUndo(false);
        triggerHaptic(HAPTIC_PATTERNS.TAP);
        onUndo?.();
    }, [onUndo]);

    return (
        <div className="relative w-full h-[72px] rounded-3xl overflow-hidden">
            {/* Background Track */}
            <div className={`
        absolute inset-0 
        bg-gradient-to-r from-[var(--cosmos-glass-bg)] via-[var(--cosmos-glass-bg)] to-[var(--cosmos-accent-primary)]/10 
        border border-[var(--cosmos-glass-border)]
        ${disabled ? 'opacity-50' : ''}
      `} />

            {/* Success Fill Animation */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-green-400/40"
                style={{ opacity: backgroundOpacity }}
            />

            {/* Shine Effect */}
            <div className="absolute inset-0 workout-swipe-shine overflow-hidden" />

            {/* Text */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center font-bold tracking-[0.15em] text-[var(--cosmos-text-muted)] pointer-events-none uppercase text-sm"
                style={{ opacity: textOpacity }}
            >
                <span className="flex items-center gap-3">
                    <span className="text-xl">👉</span>
                    החלק לסיום
                </span>
            </motion.div>

            {/* Draggable Handle */}
            <motion.div
                className={`
          absolute left-1.5 top-1.5 bottom-1.5 w-16 
          rounded-[20px] 
          flex items-center justify-center 
          cursor-grab active:cursor-grabbing z-10
          ${isCompleting
                        ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                        : 'bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-secondary)]'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                drag={disabled ? false : "x"}
                dragConstraints={{ left: 0, right: 230 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{
                    x,
                    boxShadow: isCompleting
                        ? '0 0 35px rgba(34, 197, 94, 0.6)'
                        : '0 0 30px rgba(99, 102, 241, 0.4)',
                }}
                whileTap={disabled ? {} : { scale: 1.1 }}
                whileHover={disabled ? {} : { scale: 1.05 }}
            >
                <motion.div
                    style={{ scale: checkScale }}
                    animate={isCompleting ? {
                        scale: [1, 1.4, 1],
                        rotate: [0, 15, -15, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                >
                    <CheckCheckIcon className="w-7 h-7 text-white drop-shadow-lg" />
                </motion.div>
            </motion.div>

            {/* Success Checkmark Overlay */}
            {isCompleting && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        className="w-16 h-16 rounded-full bg-emerald-500/30 flex items-center justify-center"
                    >
                        <CheckCheckIcon className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                </motion.div>
            )}

            {/* Undo Button */}
            {showUndo && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={handleUndo}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-medium text-white/80 transition-all"
                >
                    בטל
                </motion.button>
            )}
        </div>
    );
});

SwipeComplete.displayName = 'SwipeComplete';

export default SwipeComplete;
