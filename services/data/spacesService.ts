/**
 * Spaces Service
 * Handles CRUD operations for spaces/categories
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete, dbGetAll, initializeDefaultData } from './dbCore';
import { ValidationError, NotFoundError } from '../errors';
import { defaultSpaces } from '../mockData';
import type { Space } from '../../types';
import { getPersonalItems, updatePersonalItem } from './personalItemsService';

/**
 * Get all spaces sorted by order
 */
export const getSpaces = async (): Promise<Space[]> => {
    const spaces = await initializeDefaultData(LS.SPACES, defaultSpaces);
    return spaces.sort((a, b) => a.order - b.order);
};

/**
 * Add a new space
 */
export const addSpace = async (spaceData: Omit<Space, 'id'>): Promise<Space> => {
    if (!spaceData.name) throw new ValidationError('Space name is required.');

    const newSpace: Space = {
        id: `space-${Date.now()}`,
        ...spaceData
    };

    await dbPut(LS.SPACES, newSpace);
    return newSpace;
};

/**
 * Re-add a space (used for import/restore)
 */
export const reAddSpace = (item: Space): Promise<void> => dbPut(LS.SPACES, item);

/**
 * Update a space
 */
export const updateSpace = async (id: string, updates: Partial<Space>): Promise<Space> => {
    if (!id) throw new ValidationError('Space ID is required for update.');

    const spaceToUpdate = await dbGet<Space>(LS.SPACES, id);
    if (!spaceToUpdate) throw new NotFoundError('Space', id);

    const updatedSpace = { ...spaceToUpdate, ...updates };
    await dbPut(LS.SPACES, updatedSpace);
    return updatedSpace;
};

/**
 * Remove a space and unassign items from it
 */
export const removeSpace = async (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Space ID is required for deletion.');

    await dbDelete(LS.SPACES, id);

    // Un-assign items from the deleted space
    const itemsToUpdate = (await getPersonalItems()).filter(i => i.spaceId === id);
    await Promise.all(
        itemsToUpdate.map(item => updatePersonalItem(item.id, { spaceId: undefined }))
    );
};

/**
 * Reorder spaces
 */
export const reorderSpaces = async (orderedIds: string[]): Promise<Space[]> => {
    const spaces = await dbGetAll<Space>(LS.SPACES);

    const updatedSpaces = spaces.map(space => {
        const newOrder = orderedIds.indexOf(space.id);
        return { ...space, order: newOrder >= 0 ? newOrder : space.order };
    });

    await Promise.all(updatedSpaces.map(space => dbPut(LS.SPACES, space)));
    return updatedSpaces.sort((a, b) => a.order - b.order);
};
