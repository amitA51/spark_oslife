import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { PersonalItem, Space, Screen } from '../types';
import PersonalItemCard from '../components/PersonalItemCard';
import { ChevronLeftIcon, SparklesIcon, PlusIcon, PinIcon } from '../components/icons';
import KanbanView from '../components/KanbanView';
import { reAddPersonalItem } from '../services/dataService';
import { summarizeSpaceContent } from '../services/geminiService';
import { getIconForName } from '../components/IconMap';
import SpaceSummaryModal from '../components/SpaceSummaryModal';
import { useItemReordering } from '../hooks/useItemReordering';
import PersonalItemDetailModal from '../components/PersonalItemDetailModal';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import { useModal } from '../state/ModalContext';
import { useData } from '../src/contexts/DataContext';
import { SpaceItemFilterBar } from '../components/library/SpaceItemFilterBar';

interface SpaceDetailScreenProps {
  space: Space;
  onBack: () => void;
  onSelectItem: (item: PersonalItem, event?: React.MouseEvent | React.KeyboardEvent) => void;
  setActiveScreen: (screen: Screen) => void;
}

const SpaceDetailScreen: React.FC<SpaceDetailScreenProps> = ({ space, onBack, setActiveScreen }) => {
  const { personalItems, updatePersonalItem, removePersonalItem, refreshAll } = useData();
  const { openModal } = useModal();

  // UI State
  const [view, setView] = useState<'list' | 'board' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'name' | 'status'>('date');
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority' | 'type'>('none');
  const [showFilters, setShowFilters] = useState(false);

  // Summary State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // Modal / Selection State
  const [selectedItem, setSelectedItem] = useState<PersonalItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => void;
  } | null>(null);

  const showStatus = useCallback((type: StatusMessageType, text: string, onUndo?: () => void) => {
    setStatusMessage({ type, text, id: Date.now(), onUndo });
  }, []);

  const handleCloseModal = (nextItem?: PersonalItem) => setSelectedItem(nextItem || null);

  // --- Data Logic ---

  const spaceItems = useMemo(() => {
    let items = personalItems.filter(item => item.spaceId === space.id);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => (i.title || '').toLowerCase().includes(q) || (i.content || '').toLowerCase().includes(q));
    }

    // Sort
    items.sort((a, b) => {
      // Pinned always top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return (pMap[b.priority || 'low'] || 0) - (pMap[a.priority || 'low'] || 0);
      }
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'status') return (a.isCompleted === b.isCompleted) ? 0 : a.isCompleted ? 1 : -1;

      // Default: Date (Newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return items;
  }, [personalItems, space.id, searchQuery, sortBy]);

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') return { 'All': spaceItems };

    const groups: Record<string, PersonalItem[]> = {};
    spaceItems.forEach(item => {
      let key = 'Other';
      if (groupBy === 'status') key = item.isCompleted ? 'Completed' : 'Active';
      if (groupBy === 'priority') key = item.priority || 'No Priority';
      if (groupBy === 'type') key = item.type;

      if (!groups[key]) groups[key] = [];
      groups[key]!.push(item);
    });
    return groups;
  }, [spaceItems, groupBy]);


  const handleUpdateItem = useCallback(
    async (id: string, updates: Partial<PersonalItem>) => {
      const originalItem = personalItems.find(item => item.id === id);
      if (!originalItem) return;
      if (selectedItem?.id === id) {
        setSelectedItem(prev => (prev ? { ...prev, ...updates } : null));
      }
      try {
        const updated = await updatePersonalItem(id, updates);
        if (selectedItem?.id === id) {
          setSelectedItem(updated);
        }
      } catch (error) {
        console.error('Failed to update item:', error);
        if (selectedItem?.id === id) {
          setSelectedItem(originalItem);
        }
      }
    },
    [personalItems, selectedItem, updatePersonalItem]
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

  const handleDeleteWithConfirmation = useCallback(
    (id: string) => {
      const itemToDelete = personalItems.find(item => item.id === id);
      if (itemToDelete && window.confirm(`האם למחוק את "${itemToDelete.title}"?`)) {
        handleDeleteItem(id);
        setSelectedItem(null); // Close modal
      }
    },
    [personalItems, handleDeleteItem]
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

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeSpaceContent(spaceItems, space.name);
      setSummary(result);
    } catch (error) {
      console.error('Failed to summarize space', error);
      setSummary('שגיאה בעת יצירת הסיכום.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const { draggingItem, handleDragStart, handleDragEnter, handleDragEnd, handleDrop } =
    useItemReordering(spaceItems, handleUpdateItem);

  const Icon = getIconForName(space.icon);

  // Calculate active filters count
  const activeFiltersCount = (searchQuery ? 1 : 0) + (sortBy !== 'date' ? 1 : 0) + (groupBy !== 'none' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] animate-screen-enter pb-20">

      {/* Spectacular Header */}
      <motion.header
        className="relative overflow-hidden z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Background Gradient/Mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(180deg, ${space.color}40 0%, transparent 100%)`
            } as any}
          />
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[100px]"
            style={{ background: space.color } as any}
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative px-4 pt-4 pb-0">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/5 transition-all active:scale-95"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSummarize}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-yellow-400 backdrop-blur-md border border-white/5 transition-all active:scale-95"
                title="סיכום AI"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Title Area */}
          <div className="flex items-end justify-between mb-8">
            <div className="flex items-center gap-5">
              <motion.div
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-xl border border-white/10 text-4xl"
                style={{
                  background: `linear-gradient(135deg, ${space.color}20 0%, ${space.color}05 100%)`,
                  boxShadow: `0 8px 32px -4px ${space.color}30`
                } as any}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Icon className="w-10 h-10" style={{ color: space.color }} />
              </motion.div>

              <div>
                <motion.div
                  className="flex items-center gap-2 mb-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-xs font-bold tracking-wider uppercase opacity-60">מרחב עבודה</span>
                  {space.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">{space.category}</span>
                  )}
                </motion.div>
                <motion.h1
                  className="text-4xl font-bold text-white font-heading tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {space.name}
                </motion.h1>
                {space.tags && (
                  <div className="flex gap-2 mt-2">
                    {space.tags.map(tag => (
                      <span key={tag} className="text-xs text-white/50">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Progress/Stats could go here */}
            <div className="hidden sm:block text-right">
              <span className="block text-3xl font-bold text-white">{spaceItems.length}</span>
              <span className="text-xs text-white/40 uppercase tracking-widest">פריטים</span>
            </div>
          </div>

          {/* Filter Bar */}
          <SpaceItemFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            groupBy={groupBy}
            onGroupChange={setGroupBy}
            viewMode={view}
            onViewChange={setView}
            activeFilters={activeFiltersCount}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
        </div>
      </motion.header>

      {/* Content Area */}
      <div className="px-4">
        {view === 'board' ? (
          <KanbanView
            items={spaceItems}
            onUpdate={handleUpdateItem}
            onSelectItem={(item, e) => handleSelectItem(item, e)}
            onQuickAdd={() => { }}
            onDelete={handleDeleteItem}
          />
        ) : (
          <div className={`space-y-8 ${view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0' : ''}`}>

            {/* Pinned Section (if not grouping and in list/grid view) */}
            {groupBy === 'none' && spaceItems.some(i => i.isPinned) && (
              <div className={view === 'grid' ? 'col-span-full' : ''}>
                <h3 className="text-xs font-bold text-[var(--dynamic-accent-start)] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <PinIcon className="w-3 h-3" /> נעוצים
                </h3>
                <div className={`gap-3 ${view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}`}>
                  {spaceItems.filter(i => i.isPinned).map((item, index) => (
                    <PersonalItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onSelect={handleSelectItem}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onContextMenu={() => { }}
                      onLongPress={() => { }}
                      isInSelectionMode={false}
                      isSelected={false}
                      spaceColor={space.color}
                    // Pass handleTogglePin if Card supports it, currently it might not, need to check Card props
                    // Since I cannot update Card in this run easily without risk, I assume Card needs update or I add action button
                    />
                  ))}
                </div>
                <div className="h-px bg-white/5 my-6" />
              </div>
            )}

            {/* Groups Loop */}
            {Object.entries(groupedItems).map(([groupName, items]) => (
              <div key={groupName} className={view === 'grid' ? 'col-span-full' : ''}>
                {groupBy !== 'none' && (
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 p-2 bg-white/5 rounded-lg w-max">
                    {groupName}
                    <span className="text-xs font-normal text-gray-400 bg-black/20 px-1.5 rounded-md">{items.length}</span>
                  </h2>
                )}

                <div
                  className={`gap-3 ${view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}`}
                  onDrop={view === 'list' && groupBy === 'none' ? handleDrop : undefined}
                >
                  {items.filter(i => groupBy !== 'none' || !i.isPinned).map((item, index) => (
                    <PersonalItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onSelect={handleSelectItem}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onContextMenu={() => { }}
                      onLongPress={() => { }}
                      isInSelectionMode={false}
                      isSelected={false}
                      spaceColor={space.color}
                      onDragStart={groupBy === 'none' && view === 'list' ? (e, item) => handleDragStart(e, item) : undefined}
                      onDragEnter={groupBy === 'none' && view === 'list' ? (e, item) => handleDragEnter(e, item) : undefined}
                      onDragEnd={groupBy === 'none' && view === 'list' ? handleDragEnd : undefined}
                      isDragging={draggingItem?.id === item.id}
                    />
                  ))}
                </div>
                {items.length === 0 && groupBy !== 'none' && (
                  <p className="text-xs text-gray-500 italic p-2">אין פריטים בקבוצה זו</p>
                )}
              </div>
            ))}

            {spaceItems.length === 0 && (
              <div className="text-center text-[var(--text-secondary)] mt-16 flex flex-col items-center col-span-full">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">המרחב ריק</h3>
                <p className="text-sm opacity-60">הוסף פריטים חדשים כדי להתחיל לעבוד</p>
              </div>
            )}
          </div>
        )}
      </div>

      {(isSummarizing || summary) && (
        <SpaceSummaryModal
          isLoading={isSummarizing}
          summary={summary}
          spaceName={space.name}
          onClose={() => setSummary(null)}
        />
      )}

      {selectedItem && (
        <PersonalItemDetailModal
          item={selectedItem}
          onClose={handleCloseModal}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteWithConfirmation}
          contextItems={spaceItems}
        />
      )}

      {/* FAB */}
      <motion.button
        onClick={() => {
          sessionStorage.setItem('preselect_add_defaults', JSON.stringify({ spaceId: space.id }));
          setActiveScreen('add');
        }}
        className="fixed bottom-6 left-6 w-14 h-14 bg-[var(--dynamic-accent-start)] text-white rounded-2xl shadow-2xl flex items-center justify-center z-30"
        style={{
          boxShadow: '0 8px 30px rgba(var(--dynamic-accent-rgb), 0.4)',
          background: `linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))`
        } as any}
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
      >
        <PlusIcon className="w-6 h-6" />
      </motion.button>

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

export default SpaceDetailScreen;
