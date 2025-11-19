import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../state/AppContext';
import BaseWidget from './BaseWidget';
import { CheckCircleIcon, CircleIcon } from '../icons';
import { PersonalItem } from '../../types';

interface TasksTodayWidgetProps {
    onTaskClick?: (task: PersonalItem) => void;
    onTaskComplete?: (taskId: string) => void;
}

const TasksTodayWidget: React.FC<TasksTodayWidgetProps> = ({ onTaskClick, onTaskComplete }) => {
    const { state } = useContext(AppContext);

    const todayTasks = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return state.personalItems
            .filter(item =>
                item.type === 'task' &&
                item.dueDate === today &&
                !item.isCompleted
            )
            .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2);
            });
    }, [state.personalItems]);

    const completedToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return state.personalItems.filter(item =>
            item.type === 'task' &&
            item.dueDate === today &&
            item.isCompleted
        ).length;
    }, [state.personalItems]);

    const handleToggleComplete = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        onTaskComplete?.(taskId);
    };

    return (
        <BaseWidget
            title="משימות להיום"
            icon={<CheckCircleIcon className="w-5 h-5" />}
        >
            <div className="space-y-3">
                {/* Progress */}
                <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[var(--text-secondary)]">התקדמות</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                            {completedToday} / {completedToday + todayTasks.length}
                        </span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div
                            className="bg-[var(--dynamic-accent-start)] h-2 rounded-full transition-all"
                            style={{
                                width: `${todayTasks.length + completedToday > 0
                                    ? (completedToday / (completedToday + todayTasks.length)) * 100
                                    : 0}%`
                            }}
                        />
                    </div>
                </div>

                {/* Tasks List */}
                {todayTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-400" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            {completedToday > 0 ? 'כל המשימות הושלמו! 🎉' : 'אין משימות להיום'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayTasks.slice(0, 5).map(task => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick?.(task)}
                                className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg cursor-pointer transition-colors group"
                            >
                                <button
                                    onClick={(e) => handleToggleComplete(e, task.id)}
                                    className="flex-shrink-0 mt-0.5"
                                >
                                    <CircleIcon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--dynamic-accent-start)]" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                        {task.title}
                                    </p>
                                    {task.dueTime && (
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                            {task.dueTime}
                                        </p>
                                    )}
                                </div>
                                {task.priority === 'high' && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></span>
                                )}
                            </div>
                        ))}
                        {todayTasks.length > 5 && (
                            <p className="text-xs text-center text-[var(--text-secondary)] pt-2">
                                +{todayTasks.length - 5} משימות נוספות
                            </p>
                        )}
                    </div>
                )}
            </div>
        </BaseWidget>
    );
};

export default TasksTodayWidget;
