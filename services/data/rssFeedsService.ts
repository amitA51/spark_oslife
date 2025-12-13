/**
 * RSS Feeds Service
 * Handles CRUD operations for RSS feed subscriptions
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete, initializeDefaultData } from './dbCore';
import { ValidationError } from '../errors';
import { fetchAndParseFeed } from '../rssService';
import { defaultRssFeeds } from '../mockData';
import type { RssFeed } from '../../types';

/**
 * Get all RSS feeds
 */
export const getFeeds = (): Promise<RssFeed[]> =>
    initializeDefaultData(LS.RSS_FEEDS, defaultRssFeeds);

/**
 * Add a new RSS feed
 */
export const addFeed = async (url: string, spaceId?: string): Promise<RssFeed> => {
    if (!url || !url.startsWith('http')) {
        throw new ValidationError('A valid URL is required to add a feed.');
    }

    const feeds = await getFeeds();
    if (feeds.some(feed => feed.url === url)) {
        throw new Error('פיד עם כתובת זו כבר קיים.');
    }

    const parsedFeed = await fetchAndParseFeed(url);
    const newFeed: RssFeed = {
        id: `rss-${Date.now()}`,
        url,
        name: parsedFeed.title,
        spaceId
    };

    await dbPut(LS.RSS_FEEDS, newFeed);
    return newFeed;
};

/**
 * Remove an RSS feed
 */
export const removeFeed = (id: string): Promise<void> =>
    dbDelete(LS.RSS_FEEDS, id);

/**
 * Re-add an RSS feed (used for import/restore)
 */
export const reAddFeed = (item: RssFeed): Promise<void> =>
    dbPut(LS.RSS_FEEDS, item);

/**
 * Update an RSS feed
 */
export const updateFeed = async (id: string, updates: Partial<RssFeed>): Promise<void> => {
    const feedToUpdate = await dbGet<RssFeed>(LS.RSS_FEEDS, id);
    if (feedToUpdate) {
        await dbPut(LS.RSS_FEEDS, { ...feedToUpdate, ...updates });
    }
};

/**
 * Get feeds by space ID
 */
export const getFeedsBySpace = async (spaceId: string): Promise<RssFeed[]> => {
    const feeds = await getFeeds();
    return feeds.filter(feed => feed.spaceId === spaceId);
};
