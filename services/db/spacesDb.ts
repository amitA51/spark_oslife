import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { Space } from '../../types';
import { defaultSpaces } from '../mockData';
import {
    dbGet,
    dbPut,
    dbDelete,
    initializeDefaultData,
    syncWithRetry
} from './indexedDBCore';
import {
    syncSpace,
    deleteSpace as deleteCloudSpace
} from '../firestoreService';
import { auth } from '../../config/firebase';
import { NotFoundError } from '../errors';
import { getPersonalItems, updatePersonalItem } from './personalItemsDb';
import { getFeeds, updateFeed } from './feedsDb';

// Re-export type if needed, but usually types are imported from types.ts

export const getSpaces = async (): Promise<Space[]> => {
    const spaces = await initializeDefaultData(LS.SPACES, defaultSpaces);
    return spaces.sort((a, b) => a.order - b.order);
};

export const addSpace = async (spaceData: Omit<Space, 'id'>): Promise<Space> => {
    const newSpace: Space = { id: `space-${Date.now()}`, ...spaceData };
    await dbPut(LS.SPACES, newSpace);

    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(() => syncSpace(currentUser.uid, newSpace), `addSpace:${newSpace.id}`);
    }
    return newSpace;
};

export const reAddSpace = (item: Space): Promise<void> => dbPut(LS.SPACES, item);

export const updateSpace = async (id: string, updates: Partial<Space>): Promise<Space> => {
    const spaceToUpdate = await dbGet<Space>(LS.SPACES, id);
    if (!spaceToUpdate) throw new NotFoundError('Space', id);
    const updatedSpace = { ...spaceToUpdate, ...updates };
    await dbPut(LS.SPACES, updatedSpace);

    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(() => syncSpace(currentUser.uid, updatedSpace), `updateSpace:${id}`);
    }
    return updatedSpace;
};

export const removeSpace = async (id: string): Promise<void> => {
    await dbDelete(LS.SPACES, id);

    const currentUser = auth?.currentUser;
    if (currentUser) {
        syncWithRetry(() => deleteCloudSpace(currentUser.uid, id), `removeSpace:${id}`);
    }

    // Un-assign items from the deleted space
    // Note: Circular dependency risk if we just import safely.
    // We need to implement this carefully to avoid cycles if personalItemsDb needs spacesDb.
    // Ideally, these higher-level orchestrations belong in a service layer, not the DB layer.
    // For now, keeping the logic here to match previous behavior, assuming personalItemsDb does NOT import spacesDb.

    const itemsToUpdate = (await getPersonalItems()).filter(i => i.spaceId === id);
    // We need getFeeds from feedsDb. usage implies we need that module too.
    const feedsToUpdate = (await getFeeds()).filter(f => f.spaceId === id);

    await Promise.all([
        ...itemsToUpdate.map(item => updatePersonalItem(item.id, { spaceId: undefined })),
        ...feedsToUpdate.map(feed => updateFeed(feed.id, { spaceId: undefined })),
    ]);
};
