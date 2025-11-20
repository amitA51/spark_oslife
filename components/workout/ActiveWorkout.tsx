import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PersonalItem, Exercise, WorkoutSet } from '../../types';
import {
    DumbbellIcon, CheckCircleIcon, ChevronLeftIcon,
    SettingsIcon, AddIcon, TargetIcon
} from '../icons';
import './ActiveWorkout.css';
import * as dataService from '../../services/dataService';
import ExerciseSelector from './ExerciseSelector';
import QuickExerciseForm from './QuickExerciseForm';

// Local Icons
const CloseIcon = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
    <svg onClick={onClick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

interface ActiveWorkoutProps {
    item: PersonalItem;
    onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
    onExit: () => void;
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ item, onUpdate, onExit }) => {
    // --- State ---
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [exercises, setExercises] = useState<Exercise[]>(item.exercises || []);
    const [workoutTimer, setWorkoutTimer] = useState(item.workoutDuration || 0);
    const [isPaused, setIsPaused] = useState(false);

    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [numpadConfig, setNumpadConfig] = useState<{ isOpen: boolean, target: 'weight' | 'reps' | null, value: string }>({ isOpen: false, target: null, value: '' });
    const [restTimer, setRestTimer] = useState<{ active: boolean, timeLeft: number, totalTime: number }>({ active: false, timeLeft: 0, totalTime: 0 });

    // Modals
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [showQuickForm, setShowQuickForm] = useState(false);

    const currentExercise = exercises[currentExerciseIndex];
    const currentSetIndex = currentExercise?.sets.findIndex(s => !s.completedAt) ?? -1;
    const activeSetIndex = currentSetIndex === -1 ? (currentExercise?.sets.length || 0) : currentSetIndex; // If all done, show new set or last set? Let's show next potential set.

    // Ensure there's always at least one set to edit
    const currentSet = currentExercise?.sets[activeSetIndex] || { reps: 0, weight: 0, completedAt: undefined };

    // --- Effects ---

    // Timer
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setWorkoutTimer(prev => {
                const newVal = prev + 1;
                if (newVal % 5 === 0) { // Sync every 5 seconds
                    onUpdate(item.id, { workoutDuration: newVal });
                }
                return newVal;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, item.id, onUpdate]);

    // Rest Timer Countdown
    useEffect(() => {
        if (!restTimer.active) return;
        const interval = setInterval(() => {
            setRestTimer(prev => {
                if (prev.timeLeft <= 1) {
                    // Timer finished
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    return { ...prev, active: false, timeLeft: 0 };
                }
                return { ...prev, timeLeft: prev.timeLeft - 1 };
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [restTimer.active]);

    // --- Logic ---

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSetUpdate = (field: 'weight' | 'reps', value: number) => {
        const newExercises = [...exercises];
        const exercise = newExercises[currentExerciseIndex];

        // If we are at the end (all sets done), we are technically editing a "new" set that hasn't been added yet, 
        // or editing the last completed set? 
        // Let's assume we are editing the 'activeSetIndex'. If it doesn't exist, create it.

        if (!exercise.sets[activeSetIndex]) {
            exercise.sets[activeSetIndex] = { reps: 0, weight: 0 };
        }

        exercise.sets[activeSetIndex][field] = value;
        setExercises(newExercises);
        onUpdate(item.id, { exercises: newExercises });
    };

    const completeSet = () => {
        if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback

        const newExercises = [...exercises];
        const exercise = newExercises[currentExerciseIndex];

        if (!exercise.sets[activeSetIndex]) {
            exercise.sets[activeSetIndex] = { reps: 0, weight: 0 };
        }

        // Mark as completed
        exercise.sets[activeSetIndex].completedAt = new Date().toISOString();
        exercise.sets[activeSetIndex].restTime = 0; // Could measure actual rest

        // Start Rest Timer
        const restTime = exercise.targetRestTime || 60;
        setRestTimer({ active: true, timeLeft: restTime, totalTime: restTime });

        // Add next set automatically if needed (copy previous values)
        if (activeSetIndex === exercise.sets.length - 1) {
            exercise.sets.push({
                reps: exercise.sets[activeSetIndex].reps,
                weight: exercise.sets[activeSetIndex].weight
            });
        }

        setExercises(newExercises);
        onUpdate(item.id, { exercises: newExercises });
    };

    const finishWorkout = () => {
        if (confirm("לסיים את האימון?")) {
            onUpdate(item.id, {
                isActiveWorkout: false,
                workoutEndTime: new Date().toISOString(),
                exercises: exercises
            });
            onExit();
        }
    };

    const addExercise = (newExercise: Exercise) => {
        const updatedExercises = [...exercises, newExercise];
        setExercises(updatedExercises);
        onUpdate(item.id, { exercises: updatedExercises });
        setCurrentExerciseIndex(updatedExercises.length - 1); // Jump to new exercise
        setShowExerciseSelector(false);
        setShowQuickForm(false);
    };

    // --- Numpad Logic ---
    const handleNumpadInput = (num: string) => {
        if (num === 'backspace') {
            setNumpadConfig(prev => ({ ...prev, value: prev.value.slice(0, -1) }));
        } else if (num === 'done') {
            if (numpadConfig.target && numpadConfig.value) {
                handleSetUpdate(numpadConfig.target, parseInt(numpadConfig.value));
            }
            setNumpadConfig({ isOpen: false, target: null, value: '' });
        } else {
            setNumpadConfig(prev => ({ ...prev, value: prev.value + num }));
        }
    };

    // --- Render Helpers ---

    const renderNumpad = () => (
        <div className={`aw-drawer-overlay ${numpadConfig.isOpen ? 'open' : ''}`} onClick={() => setNumpadConfig({ ...numpadConfig, isOpen: false })}>
            <div className="aw-drawer" onClick={e => e.stopPropagation()} style={{ height: 'auto', paddingBottom: '40px' }}>
                <div className="aw-numpad-display">{numpadConfig.value || '0'}</div>
                <div className="aw-numpad-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
                        <button key={n} className="aw-numpad-btn" onClick={() => handleNumpadInput(n.toString())}>{n}</button>
                    ))}
                    <button className="aw-numpad-btn" style={{ color: 'var(--aw-danger)' }} onClick={() => handleNumpadInput('backspace')}>⌫</button>
                </div>
                <button className="aw-complete-btn" style={{ marginTop: '20px' }} onClick={() => handleNumpadInput('done')}>אישור</button>
            </div>
        </div>
    );

    const renderRestTimer = () => (
        <div className="aw-container" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="relative flex items-center justify-center">
                {/* Breathing Circle Animation */}
                <div className="absolute w-64 h-64 rounded-full border-4 border-[var(--aw-accent)] opacity-20 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute w-48 h-48 rounded-full border-2 border-[var(--aw-accent)] opacity-50 animate-pulse"></div>

                <div className="text-center z-10">
                    <div className="text-6xl font-bold text-white font-mono mb-2">{formatTime(restTimer.timeLeft)}</div>
                    <div className="text-[var(--aw-accent)] uppercase tracking-widest text-sm">זמן מנוחה</div>
                    <button
                        onClick={() => setRestTimer({ ...restTimer, active: false })}
                        className="mt-8 px-6 py-2 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
                    >
                        דלג מנוחה
                    </button>
                    <div className="mt-4 flex gap-2 justify-center">
                        <button onClick={() => setRestTimer(p => ({ ...p, timeLeft: p.timeLeft + 30 }))} className="px-3 py-1 bg-white/10 rounded-lg text-xs">+30שנ'</button>
                        <button onClick={() => setRestTimer(p => ({ ...p, timeLeft: Math.max(0, p.timeLeft - 10) }))} className="px-3 py-1 bg-white/10 rounded-lg text-xs">-10שנ'</button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!currentExercise) return <div className="aw-container flex items-center justify-center">Loading...</div>;

    return (
        <div className="aw-container">
            {/* Background */}
            <div className="aw-aurora-bg">
                <div className="aw-blob aw-blob-1"></div>
                <div className="aw-blob aw-blob-2"></div>
            </div>

            {/* Main Content */}
            <div className="aw-content">
                {/* Header */}
                <header className="aw-header">
                    <button onClick={finishWorkout} className="aw-finish-btn">סיים אימון</button>
                    <div className="aw-timer-badge">{formatTime(workoutTimer)}</div>
                    <button onClick={() => setIsDrawerOpen(true)} className="aw-finish-btn border-0"><SettingsIcon className="w-6 h-6" /></button>
                </header>

                {/* Focus Card */}
                <div className="aw-focus-card animate-scale-in">
                    <h2 className="aw-exercise-title">{currentExercise.name}</h2>
                    <div className="aw-set-indicator">
                        SET {activeSetIndex + 1} <span className="text-white/30 mx-2">/</span> {currentExercise.sets.length}
                    </div>

                    {/* Weight Input */}
                    <div className="aw-input-group">
                        <div className="aw-input-container">
                            <span className="aw-input-label">משקל (ק"ג)</span>
                            <span className="aw-input-value" onClick={() => setNumpadConfig({ isOpen: true, target: 'weight', value: '' })}>
                                {currentSet.weight || 0}
                            </span>
                            <div className="aw-input-controls">
                                <button className="aw-control-btn" onClick={() => handleSetUpdate('weight', Math.max(0, (currentSet.weight || 0) - 2.5))}>-</button>
                                <button className="aw-control-btn" onClick={() => handleSetUpdate('weight', (currentSet.weight || 0) + 2.5)}>+</button>
                            </div>
                        </div>

                        {/* Reps Input */}
                        <div className="aw-input-container">
                            <span className="aw-input-label">חזרות</span>
                            <span className="aw-input-value" onClick={() => setNumpadConfig({ isOpen: true, target: 'reps', value: '' })}>
                                {currentSet.reps || 0}
                            </span>
                            <div className="aw-input-controls">
                                <button className="aw-control-btn" onClick={() => handleSetUpdate('reps', Math.max(0, (currentSet.reps || 0) - 1))}>-</button>
                                <button className="aw-control-btn" onClick={() => handleSetUpdate('reps', (currentSet.reps || 0) + 1)}>+</button>
                            </div>
                        </div>
                    </div>

                    {/* Previous Performance Ghost */}
                    <div className="text-center opacity-40 text-sm mt-4">
                        ביצוע אחרון: 60kg x 8
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="aw-footer">
                    <button className="aw-complete-btn" onClick={completeSet}>
                        הושלם ✓
                    </button>

                    <div className="aw-nav-row">
                        <button
                            className="aw-peek-btn"
                            onClick={() => setIsDrawerOpen(true)}
                        >
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <div className="w-1 h-1 bg-white rounded-full shadow-[0_4px_0_white,0_-4px_0_white]"></div>
                            </div>
                            רשימת תרגילים
                        </button>

                        <div className="flex gap-2">
                            <button
                                className="aw-control-btn"
                                disabled={currentExerciseIndex === 0}
                                onClick={() => setCurrentExerciseIndex(i => i - 1)}
                            >
                                <ChevronLeftIcon className="w-6 h-6 rotate-180" />
                            </button>
                            <button
                                className="aw-control-btn"
                                disabled={currentExerciseIndex === exercises.length - 1}
                                onClick={() => setCurrentExerciseIndex(i => i + 1)}
                            >
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            {restTimer.active && renderRestTimer()}
            {numpadConfig.isOpen && renderNumpad()}

            {/* Exercise Drawer */}
            <div className={`aw-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                <div className="aw-drawer" onClick={e => e.stopPropagation()}>
                    <div className="aw-drawer-handle"></div>
                    <h3 className="text-xl font-bold text-white mb-4 px-2">תוכנית האימון</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {exercises.map((ex, i) => (
                            <div
                                key={ex.id}
                                className={`aw-exercise-list-item ${i === currentExerciseIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentExerciseIndex(i);
                                    setIsDrawerOpen(false);
                                }}
                            >
                                <span className="font-medium">{i + 1}. {ex.name}</span>
                                <span className="text-xs opacity-50">{ex.sets.filter(s => s.completedAt).length}/{ex.sets.length} סטים</span>
                            </div>
                        ))}
                        <button
                            onClick={() => { setShowExerciseSelector(true); setIsDrawerOpen(false); }}
                            className="w-full py-4 mt-4 border border-dashed border-white/20 rounded-xl text-sm text-gray-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                        >
                            <AddIcon className="w-5 h-5" /> הוסף תרגיל
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals for adding exercises */}
            {showExerciseSelector && (
                <ExerciseSelector
                    onSelect={addExercise}
                    onClose={() => setShowExerciseSelector(false)}
                    onCreateNew={() => { setShowExerciseSelector(false); setShowQuickForm(true); }}
                />
            )}
            {showQuickForm && (
                <QuickExerciseForm
                    onSave={(ex) => { addExercise(ex); setShowQuickForm(false); }}
                    onClose={() => setShowQuickForm(false)}
                />
            )}
        </div>
    );
};

export default ActiveWorkout;
