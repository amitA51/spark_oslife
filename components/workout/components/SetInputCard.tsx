// SetInputCard - Premium input card for weight/reps with FIXED button responsiveness
// CRITICAL: Uses onPointerDown instead of onClick for instant mobile response

import React, { useCallback, useTransition, memo } from 'react';
import { motion } from 'framer-motion';
import { FlameIcon } from '../../icons';
import { HAPTIC_PATTERNS } from '../core/workoutTypes';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface SetInputCardProps {
    label: string;
    value: number;
    ghostValue?: number;
    showGhost: boolean;
    icon?: React.ReactNode;
    incrementAmount?: number;
    onTap: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
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
// BUTTON COMPONENT (Instant Response)
// ============================================================

interface InputButtonProps {
    onPress: () => void;
    variant: 'increment' | 'decrement';
    children: React.ReactNode;
}

/**
 * CRITICAL FIX: Button with instant response on mobile
 * - Uses onPointerDown (fires immediately on touch)
 * - Uses useTransition for non-blocking updates
 * - Has touch-action: manipulation to prevent 300ms delay
 */
const InputButton = memo<InputButtonProps>(({ onPress, variant, children }) => {
    const [isPending, startTransition] = useTransition();

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // Haptic feedback IMMEDIATELY
        triggerHaptic();

        // Non-blocking state update
        startTransition(() => {
            onPress();
        });
    }, [onPress]);

    const baseClasses = `
    flex-1 h-14 min-h-[56px] rounded-2xl
    flex items-center justify-center
    text-2xl font-bold
    transition-all duration-150
    active:scale-90
    select-none
    touch-manipulation
  `;

    const variantClasses = variant === 'increment'
        ? `
        bg-gradient-to-br from-[var(--cosmos-accent-primary)]/25 to-[var(--cosmos-accent-primary)]/10
        border-2 border-[var(--cosmos-accent-primary)]/40
        text-[var(--cosmos-accent-primary)]
        hover:bg-[var(--cosmos-accent-primary)]/35
        active:bg-[var(--cosmos-accent-primary)]/50
        shadow-[0_0_20px_rgba(99,102,241,0.15)]
      `
        : `
        bg-gradient-to-br from-white/8 to-white/3
        border-2 border-white/15
        text-[var(--cosmos-text-primary)]
        hover:border-white/25
        active:bg-white/15
      `;

    return (
        <button
            type="button"
            className={`${baseClasses} ${variantClasses}`}
            style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={handlePointerDown}
        >
            {isPending ? (
                <span className="opacity-50">{children}</span>
            ) : (
                children
            )}
        </button>
    );
});

InputButton.displayName = 'InputButton';

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * Premium Input Card for weight/reps
 * Features:
 * - Instant button response (onPointerDown)
 * - Ghost values from previous workout
 * - Haptic feedback on every tap
 * - Tap on value to open numpad
 * - Premium glassmorphism design
 */
const SetInputCard = memo<SetInputCardProps>(({
    label,
    value,
    ghostValue,
    showGhost,
    icon,
    incrementAmount = 1,
    onTap,
    onIncrement,
    onDecrement,
}) => {
    const displayValue = value || (showGhost ? ghostValue : 0) || 0;
    const isGhostValue = !value && showGhost && ghostValue;

    const handleTap = useCallback(() => {
        triggerHaptic();
        onTap();
    }, [onTap]);

    return (
        <motion.div
            className="
        workout-glass-card workout-iridescent-border 
        rounded-[28px] p-5 
        flex flex-col items-center 
        relative overflow-hidden 
        cursor-pointer group
      "
            onClick={handleTap}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Top Shine Line */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Icon Badge */}
            <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--cosmos-accent-primary)]/20 to-transparent flex items-center justify-center">
                {icon || <FlameIcon className="w-4 h-4 text-[var(--cosmos-accent-primary)]" />}
            </div>

            {/* Ghost Indicator */}
            {isGhostValue && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40 font-semibold tracking-wider uppercase"
                >
                    קודם
                </motion.span>
            )}

            {/* Label */}
            <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--cosmos-text-muted)] mb-3 font-semibold">
                {label}
            </span>

            {/* Value Display */}
            <motion.span
                key={displayValue}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`
          text-6xl font-black tabular-nums leading-none
          ${isGhostValue
                        ? 'text-white/25'
                        : 'text-[var(--cosmos-text-primary)] drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    }
        `}
            >
                {displayValue}
            </motion.span>

            {/* Increment/Decrement Buttons */}
            <div
                className="flex justify-between w-full mt-5 gap-3"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                <InputButton variant="decrement" onPress={onDecrement}>
                    −
                </InputButton>
                <InputButton variant="increment" onPress={onIncrement}>
                    +
                </InputButton>
            </div>

            {/* Increment Amount Hint */}
            <div className="absolute bottom-2 right-3 text-[9px] text-white/20 font-mono">
                ±{incrementAmount}
            </div>
        </motion.div>
    );
});

SetInputCard.displayName = 'SetInputCard';

export default SetInputCard;
