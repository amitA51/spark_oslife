import React, { useState } from 'react';
import { Exercise } from '../../types';
import { CloseIcon } from '../icons';
import * as dataService from '../../services/dataService';

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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border-color)] animate-screen-enter">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
                    <h2 className="text-2xl font-bold">תרגיל חדש</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            שם התרגיל *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="לדוגמה: Bench Press"
                            required
                            autoFocus
                            className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            קבוצת שרירים (אופציונלי)
                        </label>
                        <select
                            value={formData.muscleGroup}
                            onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        >
                            <option value="">בחר (אופציונלי)</option>
                            {muscleGroups.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                מנוחה (שניות)
                            </label>
                            <input
                                type="number"
                                value={formData.targetRestTime}
                                onChange={(e) => setFormData({ ...formData, targetRestTime: parseInt(e.target.value) || 90 })}
                                className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-center"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                מספר סטים
                            </label>
                            <input
                                type="number"
                                value={formData.defaultSets}
                                onChange={(e) => setFormData({ ...formData, defaultSets: parseInt(e.target.value) || 4 })}
                                min="1"
                                max="10"
                                className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-center"
                            />
                        </div>
                    </div>

                    {/* Save to Library Checkbox */}
                    <label className="flex items-start gap-3 p-3 bg-[var(--accent-primary)]/5 rounded-xl cursor-pointer hover:bg-[var(--accent-primary)]/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.saveToLibrary}
                            onChange={(e) => setFormData({ ...formData, saveToLibrary: e.target.checked })}
                            className="mt-1 w-5 h-5 rounded border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-[var(--accent-primary)]">שמור לרשימה שלי</div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1">
                                התרגיל יישמר ברשימת התרגילים האישית לשימוש עתידי
                            </div>
                        </div>
                    </label>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-[var(--accent-gradient)] text-black rounded-xl font-bold shadow-lg hover:brightness-110 transition-all active:scale-95"
                        >
                            הוסף תרגיל
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-3 bg-[var(--surface-secondary)] rounded-xl font-semibold hover:bg-[var(--surface-hover)] transition-all active:scale-95"
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
