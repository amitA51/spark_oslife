/**
 * Personal Items Database Service
 * 
 * CRUD operations for PersonalItem entities with cloud sync integration.
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import type { PersonalItem, FocusSession } from '../../types';
import { dbGet, dbPut, dbDelete, dbClear, initializeDefaultData, safeDateSort, syncWithRetry } from './indexedDBCore';
import { defaultPersonalItems } from '../mockData';
import { ValidationError, NotFoundError } from '../errors';
import { logEvent } from '../correlationsService';
import { auth } from '../../config/firebase';
import {
    syncPersonalItem,
    deletePersonalItem as deleteCloudItem,
    subscribeToPersonalItems,
} from '../firestoreService';

// --- Cloud Sync ---

let unsubscribePersonalItems: (() => void) | null = null;

/**
 * Initialize cloud sync subscription for personal items.
 */
export const initializeCloudSync = (
    userId: string,
    onDataUpdate: (items: PersonalItem[]) => void
): void => {
    if (unsubscribePersonalItems) {
        unsubscribePersonalItems();
    }

    unsubscribePersonalItems = subscribeToPersonalItems(userId, async cloudItems => {
        await Promise.all(cloudItems.map(item => dbPut(LS.PERSONAL_ITEMS, item)));
        onDataUpdate(cloudItems);
    });
};

/**
 * Migrate all local personal items to cloud.
 */
export const migrateLocalDataToCloud = async (userId: string): Promise<void> => {
    const personalItems = await getPersonalItems();
    await Promise.all(personalItems.map(item => syncPersonalItem(userId, item)));
};

// --- CRUD Operations ---

/**
 * Get all personal items, sorted by creation date (newest first).
 */
export const getPersonalItems = async (): Promise<PersonalItem[]> => {
    const items = await initializeDefaultData(LS.PERSONAL_ITEMS, defaultPersonalItems);
    return items.sort(safeDateSort);
};

/**
 * Re-add a personal item (used during import, no cloud sync trigger).
 */
export const reAddPersonalItem = (item: PersonalItem): Promise<void> =>
    dbPut(LS.PERSONAL_ITEMS, item);

/**
 * Get personal items filtered by project ID.
 */
export const getPersonalItemsByProjectId = async (projectId: string): Promise<PersonalItem[]> => {
    if (!projectId) return [];
    const items = await getPersonalItems();
    return items.filter(item => item.projectId === projectId).sort(safeDateSort);
};

/**
 * Add a new personal item.
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

    // Log journal entries
    if (newItem.type === 'journal') {
        logEvent({
            eventType: 'journal_entry',
            itemId: newItem.id,
            itemTitle: newItem.title || 'Untitled',
        });
    }

    // Cloud Sync with retry
    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(
            () => syncPersonalItem(currentUser.uid, newItem),
            `addPersonalItem:${newItem.id}`
        );
    }

    return newItem;
};

/**
 * Update an existing personal item.
 */
export const updatePersonalItem = async (
    id: string,
    updates: Partial<PersonalItem>
): Promise<PersonalItem> => {
    if (!id) throw new ValidationError('Item ID is required for update.');

    const itemToUpdate = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);
    if (!itemToUpdate) throw new NotFoundError('PersonalItem', id);

    const updatedItem = { ...itemToUpdate, ...updates };
    await dbPut(LS.PERSONAL_ITEMS, updatedItem);

    // Log completion events
    if (updates.isCompleted && !itemToUpdate.isCompleted) {
        if (updatedItem.type === 'task') {
            logEvent({
                eventType: 'task_completed',
                itemId: updatedItem.id,
                itemTitle: updatedItem.title || 'Untitled',
            });
        } else if (updatedItem.type === 'habit') {
            logEvent({
                eventType: 'habit_completed',
                itemId: updatedItem.id,
                itemTitle: updatedItem.title || 'Untitled',
            });
        }
    }

    // Cloud Sync with retry
    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(
            () => syncPersonalItem(currentUser.uid, updatedItem),
            `updatePersonalItem:${updatedItem.id}`
        );
    }

    return updatedItem;
};

/**
 * Remove a personal item.
 */
export const removePersonalItem = async (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Item ID is required for deletion.');
    await dbDelete(LS.PERSONAL_ITEMS, id);

    // Cloud Sync with retry
    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(
            () => deleteCloudItem(currentUser.uid, id),
            `removePersonalItem:${id}`
        );
    }
};

/**
 * Duplicate a personal item.
 */
export const duplicatePersonalItem = async (id: string): Promise<PersonalItem> => {
    if (!id) throw new ValidationError('Item ID is required for duplication.');

    const originalItem = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);
    if (!originalItem) throw new NotFoundError('PersonalItem', id);

    const duplicatedItem: PersonalItem = {
        ...JSON.parse(JSON.stringify(originalItem)),
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: `${originalItem.title} (העתק)`,
        isCompleted: originalItem.type === 'task' ? false : undefined,
    };

    await dbPut(LS.PERSONAL_ITEMS, duplicatedItem);
    return duplicatedItem;
};

/**
 * Log a focus session for a personal item.
 */
export const logFocusSession = async (
    itemId: string,
    durationInMinutes: number
): Promise<PersonalItem> => {
    if (!itemId) throw new ValidationError('Item ID is required to log a focus session.');

    const itemToUpdate = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, itemId);
    if (!itemToUpdate) throw new NotFoundError('PersonalItem', itemId);

    const newSession: FocusSession = { date: new Date().toISOString(), duration: durationInMinutes };
    const updatedItem = {
        ...itemToUpdate,
        focusSessions: [...(itemToUpdate.focusSessions || []), newSession],
    };

    await dbPut(LS.PERSONAL_ITEMS, updatedItem);

    logEvent({
        eventType: 'focus_session',
        itemId: updatedItem.id,
        itemTitle: updatedItem.title || 'Untitled',
        metadata: { duration: durationInMinutes },
    });

    // Cloud Sync with retry
    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(
            () => syncPersonalItem(currentUser.uid, updatedItem),
            `logFocusSession:${updatedItem.id}`
        );
    }

    return updatedItem;
};

/**
 * Replace all personal items with cloud data.
 */
export const replacePersonalItemsFromCloud = async (items: PersonalItem[]): Promise<void> => {
    await dbClear(LS.PERSONAL_ITEMS);
    await Promise.all(items.map(item => dbPut(LS.PERSONAL_ITEMS, item)));
};
