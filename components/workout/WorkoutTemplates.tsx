import React, { useState, useEffect } from 'react';
import { WorkoutTemplate, Exercise } from '../../types';
import * as dataService from '../../services/dataService';
import { AddIcon, TrashIcon } from '../icons';

interface WorkoutTemplatesProps {
    onLoadTemplate: (templateId: string) => void;
    onClose: () => void;
}

const WorkoutTemplates: React.FC<WorkoutTemplatesProps> = ({ onLoadTemplate, onClose }) => {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Partial<WorkoutTemplate>>({
        name: '',
        description: '',
        exercises: []
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const loaded = await dataService.getWorkoutTemplates();
        setTemplates(loaded);
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name?.trim()) return;

        await dataService.createWorkoutTemplate({
            name: newTemplate.name,
            description: newTemplate.description,
            exercises: newTemplate.exercises || []
        });

        setIsCreating(false);
        setNewTemplate({ name: '', description: '', exercises: [] });
        loadTemplates();
    };

    const handleDeleteTemplate = async (id: string) => {
        if (confirm('האם למחוק תבנית זו?')) {
            await dataService.deleteWorkoutTemplate(id);
            loadTemplates();
        }
    };

    // Built-in templates
    const builtInTemplates: WorkoutTemplate[] = [
        {
            id: 'bench-press',
            name: 'Bench Press',
            description: 'תרגיל חזה בסיסי',
            createdAt: new Date().toISOString(),
            muscleGroups: ['Chest', 'Triceps'],
            exercises: [
                {
                    id: 'ex-1',
                    name: 'Bench Press',
                    muscleGroup: 'Chest',
                    targetRestTime: 120,
                    sets: [
                        { reps: 8, weight: 60 },
                        { reps: 8, weight: 60 },
                        { reps: 8, weight: 60 },
                        { reps: 8, weight: 60 }
                    ]
                }
            ]
        },
        {
            id: 'squat',
            name: 'Squat',
            description: 'תרגיל רגליים בסיסי',
            createdAt: new Date().toISOString(),
            muscleGroups: ['Legs'],
            exercises: [
                {
                    id: 'ex-1',
                    name: 'Barbell Squat',
                    muscleGroup: 'Legs',
                    targetRestTime: 180,
                    sets: [
                        { reps: 5, weight: 100 },
                        { reps: 5, weight: 100 },
                        { reps: 5, weight: 100 },
                        { reps: 5, weight: 100 },
                        { reps: 5, weight: 100 }
                    ]
                }
            ]
        },
        {
            id: 'deadlift',
            name: 'Deadlift',
            description: 'תרגיל גב ורגליים',
            createdAt: new Date().toISOString(),
            muscleGroups: ['Back', 'Legs'],
            exercises: [
                {
                    id: 'ex-1',
                    name: 'Barbell Deadlift',
                    muscleGroup: 'Back',
                    targetRestTime: 180,
                    sets: [
                        { reps: 5, weight: 120 },
                        { reps: 5, weight: 120 },
                        { reps: 5, weight: 120 }
                    ]
                }
            ]
        }
    ];

    const allTemplates = [...builtInTemplates, ...templates];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">תבניות אימון</h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] text-2xl">×</button>
                </div>

                <div className="p-4 space-y-3">
                    {/* Built-in Templates */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">תבניות מובנות</h3>
                        {builtInTemplates.map(template => (
                            <div
                                key={template.id}
                                className="p-4 bg-[var(--surface-secondary)] rounded-lg mb-2 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                                onClick={() => {
                                    onLoadTemplate(template.id);
                                    onClose();
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{template.name}</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">{template.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            {template.muscleGroups?.map(mg => (
                                                <span key={mg} className="text-xs px-2 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded">
                                                    {mg}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* User Templates */}
                    {templates.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">התבניות שלי</h3>
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="p-4 bg-[var(--surface-secondary)] rounded-lg mb-2"
                                >
                                    <div className="flex justify-between items-start">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => {
                                                onLoadTemplate(template.id);
                                                onClose();
                                            }}
                                        >
                                            <h4 className="font-semibold">{template.name}</h4>
                                            <p className="text-sm text-[var(--text-secondary)]">{template.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            className="text-[var(--danger)] hover:text-red-600"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Create New Template */}
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-3 border-2 border-dashed border-[var(--border-color)] rounded-lg text-[var(--accent-primary)] font-semibold flex items-center justify-center gap-2"
                        >
                            <AddIcon className="w-5 h-5" />
                            צור תבנית חדשה
                        </button>
                    ) : (
                        <div className="p-4 bg-[var(--surface-secondary)] rounded-lg space-y-3">
                            <input
                                type="text"
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                placeholder="שם התבנית"
                                className="w-full px-3 py-2 bg-[var(--bg-primary)] rounded-lg"
                            />
                            <textarea
                                value={newTemplate.description}
                                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                placeholder="תיאור (אופציונלי)"
                                className="w-full px-3 py-2 bg-[var(--bg-primary)] rounded-lg resize-none"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateTemplate}
                                    className="flex-1 py-2 bg-[var(--accent-gradient)] text-black rounded-lg font-semibold"
                                >
                                    שמור
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-2 bg-[var(--surface-hover)] rounded-lg"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkoutTemplates;
