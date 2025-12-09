import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { FeedItem, RssFeed } from '../types';
import type { Screen } from '../types';
import FeedCard from '../components/FeedCard';
import ItemDetailModal from '../components/ItemDetailModal';
import SynthesisModal from '../components/SynthesisModal';
import FeedSkeleton from '../components/FeedSkeleton';
import EmptyState from '../components/EmptyState';
import ContextMenu from '../components/ContextMenu';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import { summarizeItemContent } from '../services/geminiService';
import * as dataService from '../services/dataService';
import { refreshAllFeeds } from '../services/feedService';
import {
  RefreshIcon,
  CloseIcon,
  SettingsIcon,
  CheckCheckIcon,
  BookOpenIcon,
  TrashIcon,
  SplitScreenIcon,
} from '../components/icons';
import { PremiumButton } from '../components/premium/PremiumComponents';
import { useData } from '../src/contexts/DataContext';
import { useSettings } from '../src/contexts/SettingsContext';
import { useContextMenu } from '../hooks/useContextMenu';
import { useHaptics } from '../hooks/useHaptics';
import { useModal } from '../state/ModalContext';
import Skeleton from '../components/Skeleton';
import { Virtuoso } from 'react-virtuoso';
import { rafThrottle } from '../utils/performance';
import PremiumHeader from '../components/PremiumHeader';
import TodayHighlightsWidget from '../components/feed/TodayHighlightsWidget';

// --- Premium Batch Action Bar Component ---
const BatchActionBar: React.FC<{
  count: number;
  onCancel: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onAddToLibrary: () => void;
}> = React.memo(({ count, onCancel, onDelete, onMarkRead, onAddToLibrary }) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-24 right-0 left-0 z-40 px-4 animate-slide-up-in pointer-events-none flex justify-center">
      <div className="w-full max-w-md bg-cosmos-depth/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex justify-between items-center pointer-events-auto ring-1 ring-white/5">
        <div className="flex items-center gap-3 pl-2">
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-white/10 transition-colors group"
          >
            <CloseIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
          <span className="font-bold text-white text-sm tracking-wide">
            <span className="text-accent-cyan">{count}</span> נבחרו
          </span>
        </div>
        <div className="flex items-center gap-1">
          <PremiumButton
            onClick={onMarkRead}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-accent-cyan"
            icon={<CheckCheckIcon className="w-5 h-5" />}
          >
            {null}
          </PremiumButton>
          <PremiumButton
            onClick={onAddToLibrary}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-accent-violet"
            icon={<BookOpenIcon className="w-5 h-5" />}
          >
            {null}
          </PremiumButton>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <PremiumButton
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            icon={<TrashIcon className="w-5 h-5" />}
          >
            {null}
          </PremiumButton>
        </div>
      </div>
    </div>
  );
});

BatchActionBar.displayName = 'BatchActionBar';

interface FeedScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const FilterButton: React.FC<{
  label: string;
  onClick: () => void;
  isActive: boolean;
}> = ({ label, onClick, isActive }) => (
  <PremiumButton
    onClick={onClick}
    variant={isActive ? 'primary' : 'secondary'}
    className={`rounded-full shrink-0 border backdrop-blur-md ${isActive
      ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan shadow-glow-cyan'
      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
      }`}
    size="sm"
  >
    {label}
  </PremiumButton>
);

const LAST_REFRESH_KEY = 'spark_last_refresh_time';

const FeedScreen: React.FC<FeedScreenProps> = ({ setActiveScreen }) => {
  const { feedItems, spaces, isLoading, updateFeedItem, refreshAll, removeFeedItem } = useData();
  const { settings } = useSettings();
  const headerRef = useRef<HTMLElement>(null);
  const { triggerHaptic } = useHaptics();
  const { openModal } = useModal();

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all'); // Can be 'all', 'sparks', or a spaceId
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => Promise<void> | void;
  } | null>(null);

  // --- State for Batch Actions ---
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu<FeedItem>();

  const feedSpaces = useMemo(() => spaces.filter(s => s.type === 'feed'), [spaces]);

  // PERFORMANCE: Split feedStats computation - only recalculate when feedItems changes
  const feedStats = useMemo(() => {
    let unread = 0;
    let sparks = 0;
    for (const item of feedItems) {
      if (!item.is_read) unread++;
      if (item.type === 'spark') sparks++;
    }
    return {
      total: feedItems.length,
      unread,
      sparks,
    };
  }, [feedItems]);

  // PERFORMANCE: Sources count calculated separately since it depends on spaces
  const sourcesCount = feedSpaces.length;

  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  useEffect(() => {
    const fetchFeeds = async () => {
      const feeds = await dataService.getFeeds();
      setRssFeeds(feeds);
    };
    fetchFeeds();
  }, []);

  // Fi Principle: Parallax Header for Immersive Depth - Optimized with rafThrottle
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showStatus = (
    type: StatusMessageType,
    text: string,
    onUndo?: () => Promise<void> | void
  ) => {
    setStatusMessage({ type, text, id: Date.now(), onUndo });
  };



  const handleSelectItem = useCallback(
    (item: FeedItem, event?: React.MouseEvent | React.KeyboardEvent) => {
      event?.stopPropagation();
      if (selectionMode) {
        const newIds = new Set(selectedIds);
        if (newIds.has(item.id)) {
          newIds.delete(item.id);
        } else {
          newIds.add(item.id);
        }
        setSelectedIds(newIds);
        if (newIds.size === 0) {
          setSelectionMode(false);
        }
      } else {
        if (!document.startViewTransition) {
          setSelectedItem(item);
          return;
        }
        document.startViewTransition(() => {
          setSelectedItem(item);
        });
      }
    },
    [selectionMode, selectedIds]
  );

  const handleUpdateItem = useCallback(
    async (id: string, updates: Partial<FeedItem>) => {
      const originalItem = feedItems.find(item => item.id === id);
      if (!originalItem) return;

      // Optimistic local update of selected item (DataContext will update global list)
      if (selectedItem?.id === id) {
        setSelectedItem(prev => (prev ? { ...prev, ...updates } : null));
      }

      try {
        await updateFeedItem(id, updates);
      } catch (error) {
        console.error('Failed to update item:', error);
        // Rollback on failure only for selected item UI
        if (selectedItem?.id === id) {
          setSelectedItem(originalItem);
        }
        showStatus('error', 'שגיאה בעדכון הפריט.');
      }
    },
    [selectedItem, feedItems, updateFeedItem]
  );

  const handleRefresh = useCallback(
    async (isAutoRefresh = false) => {
      if (isRefreshing) return;
      if (!isAutoRefresh) window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsRefreshing(true);
      try {
        const newItems = await refreshAllFeeds();

        await refreshAll();

        if (!isAutoRefresh) {
          localStorage.setItem(LAST_REFRESH_KEY, new Date().getTime().toString());
          if (newItems.length > 0) {
            showStatus('success', `נוספו ${newItems.length} פריטים חדשים.`);
          } else {
            showStatus('success', 'הפיד שלך עדכני.');
          }
        }
      } catch (error) {
        console.error('Error refreshing feed:', error);
        if (!isAutoRefresh) {
          showStatus('error', 'שגיאה בעת רענון הפידים.');
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [isRefreshing, refreshAll]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastRefreshTime = localStorage.getItem(LAST_REFRESH_KEY);
        const now = new Date().getTime();
        const ONE_HOUR = 60 * 60 * 1000;

        if (!lastRefreshTime || now - parseInt(lastRefreshTime, 10) > ONE_HOUR) {
          handleRefresh(true);
          localStorage.setItem(LAST_REFRESH_KEY, now.toString());
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Initial check on mount
    handleVisibilityChange();
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleRefresh]);

  const handleToggleRead = useCallback(
    (id: string, forceStatus?: boolean) => {
      const currentItem = feedItems.find(item => item.id === id);
      if (!currentItem) return;
      const newReadStatus = forceStatus !== undefined ? forceStatus : !currentItem.is_read;
      handleUpdateItem(id, { is_read: newReadStatus });
    },
    [feedItems, handleUpdateItem]
  );

  const handleSummarize = useCallback(
    async (itemToSummarize: FeedItem) => {
      if (!itemToSummarize || isSummarizing) return;
      setIsSummarizing(itemToSummarize.id);
      try {
        const summary = await summarizeItemContent(itemToSummarize.content);
        await handleUpdateItem(itemToSummarize.id, { summary_ai: summary });
      } catch (error) {
        console.error('Failed to summarize:', error);
        showStatus('error', 'שגיאה בעת ניסיון הסיכום.');
      } finally {
        setIsSummarizing(null);
      }
    },
    [isSummarizing, handleUpdateItem]
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const itemToDelete = feedItems.find(item => item.id === id);
      if (!itemToDelete) return;

      triggerHaptic('medium');

      await removeFeedItem(id);

      showStatus('success', 'הפריט נמחק.', async () => {
        // UNDO: Re-add the item and refresh from storage
        await dataService.reAddFeedItem(itemToDelete);
        await refreshAll();
      });
    },
    [feedItems, removeFeedItem, triggerHaptic, showStatus, refreshAll]
  );

  const handleDeleteWithConfirmation = useCallback(
    (id: string) => {
      const itemToDelete = feedItems.find(item => item.id === id);
      if (itemToDelete && window.confirm(`האם למחוק את "${itemToDelete.title}"?`)) {
        handleDeleteItem(id);
        setSelectedItem(null); // Close modal
      }
    },
    [feedItems, handleDeleteItem]
  );

  const handleAddToLibrary = useCallback(
    (item: FeedItem) => {
      try {
        const newPersonalItemPromise = dataService.convertFeedItemToPersonalItem(item);
        newPersonalItemPromise.then(async () => {
          await refreshAll();
          handleToggleRead(item.id, true);
          showStatus('success', 'הפריט הוסף לספרייה');
        });
      } catch (error) {
        console.error('Failed to add to library:', error);
        showStatus('error', 'שגיאה בהוספה לספרייה');
      }
    },
    [handleToggleRead, refreshAll]
  );

  // --- Batch Action Handlers ---
  const handleLongPress = useCallback(
    (item: FeedItem) => {
      // Fi Principle: Holistic Feedback
      triggerHaptic('medium');
      setSelectionMode(true);
      setSelectedIds(new Set([item.id]));
    },
    [triggerHaptic]
  );

  const handleBatchCancel = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBatchMarkRead = useCallback(async () => {
    const itemsToUpdate = Array.from(selectedIds)
      .map(id => feedItems.find(item => item.id === id))
      .filter(Boolean) as FeedItem[];
    if (itemsToUpdate.length === 0) return;

    // If any selected item is unread, mark all as read. Otherwise, mark all as unread.
    const shouldMarkAsRead = itemsToUpdate.some(item => !item.is_read);
    const updates = itemsToUpdate.map(item => ({
      id: item.id,
      updates: { is_read: shouldMarkAsRead },
    }));

    try {
      await Promise.all(updates.map(u => updateFeedItem(u.id, u.updates)));
      handleBatchCancel();
    } catch (error) {
      console.error('Batch mark read failed:', error);
      showStatus('error', 'שגיאה בעדכון הפריטים.');
    }
  }, [selectedIds, feedItems, updateFeedItem, handleBatchCancel]);

  const handleBatchAddToLibrary = useCallback(() => {
    const itemsToAdd = Array.from(selectedIds)
      .map(id => feedItems.find(item => item.id === id))
      .filter(Boolean) as FeedItem[];
    itemsToAdd.forEach(handleAddToLibrary);
    handleBatchCancel();
  }, [selectedIds, feedItems, handleAddToLibrary, handleBatchCancel]);

  const handleBatchDelete = useCallback(async () => {
    const itemsToDelete = Array.from(selectedIds)
      .map(id => feedItems.find(item => item.id === id))
      .filter(Boolean) as FeedItem[];

    if (itemsToDelete.length === 0) return;

    triggerHaptic('heavy');

    try {
      await Promise.all(itemsToDelete.map(item => removeFeedItem(item.id)));
      showStatus('success', `${itemsToDelete.length} פריטים נמחקו.`);
    } catch (error) {
      console.error('Batch delete failed:', error);
      showStatus('error', 'שגיאה במחיקת הפריטים.');
    }

    handleBatchCancel();
  }, [selectedIds, feedItems, removeFeedItem, triggerHaptic, handleBatchCancel]);

  // PERF: Memoize feedIds lookup map separately - avoids recreating Set on every filter change
  const feedIdsBySpace = useMemo(() => {
    const map = new Map<string, Set<string>>();
    rssFeeds.forEach(f => {
      if (f.spaceId) {
        if (!map.has(f.spaceId)) map.set(f.spaceId, new Set());
        map.get(f.spaceId)!.add(f.id);
      }
    });
    return map;
  }, [rssFeeds]);

  const filteredItems = useMemo(() => {
    let items = feedItems;
    if (filter === 'sparks') {
      items = items.filter(item => item.type === 'spark');
    } else if (filter !== 'all') {
      const feedIdsInSpace = feedIdsBySpace.get(filter) || new Set();
      items = items.filter(
        item => item.type === 'rss' && item.source && feedIdsInSpace.has(item.source)
      );
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [feedItems, filter, feedIdsBySpace]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadInFilter = filteredItems.filter(item => !item.is_read);
    if (unreadInFilter.length === 0) {
      showStatus('success', 'אין פריטים חדשים לסמון.');
      return;
    }

    try {
      // Batch update all items in parallel instead of N individual updates
      await Promise.all(unreadInFilter.map(item => updateFeedItem(item.id, { is_read: true })));
      showStatus('success', `${unreadInFilter.length} פריטים סומנו כנקראו.`);
    } catch (error) {
      console.error('Batch mark read failed:', error);
      showStatus('error', 'שגיאה בעדכון הפריטים.');
    }
  }, [filteredItems, updateFeedItem, showStatus]);

  return (
    <div className={`screen-shell ${selectionMode ? 'selection-mode' : ''}`}>
      <PremiumHeader
        title={settings.screenLabels?.feed || 'פיד'}
        subtitle={
          feedStats.unread > 0
            ? `${feedStats.unread} פריטים חדשים · ${feedStats.sparks} ספארקים · ${sourcesCount} מקורות`
            : `${feedStats.total} פריטים בפיד · ${feedStats.sparks} ספארקים · ${sourcesCount} מקורות`
        }
        actions={
          <>
            <PremiumButton
              onClick={() => openModal('splitViewConfig')}
              variant="ghost"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              icon={<SplitScreenIcon className="w-6 h-6" />}
            >
              {null}
            </PremiumButton>
            <PremiumButton
              onClick={() => handleRefresh(false)}
              disabled={isRefreshing || isLoading}
              variant="ghost"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              icon={<RefreshIcon className={`h-6 w-6 ${isRefreshing ? 'animate-spin text-accent-cyan' : ''}`} />}
            >
              {null}
            </PremiumButton>
            <PremiumButton
              onClick={handleMarkAllRead}
              variant="ghost"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              icon={<CheckCheckIcon className="h-6 w-6" />}
            >
              {null}
            </PremiumButton>
            <PremiumButton
              onClick={() => setActiveScreen('settings')}
              variant="ghost"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              icon={<SettingsIcon className="w-6 w-6" />}
            >
              {null}
            </PremiumButton>
          </>
        }
      >
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
            <span
              className={`w-1.5 h-1.5 rounded-full ${feedStats.unread > 0 ? 'bg-accent-cyan shadow-[0_0_8px_var(--color-accent-cyan)]' : 'bg-gray-500'}`}
            />
            {feedStats.unread > 0 ? `${feedStats.unread} לא נקראו` : 'הכול נקרא'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
            {feedStats.sparks} ספארקים
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            {sourcesCount} מקורות
          </span>
        </div>
      </PremiumHeader>

      {/* Fi Principle: Wrapper for Immersive Depth Effect */}
      <div className={`transition-all duration-500`}>
        <>
          {/* Premium Widgets Section */}
          {filter === 'all' && !isLoading && feedItems.length > 0 && (
            <div className="mb-6">
              {/* Today's Highlights */}
              <TodayHighlightsWidget
                items={feedItems}
                onSelectItem={(item) => setSelectedItem(item)}
              />
            </div>
          )}

          {/* Premium Filter Pills */}
          <div
            className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-3 -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide"
          >
            <FilterButton
              label="הכל"
              onClick={() => setFilter('all')}
              isActive={filter === 'all'}
            />
            <FilterButton
              label="ספארקים"
              onClick={() => setFilter('sparks')}
              isActive={filter === 'sparks'}
            />
            {feedSpaces.map(space => (
              <FilterButton
                key={space.id}
                label={space.name}
                onClick={() => setFilter(space.id)}
                isActive={filter === space.id}
              />
            ))}
          </div>

          {isLoading && feedItems.length === 0 ? (
            <FeedSkeleton count={5} />
          ) : (
            <div className="px-1">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-cosmos-depth/50 rounded-2xl p-4 space-y-3 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="space-y-2">
                          <Skeleton variant="text" width={120} height={16} />
                          <Skeleton variant="text" width={80} height={12} />
                        </div>
                      </div>
                      <Skeleton variant="rectangular" height={100} className="w-full rounded-xl" />
                      <div className="flex justify-between">
                        <Skeleton variant="text" width={60} height={20} />
                        <Skeleton variant="text" width={60} height={20} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <EmptyState
                  illustration="feed"
                  title={feedItems.length > 0 ? 'אין פריטים כאן' : 'הפיד שלך ריק'}
                  description={
                    feedItems.length > 0
                      ? 'נסה לבחור סינון אחר או לרענן את הפידים שלך.'
                      : 'לחץ על כפתור הרענון כדי למשוך תוכן חדש מהמקורות שהגדרת.'
                  }
                  action={{
                    label: 'רענן פידים',
                    onClick: () => handleRefresh(false),
                    icon: (
                      <RefreshIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    ),
                  }}
                />
              ) : (
                <Virtuoso
                  useWindowScroll
                  data={filteredItems}
                  overscan={400}
                  computeItemKey={(index, item) => item.id}
                  increaseViewportBy={{ top: 200, bottom: 400 }}
                  itemContent={(index, item) => (
                    <div
                      className="animate-item-enter-fi pb-6"
                      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                    >
                      <FeedCard
                        item={item}
                        index={index}
                        onSelect={handleSelectItem}
                        onLongPress={handleLongPress}
                        onContextMenu={handleContextMenu}
                        isInSelectionMode={selectionMode}
                        isSelected={selectedIds.has(item.id)}
                      />
                    </div>
                  )}
                />
              )}
            </div>
          )}
        </>

        <ItemDetailModal
          item={selectedItem}
          onSelectItem={item => setSelectedItem(item)}
          onClose={() => {
            if (!document.startViewTransition) {
              setSelectedItem(null);
              return;
            }
            document.startViewTransition(() => {
              setSelectedItem(null);
            });
          }}
          onSummarize={handleSummarize}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteWithConfirmation}
          isSummarizing={!!isSummarizing}
        />
        <SynthesisModal
          isLoading={isSynthesizing}
          synthesisResult={synthesisResult}
          onClose={() => {
            setIsSynthesizing(false);
            setSynthesisResult(null);
          }}
        />
        {contextMenu.isOpen && contextMenu.item && !selectionMode && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            onClose={closeContextMenu}
            onToggleRead={() => handleToggleRead(contextMenu.item!.id)}
            onSummarize={() => handleSummarize(contextMenu.item!)}
            onDelete={handleDeleteItem}
            onAddToLibrary={handleAddToLibrary}
          />
        )}
        {selectionMode && (
          <BatchActionBar
            count={selectedIds.size}
            onCancel={handleBatchCancel}
            onMarkRead={handleBatchMarkRead}
            onAddToLibrary={handleBatchAddToLibrary}
            onDelete={handleBatchDelete}
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
    </div>
  );
};

export default React.memo(FeedScreen);
