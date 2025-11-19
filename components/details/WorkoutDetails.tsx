import React, { useState } from 'react';
import { ViewProps, EditProps, smallInputStyles } from './common';
import { TrashIcon, AddIcon } from '../icons';
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
            isActiveWorkout: true
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
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (showActiveWorkout && item.isActiveWorkout) {
        return (
            <ActiveWorkout
                item={item}
                onUpdate={onUpdate}
                onExit={() => setShowActiveWorkout(false)}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Workout Stats */}
            {item.workoutDuration && (
                <div className="bg-[var(--surface-secondary)] rounded-lg p-3 flex justify-around text-center">
                    <div>
                        <div className="text-xs text-[var(--text-secondary)]">משך אימון</div>
                        <div className="text-lg font-bold">{formatDuration(item.workoutDuration)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-secondary)]">תרגילים</div>
                        <div className="text-lg font-bold">{item.exercises?.length || 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-secondary)]">סטים</div>
                        <div className="text-lg font-bold">
                            {item.exercises?.reduce((sum, ex) => sum + ex.sets.length, 0) || 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleStartWorkout}
                    className="flex-1 py-3 bg-[var(--accent-gradient)] text-black rounded-lg font-bold shadow-[0_2px_10px_var(--dynamic-accent-glow)]"
                >
                    🏋️ התחל אימון
                </button>
                <button
                    onClick={() => setShowTemplates(true)}
                    className="px-4 py-3 bg-[var(--surface-secondary)] rounded-lg font-semibold"
                >
                    📋 תבניות
                </button>
            </div>

            {/* Exercises */}
            {item.exercises?.map((ex) => (
                <div key={ex.id} className="bg-[var(--bg-card)] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className="font-semibold text-lg">{ex.name}</h4>
                            {ex.muscleGroup && (
                                <span className="text-xs px-2 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded">
                                    {ex.muscleGroup}
                                </span>
                            )}
                        </div>
                        {ex.targetRestTime && (
                            <div className="text-xs text-[var(--text-secondary)]">
                                מנוחה: {ex.targetRestTime}s
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {ex.sets.map((set, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border-l-2 ${set.completedAt
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-[var(--border-primary)] bg-[var(--surface-secondary)]'
                                    }`}
                            >
                                <div className="flex justify-around text-center">
                                    <div>
                                        <span className="text-xs text-[var(--text-secondary)]">סט</span>
                                        <p className="font-semibold">{index + 1}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-[var(--text-secondary)]">חזרות</span>
                                        <p className="font-semibold">{set.reps}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-[var(--text-secondary)]">משקל (ק"ג)</span>
                                        <p className="font-semibold">{set.weight}</p>
                                    </div>
                                    {set.rpe && (
                                        <div>
                                            <span className="text-xs text-[var(--text-secondary)]">RPE</span>
                                            <p className="font-semibold">{set.rpe}</p>
                                        </div>
                                    )}
                                </div>
                                {set.notes && (
                                    <p className="text-xs text-center mt-2 pt-2 border-t border-[var(--border-primary)] text-[var(--text-secondary)] italic">
                                        "{set.notes}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Templates Modal */}
            {showTemplates && (
                <WorkoutTemplates
                    onLoadTemplate={handleLoadTemplate}
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
        const newExercises = [...(editState.exercises || []), {
            id: `ex-${Date.now()}`,
            name: '',
            targetRestTime: 90,
            sets: [{ reps: 0, weight: 0 }]
        }];
        dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
    };
    const handleRemoveExercise = (exIndex: number) => {
        const newExercises = (editState.exercises || []).filter((_, i) => i !== exIndex);
        dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
    };
    const handleUpdateSet = (exIndex: number, setIndex: number, field: keyof WorkoutSet, value: any) => {
        const newExercises = [...(editState.exercises || [])];
        (newExercises[exIndex].sets[setIndex] as any)[field] = value;
        dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
    };
    const handleAddSet = (exIndex: number) => {
        const newExercises = [...(editState.exercises || [])];
        const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length - 1];
        newExercises[exIndex].sets.push({
            reps: lastSet?.reps || 0,
            weight: lastSet?.weight || 0
        });
        dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
    };
    const handleRemoveSet = (exIndex: number, setIndex: number) => {
        const newExercises = [...(editState.exercises || [])];
        newExercises[exIndex].sets = newExercises[exIndex].sets.filter((_, i) => i !== setIndex);
        dispatch({ type: 'SET_FIELD', payload: { field: 'exercises', value: newExercises } });
    };

    return (
        <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">תרגילים</label>
            <div className="space-y-4">
                {(editState.exercises || []).map((ex, exIndex) => (
                    <div key={ex.id || exIndex} className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={ex.name}
                                onChange={(e) => handleUpdateExercise(exIndex, 'name', e.target.value)}
                                placeholder="שם התרגיל"
                                className={smallInputStyles + " flex-grow"}
                            />
                            <input
                                type="number"
                                value={ex.targetRestTime || 90}
                                onChange={(e) => handleUpdateExercise(exIndex, 'targetRestTime', e.target.valueAsNumber || 90)}
                                placeholder="מנוחה (שניות)"
                                className={smallInputStyles + " w-24"}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveExercise(exIndex)}
                                className="text-[var(--text-secondary)] hover:text-[var(--danger)]"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {ex.sets.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-4 gap-2 items-center text-sm">
                                    <span className="text-center text-[var(--text-secondary)]">סט {setIndex + 1}</span>
                                    <input
                                        type="number"
                                        value={set.reps}
                                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.valueAsNumber || 0)}
                                        placeholder="חזרות"
                                        className={smallInputStyles + " text-center"}
                                    />
                                    <input
                                        type="number"
                                        value={set.weight}
                                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.valueAsNumber || 0)}
                                        placeholder="משקל"
                                        className={smallInputStyles + " text-center"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSet(exIndex, setIndex)}
                                        className="text-[var(--text-secondary)] hover:text-[var(--danger)] justify-self-center"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAddSet(exIndex)}
                            className="w-full text-sm text-[var(--accent-highlight)] font-semibold flex items-center justify-center gap-1"
                        >
                            <AddIcon className="w-4 h-4" /> הוסף סט
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={handleAddExercise}
                className="mt-4 w-full text-sm text-[var(--accent-highlight)] font-semibold flex items-center justify-center gap-1"
            >
                <AddIcon className="w-4 h-4" /> הוסף תרגיל
            </button>
        </div>
    );
};
