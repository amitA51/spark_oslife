import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Exercise, WorkoutSet } from '../../types';
import { CheckCheckIcon, TrophyIcon, FlameIcon } from '../icons';
import './workout-premium.css';

interface CurrentExerciseProps {
  exercise: Exercise;
  displaySetIndex: number;
  currentSet: WorkoutSet;
  previousData: WorkoutSet[] | null;
  prInfo: string;
  onUpdateSet: (field: 'weight' | 'reps', value: number) => void;
  onCompleteSet: () => void;
  onOpenNumpad: (target: 'weight' | 'reps') => void;
  onRenameExercise: (name: string) => void;
  nameSuggestions?: string[];
}

/**
 * Premium Swipe Button with shine effect and haptic-like feedback
 */
const SwipeButton = ({ onComplete }: { onComplete: () => void }) => {
  const x = useMotionValue(0);
  const [isCompleting, setIsCompleting] = React.useState(false);

  // Haptic on drag start
  const handleDragStart = () => {
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 150) {
      setIsCompleting(true);
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 100]);
      onComplete();
      setTimeout(() => {
        setIsCompleting(false);
        x.set(0);
      }, 1000);
    } else {
      x.set(0);
    }
  };

  const backgroundOpacity = useTransform(x, [0, 200], [0, 0.3]);
  const textOpacity = useTransform(x, [0, 100], [1, 0]);

  return (
    <div className="relative w-full h-[72px] rounded-3xl overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--cosmos-glass-bg)] via-[var(--cosmos-glass-bg)] to-[var(--cosmos-accent-primary)]/10 border border-[var(--cosmos-glass-border)]" />

      {/* Success Fill Animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-green-400/30"
        style={{ opacity: backgroundOpacity }}
      />

      {/* Shine Effect */}
      <div className="absolute inset-0 workout-swipe-shine overflow-hidden" />

      {/* Text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center font-bold tracking-[0.2em] text-[var(--cosmos-text-muted)] pointer-events-none uppercase text-xs"
        style={{ opacity: textOpacity }}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">👉</span>
          החלק לסיום
        </span>
      </motion.div>

      {/* Draggable Handle */}
      <motion.div
        className={`absolute left-1 top-1 bottom-1 w-16 rounded-[20px] flex items-center justify-center cursor-grab active:cursor-grabbing z-10 ${isCompleting
          ? 'bg-gradient-to-br from-emerald-400 to-green-500'
          : 'bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-secondary)]'
          }`}
        drag="x"
        dragConstraints={{ left: 0, right: 250 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          x,
          boxShadow: isCompleting
            ? '0 0 30px rgba(34, 197, 94, 0.6)'
            : '0 0 25px rgba(99, 102, 241, 0.4)'
        }}
        whileTap={{ scale: 1.1 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={isCompleting ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <CheckCheckIcon className="w-6 h-6 text-white drop-shadow-lg" />
        </motion.div>
      </motion.div>
    </div>
  );
};

/**
 * Premium Input Card Component
 */
const InputCard = ({
  label,
  value,
  ghostValue,
  showGhost,
  icon,
  onTap,
  onIncrement,
  onDecrement,
  incrementAmount = 1
}: {
  label: string;
  value: number;
  ghostValue?: number;
  showGhost: boolean;
  icon: React.ReactNode;
  onTap: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  incrementAmount?: number;
}) => {
  const [justUpdated, setJustUpdated] = React.useState(false);

  React.useEffect(() => {
    if (value > 0) {
      setJustUpdated(true);
      const timer = setTimeout(() => setJustUpdated(false), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value]);

  return (
    <motion.div
      className={`workout-glass-card workout-iridescent-border rounded-[28px] p-6 flex flex-col items-center relative overflow-hidden cursor-pointer group ${justUpdated ? 'workout-value-updated' : ''}`}
      onClick={onTap}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Top Shine */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Icon Badge */}
      <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--cosmos-accent-primary)]/20 to-transparent flex items-center justify-center">
        {icon}
      </div>

      {/* Ghost Indicator */}
      {showGhost && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/30 font-semibold tracking-wider"
        >
          PREV
        </motion.span>
      )}

      {/* Label */}
      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--cosmos-text-muted)] mb-3 font-semibold">
        {label}
      </span>

      {/* Value Display */}
      <motion.span
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-5xl font-black tabular-nums ${showGhost
          ? 'text-white/30'
          : 'text-[var(--cosmos-text-primary)] drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          }`}
      >
        {value || ghostValue || 0}
      </motion.span>

      {/* Increment/Decrement Buttons */}
      <div className="flex justify-between w-full mt-5 gap-3" onClick={e => e.stopPropagation()}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="flex-1 h-11 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-[var(--cosmos-text-primary)] flex items-center justify-center text-xl font-medium transition-all hover:border-[var(--cosmos-accent-primary)]/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          onClick={() => { if ('vibrate' in navigator) navigator.vibrate(20); onDecrement(); }}
        >
          −
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="flex-1 h-11 rounded-xl bg-gradient-to-br from-[var(--cosmos-accent-primary)]/20 to-[var(--cosmos-accent-primary)]/5 border border-[var(--cosmos-accent-primary)]/30 text-[var(--cosmos-accent-primary)] flex items-center justify-center text-xl font-medium transition-all hover:bg-[var(--cosmos-accent-primary)]/30"
          onClick={() => { if ('vibrate' in navigator) navigator.vibrate(20); onIncrement(); }}
        >
          +
        </motion.button>
      </div>

      {/* Increment Amount Hint */}
      <div className="absolute bottom-2 right-2 text-[8px] text-white/20 font-mono">
        ±{incrementAmount}
      </div>
    </motion.div>
  );
};

/**
 * CurrentExercise displays the currently active exercise with premium inputs for weight/reps.
 * Features iridescent borders, animated glow effects, and smooth transitions.
 */
const CurrentExercise: React.FC<CurrentExerciseProps> = ({
  exercise,
  displaySetIndex,
  currentSet,
  previousData,
  prInfo,
  onUpdateSet,
  onCompleteSet,
  onOpenNumpad,
  onRenameExercise,
  nameSuggestions,
}) => {
  const previousSet = previousData?.[displaySetIndex];
  const showGhostWeight = !currentSet.weight && !!previousSet?.weight;
  const showGhostReps = !currentSet.reps && !!previousSet?.reps;

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(exercise.name || '');
  const [autoFilledFromHistory, setAutoFilledFromHistory] = React.useState(false);

  const lastCompletedInExercise = React.useMemo(() => {
    const sets = exercise?.sets || [];
    const completed = sets.filter(set => set.completedAt);
    return completed.length > 0 ? completed[completed.length - 1] : null;
  }, [exercise?.sets]);

  const completedSetsCount = React.useMemo(() => {
    return exercise?.sets?.filter(s => s.completedAt).length || 0;
  }, [exercise?.sets]);

  React.useEffect(() => {
    setTempName(exercise.name || '');
    setAutoFilledFromHistory(false);
  }, [exercise.id, exercise.name]);

  // Auto-fill from history
  React.useEffect(() => {
    if (autoFilledFromHistory) return;
    if (!previousData || previousData.length === 0) return;
    if ((currentSet.weight || 0) !== 0 || (currentSet.reps || 0) !== 0) return;

    const lastFromHistory = previousData[previousData.length - 1];
    if (!lastFromHistory) return;
    const w = lastFromHistory.weight || 0;
    const r = lastFromHistory.reps || 0;
    if (!w && !r) return;

    onUpdateSet('weight', w);
    onUpdateSet('reps', r);
    setAutoFilledFromHistory(true);
  }, [previousData, currentSet.weight, currentSet.reps, autoFilledFromHistory, onUpdateSet]);

  const handleNameSubmit = () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    onRenameExercise(trimmed);
    setIsEditingName(false);
  };

  // Parse PR info to check if there's an existing PR
  const hasPR = prInfo && !prInfo.includes('NO PR');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={exercise.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col items-center justify-center gap-6 perspective-[1000px]"
      >
        {/* Exercise Name Section */}
        <div className="text-center w-full">
          {isEditingName ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 mb-2"
            >
              <input
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                placeholder="שם התרגיל"
                autoFocus
                className="w-full max-w-xs mx-auto px-4 py-3 rounded-2xl bg-[var(--cosmos-card-bg)] border border-[var(--cosmos-accent-primary)]/50 text-center text-lg font-semibold outline-none shadow-[0_0_20px_rgba(99,102,241,0.2)] workout-input-focus"
              />
              {nameSuggestions && nameSuggestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                  {nameSuggestions.slice(0, 6).map(name => (
                    <motion.button
                      key={name}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onRenameExercise(name);
                        setIsEditingName(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-[var(--cosmos-accent-primary)] hover:text-black hover:border-transparent transition-all"
                    >
                      {name}
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="flex justify-center gap-4 text-sm">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-1.5 rounded-lg text-[var(--cosmos-text-muted)] hover:text-white hover:bg-white/5 transition-all"
                >
                  ביטול
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  onClick={handleNameSubmit}
                  className="px-4 py-1.5 rounded-lg bg-[var(--cosmos-accent-primary)] text-black font-semibold hover:brightness-110 transition-all"
                >
                  שמור
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center gap-3 mb-2">
              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl font-black text-center leading-tight workout-gradient-text-accent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {exercise.name || 'תרגיל ללא שם'}
              </motion.h2>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditingName(true)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-[var(--cosmos-text-muted)] flex items-center justify-center text-sm hover:bg-[var(--cosmos-accent-primary)]/20 hover:text-white hover:border-[var(--cosmos-accent-primary)]/50 transition-all"
                title="שנה שם"
              >
                ✎
              </motion.button>
            </div>
          )}

          {/* Badges Row */}
          <div className="mt-4 flex gap-2 justify-center flex-wrap">
            {/* Set Counter Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[var(--cosmos-accent-primary)]/15 to-[var(--cosmos-accent-primary)]/5 border border-[var(--cosmos-accent-primary)]/30 workout-pulse-glow"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span className="text-[var(--cosmos-accent-primary)] font-black text-sm tracking-wider">
                סט {displaySetIndex + 1}
              </span>
              <span className="text-[var(--cosmos-text-muted)] text-xs">/</span>
              <span className="text-[var(--cosmos-text-muted)] text-sm">{exercise?.sets?.length || 0}</span>
            </motion.div>

            {/* Completed Sets Badge */}
            {completedSetsCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <CheckCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-xs">{completedSetsCount} הושלמו</span>
              </motion.div>
            )}

            {/* Tempo Badge */}
            {exercise.tempo && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30"
              >
                <span className="text-cyan-400 font-bold text-sm tracking-widest font-mono">
                  {exercise.tempo}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Premium Input Cards */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <InputCard
            label="משקל (ק״ג)"
            value={currentSet.weight || 0}
            ghostValue={previousSet?.weight}
            showGhost={showGhostWeight}
            icon={<FlameIcon className="w-4 h-4 text-[var(--cosmos-accent-primary)]" />}
            onTap={() => onOpenNumpad('weight')}
            onIncrement={() => onUpdateSet('weight', (currentSet.weight || 0) + 2.5)}
            onDecrement={() => onUpdateSet('weight', Math.max(0, (currentSet.weight || 0) - 2.5))}
            incrementAmount={2.5}
          />
          <InputCard
            label="חזרות"
            value={currentSet.reps || 0}
            ghostValue={previousSet?.reps}
            showGhost={showGhostReps}
            icon={<span className="text-sm">🔄</span>}
            onTap={() => onOpenNumpad('reps')}
            onIncrement={() => onUpdateSet('reps', (currentSet.reps || 0) + 1)}
            onDecrement={() => onUpdateSet('reps', Math.max(0, (currentSet.reps || 0) - 1))}
            incrementAmount={1}
          />
        </div>

        {/* Copy Last Set Button */}
        {lastCompletedInExercise && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-[var(--cosmos-accent-primary)]/30 transition-all group"
            onClick={() => {
              const w = lastCompletedInExercise.weight || 0;
              const r = lastCompletedInExercise.reps || 0;
              onUpdateSet('weight', w);
              onUpdateSet('reps', r);
            }}
          >
            <span className="text-[var(--cosmos-accent-primary)] font-semibold text-xs tracking-wider group-hover:text-white transition-colors">
              📋 העתק סט קודם
            </span>
            <span className="font-mono text-[11px] text-white/50 bg-white/5 px-2 py-0.5 rounded-lg">
              {lastCompletedInExercise.weight || 0}kg × {lastCompletedInExercise.reps || 0}
            </span>
          </motion.button>
        )}

        {/* PR Display */}
        <motion.div
          className={`text-xs font-medium px-4 py-2 rounded-xl ${hasPR
            ? 'bg-yellow-500/10 border border-yellow-500/20'
            : 'bg-white/5 border border-white/5'
            }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {hasPR ? (
            <span className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-yellow-400 workout-fire-effect" />
              <span className="workout-pr-badge font-semibold">{prInfo}</span>
            </span>
          ) : (
            <span className="text-[var(--cosmos-text-muted)]">
              🎯 {prInfo}
            </span>
          )}
        </motion.div>

        {/* Premium Swipe Button */}
        <div className="w-full max-w-md">
          <SwipeButton onComplete={onCompleteSet} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(CurrentExercise);

