import React, { useState, useCallback } from 'react';
import type { PersonalItem } from '../types';
import { duplicatePersonalItem, reAddPersonalItem } from '../services/dataService';
import { useData } from '../src/contexts/DataContext';
import { StatusMessageType } from '../components/StatusMessage';
import { useModal } from '../state/ModalContext';
import { useFocusSession } from '../src/contexts/FocusContext';

export const useHomeInteraction = (
  showStatus: (type: StatusMessageType, text: string, onUndo?: () => void) => void
) => {
  const { personalItems, updatePersonalItem, removePersonalItem, refreshAll } = useData();
  const [selectedItem, setSelectedItem] = useState<PersonalItem | null>(null);
  const { openModal } = useModal();
  const { startSession } = useFocusSession();

  const handleUpdateItem = useCallback(
    async (id: string, updates: Partial<PersonalItem>) => {
      const originalItem = personalItems.find(item => item.id === id);
      if (!originalItem) return;

      if (selectedItem?.id === id) {
        setSelectedItem(prev => (prev ? { ...prev, ...updates } : null));
      }

      try {
        await updatePersonalItem(id, updates);
      } catch (error) {
        console.error('Failed to update item:', error);
        if (selectedItem?.id === id) {
          setSelectedItem(originalItem);
        }
        showStatus('error', 'שגיאה בעדכון הפריט.');
      }
    },
    [selectedItem, personalItems, showStatus, updatePersonalItem]
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const itemToDelete = personalItems.find(item => item.id === id);
      if (!itemToDelete) return;

      if (window.navigator.vibrate) window.navigator.vibrate(50);

      await removePersonalItem(id);

      showStatus('success', 'הפריט נמחק.', async () => {
        await reAddPersonalItem(itemToDelete);
        await refreshAll();
      });
    },
    [personalItems, showStatus, removePersonalItem, refreshAll]
  );

  const handleSelectItem = useCallback(
    (item: PersonalItem, event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
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
      if (itemToDelete && window.confirm(`האם למחוק את "${itemToDelete.title}"?`)) {
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

  const handleStartFocus = useCallback(
    (item: PersonalItem) => {
      startSession(item);
      showStatus('success', `סשן פוקוס התחיל עבור: ${item.title}`);
    },
    [startSession, showStatus]
  );

  return {
    selectedItem,
    handleSelectItem,
    handleCloseModal,
    handleUpdateItem,
    handleDeleteItem,
    handleDeleteWithConfirmation,
    handleDuplicateItem,
    handleStartFocus,
  };
};
