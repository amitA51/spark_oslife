import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { PersonalItem, Screen } from '../types';
import HabitItem from '../components/HabitItem';
import PersonalItemDetailModal from '../components/PersonalItemDetailModal';
import PersonalItemContextMenu from '../components/PersonalItemContextMenu';
import DailyBriefingModal from '../components/DailyBriefingModal';
import QuickAddTask from '../components/QuickAddTask';
import DailyProgressCircle from '../components/DailyProgressCircle';
import { SettingsIcon, SparklesIcon, EyeIcon, StopwatchIcon } from '../components/icons';
import SkeletonLoader, { HomeScreenSkeleton } from '../components/SkeletonLoader';
import { useData } from '../src/contexts/DataContext';
import { useSettings } from '../src/contexts/SettingsContext';

import { generateDailyBriefing } from '../services/geminiService';
import { isHabitForToday } from '../hooks/useTodayItems';
import { useContextMenu } from '../hooks/useContextMenu';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import { useHomeInteraction } from '../hooks/useHomeInteraction';
import { rollOverIncompleteTasks } from '../services/dataService';
import { useHaptics } from '../hooks/useHaptics';
import { useItemReordering } from '../hooks/useItemReordering';

import ComfortZoneWidget from '../components/ComfortZoneWidget';
import Section from '../components/Section';
import type { ViewMode } from '../components/ViewSwitcher';
import MagazineQuoteWidget from '../components/widgets/MagazineQuoteWidget';
import TodayView from '../components/TodayView';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import DraggableModule from '../components/DraggableModule';
import { rafThrottle } from '../utils/performance';
import PremiumHeader from '../components/PremiumHeader';
import GratitudeTracker from '../components/GratitudeTracker';
import GoogleCalendarWidget from '../components/GoogleCalendarWidget';
import FocusTimerWidget from '../components/widgets/FocusTimerWidget';
import { HomeScreenComponentId } from '../types';
import { parseDate } from '../utils/dateUtils';

interface HomeScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveScreen }) => {
  const { personalItems, isLoading, updatePersonalItem } = useData();
  const { settings } = useSettings();
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu<PersonalItem>();
  const { triggerHaptic } = useHaptics();



  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => void;
  } | null>(null);
  const showStatus = useCallback(
    (type: StatusMessageType, text: string, onUndo?: () => void) => {
      if (type === 'error') {
        triggerHaptic('heavy');
      }
      setStatusMessage({ type, text, id: Date.now(), onUndo });
    },
    [triggerHaptic]
  );

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

  // PERFORMANCE: Use const instead of useState since view is always 'today'
  const view: ViewMode = 'today';

  const { updateSettings } = useSettings();

  const handleReorder = useCallback((newOrder: string[]) => {
    const currentLayout = settings.homeScreenLayout;
    const layoutMap = new Map(currentLayout.map(c => [c.id, c]));
    const hiddenItems = currentLayout.filter(c => !c.isVisible);

    const newLayout = [
      ...newOrder.map(id => layoutMap.get(id as HomeScreenComponentId)!),
      ...hiddenItems
    ];

    updateSettings({ homeScreenLayout: newLayout });
  }, [settings.homeScreenLayout, updateSettings]);

  const handleHideModule = useCallback((moduleId: string) => {
    const currentLayout = settings.homeScreenLayout;
    const newLayout = currentLayout.map(c =>
      c.id === moduleId ? { ...c, isVisible: false } : c
    );
    updateSettings({ homeScreenLayout: newLayout });
    triggerHaptic('light');
    showStatus('success', 'הרכיב הוסתר', () => {
      // Undo: revert the change
      const reverted = newLayout.map(c => c.id === moduleId ? { ...c, isVisible: true } : c);
      updateSettings({ homeScreenLayout: reverted });
    });
  }, [settings.homeScreenLayout, updateSettings, triggerHaptic, showStatus]);

  const handleRestoreModules = () => {
    const newLayout = settings.homeScreenLayout.map(c => ({ ...c, isVisible: true }));
    updateSettings({ homeScreenLayout: newLayout });
    triggerHaptic('medium');
  };

  const visibleModules = useMemo(() =>
    settings.homeScreenLayout.filter(c => c.isVisible).map(c => c.id),
    [settings.homeScreenLayout]
  );

  const hiddenModulesCount = useMemo(() =>
    settings.homeScreenLayout.filter(c => !c.isVisible).length,
    [settings.homeScreenLayout]
  );

  const { tasks, habits } = useMemo(() => {
    const allHabits = personalItems.filter(item => item.type === 'habit');
    const sortedAllHabits = allHabits.sort(
      (a, b) =>
        (a.order ?? new Date(a.createdAt).getTime()) - (b.order ?? new Date(b.createdAt).getTime())
    );

    const openTasks = personalItems.filter(item => item.type === 'task' && !item.isCompleted);

    let filteredTasks: PersonalItem[];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // parseDate imported from utils/dateUtils

    if (view === 'today') {
      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      filteredTasks = openTasks.filter(item => {
        if (!item.dueDate) return false;
        const dueDate = parseDate(item.dueDate);
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
    } else {
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
      return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
    });

    return {
      tasks: sortedTasks,
      habits: sortedAllHabits,
    };
  }, [personalItems, view]);

  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingContent, setBriefingContent] = useState('');
  const headerRef = useRef<HTMLElement>(null);

  const habitsReordering = useItemReordering(habits, handleUpdateItem, 'order');

  useEffect(() => {
    const handleScroll = rafThrottle(() => {
      if (headerRef.current) {
        const scrollY = window.scrollY;
        const translateY = Math.min(scrollY * 0.5, 150);
        headerRef.current.style.transform = `translateY(-${translateY}px)`;
        headerRef.current.style.opacity = `${Math.max(1 - scrollY / 200, 0)}`;
      }
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStartGlobalFocus = useCallback(() => {
    if (tasks.length > 0) {
      const item = tasks[0];
      if (item) {
        handleStartFocus(item);
      }
    } else {
      showStatus('success', 'אין משימות פתוחות להתמקד בהן.');
    }
  }, [tasks, handleStartFocus, showStatus]);

  const handleGetBriefing = useCallback(async () => {
    if (isBriefingLoading) return;
    setIsBriefingLoading(true);
    setBriefingContent('');
    try {
      const gratitudeItem = personalItems.find(
        item =>
          item.type === 'gratitude' &&
          new Date(item.createdAt).toDateString() === new Date().toDateString()
      );
      const habitsForBriefing = personalItems.filter(
        item => item.type === 'habit' && isHabitForToday(item)
      );
      const briefing = await generateDailyBriefing(
        tasks.slice(0, 3),
        habitsForBriefing,
        gratitudeItem?.content || null,
        settings.aiPersonality
      );
      setBriefingContent(briefing);
    } catch (error) {
      console.error(error);
      setBriefingContent('שגיאה בעת יצירת התדריך. אנא נסה שוב.');
    } finally {
      setIsBriefingLoading(false);
    }
  }, [isBriefingLoading, personalItems, tasks, settings.aiPersonality]);

  const handleRollOverTasks = useCallback(async () => {
    const updates = await rollOverIncompleteTasks();
    if (updates.length > 0) {
      await Promise.all(updates.map(update => updatePersonalItem(update.id, update.updates)));
      showStatus('success', `גלגלת ${updates.length} משימות להיום.`);
    } else {
      showStatus('success', 'אין משימות לגלגל.');
    }
  }, [updatePersonalItem, showStatus]);

  const { completionPercentage, overdueTasksCount } = useMemo(() => {
    const totalHabits = personalItems.filter(i => i.type === 'habit').length;
    const uncompletedHabitsToday = personalItems.filter(
      i => i.type === 'habit' && isHabitForToday(i)
    ).length;
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

  // PERFORMANCE: Memoize todayDate - only calculate once per mount
  const todayDate = useMemo(() => new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }), []);

  const renderModule = (moduleId: string) => {
    switch (moduleId) {
      case 'google_calendar':
        return (
          <DraggableModule id="google_calendar" onHide={() => handleHideModule('google_calendar')}>
            <div className="spark-card p-4 sm:p-6">
              <Section
                componentId="google_calendar"
                title={settings.sectionLabels.google_calendar}
                count={0} // Calendar widget handles its own count or doesn't show it
                isCollapsible={true}
                isExpanded={true}
                onToggle={() => { }}
                className="pl-2"
              >
                <GoogleCalendarWidget />
              </Section>
            </div>
          </DraggableModule>
        );
      case 'gratitude':
        return (
          <DraggableModule id="gratitude" onHide={() => handleHideModule('gratitude')}>
            <div className="spark-card p-4 sm:p-6">
              <Section
                componentId="gratitude"
                title={settings.sectionLabels.gratitude}
                count={0}
                isCollapsible={true}
                isExpanded={true}
                onToggle={() => { }}
                className="pl-2"
              >
                <GratitudeTracker />
              </Section>
            </div>
          </DraggableModule>
        );
      case 'comfort_zone':
        return null; // Now part of quote_comfort_row
      case 'quote':
        return null; // Now part of quote_comfort_row
      case 'quote_comfort_row':
        return (
          <DraggableModule id="quote_comfort_row" onHide={() => handleHideModule('quote_comfort_row' as HomeScreenComponentId)}>
            <div className="flex flex-col gap-4">
              <MagazineQuoteWidget title={settings.sectionLabels.quote} />
              <ComfortZoneWidget title={settings.sectionLabels.comfort_zone} />
            </div>
          </DraggableModule>
        );
      case 'focus_timer':
        return (
          <DraggableModule id="focus_timer" onHide={() => handleHideModule('focus_timer' as HomeScreenComponentId)}>
            <FocusTimerWidget />
          </DraggableModule>
        );
      case 'tasks':
        return (
          <DraggableModule id="tasks" onHide={() => handleHideModule('tasks')}>
            {/* Visual separator for main content area */}
            <div className="flex items-center gap-3 mb-4 opacity-40">
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">משימות ופעילות</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <div className="spark-card p-4 sm:p-6 space-y-4">
              <QuickAddTask onItemAdded={message => showStatus('success', message)} />
              {isLoading ? (
                <SkeletonLoader count={5} />
              ) : (
                <TodayView
                  tasks={tasks}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onSelectItem={item => handleSelectItem(item, { clientX: 0, clientY: 0 } as React.MouseEvent<HTMLElement>)}
                  onContextMenu={handleContextMenu}
                  onStartFocus={handleStartFocus}
                  onRollOverTasks={handleRollOverTasks}
                  overdueTasksCount={overdueTasksCount}
                />
              )}
            </div>
          </DraggableModule>
        );
      case 'habits':
        return (
          <DraggableModule id="habits" onHide={() => handleHideModule('habits')}>
            <div className="spark-card p-4 sm:p-6">
              <Section
                componentId="fixed_habits"
                title={settings.sectionLabels.habits}
                count={habits.length}
                isCollapsible={true}
                isExpanded={true}
                onToggle={() => { }}
                className="pl-2"
                emptyMessage="עוד לא יצרת הרגלים קבועים."
              >
                <div onDrop={habitsReordering.handleDrop}>
                  {habits.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={e => habitsReordering.handleDragStart(e, item)}
                      onDragEnter={e => habitsReordering.handleDragEnter(e, item)}
                      onDragEnd={habitsReordering.handleDragEnd}
                      onDragOver={e => e.preventDefault()}
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
            </div>
          </DraggableModule>
        );
      default:
        return null;
    }
  };


  // Show full-screen skeleton during initial load
  if (isLoading && personalItems.length === 0) {
    return <HomeScreenSkeleton />;
  }

  return (
    <div className="screen-shell space-y-5 sm:space-y-6 transition-all duration-300">
      {/* Clean Premium Header */}

      <PremiumHeader
        title={settings.screenLabels?.today || 'היום'}
        subtitle={todayDate}
        actions={
          <>
            <button
              onClick={handleStartGlobalFocus}
              className="p-2.5 rounded-xl bg-white/[0.03] text-white/70 hover:bg-accent-cyan/10 hover:text-accent-cyan transition-all duration-300 hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)] active:scale-95"
              aria-label="התחל סשן פוקוס"
            >
              <StopwatchIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleGetBriefing}
              className="p-2.5 rounded-xl bg-white/[0.03] text-white/70 hover:bg-accent-violet/10 hover:text-accent-violet transition-all duration-300 hover:shadow-[0_0_15px_-3px_rgba(167,139,250,0.3)] active:scale-95"
              aria-label="תדריך יומי"
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveScreen('settings')}
              className="p-2.5 rounded-xl bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all duration-300 active:scale-95"
              aria-label="הגדרות"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </>
        }
      >
        <DailyProgressCircle percentage={completionPercentage} />
      </PremiumHeader>

      <div className="flex flex-col gap-4">
        <Reorder.Group axis="y" values={visibleModules} onReorder={handleReorder} className="flex flex-col gap-4">
          {visibleModules.map(moduleId => (
            <React.Fragment key={moduleId}>{renderModule(moduleId)}</React.Fragment>
          ))}
        </Reorder.Group>
      </div>

      <AnimatePresence>
        {hiddenModulesCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex justify-center mt-8"
          >
            <button
              onClick={handleRestoreModules}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.02] hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-all duration-300 text-sm backdrop-blur-md border border-[var(--ql-border-invisible)] hover:border-[var(--ql-border-subtle)] active:scale-95"
            >
              <EyeIcon className="w-4 h-4" />
              הצג רכיבים מוסתרים ({hiddenModulesCount})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

export default React.memo(HomeScreen);
