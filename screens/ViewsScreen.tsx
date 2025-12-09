import React, { useState, useMemo } from 'react';
import { Screen } from '../types';
import TodayView from '../components/views/TodayView';
import PriorityView from '../components/views/PriorityView';
import { ChevronLeftIcon } from '../components/icons';
import PersonalItemDetailModal from '../components/PersonalItemDetailModal';
import type { PersonalItem } from '../types';
import { useData } from '../src/contexts/DataContext';
import { todayKey } from '../utils/dateUtils';

interface ViewsScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

type ViewTab = 'today' | 'priority';

const ViewsScreen: React.FC<ViewsScreenProps> = ({ setActiveScreen }) => {
  const { personalItems, updatePersonalItem, removePersonalItem } = useData();
  const [activeTab, setActiveTab] = useState<ViewTab>('today');
  const [selectedItem, setSelectedItem] = useState<PersonalItem | null>(null);

  const tasks = useMemo(() => {
    return personalItems.filter(item => item.type === 'task');
  }, [personalItems]);

  const handleTaskClick = (task: PersonalItem) => {
    setSelectedItem(task);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleUpdateItem = async (id: string, updates: Partial<PersonalItem>) => {
    try {
      const updatedItem = await updatePersonalItem(id, updates);
      setSelectedItem(updatedItem);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await removePersonalItem(id);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const tabs: { id: ViewTab; label: string; badge?: number }[] = [
    {
      id: 'today',
      label: 'היום',
      badge: tasks.filter(t => {
        if (t.isCompleted) return false;
        const today = todayKey();
        return (today && t.dueDate === today) || (t.dueDate && today && t.dueDate < today);
      }).length,
    },
    {
      id: 'priority',
      label: 'עדיפות',
      badge: tasks.filter(t => !t.isCompleted && t.priority === 'high').length,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('today')}
            className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">תצוגות חכמות</h1>
            <p className="text-sm text-muted">נהל משימות לפי הקשר</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
                            relative px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id
                ? 'bg-[var(--accent-gradient)] text-white shadow-lg shadow-[var(--dynamic-accent-start)]/20'
                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
              }
                        `}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`
                                absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center
                                ${activeTab === tab.id
                    ? 'bg-white text-[var(--dynamic-accent-start)]'
                    : 'bg-[var(--dynamic-accent-start)] text-white'
                  }
                            `}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div className="animate-fade-in">
        {activeTab === 'today' && (
          <TodayView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onUpdateTask={handleUpdateItem}
            onDeleteTask={handleDeleteItem}
            onContextMenu={() => { }}
          />
        )}
        {activeTab === 'priority' && (
          <PriorityView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onUpdateTask={handleUpdateItem}
            onDeleteTask={handleDeleteItem}
            onContextMenu={() => { }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <PersonalItemDetailModal
          item={selectedItem}
          onClose={handleCloseModal}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};

export default ViewsScreen;
