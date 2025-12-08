import React, { useState, useEffect } from 'react';
import { PersonalExercise } from '../types';
import * as dataService from '../services/dataService';
import { AddIcon, TrashIcon, EditIcon, SparklesIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

const ExerciseLibraryManager: React.FC = () => {
  const [exercises, setExercises] = useState<PersonalExercise[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [_isGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    defaultRestTime: 90,
    defaultSets: 4,
    tempo: '',
    notes: '',
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const data = await dataService.getPersonalExercises();
    setExercises(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await dataService.updatePersonalExercise(editingId, formData);
    } else {
      await dataService.createPersonalExercise(formData);
    }

    resetForm();
    loadExercises();
  };

  const handleEdit = (exercise: PersonalExercise) => {
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || '',
      defaultRestTime: exercise.defaultRestTime || 90,
      defaultSets: exercise.defaultSets || 4,
      tempo: exercise.tempo || '',
      notes: exercise.notes || '',
    });
    setEditingId(exercise.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תרגיל זה?')) {
      await dataService.deletePersonalExercise(id);
      loadExercises();
    }
  };

  const handleAiSuggest = async () => {
    if (!formData.muscleGroup) {
      // No muscle group selected - silently return (user needs to select first)
      return;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      muscleGroup: '',
      defaultRestTime: 90,
      defaultSets: 4,
      tempo: '',
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

  // Group exercises by muscle group
  const groupedExercises = exercises.reduce(
    (acc, exercise) => {
      const group = exercise.muscleGroup || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(exercise);
      return acc;
    },
    {} as Record<string, PersonalExercise[]>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-md z-10 py-4 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            ספריית תרגילים
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">{exercises.length} תרגילים זמינים</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[var(--accent-primary)] text-black rounded-xl font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
        >
          <AddIcon className="w-5 h-5" />
          <span className="hidden sm:inline">תרגיל חדש</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--surface-secondary)] rounded-2xl p-6 border border-[var(--border-color)] mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">{editingId ? 'עריכת תרגיל' : 'תרגיל חדש'}</h3>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={_isGenerating}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-lg border border-purple-500/30 flex items-center gap-1.5 hover:bg-purple-500/30 transition-colors"
                >
                  <SparklesIcon className="w-3 h-3" />
                  {_isGenerating ? 'חושב...' : 'הצע עם AI'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                      שם התרגיל *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="לדוגמה: Bench Press"
                      required
                      className="w-full px-4 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                      קבוצת שרירים
                    </label>
                    <select
                      value={formData.muscleGroup}
                      onChange={e => setFormData({ ...formData, muscleGroup: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all outline-none appearance-none"
                    >
                      <option value="">בחר קבוצה...</option>
                      {muscleGroups.map(group => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                      מנוחה (שנ&apos;)
                    </label>
                    <input
                      type="number"
                      value={formData.defaultRestTime}
                      onChange={e =>
                        setFormData({ ...formData, defaultRestTime: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                      סטים
                    </label>
                    <input
                      type="number"
                      value={formData.defaultSets}
                      onChange={e =>
                        setFormData({ ...formData, defaultSets: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                      טמפו (Tempo)
                    </label>
                    <input
                      type="text"
                      value={formData.tempo}
                      onChange={e => setFormData({ ...formData, tempo: e.target.value })}
                      placeholder="3010"
                      className="w-full px-4 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    הערות
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="טיפים לביצוע, דגשים..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[var(--accent-primary)] text-black rounded-xl font-bold hover:brightness-110 transition-all active:scale-95"
                  >
                    {editingId ? 'שמור שינויים' : 'הוסף לתרגילים'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl font-semibold hover:bg-[var(--surface-hover)] transition-all active:scale-95"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise List - Grouped */}
      <div className="space-y-8">
        {exercises.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="text-6xl mb-4 grayscale">🏋️</div>
            <h3 className="text-xl font-bold mb-2">הספרייה ריקה</h3>
            <p className="text-[var(--text-secondary)]">
              התחל להוסיף תרגילים או השתמש ב-AI כדי לבנות את הספרייה שלך
            </p>
          </div>
        ) : (
          Object.entries(groupedExercises).map(([group, groupExercises]) => (
            <div key={group}>
              <h3 className="text-sm font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
                {group}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className="group bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] rounded-xl p-4 border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">{exercise.name}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(exercise)}
                          className="p-1.5 hover:bg-[var(--bg-card)] rounded-lg text-[var(--accent-primary)] transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exercise.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)] mb-3">
                      <span className="bg-[var(--bg-card)] px-2 py-1 rounded-md border border-[var(--border-color)]">
                        ⏱️ {exercise.defaultRestTime}s
                      </span>
                      <span className="bg-[var(--bg-card)] px-2 py-1 rounded-md border border-[var(--border-color)]">
                        📊 {exercise.defaultSets} sets
                      </span>
                      {exercise.tempo && (
                        <span className="bg-[var(--bg-card)] px-2 py-1 rounded-md border border-[var(--border-color)] text-[var(--accent-secondary)]">
                          🎵 {exercise.tempo}
                        </span>
                      )}
                    </div>

                    {exercise.notes && (
                      <p className="text-xs text-[var(--text-dim)] line-clamp-2 italic border-t border-[var(--border-color)] pt-2 mt-2">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseLibraryManager;
