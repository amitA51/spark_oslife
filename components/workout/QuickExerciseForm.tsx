import React, { useState } from 'react';
import { Exercise } from '../../types';
import * as dataService from '../../services/dataService';
import './ActiveWorkout.css'; // Import the styles

// Local Icon
const CloseIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

interface QuickExerciseFormProps {
    onAdd: (exercise: Exercise) => void;
    onClose: () => void;
}

const QuickExerciseForm: React.FC<QuickExerciseFormProps> = ({ onAdd, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        muscleGroup: '',
        targetRestTime: 90,
        defaultSets: 4,
        saveToLibrary: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Create exercise for workout
        const exercise: Exercise = {
            id: `ex-${Date.now()}`,
            name: formData.name,
            muscleGroup: formData.muscleGroup || undefined,
            targetRestTime: formData.targetRestTime,
            sets: Array(formData.defaultSets).fill(null).map(() => ({
                reps: 0,
                weight: 0
            }))
        };

        // Save to personal library if checked
        if (formData.saveToLibrary) {
            await dataService.createPersonalExercise({
                name: formData.name,
                muscleGroup: formData.muscleGroup || undefined,
                defaultRestTime: formData.targetRestTime,
                defaultSets: formData.defaultSets
            });
        }

        onAdd(exercise);
    };

    const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

    return (
        <div className="aw-modal-overlay open">
            <div className="aw-modal-card">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-white">תרגיל חדש</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="aw-label">
                            שם התרגיל *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="לדוגמה: Bench Press"
                            required
                            autoFocus
                            className="aw-input"
                        />
                    </div>

                    <div>
                        <label className="aw-label">
                            קבוצת שרירים
                        </label>
                        <select
                            value={formData.muscleGroup}
                            onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                            className="aw-input appearance-none"
                        >
                            <option value="">בחר (אופציונלי)</option>
                            {muscleGroups.map(group => (
                                <option key={group} value={group} className="text-black">{group}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="aw-label">
                                מנוחה (שניות)
                            </label>
                            <input
                                type="number"
                                value={formData.targetRestTime}
                                onChange={(e) => setFormData({ ...formData, targetRestTime: parseInt(e.target.value) || 90 })}
                                className="aw-input text-center"
                            />
                        </div>
                        <div>
                            <label className="aw-label">
                                מספר סטים
                            </label>
                            <input
                                type="number"
                                value={formData.defaultSets}
                                onChange={(e) => setFormData({ ...formData, defaultSets: parseInt(e.target.value) || 4 })}
                                min="1"
                                max="10"
                                className="aw-input text-center"
                            />
                        </div>
                    </div>

                    {/* Save to Library Checkbox */}
                    <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
                        <input
                            type="checkbox"
                            checked={formData.saveToLibrary}
                            onChange={(e) => setFormData({ ...formData, saveToLibrary: e.target.checked })}
                            className="w-5 h-5 rounded border-2 border-[var(--aw-accent)] text-[var(--aw-accent)] bg-transparent"
                        />
                        <span className="text-sm text-white/90 font-medium">שמור לרשימה שלי</span>
                    </label>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="aw-btn-primary"
                        >
                            הוסף תרגיל
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="aw-btn-secondary"
                        >
                            ביטול
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickExerciseForm;
