import React, { useState, useEffect } from 'react';
import type { RssFeed, Space } from '../types';
import { getIconForName } from './IconMap';
import * as dataService from '../services/dataService';
import { TrashIcon, CloseIcon, AddIcon, EditIcon } from './icons';
import { AVAILABLE_ICONS } from '../constants';
import StatusMessage, { StatusMessageType } from './StatusMessage';
import { useData } from '../src/contexts/DataContext';
import { useHaptics } from '../hooks/useHaptics';

// --- Helper Components ---

const inputStyles =
  'glass-input w-full rounded-xl p-3 focus:outline-none transition-all text-[var(--text-primary)] placeholder-gray-500';

const IconPicker: React.FC<{ selected: string; onSelect: (icon: string) => void }> = ({
  selected,
  onSelect,
}) => (
  <div className="grid grid-cols-6 gap-2">
    {AVAILABLE_ICONS.map(iconName => {
      const Icon = getIconForName(iconName);
      return (
        <button
          key={iconName}
          type="button"
          onClick={() => onSelect(iconName)}
          className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${selected === iconName ? 'bg-[var(--dynamic-accent-start)] text-white ring-2 ring-offset-2 ring-offset-[var(--bg-card)] ring-[var(--dynamic-accent-start)] shadow-lg shadow-[var(--dynamic-accent-glow)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-white/10'}`}
        >
          <Icon className="w-6 h-6" />
        </button>
      );
    })}
  </div>
);

// --- Main Modal ---

interface ManageSpacesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageSpacesModal: React.FC<ManageSpacesModalProps> = ({ isOpen, onClose }) => {
  const { spaces, addSpace, updateSpace, removeSpace, refreshAll } = useData();
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'feed'>('personal');
  const { triggerHaptic } = useHaptics();

  // State for editing/creating a space
  const [editingSpace, setEditingSpace] = useState<Partial<Space> | null>(null);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [status, setStatus] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => void;
  } | null>(null);

  const showStatus = (type: StatusMessageType, text: string, onUndo?: () => void) => {
    setStatus({ type, text, id: Date.now(), onUndo });
  };

  // Must be called before any early returns
  useEffect(() => {
    if (isOpen) {
      const fetchFeeds = async () => {
        const fetchedFeeds = await dataService.getFeeds();
        setFeeds(fetchedFeeds);
      };
      fetchFeeds();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const feedSpaces = spaces.filter(s => s.type === 'feed');

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleSaveSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace || !editingSpace.name) return;

    if (editingSpace.id) {
      // Update existing
      await updateSpace(editingSpace.id, editingSpace as Partial<Space>);
    } else {
      // Create new
      const newSpaceData: Omit<Space, 'id'> = {
        name: editingSpace.name,
        icon: editingSpace.icon || 'sparkles',
        color: editingSpace.color || '#A78BFA',
        type: activeTab,
        order: spaces.filter(s => s.type === activeTab).length,
      };
      await addSpace(newSpaceData);
    }
    setEditingSpace(null);
  };

  const handleDeleteSpace = async (id: string) => {
    const spaceToDelete = spaces.find(s => s.id === id);
    if (!spaceToDelete) return;

    triggerHaptic('medium');

    await removeSpace(id);

    showStatus('success', 'המרחב נמחק.', async () => {
      await dataService.reAddSpace(spaceToDelete);
      await refreshAll();
    });
  };

  const handleUpdateFeedSpace = (feedId: string, spaceId: string | undefined) => {
    dataService.updateFeed(feedId, { spaceId });
    setFeeds(currentFeeds => currentFeeds.map(f => (f.id === feedId ? { ...f, spaceId } : f)));
  };

  const handleAddNewFeed = async () => {
    const url = prompt('הזן את כתובת ה-URL של פיד ה-RSS:');
    if (url) {
      try {
        const newFeed = await dataService.addFeed(url);
        setFeeds(currentFeeds => [...currentFeeds, newFeed]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
        alert(`שגיאה בהוספת פיד: ${message}`);
      }
    }
  };

  const handleDeleteFeed = async (id: string) => {
    const feedToDelete = feeds.find(f => f.id === id);
    if (!feedToDelete) return;

    triggerHaptic('medium');

    await dataService.removeFeed(id);
    setFeeds(currentFeeds => currentFeeds.filter(f => f.id !== id));

    showStatus('success', 'הפיד נמחק.', async () => {
      await dataService.reAddFeed(feedToDelete);
      setFeeds(currentFeeds => [...currentFeeds, feedToDelete]);
    });
  };

  const displayedSpaces = spaces.filter(s => s.type === activeTab);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={handleClose}
    >
      <div
        className={`bg-[var(--bg-secondary)] w-full max-w-2xl max-h-[90vh] responsive-modal rounded-t-3xl shadow-2xl flex flex-col border-t border-[var(--border-primary)] ${isClosing ? 'animate-modal-exit' : 'animate-modal-enter'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-[var(--bg-secondary)]/80 backdrop-blur-sm z-10 rounded-t-3xl">
          <h2 className="text-xl font-bold themed-title">ניהול מרחבים ופידים</h2>
          <button
            onClick={handleClose}
            className="text-[var(--text-secondary)] hover:text-white transition-colors p-1 rounded-full active:scale-95"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="border-b border-[var(--border-primary)] px-4 bg-[var(--bg-secondary)]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-3 font-semibold transition-colors ${activeTab === 'personal' ? 'text-[var(--dynamic-accent-highlight)] border-b-2 border-[var(--dynamic-accent-highlight)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              מרחבים אישיים
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-3 font-semibold transition-colors ${activeTab === 'feed' ? 'text-[var(--dynamic-accent-highlight)] border-b-2 border-[var(--dynamic-accent-highlight)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              מרחבי פיד ו-RSS
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-grow bg-[var(--bg-primary)]">
          {editingSpace ? (
            <form
              onSubmit={handleSaveSpace}
              className="p-5 bg-[var(--bg-card)] rounded-2xl space-y-5 border border-[var(--border-primary)] shadow-lg"
            >
              <h3 className="font-bold text-xl text-white">
                {editingSpace.id ? 'עריכת מרחב' : 'מרחב חדש'}
              </h3>
              <div>
                <label
                  htmlFor="spaceName"
                  className="text-sm font-bold text-[var(--text-secondary)] mb-2 block"
                >
                  שם המרחב
                </label>
                <input
                  id="spaceName"
                  type="text"
                  value={editingSpace.name || ''}
                  onChange={e => setEditingSpace(s => ({ ...s, name: e.target.value }))}
                  className={inputStyles}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">
                  אייקון
                </label>
                <IconPicker
                  selected={editingSpace.icon || 'sparkles'}
                  onSelect={icon => setEditingSpace(s => ({ ...s, icon }))}
                />
              </div>
              <div>
                <label
                  htmlFor="spaceColor"
                  className="text-sm font-bold text-[var(--text-secondary)] mb-2 block"
                >
                  צבע
                </label>
                <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                  <input
                    id="spaceColor"
                    type="color"
                    value={editingSpace.color || '#A78BFA'}
                    onChange={e => setEditingSpace(s => ({ ...s, color: e.target.value }))}
                    className="w-12 h-12 p-1 bg-transparent rounded-lg cursor-pointer border-none"
                  />
                  <span className="text-sm text-[var(--text-secondary)] font-mono uppercase flex-1">
                    {editingSpace.color}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSpace(null)}
                  className="flex-1 bg-[var(--bg-secondary)] hover:bg-white/5 border border-[var(--border-primary)] text-white font-bold py-3 rounded-xl transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[var(--accent-gradient)] text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_var(--dynamic-accent-glow)] transition-transform active:scale-95"
                >
                  שמור
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-3">
                {displayedSpaces.map(space => (
                  <div
                    key={space.id}
                    className="group flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--dynamic-accent-start)] transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: `${space.color}25`, color: space.color }}
                      >
                        {React.createElement(getIconForName(space.icon), { className: 'w-6 h-6' })}
                      </div>
                      <p className="font-bold text-lg text-[var(--text-primary)]">{space.name}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingSpace(space)}
                        className="text-[var(--text-secondary)] hover:text-[var(--dynamic-accent-highlight)] p-2 rounded-lg hover:bg-white/5"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSpace(space.id)}
                        className="text-[var(--text-secondary)] hover:text-[var(--danger)] p-2 rounded-lg hover:bg-white/5"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditingSpace({ type: activeTab })}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold py-4 px-4 rounded-2xl hover:border-[var(--dynamic-accent-start)] hover:text-white transition-colors hover:bg-white/5"
              >
                <AddIcon className="h-5 h-5" /> צור מרחב חדש
              </button>
            </>
          )}
          {activeTab === 'feed' && !editingSpace && (
            <div className="mt-8 pt-8 border-t border-[var(--border-primary)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">מקורות RSS</h3>
              <div className="space-y-3">
                {feeds.map(feed => (
                  <div
                    key={feed.id}
                    className="group flex items-center justify-between bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-primary)]"
                  >
                    <p className="font-medium text-[var(--text-primary)] truncate pr-4 flex-1">
                      {feed.name}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={feed.spaceId || ''}
                        onChange={e => handleUpdateFeedSpace(feed.id, e.target.value || undefined)}
                        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] max-w-[140px] focus:outline-none focus:border-[var(--dynamic-accent-start)]"
                      >
                        <option value="">ללא שיוך</option>
                        {feedSpaces.map(space => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="text-[var(--text-secondary)] hover:text-[var(--danger)] p-2 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddNewFeed}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold py-3 px-4 rounded-xl hover:border-[var(--dynamic-accent-start)] hover:text-white transition-colors hover:bg-white/5"
              >
                <AddIcon className="h-5 h-5" /> הוסף פיד RSS
              </button>
            </div>
          )}
        </div>
        {status && (
          <StatusMessage
            key={status.id}
            type={status.type}
            message={status.text}
            onDismiss={() => setStatus(null)}
            onUndo={status.onUndo}
          />
        )}
      </div>
    </div>
  );
};

export default ManageSpacesModal;
