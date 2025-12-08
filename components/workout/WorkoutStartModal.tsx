import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutTemplate, WorkoutSession, PersonalExercise } from '../../types';
import * as dataService from '../../services/dataService';
import {
    CloseIcon,
    DumbbellIcon,
    PlayIcon,
    AddIcon,
    ClockIcon,
    FlameIcon
} from '../icons';
import './workout-premium.css';

interface WorkoutStartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartFromTemplate: (template: WorkoutTemplate) => void;
    onStartEmpty: () => void;
    onRepeatLastWorkout: (session: WorkoutSession) => void;
}

/**
 * WorkoutStartModal - A premium modal for starting workouts
 * Offers organized options: Templates, Quick Start, or Repeat Last Workout
 */
const WorkoutStartModal: React.FC<WorkoutStartModalProps> = ({
    isOpen,
    onClose,
    onStartFromTemplate,
    onStartEmpty,
    onRepeatLastWorkout,
}) => {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
    const [mostUsedExercises, setMostUsedExercises] = useState<PersonalExercise[]>([]);
    const [activeTab, setActiveTab] = useState<'templates' | 'quick'>('templates');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load templates
            await dataService.initializeBuiltInWorkoutTemplates();
            const allTemplates = await dataService.getWorkoutTemplates();

            // Sort by lastUsed if available, then by createdAt
            const sortedTemplates = allTemplates.sort((a, b) => {
                const aTime = a.lastUsed || a.createdAt;
                const bTime = b.lastUsed || b.createdAt;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
            setTemplates(sortedTemplates);

            // Load last workout session
            const sessions = await dataService.getWorkoutSessions(1);
            if (sessions.length > 0 && sessions[0]) {
                setLastSession(sessions[0]);
            }

            // Load most used exercises
            const exercises = await dataService.getPersonalExercises();
            const topExercises = exercises
                .filter(ex => (ex.useCount || 0) > 0)
                .slice(0, 6);
            setMostUsedExercises(topExercises);
        } catch (error) {
            console.error('Failed to load workout start data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'היום';
        if (diffDays === 1) return 'אתמול';
        if (diffDays < 7) return `לפני ${diffDays} ימים`;
        if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
        return `לפני ${Math.floor(diffDays / 30)} חודשים`;
    };

    const estimateDuration = (template: WorkoutTemplate) => {
        const totalSets = template.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 3), 0);
        const mins = totalSets * 3;
        return mins < 60 ? `${mins} דק'` : `${Math.round(mins / 60)} שעה`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[10000] flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-gradient-to-b from-[var(--cosmos-bg-secondary)] to-[var(--cosmos-bg-primary)] rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-hidden shadow-[0_-10px_60px_rgba(0,0,0,0.5)]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 border-b border-white/5">
                        {/* Drag Handle (Mobile) */}
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)]"
                                >
                                    <DumbbellIcon className="w-6 h-6 text-white" />
                                </motion.div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">התחל אימון</h2>
                                    <p className="text-sm text-white/50">בחר איך להתחיל</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <CloseIcon className="w-5 h-5 text-white/70" />
                            </motion.button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setActiveTab('templates')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'templates'
                                    ? 'bg-[var(--cosmos-accent-primary)] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                📋 תבניות
                            </button>
                            <button
                                onClick={() => setActiveTab('quick')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'quick'
                                    ? 'bg-[var(--cosmos-accent-primary)] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                ⚡ התחלה מהירה
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 overflow-y-auto max-h-[60vh] overscroll-contain">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-10 h-10 border-2 border-[var(--cosmos-accent-primary)] border-t-transparent rounded-full"
                                />
                                <p className="mt-4 text-white/50 text-sm">טוען...</p>
                            </div>
                        ) : activeTab === 'templates' ? (
                            <div className="space-y-4">
                                {/* Repeat Last Workout (if available) */}
                                {lastSession && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => onRepeatLastWorkout(lastSession)}
                                        className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group text-right"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                <span className="text-2xl">🔄</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                                                    חזור על אימון אחרון
                                                </h3>
                                                <p className="text-sm text-white/50 mt-0.5">
                                                    {lastSession.exercises.length} תרגילים • {formatRelativeTime(lastSession.startTime)}
                                                </p>
                                            </div>
                                            <PlayIcon className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </motion.button>
                                )}

                                {/* Templates Grid */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider px-1">
                                        תבניות שמורות
                                    </h3>
                                    {templates.length > 0 ? (
                                        <div className="grid gap-3">
                                            {templates.slice(0, 6).map((template, index) => (
                                                <motion.button
                                                    key={template.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => onStartFromTemplate(template)}
                                                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--cosmos-accent-primary)]/50 hover:bg-white/[0.07] transition-all group text-right"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${template.isBuiltin
                                                            ? 'bg-gradient-to-br from-[var(--cosmos-accent-primary)]/30 to-[var(--cosmos-accent-primary)]/10'
                                                            : 'bg-white/10'
                                                            }`}>
                                                            {template.isBuiltin ? (
                                                                <DumbbellIcon className="w-5 h-5 text-[var(--cosmos-accent-primary)]" />
                                                            ) : (
                                                                <span className="text-xl">📝</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-white group-hover:text-[var(--cosmos-accent-primary)] transition-colors truncate">
                                                                {template.name}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                                                                <span>{template.exercises.length} תרגילים</span>
                                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                                <span className="flex items-center gap-1">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {estimateDuration(template)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {template.isBuiltin && (
                                                            <span className="px-2 py-1 rounded-lg bg-[var(--cosmos-accent-primary)]/10 text-[var(--cosmos-accent-primary)] text-[10px] font-bold">
                                                                מובנה
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Muscle Groups Preview */}
                                                    {template.muscleGroups && template.muscleGroups.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                                            {template.muscleGroups.slice(0, 3).map(muscle => (
                                                                <span
                                                                    key={muscle}
                                                                    className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50"
                                                                >
                                                                    {muscle}
                                                                </span>
                                                            ))}
                                                            {template.muscleGroups.length > 3 && (
                                                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/30">
                                                                    +{template.muscleGroups.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-white/40">
                                            <p>אין תבניות שמורות עדיין</p>
                                            <p className="text-sm mt-1">סיים אימון ושמור אותו כתבנית</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Quick Start Tab */
                            <div className="space-y-4">
                                {/* Start Empty Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={onStartEmpty}
                                    className="w-full p-5 min-h-[80px] rounded-2xl bg-gradient-to-r from-[var(--cosmos-accent-primary)]/20 to-[var(--cosmos-accent-cyan)]/10 border border-[var(--cosmos-accent-primary)]/30 hover:border-[var(--cosmos-accent-primary)]/60 transition-all group text-right active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                            <AddIcon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white group-hover:text-[var(--cosmos-accent-primary)] transition-colors">
                                                התחל אימון חדש
                                            </h3>
                                            <p className="text-sm text-white/50 mt-0.5">
                                                תבחר את התרגיל הראשון במסך הבא
                                            </p>
                                        </div>
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            <PlayIcon className="w-6 h-6 text-[var(--cosmos-accent-primary)]" />
                                        </motion.div>
                                    </div>
                                </motion.button>

                                {/* Most Used Exercises */}
                                {mostUsedExercises.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider px-1 flex items-center gap-2">
                                            <FlameIcon className="w-4 h-4 text-orange-400" />
                                            התרגילים הכי בשימוש
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {mostUsedExercises.map((exercise, index) => (
                                                <motion.div
                                                    key={exercise.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="p-3 rounded-xl bg-white/5 border border-white/5"
                                                >
                                                    <span className="text-sm font-medium text-white/70 line-clamp-1">
                                                        {exercise.name}
                                                    </span>
                                                    <span className="text-[10px] text-white/30 block mt-0.5">
                                                        {exercise.useCount || 0}× השתמשת
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tips */}
                                <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <p className="text-xs text-white/40 leading-relaxed">
                                        💡 <span className="text-white/60 font-medium">טיפ:</span> לאחר סיום האימון תוכל לשמור אותו כתבנית לשימוש עתידי
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Safe Area Padding (Mobile) */}
                    <div className="h-[env(safe-area-inset-bottom,0px)]" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WorkoutStartModal;
