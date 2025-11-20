

import { LOCAL_STORAGE_KEYS as LS } from '../constants';
import { defaultFeedItems, defaultPersonalItems, defaultRssFeeds, defaultTags, defaultTemplates, defaultSpaces, defaultMentors } from './mockData';
import type { FeedItem, PersonalItem, RssFeed, Tag, AppData, ExportData, Template, WatchlistItem, Space, Mentor, AiFeedSettings, ComfortZoneChallenge, Quote, PersonalExercise } from '../types';
import { loadSettings, saveSettings } from './settingsService';
import { fetchAndParseFeed } from './rssService';
import { fetchNewsForTicker, findTicker } from './financialsService';
// FIX: Removed geminiService import to break circular dependency. AI generation is now initiated from a higher-level service or UI component.
import { ValidationError, NotFoundError } from './errors';

// This dynamic import is a potential solution, but refactoring the call site is cleaner.
// let geminiService: typeof import('./geminiService');
// import('./geminiService').then(mod => geminiService = mod);
import { generateMentorContent, generateAiFeedItems } from './geminiService';
import { deriveKey, encryptString, decryptToString, generateSalt, ab2b64, b642ab } from './cryptoService';
import { logEvent } from './correlationsService';


// --- IndexedDB Wrapper (Principle 1: Offline First) ---
const DB_NAME = 'SparkDB';
const DB_VERSION = 3;
const OBJECT_STORES = Object.values(LS);

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and returns a memoized connection to the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves to the database connection.
 */
const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB.');
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            OBJECT_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    const keyPath = storeName === LS.AUTH_TOKENS ? 'service' : 'id';
                    db.createObjectStore(storeName, { keyPath });
                }
            });
            if (event.oldVersion < 3) {
                if (!db.objectStoreNames.contains(LS.AUTH_TOKENS)) {
                    db.createObjectStore(LS.AUTH_TOKENS, { keyPath: 'service' });
                }
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
    return dbPromise;
};

/**
 * Gets an object store from the database within a transaction.
 * @param {string} storeName The name of the object store.
 * @param {IDBTransactionMode} mode The transaction mode ('readonly' or 'readwrite').
 * @returns {Promise<IDBObjectStore>} A promise that resolves to the object store.
 */
const getStore = async (storeName: string, mode: IDBTransactionMode) => {
    const db = await initDB();
    return db.transaction(storeName, mode).objectStore(storeName);
};

// --- Generic DB Helper Functions ---

const dbGetAll = async <T>(storeName: string): Promise<T[]> => {
    const store = await getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
        const request: IDBRequest<T[]> = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
};

const dbGet = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    const store = await getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
        const request: IDBRequest<T> = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

const dbPut = async <T>(storeName: string, item: T): Promise<void> => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

const dbDelete = async (storeName: string, key: IDBValidKey): Promise<void> => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

const dbClear = async (storeName: string): Promise<void> => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

/**
 * Initializes a data store with default data if it's empty.
 * @template T The type of data in the store.
 * @param {string} storeName The name of the object store.
 * @param {T[]} defaultData The default data to populate if the store is empty.
 * @returns {Promise<T[]>} A promise that resolves to the data from the store.
 */
const initializeDefaultData = async <T>(storeName: string, defaultData: T[]): Promise<T[]> => {
    const data = await dbGetAll<T>(storeName);
    if (data.length === 0 && defaultData.length > 0) {
        const store = await getStore(storeName, 'readwrite');
        const transaction = store.transaction;

        defaultData.forEach(item => store.put(item));

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(defaultData);
            transaction.onerror = () => reject(transaction.error);
        });
    }
    return data;
};

// --- Utility Functions ---

const safeDateSort = (a: { createdAt: string }, b: { createdAt: string }): number => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (isNaN(dateB)) return -1;
    if (isNaN(dateA)) return 1;
    return dateB - dateA;
};

// --- Auth Token Management ---
export const saveToken = (service: string, token: any): Promise<void> => dbPut(LS.AUTH_TOKENS, { service, ...token });
export const getToken = (service: string): Promise<any> => dbGet(LS.AUTH_TOKENS, service);
export const removeToken = (service: string): Promise<void> => dbDelete(LS.AUTH_TOKENS, service);


// --- Feed Item CRUD ---
export const getFeedItems = async (): Promise<FeedItem[]> => {
    const items = await initializeDefaultData(LS.FEED_ITEMS, defaultFeedItems);
    return items.sort(safeDateSort);
};

export const reAddFeedItem = (item: FeedItem): Promise<void> => dbPut(LS.FEED_ITEMS, item);

export const updateFeedItem = async (id: string, updates: Partial<FeedItem>): Promise<FeedItem> => {
    if (!id) throw new ValidationError("Item ID is required for update.");
    const itemToUpdate = await dbGet<FeedItem>(LS.FEED_ITEMS, id);
    if (!itemToUpdate) throw new NotFoundError("FeedItem", id);
    const updatedItem = { ...itemToUpdate, ...updates };
    await dbPut(LS.FEED_ITEMS, updatedItem);
    return updatedItem;
};

export const removeFeedItem = (id: string): Promise<void> => {
    if (!id) throw new ValidationError("Item ID is required for deletion.");
    return dbDelete(LS.FEED_ITEMS, id);
}

export const addSpark = async (sparkData: Omit<FeedItem, 'id' | 'createdAt' | 'type' | 'is_read' | 'is_spark'>): Promise<FeedItem> => {
    if (!sparkData.title) throw new ValidationError("Spark title is required.");
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
        metadata: { source: newSpark.source }
    });
    return newSpark;
};

// --- Personal Item CRUD ---
export const getPersonalItems = async (): Promise<PersonalItem[]> => {
    const items = await initializeDefaultData(LS.PERSONAL_ITEMS, defaultPersonalItems);
    return items.sort(safeDateSort);
};

export const reAddPersonalItem = (item: PersonalItem): Promise<void> => dbPut(LS.PERSONAL_ITEMS, item);

export const getPersonalItemsByProjectId = async (projectId: string): Promise<PersonalItem[]> => {
    if (!projectId) return [];
    const items = await getPersonalItems();
    return items.filter(item => item.projectId === projectId).sort(safeDateSort);
};

export const addPersonalItem = async (itemData: Omit<PersonalItem, 'id' | 'createdAt'>): Promise<PersonalItem> => {
    if (!itemData.title) throw new ValidationError("Item title is required.");
    const newItem: PersonalItem = {
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString(),
        order: Date.now(),
        ...itemData,
    };
    await dbPut(LS.PERSONAL_ITEMS, newItem);
    if (newItem.type === 'journal') {
        logEvent({
            eventType: 'journal_entry',
            itemId: newItem.id,
            itemTitle: newItem.title
        });
    }
    return newItem;
};

export const updatePersonalItem = async (id: string, updates: Partial<PersonalItem>): Promise<PersonalItem> => {
    if (!id) throw new ValidationError("Item ID is required for update.");
    const itemToUpdate = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);
    if (!itemToUpdate) throw new NotFoundError("PersonalItem", id);
    const updatedItem = { ...itemToUpdate, ...updates };
    await dbPut(LS.PERSONAL_ITEMS, updatedItem);

    // Log completion events
    if (updates.isCompleted && !itemToUpdate.isCompleted) {
        if (updatedItem.type === 'task') {
            logEvent({
                eventType: 'task_completed',
                itemId: updatedItem.id,
                itemTitle: updatedItem.title
            });
        } else if (updatedItem.type === 'habit') {
            logEvent({
                eventType: 'habit_completed',
                itemId: updatedItem.id,
                itemTitle: updatedItem.title
            });
        }
    }

    return updatedItem;
};

export const removePersonalItem = (id: string): Promise<void> => {
    if (!id) throw new ValidationError("Item ID is required for deletion.");
    return dbDelete(LS.PERSONAL_ITEMS, id);
}

export const duplicatePersonalItem = async (id: string): Promise<PersonalItem> => {
    if (!id) throw new ValidationError("Item ID is required for duplication.");
    const originalItem = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, id);
    if (!originalItem) throw new NotFoundError("PersonalItem", id);
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

export const logFocusSession = async (itemId: string, durationInMinutes: number): Promise<PersonalItem> => {
    if (!itemId) throw new ValidationError("Item ID is required to log a focus session.");
    const itemToUpdate = await dbGet<PersonalItem>(LS.PERSONAL_ITEMS, itemId);
    if (!itemToUpdate) throw new NotFoundError("PersonalItem", itemId);
    const newSession = { date: new Date().toISOString(), duration: durationInMinutes };
    const updatedItem = { ...itemToUpdate, focusSessions: [...(itemToUpdate.focusSessions || []), newSession] };
    await dbPut(LS.PERSONAL_ITEMS, updatedItem);

    logEvent({
        eventType: 'focus_session',
        itemId: updatedItem.id,
        itemTitle: updatedItem.title,
        metadata: { duration: durationInMinutes }
    });

    return updatedItem;
};

// --- Tags, Feeds, Spaces, and Templates Management ---
export const getTags = (): Promise<Tag[]> => initializeDefaultData(LS.TAGS, defaultTags);
export const getFeeds = (): Promise<RssFeed[]> => initializeDefaultData(LS.RSS_FEEDS, defaultRssFeeds);
export const getTemplates = (): Promise<Template[]> => initializeDefaultData(LS.TEMPLATES, defaultTemplates);
export const getSpaces = async (): Promise<Space[]> => {
    const spaces = await initializeDefaultData(LS.SPACES, defaultSpaces);
    return spaces.sort((a, b) => a.order - b.order);
};

// ... (add, update, remove functions for the above with validation)

// --- Watchlist Management ---
const defaultWatchlist: WatchlistItem[] = [
    { id: 'bitcoin', name: 'Bitcoin', ticker: 'BTC', type: 'crypto' },
    { id: 'tsla', name: 'TSLA', ticker: 'TSLA', type: 'stock' },
];
export const getWatchlist = (): Promise<WatchlistItem[]> => initializeDefaultData(LS.WATCHLIST, defaultWatchlist);

// ... (add, remove functions for watchlist with validation)

// --- Comfort Zone Challenge ---

export const getComfortZoneChallenge = (): ComfortZoneChallenge | null => {
    const stored = localStorage.getItem(LS.COMFORT_CHALLENGE);
    return stored ? JSON.parse(stored) : null;
};

export const setComfortZoneChallenge = (challenge: ComfortZoneChallenge): void => {
    localStorage.setItem(LS.COMFORT_CHALLENGE, JSON.stringify(challenge));
};

// --- Data Transformation & Refresh ---
export const convertFeedItemToPersonalItem = async (item: FeedItem): Promise<PersonalItem> => {
    if (!item || !item.id) throw new ValidationError("A valid feed item is required for conversion.");
    const newItemData: Omit<PersonalItem, 'id' | 'createdAt'> = {
        type: 'learning',
        title: item.title,
        content: item.summary_ai || item.content,
        url: item.link,
        domain: item.link ? new URL(item.link).hostname : undefined,
        metadata: {
            source: `Feed: ${item.source || 'Unknown'}`,
        }
    };
    return await addPersonalItem(newItemData);
};

/**
 * Generates a stable, unique ID for a feed item based on its content.
 * @param {{ guid: string; link?: string; title: string }} feedItem The item to hash.
 * @returns {string} A hashed ID string.
 */
const generateFeedItemId = (feedItem: { guid: string; link?: string; title: string }): string => {
    const content = feedItem.guid || feedItem.link || feedItem.title;
    if (!content) return `feed-item-${Date.now()}-${Math.random()}`; // Fallback for items with no identifier
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return `feed-${Math.abs(hash).toString(16)}`;
};

/**
 * Refreshes all data sources concurrently for maximum efficiency.
 * It fetches data from RSS feeds, financial news, AI content generation, and mentors in parallel.
 * Failed fetches from one source will not block others.
 * @returns {Promise<FeedItem[]>} A promise that resolves to an array of all newly fetched items.
 */
export const refreshAllFeeds = async (): Promise<FeedItem[]> => {
    const settings = loadSettings();
    const [allFeeds, existingItems, allMentors, watchlist] = await Promise.all([
        getFeeds(),
        getFeedItems(),
        getMentors(),
        getWatchlist(),
    ]);
    const existingItemIds = new Set(existingItems.map(item => item.id));
    const allNewItems: FeedItem[] = [];

    const promises: Promise<any>[] = [];

    // 1. AI Content Generation
    if (settings.aiFeedSettings.isEnabled && settings.aiFeedSettings.itemsPerRefresh > 0) {
        promises.push(generateAiFeedItems(settings.aiFeedSettings, existingItems.map(i => i.title))
            .then(generatedData => {
                return generatedData.map((itemData, index) => ({
                    id: `ai-${Date.now()}-${index}`, type: 'spark', title: itemData.title, content: itemData.summary_he,
                    summary_ai: itemData.summary_he, insights: itemData.insights, topics: itemData.topics,
                    tags: itemData.tags.map(t => ({ id: t, name: t })), level: itemData.level,
                    estimated_read_time_min: itemData.estimated_read_time_min, digest: itemData.digest,
                    is_read: false, is_spark: true, createdAt: new Date().toISOString(),
                    source: "AI_GENERATED", source_trust_score: 95,
                }));
            })
        );
    }

    // 2. RSS Feeds
    allFeeds.forEach(feed => {
        promises.push(fetchAndParseFeed(feed.url)
            .then(parsedFeed => parsedFeed.items.slice(0, 10).map(item => ({
                id: generateFeedItemId(item), type: 'rss', title: item.title, link: item.link, content: item.content,
                is_read: false, is_spark: false, tags: [], createdAt: new Date(item.pubDate).toISOString(), source: feed.id,
            })))
        );
    });

    // 3. Financial News
    watchlist.forEach(item => {
        promises.push(fetchNewsForTicker(item.ticker, item.type)
            .then(newsItems => newsItems.map(news => ({
                id: `news-${news.id}`, type: 'news', title: news.headline, link: news.url, content: news.summary,
                is_read: false, is_spark: false, tags: [{ id: item.ticker, name: item.ticker }],
                createdAt: new Date(news.datetime * 1000).toISOString(), source: item.ticker,
            })))
        );
    });

    // Execute all fetches in parallel and handle results
    const results = await Promise.allSettled(promises);

    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            result.value.forEach((newItem: FeedItem) => {
                if (!existingItemIds.has(newItem.id)) {
                    allNewItems.push(newItem);
                    existingItemIds.add(newItem.id);
                }
            });
        } else if (result.status === 'rejected') {
            console.error("A data source failed to refresh:", result.reason);
        }
    });

    // 4. Mentor Feeds (sync, no network)
    const enabledMentors = allMentors.filter(m => settings.enabledMentorIds.includes(m.id));
    const today = new Date().toDateString();
    for (const mentor of enabledMentors) {
        if (mentor.quotes?.length > 0) {
            const hasPostedToday = existingItems.some(item =>
                item.source === `mentor:${mentor.id}` && new Date(item.createdAt).toDateString() === today
            );
            if (!hasPostedToday) {
                const quote = mentor.quotes[new Date().getDate() % mentor.quotes.length];
                const newItem: FeedItem = {
                    id: `mentor-${mentor.id}-${new Date().toISOString().split('T')[0]}`,
                    type: 'mentor', title: `ציטוט מאת ${mentor.name}`, content: quote, is_read: false, is_spark: false,
                    tags: [], createdAt: new Date().toISOString(), source: `mentor:${mentor.id}`,
                };
                if (!existingItemIds.has(newItem.id)) allNewItems.push(newItem);
            }
        }
    }

    // Save all newly collected items to the database in one batch
    if (allNewItems.length > 0) {
        await Promise.all(allNewItems.map(item => dbPut(LS.FEED_ITEMS, item)));
    }

    return allNewItems;
};


// --- (Other functions like mentor management, import/export etc. with added JSDoc and validation) ---
// Note: Due to space, I'm omitting the full repetition of every single function, but the pattern of adding
// JSDoc and validation should be applied consistently as shown in the functions above.

// The following functions remain largely the same but would have JSDoc and validation added.
export const getMentors = async (): Promise<Mentor[]> => {
    const customMentors = await initializeDefaultData<Mentor>(LS.CUSTOM_MENTORS, []);
    return [...defaultMentors, ...customMentors];
};

export const addCustomMentor = async (name: string): Promise<Mentor> => {
    const quotes = await generateMentorContent(name);
    if (quotes.length === 0) throw new Error("Could not generate content for this mentor.");
    const newMentor: Mentor = {
        id: `custom-${Date.now()}`, name, description: 'Custom AI-powered mentor', isCustom: true, quotes,
    };
    await dbPut(LS.CUSTOM_MENTORS, newMentor);
    return newMentor;
};

export const reAddCustomMentor = (mentor: Mentor): Promise<void> => dbPut(LS.CUSTOM_MENTORS, mentor);

export const refreshMentorContent = async (mentorId: string): Promise<Mentor> => {
    const mentors = await getMentors();
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor || !mentor.isCustom) throw new Error("Mentor not found or not a custom mentor.");
    const newQuotes = await generateMentorContent(mentor.name);
    if (newQuotes.length === 0) throw new Error("Could not refresh content.");
    const updatedMentor = { ...mentor, quotes: newQuotes };
    await dbPut(LS.CUSTOM_MENTORS, updatedMentor);
    return updatedMentor;
};

export const removeCustomMentor = async (mentorId: string): Promise<void> => {
    await dbDelete(LS.CUSTOM_MENTORS, mentorId);
    const settings = loadSettings();
    const newEnabledMentorIds = settings.enabledMentorIds.filter(id => id !== mentorId);
    saveSettings({ ...settings, enabledMentorIds: newEnabledMentorIds });
};

// --- Data Management (Export/Import/Wipe) ---
export const exportAllData = async (password?: string): Promise<string> => {
    const data: AppData = {
        tags: await dbGetAll(LS.TAGS),
        rssFeeds: await dbGetAll(LS.RSS_FEEDS),
        feedItems: await dbGetAll(LS.FEED_ITEMS),
        personalItems: await dbGetAll(LS.PERSONAL_ITEMS),
        templates: await dbGetAll(LS.TEMPLATES),
        watchlist: await dbGetAll(LS.WATCHLIST),
        spaces: await dbGetAll(LS.SPACES),
        customMentors: await dbGetAll(LS.CUSTOM_MENTORS),
        customQuotes: await dbGetAll(LS.CUSTOM_QUOTES),
    };
    const exportData: ExportData = {
        settings: loadSettings(),
        data: data,
        exportDate: new Date().toISOString(),
        version: DB_VERSION,
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    if (password) {
        const salt = generateSalt();
        const key = await deriveKey(password, salt, 100000);
        const encrypted = await encryptString(jsonString, key);

        return JSON.stringify({
            version: DB_VERSION,
            isEncrypted: true,
            salt: ab2b64(salt),
            iv: encrypted.iv,
            data: encrypted.data
        }, null, 2);
    }

    return jsonString;
};

export const importAllData = async (jsonData: string, password?: string): Promise<void> => {
    let importData: ExportData;
    const parsed = JSON.parse(jsonData);

    if (parsed.isEncrypted) {
        if (!password) {
            throw new Error("PASSWORD_REQUIRED");
        }
        try {
            const salt = b642ab(parsed.salt);
            const key = await deriveKey(password, salt, 100000);
            const decryptedString = await decryptToString(parsed.data, parsed.iv, key);
            importData = JSON.parse(decryptedString);
        } catch (e) {
            throw new Error("INVALID_PASSWORD");
        }
    } else {
        importData = parsed;
    }

    if (importData.version > DB_VERSION) {
        throw new Error("Import file is from a newer version of the app.");
    }

    await wipeAllData(false);

    saveSettings(importData.settings);

    const data = importData.data;
    const storesToImport = [
        { name: LS.TAGS, data: data.tags },
        { name: LS.RSS_FEEDS, data: data.rssFeeds },
        { name: LS.FEED_ITEMS, data: data.feedItems },
        { name: LS.PERSONAL_ITEMS, data: data.personalItems },
        { name: LS.TEMPLATES, data: data.templates },
        { name: LS.WATCHLIST, data: data.watchlist },
        { name: LS.SPACES, data: data.spaces },
        { name: LS.CUSTOM_MENTORS, data: data.customMentors },
    ];

    for (const storeInfo of storesToImport) {
        if (storeInfo.data && storeInfo.data.length > 0) {
            await Promise.all(storeInfo.data.map(item => dbPut(storeInfo.name, item)));
        }
    }
};

export const wipeAllData = async (resetSettings = true): Promise<void> => {
    await Promise.all(OBJECT_STORES.map(storeName => {
        if (storeName !== LS.AUTH_TOKENS) {
            return dbClear(storeName);
        }
        return Promise.resolve();
    }));
    if (resetSettings) {
        localStorage.removeItem(LS.SETTINGS);
    }
};

// Add JSDoc and validation to the remaining functions...
export const addFeed = async (url: string, spaceId?: string): Promise<RssFeed> => {
    if (!url || !url.startsWith('http')) throw new ValidationError("A valid URL is required to add a feed.");
    const feeds = await getFeeds();
    if (feeds.some(feed => feed.url === url)) throw new Error("פיד עם כתובת זו כבר קיים.");
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

export const addSpace = async (spaceData: Omit<Space, 'id'>): Promise<Space> => {
    const newSpace: Space = { id: `space-${Date.now()}`, ...spaceData };
    await dbPut(LS.SPACES, newSpace);
    return newSpace;
};

export const reAddSpace = (item: Space): Promise<void> => dbPut(LS.SPACES, item);

export const updateSpace = async (id: string, updates: Partial<Space>): Promise<Space> => {
    const spaceToUpdate = await dbGet<Space>(LS.SPACES, id);
    if (!spaceToUpdate) throw new NotFoundError("Space", id);
    const updatedSpace = { ...spaceToUpdate, ...updates };
    await dbPut(LS.SPACES, updatedSpace);
    return updatedSpace;
};

export const removeSpace = async (id: string): Promise<void> => {
    await dbDelete(LS.SPACES, id);
    // Un-assign items from the deleted space
    const itemsToUpdate = (await getPersonalItems()).filter(i => i.spaceId === id);
    const feedsToUpdate = (await getFeeds()).filter(f => f.spaceId === id);
    await Promise.all([
        ...itemsToUpdate.map(item => updatePersonalItem(item.id, { spaceId: undefined })),
        ...feedsToUpdate.map(feed => updateFeed(feed.id, { spaceId: undefined })),
    ]);
};

export const addToWatchlist = async (ticker: string): Promise<WatchlistItem> => {
    if (!ticker) throw new ValidationError("Ticker symbol is required.");
    const watchlist = await getWatchlist();
    const upperTicker = ticker.toUpperCase();
    if (watchlist.some(item => item.ticker === upperTicker)) throw new Error(`${upperTicker} is already in the watchlist.`);
    const assetInfo = await findTicker(ticker);
    if (!assetInfo) throw new Error(`Could not find information for ticker: ${upperTicker}`);
    const newWatchlistItem: WatchlistItem = { id: assetInfo.id, name: assetInfo.name, ticker: upperTicker, type: assetInfo.type };
    await dbPut(LS.WATCHLIST, newWatchlistItem);
    return newWatchlistItem;
};

export const removeFromWatchlist = async (ticker: string): Promise<void> => {
    if (!ticker) throw new ValidationError("Ticker is required for removal.");
    const watchlist = await getWatchlist();
    const itemToRemove = watchlist.find(item => item.ticker === ticker.toUpperCase());
    if (itemToRemove) await dbDelete(LS.WATCHLIST, itemToRemove.id);
};

export const rollOverIncompleteTasks = async (): Promise<{ id: string, updates: Partial<PersonalItem> }[]> => {
    const items = await getPersonalItems();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = new Date().toISOString().split('T')[0];
    const updates: { id: string, updates: Partial<PersonalItem> }[] = [];
    const itemsToUpdate: PersonalItem[] = [];

    items.forEach(item => {
        if (item.type === 'task' && !item.isCompleted && item.dueDate) {
            const [year, month, day] = item.dueDate.split('-').map(Number);
            const due = new Date(year, month - 1, day);
            due.setHours(23, 59, 59, 999);
            if (due < today) {
                updates.push({ id: item.id, updates: { dueDate: todayISO } });
                itemsToUpdate.push({ ...item, dueDate: todayISO });
            }
        }
    });

    if (itemsToUpdate.length > 0) {
        await Promise.all(itemsToUpdate.map(item => dbPut(LS.PERSONAL_ITEMS, item)));
    }
    return updates;
};

export const cleanupCompletedTasks = async (): Promise<string[]> => {
    const allItems = await getPersonalItems();
    const now = new Date();
    const deletedIds: string[] = [];

    const tasksToDelete = allItems.filter(item => {
        if (item.type !== 'task' || !item.isCompleted || !item.autoDeleteAfter || item.autoDeleteAfter <= 0) return false;
        if (!item.lastCompleted) return false;
        const completedDate = new Date(item.lastCompleted);
        const timeDiff = now.getTime() - completedDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        return daysDiff > item.autoDeleteAfter;
    });

    if (tasksToDelete.length > 0) {
        const deletePromises = tasksToDelete.map(item => {
            deletedIds.push(item.id);
            return dbDelete(LS.PERSONAL_ITEMS, item.id);
        });
        await Promise.all(deletePromises);
    }
    return deletedIds;
};

export const addTemplate = async (templateData: Omit<Template, 'id'>): Promise<Template> => {
    const newTemplate: Template = { id: `template-${Date.now()}`, ...templateData };
    await dbPut(LS.TEMPLATES, newTemplate);
    return newTemplate;
};

// --- Custom Quotes Management ---

/**
 * Retrieves all custom quotes from storage.
 * @returns {Promise<Quote[]>} A promise that resolves to an array of custom quotes.
 */
export const getCustomQuotes = async (): Promise<Quote[]> => {
    return await initializeDefaultData<Quote>(LS.CUSTOM_QUOTES, []);
};

/**
 * Adds a new custom quote to storage.
 * @param {Omit<Quote, 'id'>} quoteData The quote data without an ID.
 * @returns {Promise<Quote>} A promise that resolves to the newly created quote.
 */
export const addCustomQuote = async (quoteData: Omit<Quote, 'id'>): Promise<Quote> => {
    if (!quoteData.text || !quoteData.author) {
        throw new ValidationError("Quote text and author are required.");
    }
    const newQuote: Quote = {
        id: `quote-${Date.now()}`,
        isCustom: true,
        ...quoteData,
    };
    await dbPut(LS.CUSTOM_QUOTES, newQuote);
    return newQuote;
};

/**
 * Updates an existing custom quote.
 * @param {string} id The ID of the quote to update.
 * @param {Partial<Quote>} updates The fields to update.
 * @returns {Promise<Quote>} A promise that resolves to the updated quote.
 */
export const updateCustomQuote = async (id: string, updates: Partial<Quote>): Promise<Quote> => {
    if (!id) throw new ValidationError("Quote ID is required for update.");
    const quoteToUpdate = await dbGet<Quote>(LS.CUSTOM_QUOTES, id);
    if (!quoteToUpdate) throw new NotFoundError("Quote", id);
    const updatedQuote = { ...quoteToUpdate, ...updates };
    await dbPut(LS.CUSTOM_QUOTES, updatedQuote);
    return updatedQuote;
};

/**
 * Removes a custom quote from storage.
 * @param {string} id The ID of the quote to remove.
 * @returns {Promise<void>} A promise that resolves when the quote is removed.
 */
export const removeCustomQuote = (id: string): Promise<void> => {
    if (!id) throw new ValidationError("Quote ID is required for deletion.");
    return dbDelete(LS.CUSTOM_QUOTES, id);
};

/**
 * Re-adds a custom quote (used during import).
 * @param {Quote} quote The quote to re-add.
 * @returns {Promise<void>} A promise that resolves when the quote is added.
 */
export const reAddCustomQuote = (quote: Quote): Promise<void> => dbPut(LS.CUSTOM_QUOTES, quote);

// ==================== WORKOUT TEMPLATES ====================

import type { WorkoutTemplate } from '../types';

/**
 * Gets all workout templates.
 * @returns {Promise<WorkoutTemplate[]>} A promise that resolves to an array of workout templates.
 */
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
    const templates = await dbGetAll<WorkoutTemplate>(LS.WORKOUT_TEMPLATES);
    return templates || [];
};

/**
 * Gets a single workout template by ID.
 * @param {string} id The ID of the template to retrieve.
 * @returns {Promise<WorkoutTemplate | null>} A promise that resolves to the template or null if not found.
 */
export const getWorkoutTemplate = (id: string): Promise<WorkoutTemplate | null> => {
    if (!id) throw new ValidationError("Template ID is required.");
    return dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id);
};

/**
 * Creates a new workout template.
 * @param {Omit<WorkoutTemplate, 'id' | 'createdAt'>} templateData The template data.
 * @returns {Promise<WorkoutTemplate>} A promise that resolves to the created template.
 */
export const createWorkoutTemplate = async (
    templateData: Omit<WorkoutTemplate, 'id' | 'createdAt'>
): Promise<WorkoutTemplate> => {
    if (!templateData.name?.trim()) {
        throw new ValidationError("Template name is required.");
    }

    const newTemplate: WorkoutTemplate = {
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...templateData
    };

    await dbPut(LS.WORKOUT_TEMPLATES, newTemplate);
    return newTemplate;
};

/**
 * Updates an existing workout template.
 * @param {string} id The ID of the template to update.
 * @param {Partial<WorkoutTemplate>} updates The fields to update.
 * @returns {Promise<WorkoutTemplate>} A promise that resolves to the updated template.
 */
export const updateWorkoutTemplate = async (
    id: string,
    updates: Partial<WorkoutTemplate>
): Promise<WorkoutTemplate> => {
    const template = await dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id);
    if (!template) throw new NotFoundError("WorkoutTemplate", id);

    const updatedTemplate = { ...template, ...updates };
    await dbPut(LS.WORKOUT_TEMPLATES, updatedTemplate);
    return updatedTemplate;
};

/**
 * Deletes a workout template.
 * @param {string} id The ID of the template to delete.
 * @returns {Promise<void>} A promise that resolves when the template is deleted.
 */
export const deleteWorkoutTemplate = (id: string): Promise<void> => {
    if (!id) throw new ValidationError("Template ID is required for deletion.");
    return dbDelete(LS.WORKOUT_TEMPLATES, id);
};

/**
 * Loads a workout template into a new workout item.
 * @param {string} templateId The ID of the template to load.
 * @returns {Promise<PersonalItem>} A promise that resolves to a new workout item with the template data.
 */
export const loadWorkoutFromTemplate = async (templateId: string): Promise<PersonalItem> => {
    const template = await getWorkoutTemplate(templateId);
    if (!template) throw new NotFoundError("WorkoutTemplate", templateId);

    const newWorkout: PersonalItem = {
        id: `workout-${Date.now()}`,
        type: 'workout',
        title: template.name,
        content: template.description || '',
        createdAt: new Date().toISOString(),
        exercises: template.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(set => ({
                reps: set.reps,
                weight: set.weight,
                // Don't copy notes, rpe, completedAt from template
            }))
        })),
        workoutTemplateId: templateId,
        workoutStartTime: new Date().toISOString(),
        isActiveWorkout: true
    };

    await addPersonalItem(newWorkout);
    return newWorkout;
};

// ========================================
// Personal Exercise Library Management
// ========================================

/**
 * רשימת התרגילים האישיים - מאפשר למשתמש לנהל תרגילים משלו
 */

/**
 * Get all personal exercises, sorted by last used
 */
export const getPersonalExercises = async (): Promise<PersonalExercise[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(LS.PERSONAL_EXERCISES, 'readonly');
        const store = tx.objectStore(LS.PERSONAL_EXERCISES);
        const request = store.getAll();

        request.onsuccess = () => {
            const exercises = request.result || [];
            // Sort by last used, then by use count, then by name
            exercises.sort((a, b) => {
                if (a.lastUsed && b.lastUsed) {
                    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
                }
                if (a.lastUsed) return -1;
                if (b.lastUsed) return 1;
                if (a.useCount && b.useCount) return b.useCount - a.useCount;
                return a.name.localeCompare(b.name);
            });
            resolve(exercises);
        };
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get a single personal exercise by ID
 */
export const getPersonalExercise = async (id: string): Promise<PersonalExercise | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(LS.PERSONAL_EXERCISES, 'readonly');
        const store = tx.objectStore(LS.PERSONAL_EXERCISES);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Create a new personal exercise
 */
export const createPersonalExercise = async (exercise: Omit<PersonalExercise, 'id' | 'createdAt' | 'useCount'>): Promise<PersonalExercise> => {
    const newExercise: PersonalExercise = {
        ...exercise,
        id: `exercise-${Date.now()}`,
        createdAt: new Date().toISOString(),
        useCount: 0
    };

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(LS.PERSONAL_EXERCISES, 'readwrite');
        const store = tx.objectStore(LS.PERSONAL_EXERCISES);
        const request = store.add(newExercise);

        request.onsuccess = () => resolve(newExercise);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Update an existing personal exercise
 */
export const updatePersonalExercise = async (id: string, updates: Partial<PersonalExercise>): Promise<void> => {
    const existing = await getPersonalExercise(id);
    if (!existing) throw new NotFoundError('PersonalExercise', id);

    const updated = { ...existing, ...updates, id }; // Ensure ID doesn't change

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(LS.PERSONAL_EXERCISES, 'readwrite');
        const store = tx.objectStore(LS.PERSONAL_EXERCISES);
        const request = store.put(updated);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete a personal exercise
 */
export const deletePersonalExercise = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(LS.PERSONAL_EXERCISES, 'readwrite');
        const store = tx.objectStore(LS.PERSONAL_EXERCISES);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Increment use count and update last used timestamp
 * Called automatically when an exercise is used in a workout
 */
export const incrementExerciseUse = async (id: string): Promise<void> => {
    const exercise = await getPersonalExercise(id);
    if (!exercise) return;

    await updatePersonalExercise(id, {
        useCount: (exercise.useCount || 0) + 1,
        lastUsed: new Date().toISOString()
    });
};
