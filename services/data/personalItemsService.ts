/**
 * Personal Items Service
 * Handles CRUD operations for personal items (tasks, habits, notes, etc.)
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete, initializeDefaultData, safeDateSort } from './dbCore';
import { ValidationError, NotFoundError } from '../errors';
import { logEvent } from '../correlationsService';
import { auth } from '../../config/firebase';
import { syncPersonalItem, deletePersonalItem as deleteCloudItem } from '../firestoreService';
import { defaultPersonalItems } from '../mockData';
import { onTaskCompleted, onHabitCompleted, onItemCreated, onItemDeleted } from '../webhookService';
import type { PersonalItem, FeedItem } from '../../types';

/**
 * Get all personal items sorted by creation date
 */
export const getPersonalItems = async (): Promise<PersonalItem[]> => {
    const items = await initializeDefaultData(LS.PERSONAL_ITEMS, defaultPersonalItems);
    return items.sort(safeDateSort);
};

/**
 * Re-add a personal item (used for import/restore)
 */
export const reAddPersonalItem = (item: PersonalItem): Promise<void> =>
    dbPut(LS.PERSONAL_ITEMS, item);

/**
 * Get personal items by project ID
 */
export const getPersonalItemsByProjectId = async (projectId: string): Promise<PersonalItem[]> => {
    if (!projectId) return [];
    const items = await getPersonalItems();
    return items.filter(item => item.projectId === projectId).sort(safeDateSort);
};

/**
 * Add a new personal item
 */
export const addPersonalItem = async (
    itemData: Omit<PersonalItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PersonalItem> => {
    if (!itemData.title) throw new ValidationError('Item title is required.');

    const newItem: PersonalItem = {
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: Date.now(),
        ...itemData,
    };

    await dbPut(LS.PERSONAL_ITEMS, newItem);

    if (newItem.type === 'journal') {
        logEvent({
            eventType: 'journal_entry',
            itemId: newItem.id,
            itemTitle: newItem.title || 'Untitled',
        });
    }

    // Cloud Sync
    if (auth?.currentUser) {
        syncPersonalItem(auth.currentUser.uid, newItem).catch(console.error);
    }

    // Trigger webhooks for item creation
    onItemCreated({ id: newItem.id, type: newItem.type || 'unknown', title: newItem.title || 'Untitled' });

    return newItem;
};

/**
 * Update a personal item
 */
export const updatePersonalItem = async (
    id: string,
    updates: Partial<PersonalItem>
): Promise<PersonalItem> => {
    if (!id) throw new ValidationError('Item ID is required for update.');

    const itemToUpdate = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);
    if (!itemToUpdate) throw new NotFoundError('PersonalItem', id);

    const updatedItem = { ...itemToUpdate, ...updates, updatedAt: new Date().toISOString() };
    await dbPut(LS.PERSONAL_ITEMS, updatedItem);

    // Log completion events and trigger webhooks
    if (updates.isCompleted && !itemToUpdate.isCompleted) {
        if (updatedItem.type === 'task') {
            logEvent({
                eventType: 'task_completed',
                itemId: updatedItem.id,
                itemTitle: updatedItem.title || 'Untitled',
            });
            // Trigger webhook for task completion
            onTaskCompleted({ id: updatedItem.id, title: updatedItem.title || 'Untitled' });
        } else if (updatedItem.type === 'habit') {
            logEvent({
                eventType: 'habit_completed',
                itemId: updatedItem.id,
                itemTitle: updatedItem.title || 'Untitled',
            });
            // Trigger webhook for habit completion
            onHabitCompleted({ id: updatedItem.id, title: updatedItem.title || 'Untitled' });
        }
    }

    // Cloud Sync
    if (auth?.currentUser) {
        syncPersonalItem(auth.currentUser.uid, updatedItem).catch(console.error);
    }

    return updatedItem;
};

/**
 * Remove a personal item
 */
export const removePersonalItem = async (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Item ID is required for deletion.');

    // Get item before deletion for webhook
    const itemToDelete = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);

    await dbDelete(LS.PERSONAL_ITEMS, id);

    // Cloud Sync
    if (auth?.currentUser) {
        deleteCloudItem(auth.currentUser.uid, id).catch(console.error);
    }

    // Trigger webhook for item deletion
    if (itemToDelete) {
        onItemDeleted({ id, type: itemToDelete.type || 'unknown', title: itemToDelete.title || 'Untitled' });
    }
};

/**
 * Duplicate a personal item
 */
export const duplicatePersonalItem = async (id: string): Promise<PersonalItem> => {
    if (!id) throw new ValidationError('Item ID is required for duplication.');

    const originalItem = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);
    if (!originalItem) throw new NotFoundError('PersonalItem', id);

    const duplicatedItem: PersonalItem = {
        ...JSON.parse(JSON.stringify(originalItem)),
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: `${originalItem.title} (העתק)`,
        isCompleted: originalItem.type === 'task' ? false : undefined,
    };

    await dbPut(LS.PERSONAL_ITEMS, duplicatedItem);
    return duplicatedItem;
};

/**
 * Log a focus session for an item
 */
export const logFocusSession = async (
    itemId: string,
    durationInMinutes: number
): Promise<PersonalItem> => {
    if (!itemId) throw new ValidationError('Item ID is required to log a focus session.');

    const itemToUpdate = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, itemId);
    if (!itemToUpdate) throw new NotFoundError('PersonalItem', itemId);

    const newSession = { date: new Date().toISOString(), duration: durationInMinutes };
    const updatedItem = {
        ...itemToUpdate,
        focusSessions: [...(itemToUpdate.focusSessions || []), newSession],
        updatedAt: new Date().toISOString(),
    };

    await dbPut(LS.PERSONAL_ITEMS, updatedItem);

    logEvent({
        eventType: 'focus_session',
        itemId: updatedItem.id,
        itemTitle: updatedItem.title || 'Untitled',
        metadata: { duration: durationInMinutes },
    });

    // Cloud Sync
    if (auth?.currentUser) {
        syncPersonalItem(auth.currentUser.uid, updatedItem).catch(console.error);
    }

    return updatedItem;
};

/**
 * Convert a feed item to a personal item
 */
export const convertFeedItemToPersonalItem = async (item: FeedItem): Promise<PersonalItem> => {
    if (!item || !item.id) throw new ValidationError('A valid feed item is required for conversion.');

    const newItemData: Omit<PersonalItem, 'id' | 'createdAt'> = {
        type: 'learning',
        title: item.title,
        content: item.summary_ai || item.content,
        url: item.link,
        domain: item.link ? new URL(item.link).hostname : undefined,
        metadata: {
            source: `Feed: ${item.source || 'Unknown'}`,
        },
        updatedAt: new Date().toISOString(),
    };

    return await addPersonalItem(newItemData);
};
