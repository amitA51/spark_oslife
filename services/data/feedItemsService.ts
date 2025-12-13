/**
 * Feed Items Service
 * Handles CRUD operations for feed items (RSS, sparks, news, mentor content)
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete, dbGetAll, initializeDefaultData, safeDateSort } from './dbCore';
import { ValidationError, NotFoundError } from '../errors';
import { logEvent } from '../correlationsService';
import { defaultFeedItems } from '../mockData';
import type { FeedItem } from '../../types';

/**
 * Get all feed items sorted by creation date
 */
export const getFeedItems = async (): Promise<FeedItem[]> => {
    const items = await initializeDefaultData(LS.FEED_ITEMS, defaultFeedItems);
    return items.sort(safeDateSort);
};

/**
 * Re-add a feed item (used for import/restore)
 */
export const reAddFeedItem = (item: FeedItem): Promise<void> =>
    dbPut(LS.FEED_ITEMS, item);

/**
 * Update a feed item
 */
export const updateFeedItem = async (id: string, updates: Partial<FeedItem>): Promise<FeedItem> => {
    if (!id) throw new ValidationError('Item ID is required for update.');

    const itemToUpdate = await dbGet<FeedItem>(LS.FEED_ITEMS, id);
    if (!itemToUpdate) throw new NotFoundError('FeedItem', id);

    const updatedItem = { ...itemToUpdate, ...updates };
    await dbPut(LS.FEED_ITEMS, updatedItem);
    return updatedItem;
};

/**
 * Remove a feed item
 */
export const removeFeedItem = (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Item ID is required for deletion.');
    return dbDelete(LS.FEED_ITEMS, id);
};

/**
 * Save multiple feed items at once
 */
export const saveFeedItems = async (items: FeedItem[]): Promise<void> => {
    await Promise.all(items.map(item => dbPut(LS.FEED_ITEMS, item)));
};

/**
 * Add a new spark (user-created content)
 */
export const addSpark = async (
    sparkData: Omit<FeedItem, 'id' | 'createdAt' | 'type' | 'is_read' | 'is_spark'>
): Promise<FeedItem> => {
    if (!sparkData.title) throw new ValidationError('Spark title is required.');

    const newSpark: FeedItem = {
        id: `spark-${Date.now()}`,
        type: 'spark',
        is_read: false,
        is_spark: true,
        createdAt: new Date().toISOString(),
        ...sparkData,
    };

    await dbPut(LS.FEED_ITEMS, newSpark);

    logEvent({
        eventType: 'spark_created',
        itemId: newSpark.id,
        itemTitle: newSpark.title,
        metadata: { source: newSpark.source },
    });

    return newSpark;
};

/**
 * Mark a feed item as read/unread
 */
export const markFeedItemAsRead = async (id: string, isRead: boolean = true): Promise<FeedItem> => {
    return updateFeedItem(id, { is_read: isRead });
};

/**
 * Toggle spark status on a feed item
 */
export const toggleSparkStatus = async (id: string): Promise<FeedItem> => {
    const item = await dbGet<FeedItem>(LS.FEED_ITEMS, id);
    if (!item) throw new NotFoundError('FeedItem', id);

    return updateFeedItem(id, { is_spark: !item.is_spark });
};

/**
 * Get unread feed items count
 */
export const getUnreadFeedItemsCount = async (): Promise<number> => {
    const items = await dbGetAll<FeedItem>(LS.FEED_ITEMS);
    return items.filter(item => !item.is_read).length;
};

/**
 * Get starred/spark items
 */
export const getSparkItems = async (): Promise<FeedItem[]> => {
    const items = await dbGetAll<FeedItem>(LS.FEED_ITEMS);
    return items.filter(item => item.is_spark).sort(safeDateSort);
};
