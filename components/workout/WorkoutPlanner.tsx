import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutTemplate } from '../../types';
import * as dataService from '../../services/dataService';
import { CloseIcon, AddIcon } from '../icons';

interface WorkoutPlannerProps {
    onClose: () => void;
    onStartWorkout?: (template: WorkoutTemplate) => void;
}

interface ScheduledWorkout {
    id: string;
    date: string; // ISO date string (YYYY-MM-DD)
    templateId: string;
    templateName: string;
    completed?: boolean;
}

const STORAGE_KEY = 'workout_schedule';

const WEEKDAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const WEEKDAYS_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * WorkoutPlanner - Weekly calendar for planning workouts
 */
const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ onClose, onStartWorkout }) => {
    const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [loading, setLoading] = useState(true);

    // Get current week dates
    const weekDates = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return {
                date: date.toISOString().split('T')[0],
                dayNum: date.getDate(),
                dayName: WEEKDAYS_HE[i],
                dayFull: WEEKDAYS_FULL[i],
                isToday: date.toDateString() === today.toDateString(),
                isPast: date < new Date(today.setHours(0, 0, 0, 0)),
            };
        });
    }, []);

    // Load schedule and templates
    useEffect(() => {
        const load = async () => {
            try {
                // Load schedule from localStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setSchedule(JSON.parse(saved));
                }

                // Load templates
                const templatesData = await dataService.getWorkoutTemplates();
                setTemplates(templatesData);
            } catch (e) {
                console.error('Failed to load planner data:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Save schedule
    const saveSchedule = useCallback((newSchedule: ScheduledWorkout[]) => {
        setSchedule(newSchedule);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedule));
        } catch (e) {
            console.error('Failed to save schedule:', e);
        }
    }, []);

    // Add workout to schedule
    const addWorkout = useCallback((date: string, template: WorkoutTemplate) => {
        const newWorkout: ScheduledWorkout = {
            id: `sw-${Date.now()}`,
            date,
            templateId: template.id,
            templateName: template.name,
        };
        saveSchedule([...schedule, newWorkout]);
        setShowTemplateSelector(false);
        setSelectedDate(null);
    }, [schedule, saveSchedule]);

    // Remove scheduled workout
    const removeWorkout = useCallback((workoutId: string) => {
        saveSchedule(schedule.filter(w => w.id !== workoutId));
    }, [schedule, saveSchedule]);

    // Mark workout as completed
    const toggleComplete = useCallback((workoutId: string) => {
        saveSchedule(
            schedule.map(w =>
                w.id === workoutId ? { ...w, completed: !w.completed } : w
            )
        );
    }, [schedule, saveSchedule]);

    // Get workouts for a date
    const getWorkoutsForDate = useCallback((date: string) => {
        return schedule.filter(w => w.date === date);
    }, [schedule]);

    // Stats
    const stats = useMemo(() => {
        const thisWeek = schedule.filter(w => weekDates.some(d => d.date === w.date));
        const completed = thisWeek.filter(w => w.completed).length;
        return {
            planned: thisWeek.length,
            completed,
        };
    }, [schedule, weekDates]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[11000] bg-black/95 flex items-center justify-center">
                <div className="animate-pulse text-white/50">טוען...</div>
            </div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-xl flex flex-col"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
        >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 safe-area-top">
                <h2 className="text-lg font-bold text-white">🗓️ תכנון אימונים</h2>
                <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Stats Bar */}
            <div className="flex-shrink-0 flex justify-center gap-6 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.planned}</div>
                    <div className="text-xs text-white/50">מתוכננים</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                    <div className="text-xs text-white/50">הושלמו</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--cosmos-accent-primary)]">
                        {stats.planned > 0 ? Math.round((stats.completed / stats.planned) * 100) : 0}%
                    </div>
                    <div className="text-xs text-white/50">השלמה</div>
                </div>
            </div>

            {/* Week Calendar */}
            <div className="flex-shrink-0 p-4">
                <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((day, i) => {
                        const workouts = getWorkoutsForDate(day.date);
                        const hasWorkout = workouts.length > 0;
                        const isCompleted = workouts.some(w => w.completed);

                        return (
                            <motion.button
                                key={day.date}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setSelectedDate(day.date);
                                    if (workouts.length === 0) {
                                        setShowTemplateSelector(true);
                                    }
                                }}
                                className={`relative flex flex-col items-center py-3 rounded-xl transition-all ${day.isToday
                                        ? 'bg-[var(--cosmos-accent-primary)] text-black'
                                        : selectedDate === day.date
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/5 text-white/70'
                                    }`}
                            >
                                <span className="text-xs font-medium mb-1">{day.dayName}</span>
                                <span className="text-lg font-bold">{day.dayNum}</span>

                                {/* Workout indicator */}
                                {hasWorkout && (
                                    <div className={`absolute -bottom-1 w-2 h-2 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-[var(--cosmos-accent-cyan)]'
                                        }`} />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Details */}
            <div className="flex-1 overflow-y-auto p-4">
                {selectedDate ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-bold">
                                {weekDates.find(d => d.date === selectedDate)?.dayFull || selectedDate}
                            </h3>
                            <button
                                onClick={() => setShowTemplateSelector(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--cosmos-accent-primary)]/20 text-[var(--cosmos-accent-primary)] text-sm font-medium"
                            >
                                <AddIcon className="w-4 h-4" />
                                הוסף
                            </button>
                        </div>

                        {/* Scheduled Workouts */}
                        {getWorkoutsForDate(selectedDate).length === 0 ? (
                            <div className="text-center py-8 text-white/40">
                                <p className="text-4xl mb-2">📅</p>
                                <p>אין אימונים מתוכננים</p>
                                <button
                                    onClick={() => setShowTemplateSelector(true)}
                                    className="mt-3 px-4 py-2 rounded-xl bg-[var(--cosmos-accent-primary)] text-black font-medium text-sm"
                                >
                                    + תכנן אימון
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getWorkoutsForDate(selectedDate).map(workout => (
                                    <motion.div
                                        key={workout.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border transition-all ${workout.completed
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : 'bg-white/5 border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleComplete(workout.id)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${workout.completed
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-white/30'
                                                        }`}
                                                >
                                                    {workout.completed && '✓'}
                                                </button>
                                                <span className={`font-semibold ${workout.completed ? 'text-green-400' : 'text-white'
                                                    }`}>
                                                    {workout.templateName}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                {onStartWorkout && !workout.completed && (
                                                    <button
                                                        onClick={() => {
                                                            const template = templates.find(t => t.id === workout.templateId);
                                                            if (template) onStartWorkout(template);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-[var(--cosmos-accent-primary)] text-black text-xs font-bold"
                                                    >
                                                        התחל ▶
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeWorkout(workout.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium"
                                                >
                                                    מחק
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-white/40">
                        <p className="text-4xl mb-2">👆</p>
                        <p>בחר יום לצפייה או תכנון</p>
                    </div>
                )}
            </div>

            {/* Template Selector Modal */}
            <AnimatePresence>
                {showTemplateSelector && selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[12000] bg-black/80 flex items-end justify-center"
                        onClick={() => setShowTemplateSelector(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#0f0f13] rounded-t-3xl border-t border-white/10"
                        >
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white text-center">בחר תבנית אימון</h3>
                            </div>

                            <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                                {templates.length === 0 ? (
                                    <p className="text-white/40 text-center py-4">אין תבניות זמינות</p>
                                ) : (
                                    templates.map(template => (
                                        <motion.button
                                            key={template.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addWorkout(selectedDate, template)}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-right hover:bg-white/10 transition-all"
                                        >
                                            <div className="font-semibold text-white">{template.name}</div>
                                            <div className="text-xs text-white/50 mt-1">
                                                {template.exercises?.length || 0} תרגילים
                                                {template.isBuiltin && ' • מובנה'}
                                            </div>
                                        </motion.button>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 safe-area-bottom">
                                <button
                                    onClick={() => setShowTemplateSelector(false)}
                                    className="w-full h-12 rounded-xl bg-white/10 text-white font-medium"
                                >
                                    ביטול
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top, 0); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
        </motion.div>
    );
};

export default WorkoutPlanner;
