import React, { useState, useCallback } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Exercise } from '../../types';
import { DragHandleIcon, CheckCheckIcon, TrashIcon } from '../icons';
import './workout-premium.css';

interface ExerciseReorderProps {
    exercises: Exercise[];
    currentIndex: number;
    onReorder: (exercises: Exercise[]) => void;
    onSelectExercise: (index: number) => void;
    onDeleteExercise?: (index: number) => void;
    onClose: () => void;
}

/**
 * ExerciseReorder - Drag and drop interface for reordering exercises
 * Uses framer-motion Reorder for smooth animations
 */
const ExerciseReorder: React.FC<ExerciseReorderProps> = ({
    exercises,
    currentIndex,
    onReorder,
    onSelectExercise,
    onDeleteExercise,
    onClose,
}) => {
    const [items, setItems] = useState(exercises);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const handleReorder = useCallback((newOrder: Exercise[]) => {
        setItems(newOrder);
    }, []);

    const handleSave = useCallback(() => {
        onReorder(items);
        onClose();
    }, [items, onReorder, onClose]);

    const handleDelete = useCallback((index: number) => {
        if (deleteConfirm === index) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            onDeleteExercise?.(index);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(index);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    }, [deleteConfirm, items, onDeleteExercise]);

    const getCompletedSets = (exercise: Exercise) => {
        return exercise.sets?.filter(s => s.completedAt).length || 0;
    };

    const getTotalSets = (exercise: Exercise) => {
        return exercise.sets?.length || 0;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[10001] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">סדר תרגילים</h2>
                    <p className="text-sm text-white/50 mt-0.5">גרור כדי לשנות סדר</p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10"
                    >
                        ביטול
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="px-5 py-2 rounded-xl bg-[var(--cosmos-accent-primary)] text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    >
                        שמור
                    </motion.button>
                </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-5 workout-scrollable">
                <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={handleReorder}
                    className="space-y-3"
                >
                    {items.map((exercise, index) => (
                        <ExerciseReorderItem
                            key={exercise.id}
                            exercise={exercise}
                            index={index}
                            isActive={index === currentIndex}
                            completedSets={getCompletedSets(exercise)}
                            totalSets={getTotalSets(exercise)}
                            isDeleteConfirm={deleteConfirm === index}
                            onSelect={() => {
                                onSelectExercise(index);
                                onClose();
                            }}
                            onDelete={() => handleDelete(index)}
                        />
                    ))}
                </Reorder.Group>
            </div>

            {/* Safe Area */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </motion.div>
    );
};

interface ExerciseReorderItemProps {
    exercise: Exercise;
    index: number;
    isActive: boolean;
    completedSets: number;
    totalSets: number;
    isDeleteConfirm: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

const ExerciseReorderItem: React.FC<ExerciseReorderItemProps> = ({
    exercise,
    index,
    isActive,
    completedSets,
    totalSets,
    isDeleteConfirm,
    onSelect,
    onDelete,
}) => {
    const dragControls = useDragControls();
    const isComplete = completedSets === totalSets && totalSets > 0;

    return (
        <Reorder.Item
            value={exercise}
            dragListener={false}
            dragControls={dragControls}
            className={`relative rounded-2xl overflow-hidden ${isActive
                ? 'bg-gradient-to-r from-[var(--cosmos-accent-primary)]/20 to-[var(--cosmos-accent-cyan)]/10 border border-[var(--cosmos-accent-primary)]/40'
                : 'bg-white/5 border border-white/10'
                }`}
            whileDrag={{
                scale: 1.02,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                zIndex: 50
            }}
        >
            <div className="flex items-center gap-3 p-4">
                {/* Drag Handle */}
                <motion.div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="cursor-grab active:cursor-grabbing touch-none p-2 -m-2 rounded-lg hover:bg-white/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <DragHandleIcon className="w-5 h-5 text-white/40" />
                </motion.div>

                {/* Exercise Number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive
                        ? 'bg-[var(--cosmos-accent-primary)]/30 text-[var(--cosmos-accent-primary)]'
                        : 'bg-white/10 text-white/50'
                    }`}>
                    {isComplete ? <CheckCheckIcon className="w-4 h-4" /> : index + 1}
                </div>

                {/* Exercise Info */}
                <button
                    onClick={onSelect}
                    className="flex-1 text-right min-w-0"
                >
                    <h3 className={`font-bold truncate ${isActive ? 'text-white' : 'text-white/80'
                        }`}>
                        {exercise.name || 'תרגיל ללא שם'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${isComplete ? 'text-emerald-400' : 'text-white/40'
                            }`}>
                            {completedSets}/{totalSets} סטים
                        </span>
                        {exercise.muscleGroup && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="text-xs text-white/40">{exercise.muscleGroup}</span>
                            </>
                        )}
                    </div>
                </button>

                {/* Delete Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className={`p-2 rounded-xl transition-all ${isDeleteConfirm
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                >
                    <TrashIcon className="w-4 h-4" />
                </motion.button>

                {/* Active Indicator */}
                {isActive && (
                    <motion.div
                        layoutId="reorder-active-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--cosmos-accent-primary)]"
                    />
                )}
            </div>

            {/* Delete Confirmation Overlay */}
            {isDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none"
                >
                    <span className="text-xs text-red-400 font-semibold bg-red-500/20 px-3 py-1 rounded-full">
                        לחץ שוב למחיקה
                    </span>
                </motion.div>
            )}
        </Reorder.Item>
    );
};

export default React.memo(ExerciseReorder);
