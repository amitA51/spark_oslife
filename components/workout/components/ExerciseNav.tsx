// ExerciseNav - Navigation between exercises with add button
import { memo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, AddIcon } from '../../icons';
import { Exercise } from '../../../types';
import '../workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface ExerciseNavProps {
    exercises: Exercise[];
    currentIndex: number;
    onChangeExercise: (index: number) => void;
    onOpenDrawer: () => void;
    onAddExercise: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ExerciseNav - Bottom navigation for exercise switching
 * Features:
 * - Prev/Next buttons
 * - Add exercise button
 * - List view button
 * - Progress indicator (dots)
 * - Keyboard shortcuts (← →)
 */
const ExerciseNav = memo<ExerciseNavProps>(({
    exercises,
    currentIndex,
    onChangeExercise,
    onOpenDrawer,
    onAddExercise,
}) => {
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < exercises.length - 1;

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return; // Don't intercept when typing
        }

        if (e.key === 'ArrowLeft' && canGoPrev) {
            onChangeExercise(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && canGoNext) {
            onChangeExercise(currentIndex + 1);
        }
    }, [canGoPrev, canGoNext, currentIndex, onChangeExercise]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="flex items-center justify-between gap-2 pt-4">
            {/* Prev/Next Navigation */}
            <div className="flex gap-2">
                <motion.button
                    whileHover={canGoPrev ? { scale: 1.05 } : {}}
                    whileTap={canGoPrev ? { scale: 0.95 } : {}}
                    className={`
            w-11 h-11 rounded-xl 
            bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] 
            text-[var(--cosmos-text-primary)] 
            flex items-center justify-center 
            transition-all
            ${canGoPrev
                            ? 'hover:bg-[var(--cosmos-glass-highlight)] active:scale-90'
                            : 'opacity-40 cursor-not-allowed'
                        }
          `}
                    disabled={!canGoPrev}
                    onClick={() => onChangeExercise(currentIndex - 1)}
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </motion.button>

                <motion.button
                    whileHover={canGoNext ? { scale: 1.05 } : {}}
                    whileTap={canGoNext ? { scale: 0.95 } : {}}
                    className={`
            w-11 h-11 rounded-xl 
            bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] 
            text-[var(--cosmos-text-primary)] 
            flex items-center justify-center 
            transition-all
            ${canGoNext
                            ? 'hover:bg-[var(--cosmos-glass-highlight)] active:scale-90'
                            : 'opacity-40 cursor-not-allowed'
                        }
          `}
                    disabled={!canGoNext}
                    onClick={() => onChangeExercise(currentIndex + 1)}
                >
                    <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                </motion.button>

                {/* Progress Dots (only show if <= 8 exercises) */}
                {exercises.length <= 8 && exercises.length > 1 && (
                    <div className="flex items-center gap-1 px-2">
                        {exercises.map((_, i) => (
                            <motion.button
                                key={i}
                                onClick={() => onChangeExercise(i)}
                                className={`rounded-full transition-all ${i === currentIndex
                                        ? 'w-3 h-3 bg-[var(--cosmos-accent-primary)]'
                                        : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                                    }`}
                                whileHover={{ scale: 1.3 }}
                                whileTap={{ scale: 0.9 }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Exercise Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="
          flex-1 max-w-[200px] h-11 
          rounded-2xl 
          bg-[var(--cosmos-accent-primary)]/15 
          border border-[var(--cosmos-accent-primary)]/40 
          text-[var(--cosmos-accent-primary)] 
          text-sm font-semibold tracking-wide uppercase 
          flex items-center justify-center gap-2 
          shadow-[0_0_20px_rgba(129,140,248,0.2)]
          hover:bg-[var(--cosmos-accent-primary)]/25 
          hover:border-[var(--cosmos-accent-primary)]/60 
          hover:text-white 
          transition-all
        "
                onClick={onAddExercise}
            >
                <AddIcon className="w-4 h-4" />
                הוסף תרגיל
            </motion.button>

            {/* List Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
          flex items-center gap-2 
          text-xs text-[var(--cosmos-text-muted)] 
          hover:text-white 
          px-4 py-2.5 
          rounded-xl
          bg-white/5 border border-white/10
          transition-all
          min-h-[44px]
        "
                onClick={onOpenDrawer}
            >
                <div className="w-1 h-1 bg-current rounded-full shadow-[4px_0_0_currentColor,-4px_0_0_currentColor]" />
                <span className="font-medium tracking-wider">LIST</span>
            </motion.button>
        </div>
    );
});

ExerciseNav.displayName = 'ExerciseNav';

export default ExerciseNav;
