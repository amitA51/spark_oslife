import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, CheckIcon, FastForwardIcon, ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from '../../icons';

import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface WorkoutControlDeckProps {
    isPaused: boolean;
    activeSetIndex: number;
    totalSets: number;
    currentExerciseIndex: number;
    totalExercises: number;
    restTimer: number;
    isResting: boolean;
    onTogglePause: () => void;
    onNextExercise: () => void;
    onPrevExercise: () => void;
    onFinishSet: () => void;
    onSkipRest: () => void;
    onOpenSettings: () => void;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const DeckButton = memo(({
    onClick,
    icon,
    label,
    variant = 'secondary',
    size = 'normal',
    className = ''
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label?: string;
    variant?: 'primary' | 'secondary' | 'accent' | 'danger';
    size?: 'normal' | 'large';
    className?: string;
}) => {
    const variants = {
        primary: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]',
        secondary: 'bg-white/10 text-white border border-white/5 hover:bg-white/20',
        accent: 'bg-[var(--cosmos-accent-primary)] text-black shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        danger: 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
    };

    const sizeClasses = size === 'large'
        ? 'h-16 px-8 rounded-[24px] text-lg font-bold'
        : 'h-12 w-12 rounded-2xl';

    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
                e.stopPropagation();
                // Haptic feedback would go here
                onClick();
            }}
            className={`
                relative flex items-center justify-center gap-2 
                transition-all duration-200 
                ${variants[variant]} 
                ${sizeClasses}
                ${className}
            `}
        >
            {icon}
            {label && <span>{label}</span>}
        </motion.button>
    );
});

DeckButton.displayName = 'DeckButton';

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * WorkoutControlDeck - The $100M "Thumb-First" Command Center
 * Floating bottom deck containing all critical controls.
 * Designed for one-handed usage.
 */
const WorkoutControlDeck = memo<WorkoutControlDeckProps>(({
    isPaused,
    activeSetIndex,
    totalSets,
    currentExerciseIndex,
    totalExercises,
    restTimer,
    isResting,
    onTogglePause,
    onNextExercise,
    onPrevExercise,
    onFinishSet,
    onSkipRest,
    onOpenSettings,
}) => {

    // Progress bar calculations


    return (
        <div className="fixed bottom-0 left-0 right-0 z-[5000] pointer-events-none">
            {/* Gradient Fade Up */}
            <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />

            {/* Main Deck Container */}
            <div className="relative px-5 pb-[env(safe-area-inset-bottom,24px)] pt-4 pointer-events-auto flex flex-col gap-4">

                {/* 1. Navigation & Progress Row (Mini) */}
                <div className="flex items-center justify-between px-2">
                    <button
                        onClick={onPrevExercise}
                        disabled={currentExerciseIndex === 0}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>

                    {/* Pagination Dots */}
                    <div className="flex gap-1.5">
                        {Array.from({ length: Math.min(5, totalExercises) }).map((_, i) => (
                            <div
                                key={i}
                                className={`
                                    h-1.5 rounded-full transition-all duration-300
                                    ${i === Math.min(i, 4) /* Simplified logic for demo */ ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}
                                `}
                            />
                        ))}
                    </div>

                    <button
                        onClick={onNextExercise}
                        disabled={currentExerciseIndex >= totalExercises - 1}
                        className="p-2 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* 2. Main Action Row (The "Money" Buttons) */}
                <div className="flex items-center gap-3">

                    {/* Settings / Menu */}
                    <DeckButton
                        icon={<SettingsIcon className="w-5 h-5" />}
                        onClick={onOpenSettings}
                        variant="secondary"
                    />

                    {/* PRIMARY ACTION (Center Stage) */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {isResting ? (
                                <motion.button
                                    key="rest"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onSkipRest}
                                    className="w-full h-16 rounded-[24px] bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-between px-6 shadow-[0_0_30px_rgba(249,115,22,0.4)] overflow-hidden relative group"
                                >
                                    {/* Animated stripes background */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMNDAgMEgwVjQweiIgZmlsbD0id2hpdGUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] bg-[length:20px_20px]" />

                                    <span className="relative z-10 flex items-center gap-2 font-bold text-white text-lg">
                                        <FastForwardIcon className="w-5 h-5" />
                                        סיום מנוחה
                                    </span>
                                    <span className="relative z-10 font-mono font-black text-2xl text-white tracking-widest">
                                        {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
                                    </span>
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="finish-set"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onFinishSet}
                                    className="w-full h-16 rounded-[24px] bg-white text-black flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all"
                                >
                                    <CheckIcon className="w-6 h-6 stroke-[3]" />
                                    <span className="font-extrabold text-lg tracking-wide">
                                        סיום סט {activeSetIndex + 1}
                                    </span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Timer / Pause */}
                    {isPaused ? (
                        <DeckButton
                            icon={<PlayIcon className="w-6 h-6 fill-current" />}
                            onClick={onTogglePause}
                            variant="accent"
                        />
                    ) : (
                        <DeckButton
                            icon={<PauseIcon className="w-6 h-6 fill-current" />}
                            onClick={onTogglePause}
                            variant="secondary"
                        />
                    )}
                </div>

                {/* 3. Stats Row (Micro-Information) */}
                <div className="flex justify-between items-center px-4 text-[11px] font-medium text-white/30 uppercase tracking-widest">
                    <span>
                        תרגיל {currentExerciseIndex + 1} / {totalExercises}
                    </span>
                    <span>
                        סט {activeSetIndex + 1} / {totalSets}
                    </span>
                </div>
            </div>
        </div>
    );
});

WorkoutControlDeck.displayName = 'WorkoutControlDeck';

export default WorkoutControlDeck;
