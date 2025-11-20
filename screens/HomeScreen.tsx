import React, { useState, useCallback, useContext, useMemo, useRef, useEffect } from 'react';
import type { PersonalItem, Screen, ProductivityForecast } from '../types';
import TaskItem from '../components/TaskItem';
import HabitItem from '../components/HabitItem';
import PersonalItemDetailModal from '../components/PersonalItemDetailModal';
import PersonalItemContextMenu from '../components/PersonalItemContextMenu';
import DailyBriefingModal from '../components/DailyBriefingModal';
import QuickAddTask from '../components/QuickAddTask';
import DailyProgressCircle from '../components/DailyProgressCircle';
import { SettingsIcon, SparklesIcon, EyeIcon, EyeOffIcon, CheckSquareIcon, StopwatchIcon, SplitScreenIcon } from '../components/icons';
import SkeletonLoader from '../components/SkeletonLoader';
import { AppContext } from '../state/AppContext';
import { generateDailyBriefing, generateProductivityForecast } from '../services/geminiService';
import { isHabitForToday } from '../hooks/useTodayItems';
import { useContextMenu } from '../hooks/useContextMenu';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import { useHomeInteraction } from '../hooks/useHomeInteraction';
import { rollOverIncompleteTasks } from '../services/dataService';
import { useHaptics } from '../hooks/useHaptics';
import { useItemReordering } from '../hooks/useItemReordering';
import Dashboard from '../components/Dashboard';
import { useDebounce } from '../hooks/useDebounce';
import { useModal } from '../state/ModalContext';
import ComfortZoneWidget from '../components/ComfortZoneWidget';
import Section from '../components/Section';
import ViewSwitcher, { ViewMode } from '../components/ViewSwitcher';
import QuoteWidget from '../components/widgets/QuoteWidget';

interface HomeScreenProps {
    setActiveScreen: (screen: Screen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveScreen }) => {
    const { state, dispatch } = useContext(AppContext);
    const { isLoading, settings, personalItems } = state;
    const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu<PersonalItem>();
    const { triggerHaptic } = useHaptics();
    const { openModal } = useModal();

    const [statusMessage, setStatusMessage] = useState<{ type: StatusMessageType, text: string, id: number, onUndo?: () => void } | null>(null);
    const showStatus = useCallback((type: StatusMessageType, text: string, onUndo?: () => void) => {
        if (type === 'error') {
            triggerHaptic('heavy');
        }
        setStatusMessage({ type, text, id: Date.now(), onUndo });
    }, [triggerHaptic]);

    const {
        selectedItem,
        handleSelectItem,
        handleCloseModal,
        handleUpdateItem,
        handleDeleteItem,
        handleDeleteWithConfirmation,
        handleDuplicateItem,
        handleStartFocus,
    } = useHomeInteraction(showStatus);

    const [view, setView] = useState<ViewMode>('today');

    const { tasks, habits } = useMemo(() => {
        const allHabits = personalItems.filter(item => item.type === 'habit');
        const sortedAllHabits = allHabits.sort((a, b) => (a.order ?? new Date(a.createdAt).getTime()) - (b.order ?? new Date(b.createdAt).getTime()));

        const openTasks = personalItems.filter(item => item.type === 'task' && !item.isCompleted);

        let filteredTasks: PersonalItem[];

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const parseDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        if (view === 'today') {
            const tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setHours(23, 59, 59, 999);

            // Overdue, today's, and tomorrow's tasks
            filteredTasks = openTasks.filter(item => {
                if (!item.dueDate) return false;
                const dueDate = parseDate(item.dueDate);
                // Set to end of day for consistent comparison
                dueDate.setHours(23, 59, 59, 999);
                return dueDate <= tomorrowEnd;
            });
        } else if (view === 'tomorrow') {
            const tomorrowStart = new Date(todayStart);
            tomorrowStart.setDate(todayStart.getDate() + 1);
            const tomorrowEnd = new Date(tomorrowStart);
            tomorrowEnd.setHours(23, 59, 59, 999);

            filteredTasks = openTasks.filter(item => {
                if (!item.dueDate) return false;
                const dueDate = parseDate(item.dueDate);
                return dueDate >= tomorrowStart && dueDate <= tomorrowEnd;
            });
        } else { // 'week'
            const weekEnd = new Date(todayStart);
            weekEnd.setDate(todayStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            filteredTasks = openTasks.filter(item => {
                if (!item.dueDate) return false;
                const dueDate = parseDate(item.dueDate);
                return dueDate >= todayStart && dueDate <= weekEnd;
            });
        }

        const sortedTasks = filteredTasks.sort((a, b) => {
            const dateA = a.dueDate ? parseDate(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? parseDate(b.dueDate).getTime() : Infinity;
            if (dateA !== dateB) return dateA - dateB;

            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority || 'medium']) - (priorityOrder[b.priority || 'medium']);
        });

        return {
            tasks: sortedTasks,
            habits: sortedAllHabits,
        };
    }, [personalItems, view]);

    const completedTodayTasks = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(todayStart.getDate() + 1);

        return personalItems
            .filter(item => item.type === 'task' && item.isCompleted && item.lastCompleted)
            .filter(item => {
                const completedDate = new Date(item.lastCompleted!);
                return completedDate >= todayStart && completedDate < tomorrowStart;
            })
            .sort((a, b) => new Date(b.lastCompleted!).getTime() - new Date(a.lastCompleted!).getTime());
    }, [personalItems]);

    const [focusMode, setFocusMode] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Array<string>>(['fixed_habits', 'completed_today']);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [briefingContent, setBriefingContent] = useState('');
    const headerRef = useRef<HTMLElement>(null);

    const [productivityForecast, setProductivityForecast] = useState<ProductivityForecast | null>(null);
    const [isForecastLoading, setIsForecastLoading] = useState(true);
    const debouncedTasks = useDebounce(tasks, 1000);
    const debouncedHabits = useDebounce(habits, 1000);
    const debouncedEvents = useDebounce(state.calendarEvents, 1000);

    const tasksReordering = useItemReordering(tasks, handleUpdateItem, 'createdAt');
    const habitsReordering = useItemReordering(habits, handleUpdateItem, 'order');

    useEffect(() => {
        const fetchForecast = async () => {
            setIsForecastLoading(true);
            try {
                const forecast = await generateProductivityForecast(debouncedTasks, debouncedHabits, debouncedEvents);
                setProductivityForecast(forecast);
            } catch (error) {
                console.error("Failed to fetch productivity forecast", error);
                setProductivityForecast(null);
            } finally {
                setIsForecastLoading(false);
            }
        };

        if (!collapsedSections.includes('dashboard') && !focusMode) {
            fetchForecast();
        }
    }, [debouncedTasks, debouncedHabits, debouncedEvents, collapsedSections, focusMode]);

    useEffect(() => {
        let rafId: number;
        const handleScroll = () => {
            rafId = requestAnimationFrame(() => {
                if (headerRef.current) {
                    const scrollY = window.scrollY;
                    const translateY = Math.min(scrollY * 0.5, 150);
                    headerRef.current.style.transform = `translateY(-${translateY}px)`;
                    headerRef.current.style.opacity = `${Math.max(1 - scrollY / 200, 0)}`;
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    const handleToggleCollapse = (id: string) => {
        setCollapsedSections(prev =>
            prev.includes(id) ? prev.filter(sectionId => sectionId !== id) : [...prev, id]
        );
    };

    const handleStartGlobalFocus = useCallback(() => {
        if (tasks.length > 0) {
            handleStartFocus(tasks[0]);
        } else {
            showStatus('success', 'אין משימות פתוחות להתמקד בהן.');
        }
    }, [tasks, handleStartFocus, showStatus]);

    const handleGetBriefing = useCallback(async () => {
        if (isBriefingLoading) return;
        setIsBriefingLoading(true);
        setBriefingContent('');
        try {
            const gratitudeItem = personalItems.find(item => item.type === 'gratitude' && new Date(item.createdAt).toDateString() === new Date().toDateString());
            const habitsForBriefing = personalItems.filter(item => item.type === 'habit' && isHabitForToday(item));
            const briefing = await generateDailyBriefing(tasks.slice(0, 3), habitsForBriefing, gratitudeItem?.content || null, settings.aiPersonality);
            setBriefingContent(briefing);
        } catch (error) {
            console.error(error);
            setBriefingContent("שגיאה בעת יצירת התדריך. אנא נסה שוב.");
        } finally {
            setIsBriefingLoading(false);
        }
    }, [isBriefingLoading, personalItems, tasks, settings.aiPersonality]);

    const handleRollOverTasks = useCallback(async () => {
        const updates = await rollOverIncompleteTasks();
        if (updates.length > 0) {
            updates.forEach(update => {
                dispatch({ type: 'UPDATE_PERSONAL_ITEM', payload: update });
            });
            showStatus('success', `גלגלת ${updates.length} משימות להיום.`);
        } else {
            showStatus('success', 'אין משימות לגלגל.');
        }
    }, [dispatch, showStatus]);

    const { completionPercentage, overdueTasksCount } = useMemo(() => {
        const totalHabits = personalItems.filter(i => i.type === 'habit').length;
        const uncompletedHabitsToday = personalItems.filter(i => i.type === 'habit' && isHabitForToday(i)).length;
        const habitsCompletedToday = totalHabits - uncompletedHabitsToday;

        const openTasks = personalItems.filter(i => i.type === 'task' && !i.isCompleted);
        const totalTasks = personalItems.filter(i => i.type === 'task').length;
        const tasksCompleted = totalTasks - openTasks.length;

        const totalTrackedItems = totalHabits + totalTasks;
        const totalCompleted = habitsCompletedToday + tasksCompleted;
        const percentage = totalTrackedItems > 0 ? (totalCompleted / totalTrackedItems) * 100 : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdue = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < today).length;

        return { completionPercentage: percentage, overdueTasksCount: overdue };
    }, [personalItems]);

    const todayDate = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

    const habitsForTodayCount = useMemo(
        () => personalItems.filter(i => i.type === 'habit' && isHabitForToday(i)).length,
        [personalItems]
    );

    const getSectionTitle = () => {
        switch (view) {
            case 'today': return 'משימות להיום';
            case 'tomorrow': return 'משימות למחר';
            case 'week': return 'משימות לשבוע';
            default: return 'משימות';
        }
    };

    const getHeaderStats = () => {
        if (view === 'today') {
            if (tasks.length === 0 && habitsForTodayCount === 0) {
                return 'יום רגוע – אין לך משימות או הרגלים פתוחים.';
            }
            const parts: string[] = [];
            if (tasks.length > 0) parts.push(`${tasks.length} משימות`);
            if (habitsForTodayCount > 0) parts.push(`${habitsForTodayCount} הרגלים`);
            if (overdueTasksCount > 0) parts.push(`${overdueTasksCount} איחרו`);
            return parts.join(' · ');
        }
        if (view === 'tomorrow') {
            return tasks.length > 0
                ? `${tasks.length} משימות מתוכננות`
                : 'אין עדיין משימות למחר.';
        }
        if (view === 'week') {
            return tasks.length > 0
                ? `${tasks.length} משימות השבוע`
                : 'אין משימות לשבוע הקרוב.';
        }
        return '';
    };

    return (
        <div className={`pt-4 pb-8 space-y-8 transition-all duration-300 ${focusMode ? 'focus-mode' : ''}`}>
            <header ref={headerRef} className="sticky top-0 bg-[var(--bg-primary)]/90 backdrop-blur-xl py-3 z-20 -mx-4 px-4 transition-transform,opacity duration-300 border-b border-[var(--border-primary)] shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <DailyProgressCircle percentage={completionPercentage} />
                        <div>
                            <h1 className="hero-title tracking-tight">{settings.screenLabels?.today || 'היום'}</h1>
                            <p className="text-sm font-medium text-[var(--dynamic-accent-highlight)] opacity-90">{todayDate}</p>
                            <p className="text-xs mt-0.5 text-[var(--text-secondary)] opacity-80">
                                {getHeaderStats()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openModal('splitViewConfig')} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" aria-label="פתח מסך מפוצל">
                            <SplitScreenIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => setFocusMode(!focusMode)} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" aria-label={focusMode ? "כבה מצב פוקוס" : "הפעל מצב פוקוס"}>
                            {focusMode ? <EyeOffIcon className="w-6 h-6 text-[var(--dynamic-accent-start)]" /> : <EyeIcon className="w-6 h-6" />}
                        </button>
                        <button onClick={handleStartGlobalFocus} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" aria-label="התחל סשן פוקוס כללי">
                            <StopwatchIcon className="w-6 h-6" />
                        </button>
                        <button onClick={handleGetBriefing} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" aria-label="הצג תדריך יומי">
                            <SparklesIcon className="w-6 h-6 text-[var(--accent-highlight)]" />
                        </button>
                        <button onClick={() => setActiveScreen('settings')} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" aria-label="פתח הגדרות">
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <ComfortZoneWidget />
                <QuoteWidget />
            </div>

            <Section
                componentId="dashboard"
                title="דשבורד יומי"
                count={0}
                isCollapsible={true}
                isExpanded={!collapsedSections.includes('dashboard')}
                onToggle={() => handleToggleCollapse('dashboard')}
                className="px-4 animate-screen-enter"
            >
                <Dashboard
                    tasks={personalItems.filter(i => i.type === 'task')}
                    habits={habits}
                    personalItems={personalItems}
                    forecast={productivityForecast}
                    isLoadingForecast={isForecastLoading}
                />
            </Section>

            <div className="animate-screen-enter px-4">
                <ViewSwitcher currentView={view} onViewChange={setView} />
            </div>

            <div className="animate-screen-enter">
                <QuickAddTask onItemAdded={(message) => showStatus('success', message)} />
                <div className="mt-8 space-y-8">
                    {isLoading ? <SkeletonLoader count={5} /> : (
                        <>
                            <Section
                                componentId="tasks"
                                title={getSectionTitle()}
                                count={tasks.length}
                                isCollapsible={true}
                                isExpanded={!collapsedSections.includes('tasks')}
                                onToggle={() => handleToggleCollapse('tasks')}
                                className="pl-8"
                                emptyMessage="אין משימות לתצוגה זו."
                            >
                                <div onDrop={tasksReordering.handleDrop}>
                                    {tasks.map((item, index) => (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => tasksReordering.handleDragStart(e, item)}
                                            onDragEnter={(e) => tasksReordering.handleDragEnter(e, item)}
                                            onDragEnd={tasksReordering.handleDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            className={`transition-opacity duration-300 ${tasksReordering.draggingItem?.id === item.id ? 'dragging-item' : ''} cursor-grab`}
                                        >
                                            <TaskItem
                                                item={item}
                                                onUpdate={handleUpdateItem}
                                                onDelete={handleDeleteItem}
                                                onSelect={handleSelectItem}
                                                onContextMenu={handleContextMenu}
                                                onStartFocus={handleStartFocus}
                                                index={index}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {view === 'today' && overdueTasksCount > 0 && !collapsedSections.includes('tasks') && (
                                    <button
                                        onClick={handleRollOverTasks}
                                        className="mt-4 text-sm w-full flex items-center justify-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] text-[var(--dynamic-accent-highlight)] font-bold py-2 px-4 rounded-xl transition-colors"
                                    >
                                        <CheckSquareIcon className="w-5 h-5" />
                                        גלגל {overdueTasksCount} משימות שעבר זמנן
                                    </button>
                                )}
                            </Section>

                            {completedTodayTasks.length > 0 && (
                                <Section
                                    componentId="completed_today"
                                    title="משימות שסיימת היום"
                                    count={completedTodayTasks.length}
                                    isCollapsible={true}
                                    isExpanded={!collapsedSections.includes('completed_today')}
                                    onToggle={() => handleToggleCollapse('completed_today')}
                                    className="pl-8 non-essential-section"
                                >
                                    <div className="space-y-3">
                                        {completedTodayTasks.map((item, index) => (
                                            <TaskItem
                                                key={item.id}
                                                item={item}
                                                onUpdate={handleUpdateItem}
                                                onDelete={handleDeleteItem}
                                                onSelect={handleSelectItem}
                                                onContextMenu={handleContextMenu}
                                                onStartFocus={handleStartFocus}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            <Section
                                componentId="fixed_habits"
                                title="הרגלים קבועים"
                                count={habits.length}
                                isCollapsible={true}
                                isExpanded={!collapsedSections.includes('fixed_habits')}
                                onToggle={() => handleToggleCollapse('fixed_habits')}
                                className="pl-8 non-essential-section"
                                emptyMessage="עוד לא יצרת הרגלים קבועים."
                            >
                                <div onDrop={habitsReordering.handleDrop}>
                                    {habits.map((item, index) => (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => habitsReordering.handleDragStart(e, item)}
                                            onDragEnter={(e) => habitsReordering.handleDragEnter(e, item)}
                                            onDragEnd={habitsReordering.handleDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            className={`transition-opacity duration-300 ${habitsReordering.draggingItem?.id === item.id ? 'dragging-item' : ''} cursor-grab`}
                                        >
                                            <HabitItem
                                                item={item}
                                                onUpdate={handleUpdateItem}
                                                onDelete={handleDeleteItem}
                                                onSelect={handleSelectItem}
                                                onContextMenu={handleContextMenu}
                                                index={index}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        </>
                    )}
                </div>
            </div>

            {selectedItem && (
                <PersonalItemDetailModal
                    item={selectedItem}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteWithConfirmation}
                />
            )}
            {contextMenu.isOpen && contextMenu.item && (
                <PersonalItemContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    item={contextMenu.item}
                    onClose={closeContextMenu}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    onDuplicate={handleDuplicateItem}
                    onStartFocus={handleStartFocus}
                />
            )}
            {(isBriefingLoading || briefingContent) && (
                <DailyBriefingModal
                    isLoading={isBriefingLoading}
                    briefingContent={briefingContent}
                    onClose={() => setBriefingContent('')}
                />
            )}
            {statusMessage && (
                <StatusMessage
                    key={statusMessage.id}
                    type={statusMessage.type}
                    message={statusMessage.text}
                    onDismiss={() => setStatusMessage(null)}
                    onUndo={statusMessage.onUndo}
                />
            )}
        </div>
    );
};

export default HomeScreen;
