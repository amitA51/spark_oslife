import React, { useState, useEffect } from 'react';
import { PersonalItem, WorkoutSet, Exercise } from '../../types';
import RestTimer from './RestTimer';
import ExerciseSelector from './ExerciseSelector';
import QuickExerciseForm from './QuickExerciseForm';
import { AddIcon, CheckCircleIcon } from '../icons';

interface ActiveWorkoutProps {
    item: PersonalItem;
    onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
    onExit: () => void;
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ item, onUpdate, onExit }) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [restTimerSeconds, setRestTimerSeconds] = useState(90);
    const [editingSet, setEditingSet] = useState<{ exIndex: number; setIndex: number } | null>(null);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [showQuickForm, setShowQuickForm] = useState(false);

    const exercises = item.exercises || [];
    const currentExercise = exercises[currentExerciseIndex];

    // Workout timer
    useEffect(() => {
        const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const updateSet = (setIndex: number, field: keyof WorkoutSet, value: any) => {
        const newExercises = [...exercises];
        (newExercises[currentExerciseIndex].sets[setIndex] as any)[field] = value;
        onUpdate(item.id, { exercises: newExercises });
    };

    const completeSet = (setIndex: number) => {
        const newExercises = [...exercises];
        const currentSet = newExercises[currentExerciseIndex].sets[setIndex];

        if (!currentSet.weight || !currentSet.reps) {
            alert('יש למלא משקל וחזרות לפני סיום הסט');
            return;
        }

        newExercises[currentExerciseIndex].sets[setIndex] = {
            ...currentSet,
            completedAt: new Date().toISOString()
        };
        onUpdate(item.id, { exercises: newExercises });

        setRestTimerSeconds(currentExercise.targetRestTime || 90);
        setShowRestTimer(true);
        setEditingSet(null);
    };

    const addSet = () => {
        const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
        const newExercises = [...exercises];
        newExercises[currentExerciseIndex].sets.push({
            reps: lastSet?.reps || 0,
            weight: lastSet?.weight || 0
        });
        onUpdate(item.id, { exercises: newExercises });
        setEditingSet({ exIndex: currentExerciseIndex, setIndex: newExercises[currentExerciseIndex].sets.length - 1 });
    };

    const finishWorkout = () => {
        if (confirm('האם אתה בטוח שברצונך לסיים את האימון?')) {
            onUpdate(item.id, {
                workoutEndTime: new Date().toISOString(),
                workoutDuration: elapsedTime,
                isActiveWorkout: false
            });
            onExit();
        }
    };

    const copyPreviousSet = (setIndex: number) => {
        if (setIndex === 0) return;
        const previousSet = currentExercise.sets[setIndex - 1];
        updateSet(setIndex, 'weight', previousSet.weight);
        updateSet(setIndex, 'reps', previousSet.reps);
    };

    const addExercise = (exercise: Exercise) => {
        const newExercises = [...exercises, exercise];
        onUpdate(item.id, { exercises: newExercises });
        setCurrentExerciseIndex(newExercises.length - 1);
        setShowExerciseSelector(false);
        setShowQuickForm(false);
    };

    if (!currentExercise) return null;

    const completedSets = currentExercise.sets.filter(s => s.completedAt).length;
    const totalSets = currentExercise.sets.length;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] z-40 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 backdrop-blur-xl border-b border-white/10 p-4 z-10 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-xl font-bold mb-1">{item.title}</h2>
                        <div className="text-xs text-[var(--text-secondary)]">
                            תרגיל {currentExerciseIndex + 1} מתוך {exercises.length}
                        </div>
                    </div>
                    <button
                        onClick={finishWorkout}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-xl font-semibold transition-all active:scale-95"
                    >
                        סיים אימון
                    </button>
                </div>

                <div className="text-center">
                    <div className="text-5xl font-mono font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary)] bg-clip-text text-transparent animate-pulse">
                        {formatTime(elapsedTime)}
                    </div>
                </div>
            </div>

            {/* Exercise Navigation */}
            <div className="flex overflow-x-auto gap-2 p-4 bg-[var(--surface-secondary)]/50 scrollbar-hide">
                {exercises.map((ex, idx) => {
                    const exCompletedSets = ex.sets.filter(s => s.completedAt).length;
                    const exTotalSets = ex.sets.length;
                    const isComplete = exCompletedSets === exTotalSets && exTotalSets > 0;

                    return (
                        <button
                            key={ex.id}
                            onClick={() => setCurrentExerciseIndex(idx)}
                            className={`relative px-4 py-3 rounded-xl whitespace-nowrap font-semibold transition-all min-w-[120px] ${idx === currentExerciseIndex
                                ? 'bg-[var(--accent-gradient)] text-black scale-105 shadow-lg shadow-[var(--accent-primary)]/50'
                                : isComplete
                                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
                                }`}
                        >
                            <div className="text-sm truncate">{ex.name}</div>
                            <div className="text-xs mt-1 opacity-75">{exCompletedSets}/{exTotalSets} סטים</div>
                            {isComplete && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircleIcon className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* Add Exercise Button */}
                <button
                    onClick={() => setShowExerciseSelector(true)}
                    className="px-4 py-3 rounded-xl border-2 border-dashed border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold transition-all min-w-[120px]"
                >
                    <div className="text-sm">+ תרגיל חדש</div>
                </button>
            </div>

            {/* Exercise Card */}
            <div className="p-4 space-y-4">
                <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--surface-secondary)] rounded-2xl p-6 shadow-2xl border border-[var(--border-color)]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-3xl font-bold mb-2">{currentExercise.name}</h3>
                            <div className="flex gap-2">
                                {currentExercise.muscleGroup && (
                                    <span className="text-xs px-3 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full font-medium">
                                        {currentExercise.muscleGroup}
                                    </span>
                                )}
                                {currentExercise.targetRestTime && (
                                    <span className="text-xs px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full font-medium">
                                        ⏱️ {currentExercise.targetRestTime}s
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-[var(--accent-primary)]">
                                {completedSets}/{totalSets}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">סטים</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${(completedSets / totalSets) * 100}%` }}
                        />
                    </div>

                    {/* Sets */}
                    <div className="space-y-3">
                        {currentExercise.sets.map((set, idx) => {
                            const isEditing = editingSet?.exIndex === currentExerciseIndex && editingSet?.setIndex === idx;
                            const isCompleted = !!set.completedAt;

                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl transition-all ${isCompleted
                                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50'
                                        : isEditing
                                            ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/50 ring-2 ring-purple-500/20'
                                            : 'bg-[var(--surface-secondary)] border-2 border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isCompleted ? 'bg-green-500 text-white' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                                }`}>
                                                {isCompleted ? '✓' : idx + 1}
                                            </div>
                                            <div className="text-sm font-medium text-[var(--text-secondary)]">
                                                סט {idx + 1}
                                            </div>
                                        </div>

                                        {!isCompleted && idx > 0 && (
                                            <button
                                                onClick={() => copyPreviousSet(idx)}
                                                className="text-xs px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/20 transition-all"
                                            >
                                                העתק סט קודם
                                            </button>
                                        )}
                                    </div>

                                    {isCompleted ? (
                                        <div className="flex items-center gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold">{set.weight}</span>
                                                    <span className="text-sm text-[var(--text-secondary)]">ק"ג</span>
                                                    <span className="text-2xl text-[var(--text-secondary)]">×</span>
                                                    <span className="text-4xl font-bold">{set.reps}</span>
                                                </div>
                                            </div>
                                            {set.rpe && (
                                                <div className="text-center px-4 py-2 bg-yellow-500/20 rounded-lg">
                                                    <div className="text-2xl font-bold text-yellow-400">{set.rpe}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">RPE</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">משקל (ק"ג)</label>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={set.weight || ''}
                                                        onChange={(e) => updateSet(idx, 'weight', parseFloat(e.target.value) || 0)}
                                                        onFocus={() => setEditingSet({ exIndex: currentExerciseIndex, setIndex: idx })}
                                                        className="w-full px-4 py-3 bg-[var(--bg-primary)] rounded-xl text-center text-3xl font-bold border-2 border-[var(--border-color)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="text-3xl text-[var(--text-secondary)]">×</div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">חזרות</label>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={set.reps || ''}
                                                        onChange={(e) => updateSet(idx, 'reps', parseInt(e.target.value) || 0)}
                                                        onFocus={() => setEditingSet({ exIndex: currentExerciseIndex, setIndex: idx })}
                                                        className="w-full px-4 py-3 bg-[var(--bg-primary)] rounded-xl text-center text-3xl font-bold border-2 border-[var(--border-color)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            {/* RPE */}
                                            <div className="mb-4">
                                                <label className="text-xs text-[var(--text-secondary)] mb-2 block">RPE (דירוג מאמץ)</label>
                                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                                    {[...Array(10)].map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => updateSet(idx, 'rpe', i + 1)}
                                                            className={`flex-shrink-0 w-12 h-12 rounded-xl text-sm font-bold transition-all ${set.rpe === i + 1
                                                                ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-black scale-110 shadow-lg shadow-yellow-500/50'
                                                                : 'bg-[var(--surface-secondary)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => completeSet(idx)}
                                                disabled={!set.weight || !set.reps}
                                                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all active:scale-95 disabled:cursor-not-allowed"
                                            >
                                                {set.weight && set.reps ? '✓ סיימתי סט' : 'מלא משקל וחזרות'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={addSet}
                        className="w-full mt-4 py-4 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)] font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <AddIcon className="w-5 h-5" />
                        הוסף סט נוסף
                    </button>
                </div>
            </div>

            {showRestTimer && (
                <RestTimer
                    targetSeconds={restTimerSeconds}
                    onComplete={() => setShowRestTimer(false)}
                    onSkip={() => setShowRestTimer(false)}
                />
            )}

            {showExerciseSelector && (
                <ExerciseSelector
                    onSelect={addExercise}
                    onClose={() => setShowExerciseSelector(false)}
                    onCreateNew={() => {
                        setShowExerciseSelector(false);
                        setShowQuickForm(true);
                    }}
                />
            )}

            {showQuickForm && (
                <QuickExerciseForm
                    onAdd={addExercise}
                    onClose={() => setShowQuickForm(false)}
                />
            )}
        </div>
    );
};

export default ActiveWorkout;
