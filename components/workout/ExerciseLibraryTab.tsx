import React, { useState, useEffect } from 'react';
import { PersonalExercise } from '../../types';
import * as dataService from '../../services/dataService';
import { TrashIcon, AddIcon, SearchIcon } from '../icons';
// import './ActiveWorkout.css'; // Removed in favor of Tailwind

const ExerciseLibraryTab: React.FC = () => {
  const [exercises, setExercises] = useState<PersonalExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<PersonalExercise | null>(null);

  // New Exercise Form State
  const [newExercise, setNewExercise] = useState<{
    name: string;
    muscleGroup: string;
    category: PersonalExercise['category'] | '';
    tempo: string;
    tutorialText: string;
    defaultRestTime: number;
    defaultSets: number;
  }>({
    name: '',
    muscleGroup: '',
    category: '',
    tempo: '',
    tutorialText: '',
    defaultRestTime: 90,
    defaultSets: 4,
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const data = await dataService.getPersonalExercises();
    setExercises(data);
  };

  const handleDelete = (exercise: PersonalExercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setExerciseToDelete(exercise);
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete) return;
    await dataService.deletePersonalExercise(exerciseToDelete.id);
    setExerciseToDelete(null);
    loadExercises();
  };

  const cancelDelete = () => {
    setExerciseToDelete(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;

    await dataService.createPersonalExercise({
      name: newExercise.name,
      muscleGroup: newExercise.muscleGroup || undefined,
      category: newExercise.category || undefined,
      tempo: newExercise.tempo || undefined,
      tutorialText: newExercise.tutorialText || undefined,
      defaultRestTime: newExercise.defaultRestTime,
      defaultSets: newExercise.defaultSets,
    });

    setNewExercise({
      name: '',
      muscleGroup: '',
      category: '',
      tempo: '',
      tutorialText: '',
      defaultRestTime: 90,
      defaultSets: 4,
    });
    setShowAddForm(false);
    loadExercises();
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup =
      selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesMuscleGroup && matchesCategory;
  });

  const muscleGroups = [
    'all',
    'Chest',
    'Back',
    'Legs',
    'Shoulders',
    'Arms',
    'Core',
    'Cardio',
    'Other',
  ];
  const categories = ['all', 'strength', 'cardio', 'flexibility', 'warmup', 'cooldown'];

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter */}
      <div className="space-y-4 mb-4">
        <div className="relative">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חיפוש תרגיל..."
            className="aw-input pr-12"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {muscleGroups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedMuscleGroup(group)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selectedMuscleGroup === group
                  ? 'bg-[var(--aw-accent)] text-black shadow-[0_0_10px_var(--aw-accent-glow)]'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {group === 'all' ? 'הכל' : group}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Button */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 mb-4 border border-dashed border-white/20 hover:border-[var(--aw-accent)] hover:bg-[var(--aw-accent)]/5 rounded-xl text-white/60 hover:text-[var(--aw-accent)] transition-all flex items-center justify-center gap-2 font-medium text-sm"
        >
          <AddIcon className="w-4 h-4" />
          תרגיל חדש
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 space-y-3 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-white">יצירת תרגיל</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-white/40 hover:text-white"
            >
              ביטול
            </button>
          </div>

          <input
            type="text"
            value={newExercise.name}
            onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
            placeholder="שם התרגיל"
            className="aw-input text-sm"
            autoFocus
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newExercise.muscleGroup}
              onChange={e => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
              className="aw-input text-sm appearance-none"
            >
              <option value="">שריר (אופציונלי)</option>
              {muscleGroups
                .filter(g => g !== 'all')
                .map(g => (
                  <option key={g} value={g} className="text-black">
                    {g}
                  </option>
                ))}
            </select>
            <select
              value={newExercise.category}
              onChange={e => setNewExercise({ ...newExercise, category: e.target.value as any })}
              className="aw-input text-sm appearance-none"
            >
              <option value="">קטגוריה (אופציונלי)</option>
              {categories
                .filter(c => c !== 'all')
                .map(c => (
                  <option key={c} value={c} className="text-black capitalize">
                    {c}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newExercise.tempo}
              onChange={e => setNewExercise({ ...newExercise, tempo: e.target.value })}
              placeholder="Tempo (e.g. 3-0-1-0)"
              className="aw-input text-sm"
            />
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 border border-white/10">
              <span className="text-xs text-white/40">מנוחה:</span>
              <input
                type="number"
                value={newExercise.defaultRestTime}
                onChange={e =>
                  setNewExercise({ ...newExercise, defaultRestTime: parseInt(e.target.value) || 0 })
                }
                className="bg-transparent text-white text-sm w-full outline-none text-center"
              />
              <span className="text-xs text-white/40">s</span>
            </div>
          </div>

          <textarea
            value={newExercise.tutorialText}
            onChange={e => setNewExercise({ ...newExercise, tutorialText: e.target.value })}
            placeholder="הוראות / דגשים לביצוע..."
            className="aw-input text-sm h-20 resize-none"
          />

          <button type="submit" className="aw-btn-primary w-full text-sm py-2">
            שמור
          </button>
        </form>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">לא נמצאו תרגילים</div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                className="w-full text-right p-3 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 rounded-xl transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">{exercise.name}</span>
                    {exercise.muscleGroup && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded-full text-white/50 uppercase tracking-wider">
                        {exercise.muscleGroup}
                      </span>
                    )}
                    {exercise.category && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-[var(--aw-accent)]/10 text-[var(--aw-accent)] rounded-full uppercase tracking-wider">
                        {exercise.category}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/30 flex gap-2 items-center">
                    <span>⏱ {exercise.defaultRestTime || 90}s</span>
                    <span>📊 {exercise.defaultSets || 4} sets</span>
                    {exercise.tempo && <span>⚡ {exercise.tempo}</span>}
                    {exercise.tutorialText && <span>📝</span>}
                  </div>
                </div>
                <button
                  onClick={e => handleDelete(exercise, e)}
                  className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {exerciseToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-[12px] z-[12000] flex items-center justify-center">
          <div className="w-full max-w-sm mx-4 bg-[var(--cosmos-bg-primary)] border border-[var(--cosmos-glass-border)] rounded-3xl p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
            <h3 className="text-lg font-bold mb-2 text-white">למחוק תרגיל?</h3>
            <p className="text-sm text-white/90 mb-1">{exerciseToDelete.name}</p>
            <p className="text-xs text-white/50 mb-6">
              המחיקה תסיר את התרגיל מהספרייה, אבל לא תמחק אימונים שכבר שמורים.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 h-11 rounded-2xl bg-transparent border border-[var(--cosmos-glass-border)] text-white/80 font-medium hover:text-white hover:border-white transition-all active:scale-95"
              >
                ביטול
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-2xl bg-red-500 text-white font-bold shadow-[0_0_20px_rgba(248,113,113,0.35)] hover:brightness-110 transition-all active:scale-95"
              >
                מחיקה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibraryTab;
