import React, { useState, useEffect } from 'react';
import { PersonalItem, Exercise, WorkoutSet } from '../../types';
import RestTimer from './RestTimer';
import { AddIcon, TrashIcon } from '../icons';

interface ActiveWorkoutProps {
    item: PersonalItem;
    onUpdate: (updates: Partial<PersonalItem>) => void;
    onExit: () => void;
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ item, onUpdate, onExit }) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [restTimerSeconds, setRestTimerSeconds] = useState(90);

    const exercises = item.exercises || [];
    const currentExercise = exercises[currentExerciseIndex];

    // Workout timer
    useEffect(() => {
        const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    };

    const completeSet = (setIndex: number) => {
        const newExercises = [...exercises];
        newExercises[currentExerciseIndex].sets[setIndex] = {
            ...newExercises[currentExerciseIndex].sets[setIndex],
            completedAt: new Date().toISOString()
        };
        onUpdate({ exercises: newExercises });

        // Start rest timer
        setRestTimerSeconds(currentExercise.targetRestTime || 90);
        setShowRestTimer(true);
    };

    const updateSet = (setIndex: number, field: keyof WorkoutSet, value: any) => {
        const newExercises = [...exercises];
        (newExercises[currentExerciseIndex].sets[setIndex] as any)[field] = value;
        onUpdate({ exercises: newExercises });
    };

    const addSet = () => {
        const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
        const newExercises = [...exercises];
        newExercises[currentExerciseIndex].sets.push({
            reps: lastSet?.reps || 0,
            weight: lastSet?.weight || 0
        });
        onUpdate({ exercises: newExercises });
    };

    const finishWorkout = () => {
        onUpdate({
            workoutEndTime: new Date().toISOString(),
            workoutDuration: elapsedTime,
            isActiveWorkout: false
        });
        onExit();
    };

    if (!currentExercise) return null;

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] z-40 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] p-4 z-10">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">{item.title}</h2>
                    <button onClick={finishWorkout} className="text-[var(--accent-primary)] font-semibold">
                        סיים אימון
                    </button>
                </div>
                <div className="text-2xl font-mono text-center text-[var(--accent-primary)]">
                    {formatTime(elapsedTime)}
                </div>
            </div>

            {/* Exercise Navigation */}
            <div className="flex overflow-x-auto gap-2 p-4 bg-[var(--surface-secondary)]">
                {exercises.map((ex, idx) => (
                    <button
                        key={ex.id}
                        onClick={() => setCurrentExerciseIndex(idx)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${idx === currentExerciseIndex
                                ? 'bg-[var(--accent-primary)] text-black'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                            }`}
                    >
                        {ex.name}
                    </button>
                ))}
            </div>

            {/* Current Exercise */}
            <div className="p-4 space-y-4">
                <div className="bg-[var(--bg-card)] rounded-xl p-4">
                    <h3 className="text-2xl font-bold mb-4">{currentExercise.name}</h3>

                    {/* Sets */}
                    <div className="space-y-3">
                        {currentExercise.sets.map((set, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border-2 ${set.completedAt
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-[var(--border-color)] bg-[var(--surface-secondary)]'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-lg font-bold w-12">סט {idx + 1}</span>
                                    <input
                                        type="number"
                                        value={set.weight}
                                        onChange={(e) => updateSet(idx, 'weight', e.target.valueAsNumber || 0)}
                                        className="flex-1 px-3 py-2 bg-[var(--bg-primary)] rounded-lg text-center text-lg font-semibold"
                                        placeholder="משקל"
                                    />
                                    <span className="text-[var(--text-secondary)]">×</span>
                                    <input
                                        type="number"
                                        value={set.reps}
                                        onChange={(e) => updateSet(idx, 'reps', e.target.valueAsNumber || 0)}
                                        className="flex-1 px-3 py-2 bg-[var(--bg-primary)] rounded-lg text-center text-lg font-semibold"
                                        placeholder="חזרות"
                                    />
                                </div>

                                {/* RPE */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm text-[var(--text-secondary)]">RPE:</span>
                                    {[...Array(10)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => updateSet(idx, 'rpe', i + 1)}
                                            className={`w-8 h-8 rounded-full text-sm font-semibold ${set.rpe === i + 1
                                                    ? 'bg-[var(--accent-primary)] text-black'
                                                    : 'bg-[var(--surface-secondary)] text-[var(--text-tertiary)]'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                {!set.completedAt ? (
                                    <button
                                        onClick={() => completeSet(idx)}
                                        className="w-full py-3 bg-[var(--accent-gradient)] text-black rounded-lg font-bold text-lg"
                                    >
                                        ✓ סיימתי סט
                                    </button>
                                ) : (
                                    <div className="text-center text-green-500 font-semibold">✓ הושלם</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addSet}
                        className="w-full mt-4 py-3 border-2 border-dashed border-[var(--border-color)] rounded-lg text-[var(--accent-primary)] font-semibold flex items-center justify-center gap-2"
                    >
                        <AddIcon className="w-5 h-5" />
                        הוסף סט
                    </button>
                </div>
            </div>

            {/* Rest Timer */}
            {showRestTimer && (
                <RestTimer
                    targetSeconds={restTimerSeconds}
                    onComplete={() => setShowRestTimer(false)}
                    onSkip={() => setShowRestTimer(false)}
                />
            )}
        </div>
    );
};

export default ActiveWorkout;
