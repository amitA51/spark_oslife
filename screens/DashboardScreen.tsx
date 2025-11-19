import React, { useState } from 'react';
import { Screen } from '../types';
import TasksTodayWidget from '../components/widgets/TasksTodayWidget';
import QuoteWidget from '../components/widgets/QuoteWidget';
import ProductivityStatsWidget from '../components/widgets/ProductivityStatsWidget';
import HabitsTrackerWidget from '../components/widgets/HabitsTrackerWidget';
import CalendarWidget from '../components/widgets/CalendarWidget';
import { LayoutDashboardIcon, PlusIcon } from '../components/icons';

interface DashboardScreenProps {
    setActiveScreen: (screen: Screen) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ setActiveScreen }) => {
    const [isEditMode, setIsEditMode] = useState(false);

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                    <LayoutDashboardIcon className="w-6 h-6 text-[var(--dynamic-accent-start)]" />
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">דשבורד</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isEditMode
                            ? 'bg-[var(--dynamic-accent-start)] text-white'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                            }`}
                    >
                        {isEditMode ? 'סיום עריכה' : 'עריכה'}
                    </button>
                    {isEditMode && (
                        <button
                            className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                            title="הוסף ווידג'ט"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Widgets Grid */}
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                    {/* Tasks Today Widget */}
                    <div className={`${isEditMode ? 'ring-2 ring-[var(--dynamic-accent-start)] ring-opacity-50 rounded-2xl' : ''}`}>
                        <TasksTodayWidget
                            onTaskClick={(task) => {
                                // Navigate to task details
                                console.log('Task clicked:', task);
                            }}
                            onTaskComplete={(taskId) => {
                                // Toggle task completion
                                console.log('Toggle task:', taskId);
                            }}
                        />
                    </div>

                    {/* Productivity Stats Widget */}
                    <div className={`${isEditMode ? 'ring-2 ring-[var(--dynamic-accent-start)] ring-opacity-50 rounded-2xl' : ''}`}>
                        <ProductivityStatsWidget />
                    </div>

                    {/* Quote Widget */}
                    <div className={`${isEditMode ? 'ring-2 ring-[var(--dynamic-accent-start)] ring-opacity-50 rounded-2xl' : ''}`}>
                        <QuoteWidget />
                    </div>

                    {/* Habits Tracker Widget */}
                    <div className={`${isEditMode ? 'ring-2 ring-[var(--dynamic-accent-start)] ring-opacity-50 rounded-2xl' : ''}`}>
                        <HabitsTrackerWidget
                            onHabitToggle={(habitId) => {
                                console.log('Toggle habit:', habitId);
                                // Implement habit toggle logic here
                            }}
                        />
                    </div>

                    {/* Calendar Widget */}
                    <div className={`${isEditMode ? 'ring-2 ring-[var(--dynamic-accent-start)] ring-opacity-50 rounded-2xl' : ''}`}>
                        <CalendarWidget onClick={() => setActiveScreen('calendar')} />
                    </div>

                    {/* Add Widget Placeholder (in edit mode) */}
                    {isEditMode && (
                        <button className="min-h-[300px] border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors group">
                            <PlusIcon className="w-12 h-12 text-[var(--text-secondary)] group-hover:text-[var(--dynamic-accent-start)]" />
                            <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                                הוסף ווידג'ט
                            </span>
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {false && ( // This would show when no widgets are configured
                    <div className="flex flex-col items-center justify-center h-full">
                        <LayoutDashboardIcon className="w-20 h-20 text-[var(--text-secondary)] opacity-20 mb-4" />
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            הדשבורד שלך ריק
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6 text-center max-w-md">
                            התחל להוסיף ווידג'טים כדי להתאים אישית את הדשבורד שלך
                        </p>
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="px-6 py-3 bg-[var(--dynamic-accent-start)] text-white rounded-lg font-medium hover:brightness-110 transition-all"
                        >
                            הוסף ווידג'ט ראשון
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Mode Info */}
            {isEditMode && (
                <div className="bg-[var(--dynamic-accent-start)]/10 border-t border-[var(--dynamic-accent-start)]/30 p-3">
                    <p className="text-sm text-center text-[var(--text-primary)]">
                        💡 <strong>מצב עריכה:</strong> גרור ווידג'טים לסידור מחדש או לחץ על + להוספת ווידג'ט חדש
                    </p>
                </div>
            )}
        </div>
    );
};

export default DashboardScreen;
