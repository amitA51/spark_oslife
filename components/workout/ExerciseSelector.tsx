// ExerciseSelector - ULTRA PREMIUM REDESIGN
// Full-screen bottom sheet with Deep Cosmos aesthetic, mesh gradients, and premium animations

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { PersonalExercise, Exercise, WorkoutGoal } from '../../types';
import * as dataService from '../../services/dataService';
import { SearchIcon, AddIcon, StarIcon, CloseIcon, DumbbellIcon, FlameIcon, TargetIcon, TrophyIcon } from '../icons';
import { getWorkoutSessions } from '../../services/dataService';
import { calculatePRsFromHistory, PersonalRecord } from '../../services/prService';
import './workout-premium.css';

// ============================================================
// TYPES
// ============================================================

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  onCreateNew: () => void;
  goal?: WorkoutGoal;
}

interface ExerciseStats {
  last?: { weight: number; reps: number };
  pr?: PersonalRecord;
}

// ============================================================
// HAPTIC HELPER
// ============================================================

const triggerHaptic = (pattern: number[] = [10]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// ============================================================
// UNIQUE ID GENERATOR
// ============================================================

const makeExerciseId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `ex-${crypto.randomUUID()}`
    : `ex-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ============================================================
// PREMIUM EXERCISE CARD
// ============================================================

interface ExerciseCardProps {
  exercise: PersonalExercise;
  stats?: ExerciseStats;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

const ExerciseCard = motion(({ exercise, stats, isSelected, onSelect, index }: ExerciseCardProps) => {
  // Get muscle group icon as SVG
  const getMuscleIcon = (muscleGroup: string = '') => {
    const iconClass = "w-6 h-6";
    switch (muscleGroup.toLowerCase()) {
      case 'chest':
      case 'back':
      case 'shoulders':
      case 'arms':
        return <DumbbellIcon className={iconClass} />;
      case 'legs':
        return <DumbbellIcon className={iconClass} />;
      case 'core':
        return <TargetIcon className={iconClass} />;
      case 'cardio':
        return <FlameIcon className={iconClass} />;
      default:
        return <DumbbellIcon className={iconClass} />;
    }
  };

  return (
    <motion.button
      type="button"
      onClick={() => {
        triggerHaptic([15, 30, 15]);
        onSelect();
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.03,
        type: 'spring',
        stiffness: 400,
        damping: 30
      }}
      whileTap={{ scale: 0.97 }}
      className={`
        w-full text-right p-4 rounded-3xl
        transition-all duration-300 ease-out
        border backdrop-blur-xl
        min-h-[88px]
        ${isSelected
          ? 'bg-gradient-to-r from-[var(--cosmos-accent-primary)]/25 to-[var(--cosmos-accent-cyan)]/15 border-[var(--cosmos-accent-primary)]/60 shadow-[0_0_40px_rgba(99,102,241,0.3),inset_0_0_30px_rgba(99,102,241,0.1)]'
          : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.1]'
        }
      `}
      style={{
        boxShadow: isSelected
          ? '0 8px 32px rgba(99, 102, 241, 0.2), 0 0 1px rgba(255,255,255,0.1)'
          : '0 4px 24px rgba(0,0,0,0.2)'
      }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
          ${isSelected
            ? 'bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] shadow-[0_0_25px_rgba(99,102,241,0.5)]'
            : 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10'
          }
        `}>
          {getMuscleIcon(exercise.muscleGroup)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`
              font-bold text-[15px] truncate
              ${isSelected ? 'text-white' : 'text-white/90'}
            `}>
              {exercise.name}
            </h3>
            {exercise.isFavorite && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <StarIcon className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" filled />
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {exercise.muscleGroup && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-medium">
                {exercise.muscleGroup}
              </span>
            )}
            {stats?.last && (
              <span className="text-white/40 flex items-center gap-1">
                <FlameIcon className="w-3 h-3" />
                {stats.last.weight}kg × {stats.last.reps}
              </span>
            )}
            {stats?.pr && (
              <span className="text-amber-400/80 font-semibold flex items-center gap-1">
                🏆 {stats.pr.maxWeight}kg
              </span>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        <motion.div
          className={`
            w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0
            transition-all duration-300
            ${isSelected
              ? 'bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
              : 'bg-white/5 border-2 border-dashed border-white/20 text-white/40'
            }
          `}
          animate={isSelected ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {isSelected ? '✓' : '+'}
        </motion.div>
      </div>
    </motion.button>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

// ============================================================
// CATEGORY PILL
// ============================================================

interface CategoryPillProps {
  label: string;
  emoji?: string;
  isActive: boolean;
  onClick: () => void;
}

const CategoryPill = ({ label, emoji, isActive, onClick }: CategoryPillProps) => (
  <motion.button
    type="button"
    onClick={() => {
      triggerHaptic();
      onClick();
    }}
    whileTap={{ scale: 0.93 }}
    className={`
      relative flex-shrink-0 flex items-center gap-2 
      px-5 py-3 rounded-2xl
      font-semibold text-sm
      transition-all duration-300 ease-out
      min-h-[52px]
      ${isActive
        ? 'text-white'
        : 'text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15'
      }
    `}
    style={isActive ? {
      background: 'linear-gradient(135deg, var(--cosmos-accent-primary) 0%, var(--cosmos-accent-cyan) 100%)',
      boxShadow: '0 0 30px rgba(99, 102, 241, 0.4), 0 4px 16px rgba(0,0,0,0.3)'
    } : {}}
  >
    {emoji && <span className="text-lg">{emoji}</span>}
    <span>{label}</span>

    {isActive && (
      <motion.div
        layoutId="activePill"
        className="absolute inset-0 rounded-2xl -z-10"
        style={{
          background: 'linear-gradient(135deg, var(--cosmos-accent-primary) 0%, var(--cosmos-accent-cyan) 100%)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
  </motion.button>
);

// ============================================================
// QUICK CREATE PANEL
// ============================================================

interface QuickCreatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, muscleGroup: string) => void;
  isCreating: boolean;
  muscleGroups: string[];
}

const QuickCreatePanel = ({ isOpen, onClose, onCreate, isCreating, muscleGroups }: QuickCreatePanelProps) => {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setName('');
      setMuscle('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim(), muscle);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="rounded-3xl overflow-hidden mb-4"
          style={{
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 60px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <AddIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px]">תרגיל חדש</h3>
                <p className="text-[11px] text-white/50">צור והוסף לאימון במכה אחת</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="שם התרגיל"
                className="w-full h-14 px-5 rounded-2xl bg-black/40 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-[var(--cosmos-accent-primary)] focus:bg-black/60 transition-all text-[15px] font-medium"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {muscleGroups.filter(g => g !== 'all').map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setMuscle(muscle === group ? '' : group)}
                  className={`
                    flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${muscle === group
                      ? 'bg-[var(--cosmos-accent-primary)] text-white'
                      : 'bg-white/5 text-white/60 border border-white/10'
                    }
                  `}
                >
                  {group}
                </button>
              ))}
            </div>

            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || isCreating}
              whileTap={{ scale: 0.97 }}
              className="w-full h-14 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--cosmos-accent-primary) 0%, var(--cosmos-accent-cyan) 100%)',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
              }}
            >
              {isCreating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span className="text-white">יוצר...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span className="text-white">צור והוסף לאימון</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelect,
  onClose,
  onCreateNew,
  goal,
}) => {
  const [exercises, setExercises] = useState<PersonalExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'push' | 'pull' | 'legs' | 'full'>('all');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [exerciseStats, setExerciseStats] = useState<Record<string, ExerciseStats>>({});
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);
  const sheetScale = useTransform(y, [0, 300], [1, 0.95]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, sessions] = await Promise.all([
        dataService.getPersonalExercises(),
        getWorkoutSessions(80)
      ]);
      setExercises(data);

      const prMap = calculatePRsFromHistory(sessions);
      const lastMap = new Map<string, { weight: number; reps: number }>();

      sessions.forEach(session => {
        session.exercises?.forEach(ex => {
          ex.sets?.forEach(set => {
            if (!set.completedAt || !set.weight || !set.reps) return;
            if (lastMap.has(ex.name)) return;
            lastMap.set(ex.name, { weight: set.weight, reps: set.reps });
          });
        });
      });

      const combined: Record<string, ExerciseStats> = {};
      lastMap.forEach((val, name) => {
        combined[name] = { ...(combined[name] || {}), last: val };
      });
      prMap.forEach((pr, name) => {
        combined[name] = { ...(combined[name] || {}), pr };
      });

      setExerciseStats(combined);
    } catch (e) {
      console.error('Failed to load exercises', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = useCallback(async (personalExercise: PersonalExercise) => {
    if (!personalExercise.name?.trim()) return;

    const exercise: Exercise = {
      id: makeExerciseId(),
      name: personalExercise.name,
      muscleGroup: personalExercise.muscleGroup,
      targetRestTime: personalExercise.defaultRestTime || 90,
      sets: Array(personalExercise.defaultSets || 4)
        .fill(null)
        .map(() => ({ reps: 0, weight: 0 })),
    };

    await dataService.incrementExerciseUse(personalExercise.id);
    onSelect(exercise);

    setSelectedExercises(prev => {
      const next = new Set(prev);
      next.add(personalExercise.id);
      return next;
    });
  }, [onSelect]);

  const handleQuickCreate = useCallback(async (name: string, muscleGroup: string) => {
    setIsCreating(true);
    try {
      const created = await dataService.createPersonalExercise({
        name,
        muscleGroup: muscleGroup || undefined,
        defaultRestTime: 90,
        defaultSets: 4,
      });
      setExercises(prev => [created, ...prev]);
      setShowQuickCreate(false);
      await handleSelect(created);
    } catch (e) {
      console.error('Quick create failed', e);
    } finally {
      setIsCreating(false);
    }
  }, [handleSelect]);

  const presetMatches = useCallback((ex: PersonalExercise): boolean => {
    if (selectedPreset === 'all') return true;
    const mg = (ex.muscleGroup || '').toLowerCase();
    switch (selectedPreset) {
      case 'push': return ['chest', 'shoulders', 'arms', 'triceps'].some(k => mg.includes(k));
      case 'pull': return ['back', 'arms', 'biceps'].some(k => mg.includes(k));
      case 'legs': return ['legs', 'quads', 'hamstrings', 'glutes'].some(k => mg.includes(k));
      default: return true;
    }
  }, [selectedPreset]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      if (!ex.name?.trim()) return false;
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPreset = presetMatches(ex);
      return matchesSearch && matchesPreset;
    });
  }, [exercises, searchQuery, presetMatches]);

  const sortedExercises = useMemo(() => {
    return filteredExercises.slice().sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      const ua = a.useCount || 0;
      const ub = b.useCount || 0;
      if (ua !== ub) return ub - ua;
      return a.name.localeCompare(b.name);
    });
  }, [filteredExercises]);

  // Recent exercises (top 5 most used, only when not searching)
  const recentExercises = useMemo(() => {
    if (searchQuery) return [];
    return exercises
      .filter(ex => (ex.useCount || 0) > 0)
      .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
      .slice(0, 5);
  }, [exercises, searchQuery]);

  // Favorite exercises (only when not searching)
  const favoriteExercises = useMemo(() => {
    if (searchQuery) return [];
    return exercises.filter(ex => ex.isFavorite);
  }, [exercises, searchQuery]);

  const muscleGroups = useMemo(() => {
    const groups = exercises.map(ex => ex.muscleGroup).filter((g): g is string => !!g);
    return ['all', ...Array.from(new Set(groups))];
  }, [exercises]);

  const presets = [
    { id: 'all', label: 'הכל' },
    { id: 'push', label: 'דחיפה' },
    { id: 'pull', label: 'משיכה' },
    { id: 'legs', label: 'רגליים' },
    { id: 'full', label: 'גוף מלא' },
  ];

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 150) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[11000] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
      />

      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-[var(--cosmos-accent-primary)]/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[30%] w-[70%] h-[70%] rounded-full bg-[var(--cosmos-accent-cyan)]/15 blur-[100px]" />
      </div>

      {/* Sheet */}
      <motion.div
        className="relative flex-1 flex flex-col mt-8 rounded-t-[32px] overflow-hidden"
        style={{
          scale: sheetScale,
          y,
          background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,18,0.99) 100%)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">בחר תרגילים</h1>
              <p className="text-sm text-white/40 mt-0.5">
                {selectedExercises.size > 0
                  ? `${selectedExercises.size} תרגילים נבחרו`
                  : 'לחץ להוספה לאימון'
                }
              </p>
            </div>
            <motion.button
              type="button"
              onClick={onClose}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <CloseIcon className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש תרגיל..."
              className="w-full h-14 pr-14 pl-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[var(--cosmos-accent-primary)]/50 focus:bg-white/8 transition-all text-[15px]"
            />
          </div>

          {/* Presets */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-1 px-1">
            {presets.map(preset => (
              <CategoryPill
                key={preset.id}
                label={preset.label}
                emoji={preset.emoji}
                isActive={selectedPreset === preset.id}
                onClick={() => setSelectedPreset(preset.id as typeof selectedPreset)}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[120px]">
          {/* Quick Create */}
          <div className="mb-4">
            {!showQuickCreate ? (
              <motion.button
                type="button"
                onClick={() => {
                  triggerHaptic([15, 50, 15]);
                  setShowQuickCreate(true);
                }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-16 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center gap-3 text-white/50 hover:text-white hover:border-[var(--cosmos-accent-primary)]/40 hover:bg-[var(--cosmos-accent-primary)]/5 transition-all"
              >
                <AddIcon className="w-6 h-6" />
                <span className="font-bold text-[15px]">יצירת תרגיל חדש</span>
              </motion.button>
            ) : (
              <QuickCreatePanel
                isOpen={showQuickCreate}
                onClose={() => setShowQuickCreate(false)}
                onCreate={handleQuickCreate}
                isCreating={isCreating}
                muscleGroups={muscleGroups}
              />
            )}
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-3 border-white/10 border-t-[var(--cosmos-accent-primary)]"
              />
              <p className="text-white/40 mt-4">טוען תרגילים...</p>
            </div>
          ) : sortedExercises.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center mb-6">
                <DumbbellIcon className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? 'לא נמצאו תוצאות' : 'עוד אין תרגילים'}
              </h3>
              <p className="text-white/40 text-sm mb-6 max-w-[240px]">
                {searchQuery ? 'נסה מילות חיפוש אחרות או צור תרגיל חדש' : 'צור את התרגיל הראשון שלך'}
              </p>
              <motion.button
                type="button"
                onClick={() => setShowQuickCreate(true)}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-2xl font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--cosmos-accent-primary) 0%, var(--cosmos-accent-cyan) 100%)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
                }}
              >
                + צור תרגיל חדש
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Favorites Section */}
              {favoriteExercises.length > 0 && selectedPreset === 'all' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <StarIcon className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-400">מועדפים</h3>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {favoriteExercises.map((exercise, index) => (
                      <motion.button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleSelect(exercise)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-white font-medium text-sm min-w-[120px]"
                      >
                        <div className="flex items-center gap-2">
                          <StarIcon className="w-3 h-3 text-amber-400" />
                          <span className="truncate">{exercise.name}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Section */}
              {recentExercises.length > 0 && selectedPreset === 'all' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FlameIcon className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-cyan-400">אחרונים</h3>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {recentExercises.map((exercise, index) => (
                      <motion.button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleSelect(exercise)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all min-w-[120px]"
                      >
                        <span className="truncate">{exercise.name}</span>
                        {exerciseStats[exercise.name]?.last && (
                          <span className="text-[10px] text-white/40 block mt-1">
                            {exerciseStats[exercise.name]?.last?.weight}kg × {exerciseStats[exercise.name]?.last?.reps}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Exercises */}
              <div>
                {(recentExercises.length > 0 || favoriteExercises.length > 0) && selectedPreset === 'all' && !searchQuery && (
                  <h3 className="text-sm font-bold text-white/60 mb-3">כל התרגילים</h3>
                )}
                <div className="space-y-3">
                  {sortedExercises.map((exercise, index) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      stats={exerciseStats[exercise.name]}
                      isSelected={selectedExercises.has(exercise.id)}
                      onSelect={() => handleSelect(exercise)}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5 pt-4"
          style={{
            background: 'linear-gradient(to top, rgba(10,10,18,1) 0%, rgba(10,10,18,0.95) 60%, transparent 100%)'
          }}
        >
          <div className="safe-area-bottom">
            <motion.button
              type="button"
              onClick={onClose}
              whileTap={{ scale: 0.97 }}
              className="w-full h-16 rounded-3xl font-bold text-lg transition-all flex items-center justify-center gap-3"
              style={{
                background: selectedExercises.size > 0
                  ? 'linear-gradient(135deg, var(--cosmos-accent-primary) 0%, var(--cosmos-accent-cyan) 100%)'
                  : 'rgba(255,255,255,0.1)',
                boxShadow: selectedExercises.size > 0
                  ? '0 0 40px rgba(99, 102, 241, 0.5), 0 8px 32px rgba(0,0,0,0.3)'
                  : 'none',
                color: selectedExercises.size > 0 ? 'white' : 'rgba(255,255,255,0.6)'
              }}
            >
              {selectedExercises.size > 0 ? (
                <>
                  <span className="text-xl">💪</span>
                  <span>סיום ({selectedExercises.size} תרגילים)</span>
                </>
              ) : (
                <span>חזרה לאימון</span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Scrollbar and safe area styles */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 16px); }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default ExerciseSelector;
