import React, { useState, useMemo, useCallback, useRef, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalItem, Screen, Space, AddableType, Attachment } from '../types';
import PersonalItemDetailModal from '../components/PersonalItemDetailModal';
import PersonalItemContextMenu from '../components/PersonalItemContextMenu';
import ProjectDetailScreen from './ProjectDetailScreen';
import {
  InboxIcon,
  ChevronLeftIcon,
  FileIcon,
} from '../components/icons';

import SkeletonLoader from '../components/SkeletonLoader';
import { duplicatePersonalItem, reAddPersonalItem } from '../services/dataService';
import { useContextMenu } from '../hooks/useContextMenu';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import SpaceDetailScreen from './SpaceDetailScreen';
import PersonalItemCard from '../components/PersonalItemCard';
import { useDebounce } from '../hooks/useDebounce';
import { useItemReordering } from '../hooks/useItemReordering';
import { useModal } from '../state/ModalContext';
import QuickNoteModal from '../components/QuickNoteModal';

// Lazy loaded heavy components for code splitting
const KanbanView = lazy(() => import('../components/KanbanView'));
const CalendarView = lazy(() => import('../components/CalendarView'));
const TimelineView = lazy(() => import('../components/TimelineView'));
const PasswordManager = lazy(() => import('../components/password/PasswordManager'));
const InvestmentsScreen = lazy(() => import('./InvestmentsScreen'));

import CategoryAccordion from '../components/CategoryAccordion';
import { useData } from '../src/contexts/DataContext';
import { useSettings } from '../src/contexts/SettingsContext';
import { useFocusSession } from '../src/contexts/FocusContext';

import {
  PremiumViewSwitcher,
  PremiumLibraryHeader,
  PremiumSpaceCard,
  PremiumQuickActionsFAB,
  PremiumLibraryEmptyState,
} from '../components/library';

type HubView = 'dashboard' | 'timeline' | 'board' | 'calendar' | 'vault' | 'investments' | 'files';
type ActiveView =
  | { type: HubView }
  | { type: 'project'; item: PersonalItem }
  | { type: 'space'; item: Space }
  | { type: 'inbox' };

const FileGallery: React.FC<{ items: PersonalItem[]; onSelect: (item: PersonalItem) => void }> = ({
  items,
  onSelect,
}) => {
  const allFiles = useMemo(() => {
    const files: { attachment: Attachment; parentItem: PersonalItem }[] = [];
    items.forEach(item => {
      if (item.attachments) {
        item.attachments.forEach(att => {
          files.push({ attachment: att, parentItem: item });
        });
      }
    });
    return files.sort(
      (a, b) =>
        new Date(b.parentItem.createdAt).getTime() - new Date(a.parentItem.createdAt).getTime()
    );
  }, [items]);

  if (allFiles.length === 0) {
    return (
      <PremiumLibraryEmptyState
        type="files"
        onAction={() => { }}
        actionLabel="העלה קובץ"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 px-0 sm:px-4">
      {allFiles.map((fileData, index) => {
        const { attachment, parentItem } = fileData;
        const isImage = attachment.mimeType.startsWith('image/');
        const isVideo = attachment.mimeType.startsWith('video/');

        return (
          <motion.button
            key={`${parentItem.id}-${index}`}
            onClick={() => onSelect(parentItem)}
            className="group relative aspect-square rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {isImage ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            ) : isVideo ? (
              <div className="w-full h-full bg-black flex items-center justify-center relative">
                <video src={attachment.url} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className={`screen-shell h-full flex flex-col transition-all duration-300 text-center`}>
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  <FileIcon className="w-7 h-7 text-gray-400 group-hover:text-[var(--dynamic-accent-start)] transition-colors" />
                </motion.div>
                <span className="text-sm font-semibold text-white line-clamp-2 break-all">
                  {attachment.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {Math.round(attachment.size / 1024)} KB
                </span>
              </div>
            )}

            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-white font-semibold truncate">{parentItem.title}</p>
              <p className="text-xs text-gray-400 truncate">{attachment.name}</p>
            </motion.div>

            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                boxShadow: '0 0 30px var(--dynamic-accent-glow)',
              }}
            />
          </motion.button>
        );
      })}
    </div>
  );
};

const LibraryScreen: React.FC<{ setActiveScreen: (screen: Screen) => void }> = ({
  setActiveScreen,
}) => {
  const {
    personalItems,
    spaces,
    isLoading,
    updatePersonalItem,
    removePersonalItem,
    updateSpace,
    refreshAll,
  } = useData();
  const { settings } = useSettings();

  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu<PersonalItem>();
  const { openModal } = useModal();

  const [activeView, setActiveView] = useState<ActiveView>({ type: 'dashboard' });
  const [selectedItem, setSelectedItem] = useState<PersonalItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => void;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const dragSpace = useRef<Space | null>(null);
  const dragOverSpace = useRef<Space | null>(null);
  const [draggingSpace, setDraggingSpace] = useState<Space | null>(null);

  const [quickNoteDate, setQuickNoteDate] = useState<string | null>(null);

  const showStatus = useCallback((type: StatusMessageType, text: string, onUndo?: () => void) => {
    setStatusMessage({ type, text, id: Date.now(), onUndo });
  }, []);

  const handleQuickAdd = (type: AddableType, defaults: Partial<PersonalItem> = {}) => {
    sessionStorage.setItem('preselect_add', type);
    sessionStorage.setItem('preselect_add_defaults', JSON.stringify(defaults));
    setActiveScreen('add');
  };

  const handleCalendarQuickAdd = (date: string) => {
    setQuickNoteDate(date);
  };

  const handleUpdateItem = useCallback(
    async (id: string, updates: Partial<PersonalItem>) => {
      const originalItem = personalItems.find(item => item.id === id);
      if (!originalItem) return;

      setSelectedItem(prev => (prev && prev.id === id ? { ...prev, ...updates } : prev));

      try {
        await updatePersonalItem(id, updates);
      } catch (error) {
        console.error('Failed to update item:', error);
        setSelectedItem(prev => (prev && prev.id === id ? originalItem : prev));
        showStatus('error', 'שגיאה בעדכון הפריט.');
      }
    },
    [personalItems, showStatus, updatePersonalItem]
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const itemToDelete = personalItems.find(item => item.id === id);
      if (!itemToDelete) return;

      await removePersonalItem(id);

      showStatus('success', 'הפריט נמחק.', async () => {
        await reAddPersonalItem(itemToDelete);
        await refreshAll();
      });
    },
    [personalItems, showStatus, removePersonalItem, refreshAll]
  );

  const handleSelectItem = useCallback(
    (item: PersonalItem, event?: React.MouseEvent | React.KeyboardEvent) => {
      event?.stopPropagation();
      if (item.type === 'roadmap') {
        openModal('roadmapScreen', {
          item,
          onUpdate: handleUpdateItem,
          onDelete: handleDeleteItem,
        });
        return;
      }
      setSelectedItem(item);
    },
    [openModal, handleUpdateItem, handleDeleteItem]
  );

  const handleCloseModal = useCallback((nextItem?: PersonalItem) => {
    setSelectedItem(nextItem || null);
  }, []);

  const handleDeleteWithConfirmation = useCallback(
    (id: string) => {
      const itemToDelete = personalItems.find(item => item.id === id);
      if (itemToDelete) {
        handleDeleteItem(id);
        setSelectedItem(null);
      }
    },
    [personalItems, handleDeleteItem]
  );

  const handleDuplicateItem = useCallback(
    async (id: string) => {
      await duplicatePersonalItem(id);
      await refreshAll();
      showStatus('success', 'הפריט שוכפל');
    },
    [refreshAll, showStatus]
  );

  const { startSession } = useFocusSession();

  const handleStartFocus = useCallback(
    (item: PersonalItem) => {
      startSession(item);
    },
    [startSession]
  );

  const { inboxItems, projectItems, personalSpaces } = useMemo(() => {
    const inbox = personalItems
      .filter(i => !i.spaceId && !i.projectId && i.type !== 'goal' && !i.dueDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const projects = personalItems
      .filter(i => i.type === 'roadmap')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pSpaces = spaces
      .filter(s => s.type === 'personal')
      .sort((a, b) => a.order - b.order);

    return { inboxItems: inbox, projectItems: projects, personalSpaces: pSpaces };
  }, [personalItems, spaces]);

  const libraryStats = useMemo(() => {
    return {
      inbox: inboxItems.length,
      projects: projectItems.length,
      spaces: personalSpaces.length,
      total: personalItems.length,
    };
  }, [inboxItems.length, projectItems.length, personalSpaces.length, personalItems.length]);

  const inboxReordering = useItemReordering(inboxItems, handleUpdateItem);
  const projectReordering = useItemReordering(projectItems, handleUpdateItem);

  const handleSpaceDrop = () => {
    const draggedSpace = dragSpace.current;
    const targetSpace = dragOverSpace.current;

    if (!draggedSpace || !targetSpace || draggedSpace.id === targetSpace.id) {
      setDraggingSpace(null);
      return;
    }

    const currentSpaces = [...personalSpaces];
    const dragItemIndex = currentSpaces.findIndex(s => s.id === draggedSpace.id);
    const dragOverItemIndex = currentSpaces.findIndex(s => s.id === targetSpace.id);

    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;

    let newOrder: number;

    if (dragItemIndex > dragOverItemIndex) {
      const prevItem = currentSpaces[dragOverItemIndex - 1];
      const nextItem = currentSpaces[dragOverItemIndex];
      if (prevItem && nextItem) {
        newOrder = (prevItem.order + nextItem.order) / 2;
      } else if (nextItem) {
        newOrder = nextItem.order - 1000;
      } else {
        newOrder = draggedSpace.order;
      }
    } else {
      const prevItem = currentSpaces[dragOverItemIndex];
      const nextItem = currentSpaces[dragOverItemIndex + 1];
      if (prevItem && nextItem) {
        newOrder = (prevItem.order + nextItem.order) / 2;
      } else if (prevItem) {
        newOrder = prevItem.order + 1000;
      } else {
        newOrder = draggedSpace.order;
      }
    }

    const updates = { order: newOrder };

    updateSpace(draggedSpace.id, updates).catch(err => {
      console.error('Failed to update space order:', err);
    });

    setDraggingSpace(null);
    dragSpace.current = null;
    dragOverSpace.current = null;
  };

  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const lowerCaseQuery = debouncedQuery.toLowerCase();
    return personalItems.filter(
      item =>
        (item.title && item.title.toLowerCase().includes(lowerCaseQuery)) ||
        (item.content && item.content.toLowerCase().includes(lowerCaseQuery))
    );
  }, [debouncedQuery, personalItems]);

  const getProjectData = (project: PersonalItem) => {
    const childItems = personalItems.filter(i => i.projectId === project.id);
    const childTasks = childItems.filter(
      i => i.type === 'task' || i.type === 'roadmap' || (i.phases && i.phases.length > 0)
    );

    const completedTasks = childTasks.reduce((acc, i) => {
      if (i.type === 'task' && i.isCompleted) return acc + 1;
      if (i.type === 'roadmap' && i.phases)
        return acc + i.phases.flatMap(p => p.tasks).filter(t => t.isCompleted).length;
      return acc;
    }, 0);

    const totalTasks = childTasks.reduce((acc, i) => {
      if (i.type === 'task') return acc + 1;
      if (i.type === 'roadmap' && i.phases) return acc + i.phases.flatMap(p => p.tasks).length;
      return acc;
    }, 0);

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      id: project.id,
      name: project.title || 'ללא שם',
      status: project.isCompleted ? ('completed' as const) : ('active' as const),
      progress,
      totalTasks,
      completedTasks,
      dueDate: project.dueDate,
      color: 'var(--dynamic-accent-start)',
      icon: undefined,
      isPinned: false,
      description: project.content,
    };
  };

  const getSpaceData = (space: Space) => {
    const itemCount = personalItems.filter(i => i.spaceId === space.id).length;
    return {
      id: space.id,
      name: space.name,
      icon: space.icon || '📁',
      color: space.color || 'var(--dynamic-accent-start)',
      itemCount,
      description: undefined,
    };
  };

  const renderMainHub = () => {
    const hasTimelineItems = personalItems.some(i => i.dueDate);
    const shouldShowProjectsEmpty = !isLoading && projectItems.length === 0;
    const shouldShowSpacesEmpty = !isLoading && personalSpaces.length === 0;
    const shouldShowInboxEmpty = !isLoading && inboxItems.length === 0;

    return (
      <div className="relative min-h-screen">
        <PremiumLibraryHeader
          title={settings.screenLabels?.library || 'המתכנן'}
          stats={libraryStats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSettings={() => setActiveScreen('settings')}
          onOpenAssistant={() => setActiveScreen('assistant')}

        />

        <AnimatePresence mode="wait">
          {debouncedQuery ? (
            <motion.div
              key="search-results"
              className="px-4 space-y-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-sm text-gray-400">
                {searchResults.length} תוצאות נמצאו עבור "{debouncedQuery}"
              </p>
              {searchResults.length === 0 && (
                <PremiumLibraryEmptyState type="general" />
              )}
              {searchResults.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PersonalItemCard
                    item={item}
                    index={index}
                    searchQuery={debouncedQuery}
                    onSelect={handleSelectItem}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    onContextMenu={handleContextMenu}
                    onLongPress={() => { }}
                    isInSelectionMode={false}
                    isSelected={false}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="main-content"
              className={`transition-all duration-500 ${selectedItem ? 'opacity-50 scale-98' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-5xl mx-auto">
                <PremiumViewSwitcher
                  currentView={activeView.type as HubView}
                  onViewChange={view => setActiveView({ type: view })}
                />
              </div>

              <div className="pt-6 sm:pt-8 pb-32">
                {isLoading && <SkeletonLoader count={3} />}

                <AnimatePresence mode="wait">
                  {!isLoading && activeView.type === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      className="space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {inboxItems.length > 0 ? (
                        <motion.section
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <motion.button
                            onClick={() => setActiveView({ type: 'inbox' })}
                            className="w-full relative rounded-3xl overflow-hidden p-4 sm:p-5 flex justify-between items-center group"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              boxShadow: '0 18px 45px rgba(16, 185, 129, 0.25)',
                            }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <motion.div
                                className="p-2.5 sm:p-3 rounded-2xl"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.25)',
                                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
                                }}
                                animate={{
                                  boxShadow: [
                                    '0 0 0px rgba(16, 185, 129, 0)',
                                    '0 0 30px rgba(16, 185, 129, 0.6)',
                                    '0 0 0px rgba(16, 185, 129, 0)',
                                  ],
                                }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                              >
                                <InboxIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
                              </motion.div>
                              <div className="text-right">
                                <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
                                  תיבת דואר נכנס
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-400">
                                  פריטים שממתינים לארגון
                                </p>
                              </div>
                            </div>
                            <motion.span
                              className="text-xl sm:text-2xl font-bold font-mono px-3 sm:px-4 py-1.5 sm:py-2 rounded-full"
                              style={{
                                background: 'rgba(16, 185, 129, 0.25)',
                                color: '#10B981',
                              }}
                              animate={{
                                scale: [1, 1.05, 1],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {inboxItems.length}
                            </motion.span>

                            <motion.div
                              className="absolute inset-0 rounded-3xl pointer-events-none"
                              style={{
                                background:
                                  'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
                              }}
                              animate={{
                                opacity: [0, 0.6, 0],
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                          </motion.button>
                        </motion.section>
                      ) : (
                        <PremiumLibraryEmptyState
                          type="inbox"
                          onAction={() => handleQuickAdd('task')}
                          actionLabel="הוסף פריט חדש"
                        />
                      )}

                      {projectItems.length > 0 ? (
                        <motion.section
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h2
                            className="text-sm font-bold uppercase tracking-widest mb-4 px-1"
                            style={{ color: 'var(--dynamic-accent-start)' }}
                          >
                            מפות דרכים
                          </h2>
                          <div className="grid grid-cols-1 gap-3">
                            {projectItems.map((roadmap, index) => (
                              <motion.div
                                key={roadmap.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                              >
                                <PersonalItemCard
                                  item={roadmap}
                                  index={index}
                                  onSelect={handleSelectItem}
                                  onUpdate={handleUpdateItem}
                                  onDelete={handleDeleteItem}
                                  onContextMenu={handleContextMenu}
                                  onLongPress={() => { }}
                                  isInSelectionMode={false}
                                  isSelected={false}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </motion.section>
                      ) : (
                        shouldShowProjectsEmpty && (
                          <PremiumLibraryEmptyState
                            type="projects"
                            onAction={() => handleQuickAdd('roadmap')}
                            actionLabel="צור מפת דרכים חדשה"
                          />
                        )
                      )}

                      {personalItems.length > 0 && (
                        <motion.section
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h2
                            className="text-sm font-bold uppercase tracking-widest mb-4 px-1"
                            style={{ color: 'var(--dynamic-accent-start)' }}
                          >
                            כל הפריטים לפי קטגוריה
                          </h2>
                          <CategoryAccordion
                            items={personalItems}
                            onSelectItem={handleSelectItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
                            onContextMenu={handleContextMenu}
                            groupBy="type"
                          />
                        </motion.section>
                      )}

                      {personalSpaces.length > 0 ? (
                        <motion.section
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <h2
                            className="text-sm font-bold uppercase tracking-widest mb-4 px-1"
                            style={{ color: 'var(--dynamic-accent-start)' }}
                          >
                            מרחבים
                          </h2>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                            {personalSpaces.map((space, index) => (
                              <PremiumSpaceCard
                                key={space.id}
                                space={getSpaceData(space)}
                                onOpen={() => setActiveView({ type: 'space', item: space })}
                                index={index}
                              />
                            ))}
                          </div>
                        </motion.section>
                      ) : (
                        shouldShowSpacesEmpty && (
                          <PremiumLibraryEmptyState
                            type="spaces"
                            onAction={() => openModal('manageSpaces')}
                            actionLabel="צור מרחב חדש"
                          />
                        )
                      )}
                    </motion.div>
                  )}

                  {!isLoading && activeView.type === 'timeline' && (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="px-4 sm:px-6 lg:px-8"
                    >
                      <div className="max-w-5xl mx-auto">
                        <header className="mb-6 flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-1 px-1"
                              style={{ color: 'var(--dynamic-accent-start)' }}>
                              ציר זמן
                            </h2>
                            <p className="text-xs text-gray-400 px-1">
                              מבט כרונולוגי על כל מה שחשוב לך, עם חיבורים חכמים בין משימות, פרויקטים ומרחבים
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                              ⌘K לפתיחת פקודות
                            </div>
                            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                              ⌘F לחיפוש
                            </div>
                          </div>
                        </header>

                        {hasTimelineItems ? (
                          <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 via-white/0 to-white/5 backdrop-blur-xl p-2 sm:p-4">
                            <TimelineView
                              items={personalItems}
                              onSelectItem={handleSelectItem}
                              onUpdate={handleUpdateItem}
                              onDelete={handleDeleteItem}
                              onContextMenu={handleContextMenu}
                              onLongPress={() => { }}
                            />
                          </div>
                        ) : (
                          <PremiumLibraryEmptyState
                            type="timeline"
                            onAction={() => handleQuickAdd('task')}
                            actionLabel="הוסף משימה עם תאריך יעד"
                          />
                        )}
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && activeView.type === 'board' && (
                    <motion.div
                      key="board"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="px-4 sm:px-6 lg:px-8"
                    >
                      <div className="max-w-6xl mx-auto space-y-4">
                        <header className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-1 px-1"
                              style={{ color: 'var(--dynamic-accent-start)' }}>
                              לוח משימות
                            </h2>
                            <p className="text-xs text-gray-400 px-1">
                              גרור ושחרר משימות בין מצבים שונים, עם חוויית DnD חלקה וויזואליות פרימיום
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                              גרירה עם העכבר להזזה
                            </div>
                          </div>
                        </header>

                        <div
                          className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 via-white/0 to-white/5 backdrop-blur-xl p-2 sm:p-3 lg:p-4"
                          style={{
                            boxShadow: '0 24px 80px rgba(15,23,42,0.65)',
                          }}
                        >
                          <KanbanView
                            items={personalItems}
                            onUpdate={handleUpdateItem}
                            onSelectItem={handleSelectItem}
                            onQuickAdd={({ type, defaultStatus }) =>
                              handleQuickAdd(type, { status: defaultStatus })
                            }
                            onDelete={handleDeleteItem}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && activeView.type === 'calendar' && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="px-4 sm:px-6 lg:px-8"
                    >
                      <div className="max-w-6xl mx-auto space-y-4">
                        <header className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-1 px-1"
                              style={{ color: 'var(--dynamic-accent-start)' }}>
                              לוח שנה
                            </h2>
                            <p className="text-xs text-gray-400 px-1">
                              תצוגת זמן פרימיום עם הדגשה חכמה של היום, שבוע העבודה והאירועים הקרובים
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                              הקלקה כפולה ליצירת משימה
                            </div>
                          </div>
                        </header>

                        <div
                          className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 via-white/0 to-white/5 backdrop-blur-xl p-2 sm:p-3 lg:p-4"
                          style={{
                            boxShadow: '0 24px 80px rgba(15,23,42,0.65)',
                          }}
                        >
                          <CalendarView
                            items={personalItems}
                            onUpdate={handleUpdateItem}
                            onSelectItem={(item, e) => handleSelectItem(item, e)}
                            onQuickAdd={(_, date) => handleCalendarQuickAdd(date)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && activeView.type === 'files' && (
                    <motion.div
                      key="files"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="px-4 sm:px-6 lg:px-8"
                    >
                      <div className="max-w-6xl mx-auto space-y-4">
                        <header className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest mb-1 px-1"
                              style={{ color: 'var(--dynamic-accent-start)' }}>
                              קבצים ומסמכים
                            </h2>
                            <p className="text-xs text-gray-400 px-1">
                              כל הקבצים שלך במקום אחד, עם תצוגת גלריה פרימיום ותצוגה מקדימה מהירה
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                              גרור קובץ לכאן כדי להעלות
                            </div>
                          </div>
                        </header>

                        <div
                          className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 via-white/0 to-white/5 backdrop-blur-xl p-3 sm:p-4"
                          style={{
                            boxShadow: '0 24px 80px rgba(15,23,42,0.65)',
                          }}
                        >
                          <FileGallery
                            items={personalItems}
                            onSelect={item => handleSelectItem(item)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && activeView.type === 'investments' && (
                    <motion.div
                      key="investments"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <InvestmentsScreen setActiveScreen={setActiveScreen} />
                    </motion.div>
                  )}

                  {!isLoading && activeView.type === 'vault' && (
                    <motion.div
                      key="vault"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <PasswordManager />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PremiumQuickActionsFAB
          onAddTask={() => handleQuickAdd('task')}
          onAddNote={() => handleQuickAdd('note')}
          onAddIdea={() => handleQuickAdd('idea')}
          onAddBook={() => handleQuickAdd('book')}
          onAddWorkout={() => handleQuickAdd('workout')}
          onAddLink={() => handleQuickAdd('link')}
        />
      </div>
    );
  };

  if (activeView.type === 'project') {
    return (
      <ProjectDetailScreen
        project={activeView.item}
        onBack={() => setActiveView({ type: 'dashboard' })}
        onSelectItem={handleSelectItem}
      />
    );
  }

  if (activeView.type === 'space') {
    return (
      <SpaceDetailScreen
        space={activeView.item}
        onBack={() => setActiveView({ type: 'dashboard' })}
        onSelectItem={handleSelectItem}
      />
    );
  }

  if (activeView.type === 'inbox') {
    const contextItems = inboxItems;
    return (
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
      >
        <header className="sticky top-0 z-20 px-4 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setActiveView({ type: 'dashboard' })}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="חזור לדשבורד"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white font-heading">תיבת דואר נכנס</h1>
              <p className="text-sm text-gray-400">{inboxItems.length} פריטים ממתינים</p>
            </div>
          </div>
        </header>

        <div className="space-y-3 px-4 pt-4 pb-32" onDrop={inboxReordering.handleDrop}>
          {inboxItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <PersonalItemCard
                item={item}
                index={index}
                onSelect={handleSelectItem}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onContextMenu={handleContextMenu}
                onLongPress={() => { }}
                isInSelectionMode={false}
                isSelected={false}
                onDragStart={(e, item) => inboxReordering.handleDragStart(e, item)}
                onDragEnter={(e, item) => inboxReordering.handleDragEnter(e, item)}
                onDragEnd={inboxReordering.handleDragEnd}
                isDragging={inboxReordering.draggingItem?.id === item.id}
              />
            </motion.div>
          ))}
        </div>

        {selectedItem && (
          <PersonalItemDetailModal
            item={selectedItem}
            contextItems={contextItems}
            onClose={handleCloseModal}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteWithConfirmation}
          />
        )}
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {renderMainHub()}

      <PersonalItemDetailModal
        item={selectedItem}
        onClose={handleCloseModal}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteWithConfirmation}
      />

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

      {quickNoteDate && (
        <QuickNoteModal date={quickNoteDate} onClose={() => setQuickNoteDate(null)} />
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

export default React.memo(LibraryScreen);
