import React, { useState, useEffect } from 'react';
import { PersonalExercise } from '../types';
import * as dataService from '../services/dataService';
import { AddIcon, TrashIcon, EditIcon } from './icons';

const ExerciseLibraryManager: React.FC = () => {
    const [exercises, setExercises] = useState<PersonalExercise[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        muscleGroup: '',
        defaultRestTime: 90,
        defaultSets: 4,
        notes: ''
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
            notes: exercise.notes || ''
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

    const resetForm = () => {
        setFormData({
            name: '',
            muscleGroup: '',
            defaultRestTime: 90,
            defaultSets: 4,
            notes: ''
        });
        setEditingId(null);
        setShowAddForm(false);
    };

    const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">רשימת התרגילים שלי</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        נהל את רשימת התרגילים שלך לשימוש מהיר באימונים
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-[var(--accent-gradient)] text-black rounded-xl font-semibold shadow-lg hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
                >
                    <AddIcon className="w-5 h-5" />
                    תרגיל חדש
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
                    <h3 className="text-lg font-bold mb-4">
                        {editingId ? 'עריכת תרגיל' : 'תרגיל חדש'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                קבוצת שרירים
                            </label>
                            <select
                                value={formData.muscleGroup}
                                onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                                className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                            >
                                <option value="">בחר קבוצת שרירים</option>
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
                                    value={formData.defaultRestTime}
                                    onChange={(e) => setFormData({ ...formData, defaultRestTime: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    סטים
                                </label>
                                <input
                                    type="number"
                                    value={formData.defaultSets}
                                    onChange={(e) => setFormData({ ...formData, defaultSets: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                הערות
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="הערות, טיפים, טכניקה..."
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-[var(--accent-gradient)] text-black rounded-xl font-bold hover:brightness-110 transition-all active:scale-95"
                            >
                                {editingId ? 'עדכן' : 'הוסף'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-3 bg-[var(--surface-secondary)] rounded-xl font-semibold hover:bg-[var(--surface-hover)] transition-all active:scale-95"
                            >
                                ביטול
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Exercise List */}
            <div className="space-y-2">
                {exercises.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏋️</div>
                        <h3 className="text-xl font-bold mb-2">אין תרגילים עדיין</h3>
                        <p className="text-[var(--text-secondary)]">
                            הוסף תרגילים כדי לשימוש מהיר באימונים
                        </p>
                    </div>
                ) : (
                    exercises.map((exercise) => (
                        <div
                            key={exercise.id}
                            className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold">{exercise.name}</h3>
                                        {exercise.muscleGroup && (
                                            <span className="text-xs px-2.5 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full">
                                                {exercise.muscleGroup}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
                                        <div>⏱️ {exercise.defaultRestTime || 90}s מנוחה</div>
                                        <div>📊 {exercise.defaultSets || 4} סטים</div>
                                        {exercise.useCount && exercise.useCount > 0 && (
                                            <div>✓ {exercise.useCount} שימושים</div>
                                        )}
                                    </div>
                                    {exercise.notes && (
                                        <p className="text-sm text-[var(--text-secondary)] mt-2 italic">
                                            💭 {exercise.notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(exercise)}
                                        className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                                    >
                                        <EditIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exercise.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExerciseLibraryManager;
