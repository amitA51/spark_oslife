import React from 'react';
import { Exercise } from '../../types';
import { ChevronLeftIcon, AddIcon } from '../icons';

interface ExerciseListProps {
  exercises: Exercise[];
  currentIndex: number;
  onChangeExercise: (index: number) => void;
  onOpenDrawer: () => void;
  onAddExercise: () => void;
}

/**
 * ExerciseList for navigation between exercises.
 * Heavily memoized - should NOT re-render when weight/reps change!
 */
const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  currentIndex,
  onChangeExercise,
  onOpenDrawer,
  onAddExercise,
}) => {
  return (
    <div className="flex items-center justify-between mt-2 gap-2">
      <button
        className="flex items-center gap-2 text-xs sm:text-sm text-[var(--cosmos-text-muted)] hover:text-white px-3 sm:px-4 py-2 transition-colors"
        onClick={onOpenDrawer}
      >
        <div className="w-1 h-1 bg-current rounded-full shadow-[4px_0_0_currentColor,-4px_0_0_currentColor]" />
        LIST
      </button>

      {/* Primary inline add-exercise action */}
      <button
        className="flex-1 max-w-[180px] sm:max-w-[220px] h-10 rounded-2xl bg-[var(--cosmos-accent-primary)]/12 border border-[var(--cosmos-accent-primary)]/40 text-[var(--cosmos-accent-primary)] text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(129,140,248,0.25)] hover:bg-[var(--cosmos-accent-primary)]/18 hover:border-[var(--cosmos-accent-primary)]/70 hover:text-white transition-all active:scale-95"
        onClick={onAddExercise}
      >
        <AddIcon className="w-4 h-4" />
        Add Exercise
      </button>

      <div className="flex gap-2">
        <button
          className="w-10 h-10 rounded-xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-primary)] flex items-center justify-center transition-all hover:bg-[var(--cosmos-glass-highlight)] active:scale-90 disabled:opacity-50"
          disabled={currentIndex === 0}
          onClick={() => onChangeExercise(currentIndex - 1)}
        >
          <ChevronLeftIcon className="w-5 h-5 rotate-180" />
        </button>
        <button
          className="w-10 h-10 rounded-xl bg-[var(--cosmos-glass-bg)] border border-[var(--cosmos-glass-border)] text-[var(--cosmos-text-primary)] flex items-center justify-center transition-all hover:bg-[var(--cosmos-glass-highlight)] active:scale-90 disabled:opacity-50"
          disabled={currentIndex === exercises.length - 1}
          onClick={() => onChangeExercise(currentIndex + 1)}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(ExerciseList);
