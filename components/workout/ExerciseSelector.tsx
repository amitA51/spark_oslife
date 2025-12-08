import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalExercise, Exercise, WorkoutGoal } from '../../types';
import * as dataService from '../../services/dataService';
import { SearchIcon, AddIcon, StarIcon } from '../icons';
import { getWorkoutSessions } from '../../services/dataService';
import { calculatePRsFromHistory, PersonalRecord } from '../../services/prService';

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  onCreateNew: () => void;
  goal?: WorkoutGoal;
}

const makeExerciseId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `ex-${crypto.randomUUID()}`
    : `ex-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * ExerciseSelector - Mobile-first redesign
 * Full-screen bottom sheet with large touch targets and simplified UX
 */
const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelect,
  onClose,
  onCreateNew,
  goal,
}) => {
  const [exercises, setExercises] = useState<PersonalExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'push' | 'pull' | 'legs' | 'full'>('all');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [exerciseStats, setExerciseStats] = useState<
    Record<string, { last?: { weight: number; reps: number }; pr?: PersonalRecord }>
  >({});
  const [quickName, setQuickName] = useState('');
  const [quickMuscle, setQuickMuscle] = useState('');
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  useEffect(() => {
    loadExercises();
    loadStats();
  }, []);

  const loadExercises = async () => {
    const data = await dataService.getPersonalExercises();
    setExercises(data);
  };

  const loadStats = async () => {
    try {
      const sessions = await getWorkoutSessions(80);
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

      const combined: Record<string, { last?: { weight: number; reps: number }; pr?: PersonalRecord }> = {};
      lastMap.forEach((val, name) => {
        combined[name] = { ...(combined[name] || {}), last: val };
      });
      prMap.forEach((pr, name) => {
        combined[name] = { ...(combined[name] || {}), pr };
      });

      setExerciseStats(combined);
    } catch (e) {
      console.error('Failed to load exercise stats for selector', e);
    }
  };

  const handleSingleSelect = async (personalExercise: PersonalExercise) => {
    // Don't allow adding exercises without names
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
      if (prev.has(personalExercise.id)) return prev;
      const next = new Set(prev);
      next.add(personalExercise.id);
      return next;
    });
  };

  const handleQuickCreate = async () => {
    const name = quickName.trim();
    if (!name) return;

    setIsCreatingQuick(true);
    try {
      const created = await dataService.createPersonalExercise({
        name,
        muscleGroup: quickMuscle || undefined,
        defaultRestTime: 90,
        defaultSets: 4,
      });
      setExercises(prev => [created, ...prev]);
      setQuickName('');
      setQuickMuscle('');
      setShowQuickCreate(false);
      await handleSingleSelect(created);
    } catch (e) {
      console.error('Quick exercise create failed', e);
    } finally {
      setIsCreatingQuick(false);
    }
  };

  const presetMatches = (ex: PersonalExercise): boolean => {
    if (selectedPreset === 'all') return true;
    const mg = (ex.muscleGroup || '').toLowerCase();
    switch (selectedPreset) {
      case 'push':
        return ['chest', 'shoulders', 'arms', 'triceps'].some(k => mg.includes(k));
      case 'pull':
        return ['back', 'arms', 'biceps'].some(k => mg.includes(k));
      case 'legs':
        return ['legs', 'quads', 'hamstrings', 'glutes'].some(k => mg.includes(k));
      case 'full':
        return true;
      default:
        return true;
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      // Filter out exercises without valid names
      if (!ex.name?.trim()) return false;
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
      const matchesPreset = presetMatches(ex);
      return matchesSearch && matchesMuscleGroup && matchesPreset;
    });
  }, [exercises, searchQuery, selectedMuscleGroup, selectedPreset]);

  const scoredExercises = useMemo(() => {
    return filteredExercises.slice().sort((a, b) => {
      // Favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      // Then by use count
      const ua = a.useCount || 0;
      const ub = b.useCount || 0;
      if (ua !== ub) return ub - ua;

      return a.name.localeCompare(b.name);
    });
  }, [filteredExercises]);

  const muscleGroups = useMemo(() => {
    return ['all', ...Array.from(new Set(exercises.map(ex => ex.muscleGroup).filter(Boolean)))];
  }, [exercises]);

  const favoriteExercises = useMemo(() => scoredExercises.filter(ex => ex.isFavorite), [scoredExercises]);
  const recentExercises = useMemo(() => scoredExercises.filter(ex => (ex.useCount || 0) > 0).slice(0, 8), [scoredExercises]);

  // Muscle group display names in Hebrew
  const muscleGroupLabels: Record<string, string> = {
    'all': 'הכל',
    'Chest': 'חזה',
    'Back': 'גב',
    'Shoulders': 'כתפיים',
    'Arms': 'ידיים',
    'Legs': 'רגליים',
    'Core': 'בטן',
    'Cardio': 'אירובי',
  };

  const presets = [
    { id: 'all', label: 'הכל', emoji: '💪' },
    { id: 'push', label: 'דחיפה', emoji: '🏋️' },
    { id: 'pull', label: 'משיכה', emoji: '🧲' },
    { id: 'legs', label: 'רגליים', emoji: '🦵' },
    { id: 'full', label: 'גוף מלא', emoji: '⚡' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-xl flex flex-col"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      {/* Header - Sticky, compact */}
      <div className="flex-shrink-0 safe-area-top">
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 -ml-2 text-white/70 hover:text-white transition-colors min-h-[44px]"
          >
            <span className="text-lg">→</span>
            <span className="text-sm font-medium">חזור</span>
          </button>
          <h2 className="text-lg font-bold text-white">בחירת תרגילים</h2>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 bg-black/50">
          <div className="relative">
            <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש תרגיל..."
              className="w-full h-12 pr-12 pl-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 outline-none focus:border-[var(--aw-accent)] transition-colors text-base"
            />
          </div>
        </div>

        {/* Preset Filters - Large touch targets */}
        <div className="px-4 pb-3 bg-black/50 border-b border-white/10">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id as typeof selectedPreset)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold transition-all whitespace-nowrap ${selectedPreset === preset.id
                  ? 'bg-[var(--aw-accent)] text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : 'bg-white/10 text-white/70 border border-white/10 active:scale-95'
                  }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Quick Actions */}
        <div className="px-4 py-4 space-y-3">
          {/* Quick Create Toggle */}
          <motion.button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className={`w-full min-h-[56px] px-4 py-3 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${showQuickCreate
              ? 'border-[var(--aw-accent)] bg-[var(--aw-accent)]/10 text-[var(--aw-accent)]'
              : 'border-white/20 text-white/60 hover:border-[var(--aw-accent)]/50'
              }`}
            whileTap={{ scale: 0.98 }}
          >
            <AddIcon className="w-6 h-6" />
            <span className="font-bold text-base">יצירת תרגיל חדש</span>
          </motion.button>

          {/* Quick Create Form */}
          <AnimatePresence>
            {showQuickCreate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <input
                    type="text"
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    placeholder="שם התרגיל (חובה)"
                    autoFocus
                    className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none focus:border-[var(--aw-accent)] transition-colors"
                  />
                  <select
                    value={quickMuscle}
                    onChange={e => setQuickMuscle(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/15 text-white outline-none appearance-none"
                  >
                    <option value="" className="text-black">בחר קבוצת שרירים (אופציונלי)</option>
                    {muscleGroups.filter(g => g !== 'all').map(g => (
                      <option key={g} value={g} className="text-black">
                        {muscleGroupLabels[g || ''] || g}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleQuickCreate}
                    disabled={!quickName.trim() || isCreatingQuick}
                    className="w-full h-12 rounded-xl bg-[var(--aw-accent)] text-black font-bold text-base shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {isCreatingQuick ? 'יוצר...' : '✓ צור והוסף לאימון'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Favorites Section */}
        {favoriteExercises.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <StarIcon className="w-4 h-4 text-yellow-400" filled />
              <span className="text-sm font-semibold text-yellow-400">מועדפים</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {favoriteExercises.map(ex => (
                <motion.button
                  key={`fav-${ex.id}`}
                  onClick={() => handleSingleSelect(ex)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 px-4 py-3 min-h-[52px] rounded-2xl border transition-all ${selectedExercises.has(ex.id)
                    ? 'bg-[var(--aw-accent)]/20 border-[var(--aw-accent)]'
                    : 'bg-yellow-400/10 border-yellow-400/30 active:bg-yellow-400/20'
                    }`}
                >
                  <span className="font-semibold text-white whitespace-nowrap">{ex.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Section */}
        {recentExercises.length > 0 && !searchQuery && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold text-white/70">לאחרונה בשימוש</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {recentExercises.map(ex => (
                <motion.button
                  key={`recent-${ex.id}`}
                  onClick={() => handleSingleSelect(ex)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 px-4 py-3 min-h-[52px] rounded-2xl border transition-all ${selectedExercises.has(ex.id)
                    ? 'bg-[var(--aw-accent)]/20 border-[var(--aw-accent)]'
                    : 'bg-white/5 border-white/10 active:bg-white/10'
                    }`}
                >
                  <span className="font-semibold text-white whitespace-nowrap">{ex.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Muscle Group Filter */}
        {muscleGroups.length > 2 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {muscleGroups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedMuscleGroup(group || 'all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedMuscleGroup === group
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 border border-white/10'
                    }`}
                >
                  {muscleGroupLabels[group || ''] || group}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="px-4 pb-4">
          {scoredExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">לא נמצאו תרגילים</h3>
              <p className="text-white/40 mb-6 text-sm">
                {searchQuery ? 'נסה מילות חיפוש אחרות' : 'צור את התרגיל הראשון שלך'}
              </p>
              <button
                onClick={() => setShowQuickCreate(true)}
                className="px-6 py-3 rounded-xl bg-[var(--aw-accent)] text-black font-bold"
              >
                + צור תרגיל חדש
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {scoredExercises.map(exercise => {
                const isSelected = selectedExercises.has(exercise.id);
                const stats = exerciseStats[exercise.name];

                return (
                  <motion.div
                    key={exercise.id}
                    onClick={() => handleSingleSelect(exercise)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 border cursor-pointer min-h-[72px] ${isSelected
                      ? 'bg-[var(--aw-accent)]/15 border-[var(--aw-accent)] shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'bg-white/5 border-transparent active:bg-white/10'
                      }`}
                  >
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-base truncate ${isSelected ? 'text-[var(--aw-accent)]' : 'text-white'
                          }`}>
                          {exercise.name}
                        </span>
                        {exercise.isFavorite && (
                          <StarIcon className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" filled />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/50">
                        {exercise.muscleGroup && (
                          <span className="px-2 py-0.5 bg-white/10 rounded-full">
                            {muscleGroupLabels[exercise.muscleGroup] || exercise.muscleGroup}
                          </span>
                        )}
                        {stats?.last && (
                          <span>
                            אחרון: {stats.last.weight}kg × {stats.last.reps}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add Indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected
                      ? 'bg-[var(--aw-accent)] text-black'
                      : 'bg-white/10 text-white/60'
                      }`}>
                      {isSelected ? '✓' : '+'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/80 backdrop-blur-xl safe-area-bottom">
        {selectedExercises.size > 0 && (
          <div className="text-center text-sm text-white/60 mb-3">
            נבחרו {selectedExercises.size} תרגילים
          </div>
        )}
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.98 }}
          className="w-full h-14 rounded-2xl bg-[var(--aw-accent)] text-black font-bold text-lg shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all"
        >
          {selectedExercises.size > 0 ? '✓ סיום והמשך לאימון' : 'חזרה לאימון'}
        </motion.button>
      </div>

      {/* Custom scrollbar hiding */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-area-top { padding-top: env(safe-area-inset-top, 0); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </motion.div>
  );
};

export default ExerciseSelector;
