import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { RssFeed } from '../../types';
import { defaultRssFeeds } from '../mockData';
import {
    dbGet,
    dbPut,
    dbDelete,
    initializeDefaultData
} from './indexedDBCore';
import { fetchAndParseFeed } from '../rssService';
import { ValidationError } from '../errors';

export const getFeeds = (): Promise<RssFeed[]> =>
    initializeDefaultData(LS.RSS_FEEDS, defaultRssFeeds);

export const addFeed = async (url: string, spaceId?: string): Promise<RssFeed> => {
    if (!url || !url.startsWith('http'))
        throw new ValidationError('A valid URL is required to add a feed.');
    const feeds = await getFeeds();
    if (feeds.some(feed => feed.url === url)) throw new Error('פיד עם כתובת זו כבר קיים.');
    const parsedFeed = await fetchAndParseFeed(url);
    const newFeed: RssFeed = { id: `rss-${Date.now()}`, url, name: parsedFeed.title, spaceId };
    await dbPut(LS.RSS_FEEDS, newFeed);
    return newFeed;
};

export const removeFeed = (id: string): Promise<void> => dbDelete(LS.RSS_FEEDS, id);
export const reAddFeed = (item: RssFeed): Promise<void> => dbPut(LS.RSS_FEEDS, item);

export const updateFeed = async (id: string, updates: Partial<RssFeed>): Promise<void> => {
    const feedToUpdate = await dbGet<RssFeed>(LS.RSS_FEEDS, id);
    if (feedToUpdate) await dbPut(LS.RSS_FEEDS, { ...feedToUpdate, ...updates });
};
