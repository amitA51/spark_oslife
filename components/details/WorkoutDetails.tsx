import React, { useState } from 'react';
import { ViewProps, EditProps, smallInputStyles } from './common';
import { TrashIcon, AddIcon, PlayIcon } from '../icons';
import { Exercise, WorkoutSet } from '../../types';
import ActiveWorkout from '../workout/ActiveWorkout';
import WorkoutTemplates from '../workout/WorkoutTemplates';
import * as dataService from '../../services/dataService';

export const WorkoutView: React.FC<ViewProps> = ({ item, onUpdate }) => {
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleUpdate = (updates: Partial<typeof item>) => {
    onUpdate(item.id, updates);
  };

  const handleStartWorkout = () => {
    handleUpdate({
      workoutStartTime: new Date().toISOString(),
      isActiveWorkout: true,
    });
    setShowActiveWorkout(true);
  };

  const handleLoadTemplate = async (templateId: string) => {
    const workout = await dataService.loadWorkoutFromTemplate(templateId);
    handleUpdate(workout);
    setShowActiveWorkout(true);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}ש ${m}ד`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // אם האימון פעיל, הצג את מסך האימון הפעיל
  if (showActiveWorkout && item.isActiveWorkout) {
    return (
      <ActiveWorkout item={item} onUpdate={onUpdate} onExit={() => setShowActiveWorkout(false)} />
    );
  }

  const hasExercises = item.exercises && item.exercises.length > 0;
  const totalSets = item.exercises?.reduce((sum, ex) => sum + ex.sets.length, 0) || 0;

  return (
    <div className="space-y-4">
      {/* סטטיסטיקות אימון */}
      {item.workoutDuration ? (
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-4">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">משך</div>
              <div className="text-2xl font-bold text-green-400">
                {formatDuration(item.workoutDuration)}
              </div>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">תרגילים</div>
              <div className="text-2xl font-bold text-[var(--accent-primary)]">
                {item.exercises?.length || 0}
              </div>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">סטים</div>
              <div className="text-2xl font-bold text-[var(--accent-primary)]">{totalSets}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* כפתורי פעולה ראשיים */}
      <div className="flex gap-3">
        {hasExercises ? (
          <button
            onClick={handleStartWorkout}
            className="flex-1 relative group overflow-hidden bg-[var(--accent-gradient)] text-black hover:brightness-110 rounded-2xl py-4 font-bold text-lg shadow-lg shadow-[var(--accent-primary)]/30 hover:shadow-[var(--accent-primary)]/50 transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <div className="relative flex items-center justify-center gap-2">
              <PlayIcon className="w-6 h-6" />
              <span>התחל אימון</span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShowTemplates(true)}
            className="flex-1 relative group overflow-hidden bg-[var(--accent-gradient)] text-black hover:brightness-110 rounded-2xl py-4 font-bold text-lg shadow-lg shadow-[var(--accent-primary)]/30 hover:shadow-[var(--accent-primary)]/50 transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span>📋</span>
              <span>התחל מתבנית</span>
            </div>
          </button>
        )}

        {hasExercises && (
          <button
            onClick={() => setShowTemplates(true)}
            className="px-6 py-4 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-2xl font-semibold transition-all active:scale-95"
          >
            📋 תבניות
          </button>
        )}
      </div>

      {/* תרגילים */}
      {hasExercises ? (
        <div className="space-y-3">
          {item.exercises?.map((ex, exIndex) => (
            <div
              key={ex.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 hover:border-[var(--accent-primary)]/30 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{ex.name || `תרגיל ${exIndex + 1}`}</h4>
                  <div className="flex gap-2 items-center flex-wrap">
                    {ex.muscleGroup && (
                      <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full font-medium">
                        {ex.muscleGroup}
                      </span>
                    )}
                    {ex.targetRestTime && (
                      <span className="text-xs px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-full font-medium">
                        ⏱️ {ex.targetRestTime}s מנוחה
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {ex.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`p-3 rounded-xl transition-all ${
                      set.completedAt
                        ? 'bg-green-500/10 border-2 border-green-500/50'
                        : 'bg-[var(--surface-secondary)] border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-sm">
                          {setIndex + 1}
                        </div>
                        <div className="flex gap-3 items-center flex-1">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{set.weight}</div>
                            <div className="text-xs text-[var(--text-secondary)]">ק"ג</div>
                          </div>
                          <div className="text-[var(--text-secondary)]">×</div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{set.reps}</div>
                            <div className="text-xs text-[var(--text-secondary)]">חזרות</div>
                          </div>
                          {set.rpe && (
                            <>
                              <div className="h-6 w-px bg-[var(--border-color)]"></div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-yellow-400">{set.rpe}</div>
                                <div className="text-xs text-[var(--text-secondary)]">RPE</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {set.completedAt && <div className="text-green-500 font-bold text-sm">✓</div>}
                    </div>
                    {set.notes && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-sm text-[var(--text-secondary)] italic">
                        💭 {set.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="text-6xl mb-4">🏋️</div>
          <h3 className="text-xl font-bold mb-2">אין תרגילים עדיין</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            התחל מתבנית או ערוך את האימון להוספת תרגילים
          </p>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <WorkoutTemplates
          onStartWorkout={template => handleLoadTemplate(template.id)}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export const WorkoutEdit: React.FC<EditProps> = ({ editState, dispatch }) => {
  const handleUpdateExercise = (exIndex: number, field: keyof Exercise, value: any) => {
    const newExercises = [...(editState.exercises || [])];
    (newExercises[exIndex] as any)[field] = value;
    dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
  };

  const handleAddExercise = () => {
    const newExercises = [
      ...(editState.exercises || []),
      {
        id: `ex-${Date.now()}`,
        name: '',
        muscleGroup: '',
        targetRestTime: 90,
        sets: [{ reps: 0, weight: 0 }],
      },
    ];
    dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
  };

  const handleRemoveExercise = (exIndex: number) => {
    const newExercises = (editState.exercises || []).filter((_, i) => i !== exIndex);
    dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: any
  ) => {
    const newExercises = [...(editState.exercises || [])];
    if (newExercises[exIndex]?.sets[setIndex]) {
      (newExercises[exIndex].sets[setIndex] as any)[field] = value;
    }
    dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
  };

  const handleAddSet = (exIndex: number) => {
    const newExercises = [...(editState.exercises || [])];
    if (newExercises[exIndex]) {
      const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length - 1];
      newExercises[exIndex].sets.push({
        reps: lastSet?.reps || 0,
        weight: lastSet?.weight || 0,
      });
    }
    dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const newExercises = [...(editState.exercises || [])];
    if (newExercises[exIndex]) {
      newExercises[exIndex].sets = newExercises[exIndex].sets.filter((_, i) => i !== setIndex);
    }
    dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">תרגילים</label>

      {(editState.exercises || []).map((ex, exIndex) => (
        <div
          key={ex.id || exIndex}
          className="p-4 bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border-color)] space-y-3"
        >
          {/* שם תרגיל וקבוצת שרירים */}
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={ex.name}
                onChange={e => handleUpdateExercise(exIndex, 'name', e.target.value)}
                placeholder="שם התרגיל (לדוגמה: Bench Press)"
                className={smallInputStyles + ' font-semibold text-base'}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ex.muscleGroup || ''}
                  onChange={e => handleUpdateExercise(exIndex, 'muscleGroup', e.target.value)}
                  placeholder="קבוצת שרירים (לדוגמה: Chest)"
                  className={smallInputStyles + ' flex-1'}
                />
                <input
                  type="number"
                  value={ex.targetRestTime || 90}
                  onChange={e =>
                    handleUpdateExercise(exIndex, 'targetRestTime', e.target.valueAsNumber || 90)
                  }
                  placeholder="מנוחה"
                  className={smallInputStyles + ' w-24'}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveExercise(exIndex)}
              className="text-[var(--text-secondary)] hover:text-red-500 p-2 transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          {/* סטים */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">סטים</div>
            {ex.sets.map((set, setIndex) => (
              <div key={setIndex} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-sm">
                  {setIndex + 1}
                </div>
                <input
                  type="number"
                  value={set.weight}
                  onChange={e =>
                    handleUpdateSet(exIndex, setIndex, 'weight', e.target.valueAsNumber || 0)
                  }
                  placeholder="משקל (ק״ג)"
                  className={smallInputStyles + ' flex-1'}
                />
                <span className="text-[var(--text-secondary)]">×</span>
                <input
                  type="number"
                  value={set.reps}
                  onChange={e =>
                    handleUpdateSet(exIndex, setIndex, 'reps', e.target.valueAsNumber || 0)
                  }
                  placeholder="חזרות"
                  className={smallInputStyles + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSet(exIndex, setIndex)}
                  className="text-[var(--text-secondary)] hover:text-red-500 p-2 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddSet(exIndex)}
              className="w-full py-2 text-sm text-[var(--accent-primary)] font-semibold hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <AddIcon className="w-4 h-4" /> הוסף סט
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddExercise}
        className="w-full py-3 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border-2 border-dashed border-[var(--accent-primary)]/30 rounded-2xl text-[var(--accent-primary)] font-bold transition-all flex items-center justify-center gap-2"
      >
        <AddIcon className="w-5 h-5" /> הוסף תרגיל
      </button>
    </div>
  );
};
