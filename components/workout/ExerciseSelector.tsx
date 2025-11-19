import React, { useState, useEffect } from 'react';
import { PersonalExercise, Exercise } from '../../types';
import * as dataService from '../../services/dataService';
import { CloseIcon, SearchIcon, AddIcon } from '../icons';

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
        // Convert PersonalExercise to Exercise format
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

        // Increment use count
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--border-color)] animate-screen-enter">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
                    <div>
                        <h2 className="text-2xl font-bold">בחר תרגיל</h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {exercises.length} תרגילים ברשימה
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="p-4 space-y-3 border-b border-[var(--border-color)] bg-[var(--surface-secondary)]/50">
                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="חיפוש תרגיל..."
                            className="w-full pr-10 pl-4 py-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        />
                    </div>

                    {/* Muscle Group Filter */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {muscleGroups.map(group => (
                            <button
                                key={group}
                                onClick={() => setSelectedMuscleGroup(group)}
                                className={`px-4 py-2 rounded-xl whitespace-nowrap font-semibold transition-all ${selectedMuscleGroup === group
                                        ? 'bg-[var(--accent-gradient)] text-black scale-105'
                                        : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                            >
                                {group === 'all' ? 'הכל' : group}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Exercise List */}
                <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
                    {filteredExercises.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold mb-2">לא נמצאו תרגילים</h3>
                            <p className="text-[var(--text-secondary)] mb-4">
                                {searchQuery ? 'נסה חיפוש אחר' : 'הוסף תרגיל חדש לרשימה'}
                            </p>
                            <button
                                onClick={onCreateNew}
                                className="px-6 py-3 bg-[var(--accent-gradient)] text-black rounded-xl font-bold hover:brightness-110 transition-all active:scale-95"
                            >
                                + צור תרגיל חדש
                            </button>
                        </div>
                    ) : (
                        filteredExercises.map((exercise) => (
                            <button
                                key={exercise.id}
                                onClick={() => handleSelect(exercise)}
                                className="w-full text-right p-4 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent-primary)]/50 border border-transparent rounded-xl transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold group-hover:text-[var(--accent-primary)] transition-colors">
                                                {exercise.name}
                                            </h3>
                                            {exercise.muscleGroup && (
                                                <span className="text-xs px-2.5 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full">
                                                    {exercise.muscleGroup}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
                                            <div>⏱️ {exercise.defaultRestTime || 90}s</div>
                                            <div>📊 {exercise.defaultSets || 4} סטים</div>
                                            {exercise.useCount && exercise.useCount > 0 && (
                                                <div className="text-green-500">✓ {exercise.useCount} פעמים</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg text-sm font-semibold">
                                            בחר →
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--surface-secondary)]/50">
                    <button
                        onClick={onCreateNew}
                        className="w-full px-4 py-3 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 rounded-xl text-[var(--accent-primary)] font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <AddIcon className="w-5 h-5" />
                        צור תרגיל חדש
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseSelector;
