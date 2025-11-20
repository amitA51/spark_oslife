import React, { useState, useEffect } from 'react';
import { PersonalExercise, Exercise } from '../../types';
import * as dataService from '../../services/dataService';
import './ActiveWorkout.css';

// Local Icons
const CloseIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const AddIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

interface ExerciseSelectorProps {
    onSelect: (exercise: Exercise) => void;
    onClose: () => void;
    onCreateNew: () => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect, onClose, onCreateNew }) => {
    const [exercises, setExercises] = useState<PersonalExercise[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        const data = await dataService.getPersonalExercises();
        setExercises(data);
    };

    const handleSelect = async (personalExercise: PersonalExercise) => {
        const exercise: Exercise = {
            id: `ex-${Date.now()}`,
            name: personalExercise.name,
            muscleGroup: personalExercise.muscleGroup,
            targetRestTime: personalExercise.defaultRestTime || 90,
            sets: Array(personalExercise.defaultSets || 4).fill(null).map(() => ({
                reps: 0,
                weight: 0
            }))
        };

        await dataService.incrementExerciseUse(personalExercise.id);
        onSelect(exercise);
    };

    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMuscleGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
        return matchesSearch && matchesMuscleGroup;
    });

    const muscleGroups = ['all', ...Array.from(new Set(exercises.map(ex => ex.muscleGroup).filter(Boolean)))];

    return (
        <div className="aw-modal-overlay open">
            <div className="aw-modal-card" style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">בחר תרגיל</h2>
                        <p className="text-sm text-white/50 mt-1">
                            {exercises.length} תרגילים זמינים
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="p-4 space-y-4 bg-white/5 border-b border-white/10">
                    <div className="relative">
                        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="חיפוש תרגיל..."
                            className="aw-input pr-12"
                            style={{ background: 'rgba(0,0,0,0.3)' }}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        {muscleGroups.map(group => (
                            <button
                                key={group}
                                onClick={() => setSelectedMuscleGroup(group)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedMuscleGroup === group
                                        ? 'bg-[var(--aw-accent)] text-black shadow-[0_0_10px_var(--aw-accent-glow)]'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                            >
                                {group === 'all' ? 'הכל' : group}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredExercises.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <SearchIcon className="w-8 h-8 text-white/20" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">לא נמצאו תרגילים</h3>
                            <p className="text-white/40 mb-6 text-sm">
                                {searchQuery ? 'נסה מילות חיפוש אחרות' : 'הרשימה שלך ריקה כרגע'}
                            </p>
                            <button
                                onClick={onCreateNew}
                                className="aw-btn-primary"
                                style={{ width: 'auto', padding: '10px 24px' }}
                            >
                                + צור תרגיל חדש
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredExercises.map((exercise) => (
                                <button
                                    key={exercise.id}
                                    onClick={() => handleSelect(exercise)}
                                    className="w-full text-right p-4 bg-white/5 hover:bg-white/10 border border-transparent hover:border-[var(--aw-accent)]/30 rounded-xl transition-all group flex items-center justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-white text-lg group-hover:text-[var(--aw-accent)] transition-colors">
                                                {exercise.name}
                                            </span>
                                            {exercise.muscleGroup && (
                                                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/60 uppercase tracking-wider">
                                                    {exercise.muscleGroup}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-white/40 flex gap-3">
                                            <span>⏱ {exercise.defaultRestTime || 90}s</span>
                                            <span>📊 {exercise.defaultSets || 4} sets</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-[var(--aw-accent)]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <AddIcon className="w-4 h-4 text-[var(--aw-accent)]" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <button
                        onClick={onCreateNew}
                        className="w-full py-3 border border-dashed border-white/20 hover:border-[var(--aw-accent)] hover:bg-[var(--aw-accent)]/5 rounded-xl text-white/60 hover:text-[var(--aw-accent)] transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <AddIcon className="w-5 h-5" />
                        לא מצאת? צור תרגיל חדש
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseSelector;
