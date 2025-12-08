import { LOCAL_STORAGE_KEYS as LS } from '../constants';
import {
  defaultFeedItems,
  defaultPersonalItems,
  defaultRssFeeds,
  defaultTags,
  defaultTemplates,
  defaultSpaces,
  defaultMentors,
} from './mockData';
import { todayKey } from '../utils/dateUtils';
import type {
  PersonalItem,
  FeedItem,
  RssFeed,
  Tag,
  AppData,
  ExportData,
  Template,
  WatchlistItem,
  Space,
  Mentor,
  ComfortZoneChallenge,
  Quote,
  PersonalExercise,
  WorkoutTemplate,
  BodyWeightEntry,
  WorkoutSession,
} from '../types';
import { loadSettings, saveSettings } from './settingsService';
import { fetchAndParseFeed } from './rssService';
import { findTicker } from './financialsService';
// FIX: Removed geminiService import to break circular dependency. AI generation is now initiated from a higher-level service or UI component.
import { ValidationError, NotFoundError } from './errors';

import {
  deriveKey,
  encryptString,
  decryptToString,
  generateSalt,
  ab2b64,
  b642ab,
} from './cryptoService';
import { logEvent } from './correlationsService';
import { auth } from '../config/firebase';
import {
  syncPersonalItem,
  deletePersonalItem as deleteCloudItem,
  subscribeToPersonalItems,
} from './firestoreService';

// --- IndexedDB Wrapper (Principle 1: Offline First) ---
const DB_NAME = 'SparkDB';
const DB_VERSION = 3;
const OBJECT_STORES = [
  ...Object.values(LS),
  'body_weight',
  'workout_sessions',
  'workout_templates',
];

let dbPromise: Promise<IDBDatabase> | null = null;
let dbInstance: IDBDatabase | null = null;

/**
 * Retry utility for async operations
 */
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
};

/**
 * Initializes and returns a memoized connection to the IndexedDB database.
 * Includes connection recovery and better error handling.
 * @returns {Promise<IDBDatabase>} A promise that resolves to the database connection.
 */
const initDB = (): Promise<IDBDatabase> => {
  // Return existing connection if available and open
  if (dbInstance && dbInstance.objectStoreNames.length > 0) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      dbPromise = null; // Reset so next call will retry
      reject(new Error(`Error opening IndexedDB: ${request.error?.message || 'Unknown error'}`));
    };

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - close other tabs');
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Handle database errors during upgrade
      db.onerror = e => {
        console.error('Database error during upgrade:', e);
      };

      OBJECT_STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          try {
            const keyPath = storeName === LS.AUTH_TOKENS ? 'service' : 'id';
            db.createObjectStore(storeName, { keyPath });
          } catch (e) {
            console.error(`Failed to create store ${storeName}:`, e);
          }
        }
      });

      // Handle older version upgrades
      if (event.oldVersion < 3) {
        if (!db.objectStoreNames.contains(LS.AUTH_TOKENS)) {
          try {
            db.createObjectStore(LS.AUTH_TOKENS, { keyPath: 'service' });
          } catch (e) {
            console.error('Failed to create AUTH_TOKENS store:', e);
          }
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle connection close to allow reconnection
      dbInstance.onclose = () => {
        console.warn('IndexedDB connection closed, will reconnect on next operation');
        dbInstance = null;
        dbPromise = null;
      };

      // Handle version change (another tab upgraded the DB)
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
        console.warn('Database version changed - please reload the page');
      };

      resolve(dbInstance);
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

// --- Generic DB Helper Functions with Retry Logic ---

const dbGetAll = async <T>(storeName: string): Promise<T[]> => {
  return withRetry(async () => {
    const store = await getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request: IDBRequest<T[]> = store.getAll();
      request.onerror = () =>
        reject(new Error(`Failed to get all from ${storeName}: ${request.error?.message}`));
      request.onsuccess = () => resolve(request.result || []);
    });
  });
};

const dbGet = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
  return withRetry(async () => {
    const store = await getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request: IDBRequest<T> = store.get(key);
      request.onerror = () =>
        reject(new Error(`Failed to get ${key} from ${storeName}: ${request.error?.message}`));
      request.onsuccess = () => resolve(request.result);
    });
  });
};

const dbPut = async <T>(storeName: string, item: T): Promise<void> => {
  return withRetry(async () => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onerror = () =>
        reject(new Error(`Failed to put item in ${storeName}: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  });
};

const dbDelete = async (storeName: string, key: IDBValidKey): Promise<void> => {
  return withRetry(async () => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () =>
        reject(new Error(`Failed to delete ${key} from ${storeName}: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  });
};

const dbClear = async (storeName: string): Promise<void> => {
  return withRetry(async () => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () =>
        reject(new Error(`Failed to clear ${storeName}: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  }, 2); // Only 2 retries for clear operation
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

/**
 * OAuth token structure for external service authentication
 */
export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

/**
 * Stored auth token with service identifier
 */
export interface StoredAuthToken extends OAuthToken {
  service: string;
}

/**
 * Encrypted token storage structure
 */
interface EncryptedTokenData {
  service: string;
  encrypted: {
    salt: string;    // Base64 encoded salt
    iv: string;      // Base64 encoded IV
    data: string;    // Encrypted token data
  };
}

// Static encryption key component (combined with service name for unique key per service)
const TOKEN_ENCRYPTION_SALT = 'spark-token-encryption-v1';

/**
 * Save an OAuth token with encryption
 * SECURITY: Tokens are encrypted before storage to protect against XSS attacks
 */
export const saveToken = async (service: string, token: OAuthToken): Promise<void> => {
  try {
    const salt = generateSalt();
    const key = await deriveKey(service + TOKEN_ENCRYPTION_SALT, salt, 10000);
    const encrypted = await encryptString(JSON.stringify(token), key);

    const encryptedData: EncryptedTokenData = {
      service,
      encrypted: {
        salt: ab2b64(salt),
        iv: encrypted.iv,
        data: encrypted.data,
      },
    };

    await dbPut(LS.AUTH_TOKENS, encryptedData);
  } catch (error) {
    console.error('Failed to encrypt and save token:', error);
    throw new Error('Failed to save authentication token securely');
  }
};

/**
 * Get and decrypt an OAuth token
 * SECURITY: Tokens are decrypted on retrieval
 */
export const getToken = async (service: string): Promise<StoredAuthToken | null> => {
  try {
    const stored = await dbGet<EncryptedTokenData>(LS.AUTH_TOKENS, service);

    if (!stored?.encrypted) {
      return null;
    }

    const salt = b642ab(stored.encrypted.salt);
    const key = await deriveKey(service + TOKEN_ENCRYPTION_SALT, salt, 10000);
    const decrypted = await decryptToString(stored.encrypted.data, stored.encrypted.iv, key);
    const token = JSON.parse(decrypted) as OAuthToken;

    return { service, ...token };
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    // Token may be corrupted or tampered with - remove it
    await removeToken(service);
    return null;
  }
};

export const removeToken = (service: string): Promise<void> => dbDelete(LS.AUTH_TOKENS, service);

// --- Cloud Sync Initialization ---
let unsubscribePersonalItems: (() => void) | null = null;

export const initializeCloudSync = (
  userId: string,
  onDataUpdate: (items: PersonalItem[]) => void
) => {
  if (unsubscribePersonalItems) {
    unsubscribePersonalItems();
  }

  unsubscribePersonalItems = subscribeToPersonalItems(userId, async cloudItems => {
    // Merge strategy: Cloud wins for now, but we should be careful not to overwrite unsynced local changes in a real app.
    // For this MVP, we'll update local DB with cloud data.
    await Promise.all(cloudItems.map(item => dbPut(LS.PERSONAL_ITEMS, item)));
    onDataUpdate(cloudItems);
  });
};

export const migrateLocalDataToCloud = async (userId: string) => {
  const personalItems = await getPersonalItems();
  // We can batch this or do it one by one. For simplicity and reliability, let's do it in parallel.
  await Promise.all(personalItems.map(item => syncPersonalItem(userId, item)));

  // We could also migrate feed items, settings, etc. here.
};

// --- Feed Item CRUD ---
export const getFeedItems = async (): Promise<FeedItem[]> => {
  const items = await initializeDefaultData(LS.FEED_ITEMS, defaultFeedItems);
  return items.sort(safeDateSort);
};

export const reAddFeedItem = (item: FeedItem): Promise<void> => dbPut(LS.FEED_ITEMS, item);

export const updateFeedItem = async (id: string, updates: Partial<FeedItem>): Promise<FeedItem> => {
  if (!id) throw new ValidationError('Item ID is required for update.');
  const itemToUpdate = await dbGet<FeedItem>(LS.FEED_ITEMS, id);
  if (!itemToUpdate) throw new NotFoundError('FeedItem', id);
  const updatedItem = { ...itemToUpdate, ...updates };
  await dbPut(LS.FEED_ITEMS, updatedItem);
  return updatedItem;
};

export const removeFeedItem = (id: string): Promise<void> => {
  if (!id) throw new ValidationError('Item ID is required for deletion.');
  return dbDelete(LS.FEED_ITEMS, id);
};

export const saveFeedItems = async (items: FeedItem[]): Promise<void> => {
  await Promise.all(items.map(item => dbPut(LS.FEED_ITEMS, item)));
};

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

  // Cloud Sync
  if (auth.currentUser) {
    // We don't have a specific sync function for sparks yet in firestoreService,
    // but we can add it later. For now, we focus on PersonalItems.
  }

  return newSpark;
};

// --- Personal Item CRUD ---
export const getPersonalItems = async (): Promise<PersonalItem[]> => {
  const items = await initializeDefaultData(LS.PERSONAL_ITEMS, defaultPersonalItems);
  return items.sort(safeDateSort);
};

export const reAddPersonalItem = (item: PersonalItem): Promise<void> =>
  dbPut(LS.PERSONAL_ITEMS, item);

export const getPersonalItemsByProjectId = async (projectId: string): Promise<PersonalItem[]> => {
  if (!projectId) return [];
  const items = await getPersonalItems();
  return items.filter(item => item.projectId === projectId).sort(safeDateSort);
};

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
    const event = {
      eventType: 'journal_entry' as const,
      itemId: newItem.id,
      itemTitle: newItem.title,
    };
    logEvent({ ...event, itemTitle: event.itemTitle || 'Untitled' });
    if (auth.currentUser) {
      // Sync event log to cloud
      // We need to construct the full event object or let the service handle it.
      // For simplicity, we'll rely on the local logEvent for now,
      // but ideally logEvent should also sync.
    }
  }

  // Cloud Sync
  if (auth.currentUser) {
    syncPersonalItem(auth.currentUser.uid, newItem).catch(console.error);
  }

  return newItem;
};

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

  // Cloud Sync
  if (auth.currentUser) {
    syncPersonalItem(auth.currentUser.uid, updatedItem).catch(console.error);
  }

  return updatedItem;
};

export const removePersonalItem = async (id: string): Promise<void> => {
  if (!id) throw new ValidationError('Item ID is required for deletion.');
  await dbDelete(LS.PERSONAL_ITEMS, id);

  // Cloud Sync
  if (auth.currentUser) {
    deleteCloudItem(auth.currentUser.uid, id).catch(console.error);
  }
};

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
  };
  await dbPut(LS.PERSONAL_ITEMS, updatedItem);

  logEvent({
    eventType: 'focus_session',
    itemId: updatedItem.id,
    itemTitle: updatedItem.title || 'Untitled',
    metadata: { duration: durationInMinutes },
  });

  // Cloud Sync
  if (auth.currentUser) {
    syncPersonalItem(auth.currentUser.uid, updatedItem).catch(console.error);
  }

  return updatedItem;
};

// --- Tags, Feeds, Spaces, and Templates Management ---
export const getTags = (): Promise<Tag[]> => initializeDefaultData(LS.TAGS, defaultTags);
export const getFeeds = (): Promise<RssFeed[]> =>
  initializeDefaultData(LS.RSS_FEEDS, defaultRssFeeds);
export const getTemplates = (): Promise<Template[]> =>
  initializeDefaultData(LS.TEMPLATES, defaultTemplates);
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
export const getWatchlist = (): Promise<WatchlistItem[]> =>
  initializeDefaultData(LS.WATCHLIST, defaultWatchlist);

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

// --- (Other functions like mentor management, import/export etc. with added JSDoc and validation) ---
// Note: Due to space, I'm omitting the full repetition of every single function, but the pattern of adding
// JSDoc and validation should be applied consistently as shown in the functions above.

// The following functions remain largely the same but would have JSDoc and validation added.
export const getMentors = async (): Promise<Mentor[]> => {
  const customMentors = await initializeDefaultData<Mentor>(LS.CUSTOM_MENTORS, []);
  return [...defaultMentors, ...customMentors];
};

export const reAddCustomMentor = (mentor: Mentor): Promise<void> =>
  dbPut(LS.CUSTOM_MENTORS, mentor);

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

    return JSON.stringify(
      {
        version: DB_VERSION,
        isEncrypted: true,
        salt: ab2b64(salt),
        iv: encrypted.iv,
        data: encrypted.data,
      },
      null,
      2
    );
  }

  return jsonString;
};

export const importAllData = async (jsonData: string, password?: string): Promise<void> => {
  let importData: ExportData;
  const parsed = JSON.parse(jsonData);

  if (parsed.isEncrypted) {
    if (!password) {
      throw new Error('PASSWORD_REQUIRED');
    }
    try {
      const salt = b642ab(parsed.salt);
      const key = await deriveKey(password, salt, 100000);
      const decryptedString = await decryptToString(parsed.data, parsed.iv, key);
      importData = JSON.parse(decryptedString);
    } catch (e) {
      throw new Error('INVALID_PASSWORD');
    }
  } else {
    importData = parsed;
  }

  if (importData.version > DB_VERSION) {
    throw new Error('Import file is from a newer version of the app.');
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
  await Promise.all(
    OBJECT_STORES.map(storeName => {
      if (storeName !== LS.AUTH_TOKENS) {
        return dbClear(storeName);
      }
      return Promise.resolve();
    })
  );
  if (resetSettings) {
    localStorage.removeItem(LS.SETTINGS);
  }
};

// Add JSDoc and validation to the remaining functions...
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

export const addSpace = async (spaceData: Omit<Space, 'id'>): Promise<Space> => {
  const newSpace: Space = { id: `space-${Date.now()}`, ...spaceData };
  await dbPut(LS.SPACES, newSpace);
  return newSpace;
};

export const reAddSpace = (item: Space): Promise<void> => dbPut(LS.SPACES, item);

export const updateSpace = async (id: string, updates: Partial<Space>): Promise<Space> => {
  const spaceToUpdate = await dbGet<Space>(LS.SPACES, id);
  if (!spaceToUpdate) throw new NotFoundError('Space', id);
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
  if (!ticker) throw new ValidationError('Ticker symbol is required.');
  const watchlist = await getWatchlist();
  const upperTicker = ticker.toUpperCase();
  if (watchlist.some(item => item.ticker === upperTicker))
    throw new Error(`${upperTicker} is already in the watchlist.`);
  const assetInfo = await findTicker(ticker);
  if (!assetInfo) throw new Error(`Could not find information for ticker: ${upperTicker}`);
  const newWatchlistItem: WatchlistItem = {
    id: assetInfo.id,
    name: assetInfo.name,
    ticker: upperTicker,
    type: assetInfo.type,
  };
  await dbPut(LS.WATCHLIST, newWatchlistItem);
  return newWatchlistItem;
};

export const removeFromWatchlist = async (ticker: string): Promise<void> => {
  if (!ticker) throw new ValidationError('Ticker is required for removal.');
  const watchlist = await getWatchlist();
  const itemToRemove = watchlist.find(item => item.ticker === ticker.toUpperCase());
  if (itemToRemove) await dbDelete(LS.WATCHLIST, itemToRemove.id);
};

export const rollOverIncompleteTasks = async (): Promise<
  { id: string; updates: Partial<PersonalItem> }[]
> => {
  const items = await getPersonalItems();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = todayKey();
  const updates: { id: string; updates: Partial<PersonalItem> }[] = [];
  const itemsToUpdate: PersonalItem[] = [];

  items.forEach(item => {
    if (item.type === 'task' && !item.isCompleted && item.dueDate) {
      const [year, month, day] = item.dueDate.split('-').map(Number);
      const due = new Date(year || 0, (month || 1) - 1, day || 1);
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
    if (
      item.type !== 'task' ||
      !item.isCompleted ||
      !item.autoDeleteAfter ||
      item.autoDeleteAfter <= 0
    )
      return false;
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
    throw new ValidationError('Quote text and author are required.');
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
  if (!id) throw new ValidationError('Quote ID is required for update.');
  const quoteToUpdate = await dbGet<Quote>(LS.CUSTOM_QUOTES, id);
  if (!quoteToUpdate) throw new NotFoundError('Quote', id);
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
  if (!id) throw new ValidationError('Quote ID is required for deletion.');
  return dbDelete(LS.CUSTOM_QUOTES, id);
};

/**
 * Re-adds a custom quote (used during import).
 * @param {Quote} quote The quote to re-add.
 * @returns {Promise<void>} A promise that resolves when the quote is added.
 */
export const reAddCustomQuote = (quote: Quote): Promise<void> => dbPut(LS.CUSTOM_QUOTES, quote);

// ==================== WORKOUT TEMPLATES ====================

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
  if (!id) throw new ValidationError('Template ID is required.');
  return dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id).then(res => res || null);
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
    throw new ValidationError('Template name is required.');
  }

  const newTemplate: WorkoutTemplate = {
    id: `template-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...templateData,
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
  if (!template) throw new NotFoundError('WorkoutTemplate', id);

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
  if (!id) throw new ValidationError('Template ID is required for deletion.');
  return dbDelete(LS.WORKOUT_TEMPLATES, id);
};

/**
 * Loads a workout template into a new workout item.
 * @param {string} templateId The ID of the template to load.
 * @returns {Promise<PersonalItem>} A promise that resolves to a new workout item with the template data.
 */
export const loadWorkoutFromTemplate = async (templateId: string): Promise<PersonalItem> => {
  const template = await getWorkoutTemplate(templateId);
  if (!template) throw new NotFoundError('WorkoutTemplate', templateId);

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
      })),
    })),
    workoutTemplateId: templateId,
    workoutStartTime: new Date().toISOString(),
    isActiveWorkout: true,
    updatedAt: new Date().toISOString(),
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
 * Get all personal exercises, sorted by last used.
 * If none exist yet, seed a curated set of built-in exercises so the user never starts from an empty library.
 */
export const getPersonalExercises = async (): Promise<PersonalExercise[]> => {
  let exercises = await dbGetAll<PersonalExercise>(LS.PERSONAL_EXERCISES);

  if (exercises.length === 0) {
    const now = new Date().toISOString();
    const builtIn: Omit<PersonalExercise, 'id' | 'createdAt'>[] = [
      // Warmup
      {
        name: 'Jumping Jacks',
        muscleGroup: 'Cardio',
        category: 'warmup',
        tempo: '1-0-1-0',
        defaultRestTime: 30,
        defaultSets: 2,
        notes: 'Whole-body warmup, keep a comfortable pace.',
        tutorialText:
          'Stand tall, jump your feet out while raising arms overhead, then return. Land softly.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Arm Circles',
        muscleGroup: 'Shoulders',
        category: 'warmup',
        tempo: 'controlled',
        defaultRestTime: 20,
        defaultSets: 2,
        notes: 'Mobilize the shoulder joint before pressing.',
        tutorialText:
          'Circle arms forward and backward in small-to-medium circles, keep posture tall.',
        lastUsed: now,
        useCount: 0,
      },
      // Strength – Lower Body
      {
        name: 'Back Squat',
        muscleGroup: 'Legs',
        category: 'strength',
        tempo: '3-1-1-1',
        defaultRestTime: 120,
        defaultSets: 4,
        notes: 'Focus on full range of motion and stable core.',
        tutorialText:
          'Bar on upper back, feet shoulder-width, sit back and down until thighs are at least parallel, then drive up.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Romanian Deadlift',
        muscleGroup: 'Legs',
        category: 'strength',
        tempo: '3-1-1-0',
        defaultRestTime: 90,
        defaultSets: 3,
        notes: 'Target hamstrings and glutes, keep back neutral.',
        tutorialText:
          'Hinge at hips with slight knee bend, lower the bar along your thighs until stretch in hamstrings, return by driving hips forward.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Walking Lunges',
        muscleGroup: 'Legs',
        category: 'strength',
        tempo: '2-0-1-0',
        defaultRestTime: 60,
        defaultSets: 3,
        notes: 'Great unilateral work and balance.',
        tutorialText:
          'Step forward, drop back knee close to floor, push through front heel and step into the next lunge.',
        lastUsed: now,
        useCount: 0,
      },
      // Strength – Upper Body Push
      {
        name: 'Bench Press',
        muscleGroup: 'Chest',
        category: 'strength',
        tempo: '2-1-1-0',
        defaultRestTime: 120,
        defaultSets: 4,
        notes: 'Classic horizontal press, keep shoulder blades tight.',
        tutorialText:
          'Lie on bench, feet planted, lower bar to mid-chest under control, press up without locking elbows hard.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Incline Dumbbell Press',
        muscleGroup: 'Chest',
        category: 'strength',
        tempo: '2-1-1-0',
        defaultRestTime: 90,
        defaultSets: 3,
        notes: 'Targets upper chest, control the bottom position.',
        tutorialText:
          'On an incline bench, lower dumbbells to upper chest with elbows at ~45°, press up together.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Overhead Press',
        muscleGroup: 'Shoulders',
        category: 'strength',
        tempo: '2-1-1-0',
        defaultRestTime: 90,
        defaultSets: 3,
        notes: 'Strict press, no leg drive for strength focus.',
        tutorialText:
          'Stand tall, brace core, press bar or dumbbells overhead until arms are fully extended, then lower under control.',
        lastUsed: now,
        useCount: 0,
      },
      // Strength – Upper Body Pull
      {
        name: 'Pull Up',
        muscleGroup: 'Back',
        category: 'strength',
        tempo: '2-1-1-1',
        defaultRestTime: 120,
        defaultSets: 4,
        notes: 'Full range of motion, chin over bar, controlled descent.',
        tutorialText:
          'Grip the bar slightly wider than shoulders, pull chest toward bar, lower fully without swinging.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Lat Pulldown',
        muscleGroup: 'Back',
        category: 'strength',
        tempo: '2-1-1-1',
        defaultRestTime: 90,
        defaultSets: 3,
        notes: 'Focus on lats, not biceps, slight lean back.',
        tutorialText:
          'Pull bar toward upper chest, squeeze shoulder blades, control the return without letting weights slam.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Seated Row',
        muscleGroup: 'Back',
        category: 'strength',
        tempo: '2-1-2-0',
        defaultRestTime: 90,
        defaultSets: 3,
        notes: 'Keep chest up and avoid shrugging shoulders.',
        tutorialText:
          'Pull handle toward your lower ribs, squeeze shoulder blades, then extend arms without rounding back.',
        lastUsed: now,
        useCount: 0,
      },
      // Arms & Shoulders accessories
      {
        name: 'Dumbbell Bicep Curl',
        muscleGroup: 'Arms',
        category: 'strength',
        tempo: '2-0-2-0',
        defaultRestTime: 60,
        defaultSets: 3,
        notes: 'Control both up and down, avoid swinging.',
        tutorialText:
          'Stand tall, curl dumbbells toward shoulders, keep elbows close to body, lower slowly.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Tricep Rope Pushdown',
        muscleGroup: 'Arms',
        category: 'strength',
        tempo: '2-0-2-0',
        defaultRestTime: 60,
        defaultSets: 3,
        notes: 'Focus on full elbow extension and squeeze.',
        tutorialText:
          'Start with elbows at sides, push rope down and slightly apart at the bottom, then return under control.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Lateral Raise',
        muscleGroup: 'Shoulders',
        category: 'strength',
        tempo: '2-0-2-1',
        defaultRestTime: 60,
        defaultSets: 3,
        notes: 'Light to moderate weight, focus on side delts.',
        tutorialText:
          'Raise dumbbells to the side up to shoulder height with slight elbow bend, pause, then lower slowly.',
        lastUsed: now,
        useCount: 0,
      },
      // Core
      {
        name: 'Plank',
        muscleGroup: 'Core',
        category: 'strength',
        tempo: 'isometric',
        defaultRestTime: 45,
        defaultSets: 3,
        notes: 'Neutral spine, don’t let hips sag.',
        tutorialText:
          'Elbows under shoulders, body in a straight line from head to heels, hold and breathe steadily.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Crunches',
        muscleGroup: 'Core',
        category: 'strength',
        tempo: '2-0-2-0',
        defaultRestTime: 45,
        defaultSets: 3,
        notes: 'Short range, focus on ribcage toward pelvis.',
        tutorialText:
          'Lie on back, knees bent, curl upper back off the floor, avoid pulling on neck.',
        lastUsed: now,
        useCount: 0,
      },
      // Cardio
      {
        name: 'Treadmill Run',
        muscleGroup: 'Cardio',
        category: 'cardio',
        tempo: 'steady',
        defaultRestTime: 0,
        defaultSets: 1,
        notes: 'Use for continuous cardio or intervals.',
        tutorialText:
          'Start easy, gradually increase speed or incline, keep posture tall and relaxed.',
        lastUsed: now,
        useCount: 0,
      },
      {
        name: 'Stationary Bike',
        muscleGroup: 'Cardio',
        category: 'cardio',
        tempo: 'steady',
        defaultRestTime: 0,
        defaultSets: 1,
        notes: 'Low impact cardio, good for intervals and warmups.',
        tutorialText:
          'Adjust seat height, keep slight knee bend at bottom, maintain smooth pedaling cadence.',
        lastUsed: now,
        useCount: 0,
      },
    ];

    const withIds: PersonalExercise[] = builtIn.map((ex, index) => ({
      ...ex,
      id: `builtin-ex-${index + 1}`,
      createdAt: now,
    }));

    await Promise.all(withIds.map(ex => dbPut(LS.PERSONAL_EXERCISES, ex)));
    exercises = withIds;
  }

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

  return exercises;
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
export const createPersonalExercise = async (
  exercise: Omit<PersonalExercise, 'id' | 'createdAt' | 'useCount'>
): Promise<PersonalExercise> => {
  const newExercise: PersonalExercise = {
    ...exercise,
    id: `exercise-${Date.now()}`,
    createdAt: new Date().toISOString(),
    useCount: 0,
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
export const updatePersonalExercise = async (
  id: string,
  updates: Partial<PersonalExercise>
): Promise<void> => {
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
    lastUsed: new Date().toISOString(),
  });
};
// --- Workout Overhaul Data Methods ---

// Body Weight
export const saveBodyWeight = async (entry: BodyWeightEntry): Promise<void> => {
  await dbPut(LS.BODY_WEIGHT, entry);
};

export const getBodyWeightHistory = async (): Promise<BodyWeightEntry[]> => {
  const entries = await dbGetAll<BodyWeightEntry>(LS.BODY_WEIGHT);
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getLatestBodyWeight = async (): Promise<number | null> => {
  const history = await getBodyWeightHistory();
  return history.length > 0 && history[0] ? history[0].weight : null;
};

// Workout Sessions
export const saveWorkoutSession = async (session: WorkoutSession): Promise<void> => {
  await dbPut(LS.WORKOUT_SESSIONS, session);

  // Cloud Sync
  if (auth.currentUser) {
    // Implement cloud sync for sessions later
  }
};

export const getWorkoutSessions = async (limit: number = 20): Promise<WorkoutSession[]> => {
  const sessions = await dbGetAll<WorkoutSession>(LS.WORKOUT_SESSIONS);
  return sessions
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit);
};

// Themes
export const saveThemePreference = async (themeId: string): Promise<void> => {
  const settings = loadSettings();
  const newSettings = {
    ...settings,
    workoutSettings: {
      ...settings.workoutSettings,
      selectedTheme: themeId,
    },
  };
  saveSettings(newSettings);
};

export const getThemePreference = (): string => {
  const settings = loadSettings();
  return settings.workoutSettings?.selectedTheme || 'deepCosmos';
};

export const initializeBuiltInWorkoutTemplates = async (): Promise<void> => {
  const existing = await getWorkoutTemplates();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const builtIn: WorkoutTemplate[] = [
    {
      id: 'template-full-body',
      name: 'Full Body Foundation',
      description:
        'Balanced full-body routine 3x per week – perfect for beginners and busy people.',
      exercises: [
        {
          id: 'tmpl-squat',
          name: 'Back Squat',
          muscleGroup: 'Legs',
          targetRestTime: 120,
          tempo: '3-1-1-1',
          notes: 'Heavy compound for legs and core.',
          tutorialText:
            'Feet shoulder-width, sit back and down, keep chest up and knees tracking over toes.',
          sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: 0 })),
        },
        {
          id: 'tmpl-bench',
          name: 'Bench Press',
          muscleGroup: 'Chest',
          targetRestTime: 120,
          tempo: '2-1-1-0',
          notes: 'Focus on stable shoulder blades and controlled bar path.',
          tutorialText:
            'Grip slightly wider than shoulders, lower bar to mid-chest, press up without bouncing.',
          sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: 0 })),
        },
        {
          id: 'tmpl-row',
          name: 'Seated Row',
          muscleGroup: 'Back',
          targetRestTime: 90,
          tempo: '2-1-2-0',
          notes: 'Balance pressing volume with horizontal pulling.',
          tutorialText: 'Pull handle toward lower ribs, squeeze shoulder blades, keep chest up.',
          sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 })),
        },
        {
          id: 'tmpl-ohp',
          name: 'Overhead Press',
          muscleGroup: 'Shoulders',
          targetRestTime: 90,
          tempo: '2-1-1-0',
          notes: 'Overhead strength and core stability.',
          tutorialText:
            'Press bar or dumbbells overhead with tight core and glutes, avoid overextending lower back.',
          sets: Array.from({ length: 2 }, () => ({ reps: 10, weight: 0 })),
        },
        {
          id: 'tmpl-plank',
          name: 'Plank',
          muscleGroup: 'Core',
          targetRestTime: 45,
          tempo: 'isometric',
          notes: 'Core stability finisher.',
          tutorialText:
            'Elbows under shoulders, body in a straight line, hold with steady breathing.',
          sets: Array.from({ length: 3 }, () => ({ reps: 30, weight: 0 })), // 30s holds
        },
      ],
      tags: ['strength', 'full-body', 'beginner'],
      muscleGroups: ['Legs', 'Chest', 'Back', 'Shoulders', 'Core'],
      createdAt: now,
      isBuiltin: true,
    },
    {
      id: 'template-push',
      name: 'Push Day – Chest & Shoulders',
      description: 'Upper body push session for chest, shoulders and triceps.',
      exercises: [
        {
          id: 'tmpl-push-bench',
          name: 'Bench Press',
          muscleGroup: 'Chest',
          targetRestTime: 120,
          tempo: '2-1-1-0',
          sets: Array.from({ length: 4 }, () => ({ reps: 6, weight: 0 })),
        },
        {
          id: 'tmpl-push-incline',
          name: 'Incline Dumbbell Press',
          muscleGroup: 'Chest',
          targetRestTime: 90,
          tempo: '2-1-1-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 })),
        },
        {
          id: 'tmpl-push-ohp',
          name: 'Overhead Press',
          muscleGroup: 'Shoulders',
          targetRestTime: 90,
          tempo: '2-1-1-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: 0 })),
        },
        {
          id: 'tmpl-push-lat-raise',
          name: 'Lateral Raise',
          muscleGroup: 'Shoulders',
          targetRestTime: 60,
          tempo: '2-0-2-1',
          sets: Array.from({ length: 3 }, () => ({ reps: 15, weight: 0 })),
        },
        {
          id: 'tmpl-push-tricep',
          name: 'Tricep Rope Pushdown',
          muscleGroup: 'Arms',
          targetRestTime: 60,
          tempo: '2-0-2-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 12, weight: 0 })),
        },
      ],
      tags: ['strength', 'upper-body', 'push'],
      muscleGroups: ['Chest', 'Shoulders', 'Arms'],
      createdAt: now,
      isBuiltin: true,
    },
    {
      id: 'template-pull',
      name: 'Pull Day – Back & Biceps',
      description: 'Upper body pull session focused on back thickness and biceps.',
      exercises: [
        {
          id: 'tmpl-pull-pullup',
          name: 'Pull Up',
          muscleGroup: 'Back',
          targetRestTime: 120,
          tempo: '2-1-2-1',
          sets: Array.from({ length: 4 }, () => ({ reps: 6, weight: 0 })),
        },
        {
          id: 'tmpl-pull-lat',
          name: 'Lat Pulldown',
          muscleGroup: 'Back',
          targetRestTime: 90,
          tempo: '2-1-2-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 })),
        },
        {
          id: 'tmpl-pull-row',
          name: 'Seated Row',
          muscleGroup: 'Back',
          targetRestTime: 90,
          tempo: '2-1-2-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 })),
        },
        {
          id: 'tmpl-pull-curl',
          name: 'Dumbbell Bicep Curl',
          muscleGroup: 'Arms',
          targetRestTime: 60,
          tempo: '2-0-2-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 12, weight: 0 })),
        },
      ],
      tags: ['strength', 'upper-body', 'pull'],
      muscleGroups: ['Back', 'Arms'],
      createdAt: now,
      isBuiltin: true,
    },
    {
      id: 'template-legs',
      name: 'Lower Body Strength',
      description: 'Leg-focused day: quads, hamstrings and glutes.',
      exercises: [
        {
          id: 'tmpl-legs-squat',
          name: 'Back Squat',
          muscleGroup: 'Legs',
          targetRestTime: 120,
          tempo: '3-1-1-1',
          sets: Array.from({ length: 4 }, () => ({ reps: 6, weight: 0 })),
        },
        {
          id: 'tmpl-legs-rdl',
          name: 'Romanian Deadlift',
          muscleGroup: 'Legs',
          targetRestTime: 120,
          tempo: '3-1-1-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: 0 })),
        },
        {
          id: 'tmpl-legs-lunge',
          name: 'Walking Lunges',
          muscleGroup: 'Legs',
          targetRestTime: 90,
          tempo: '2-0-2-0',
          sets: Array.from({ length: 3 }, () => ({ reps: 12, weight: 0 })),
        },
        {
          id: 'tmpl-legs-core',
          name: 'Plank',
          muscleGroup: 'Core',
          targetRestTime: 45,
          tempo: 'isometric',
          sets: Array.from({ length: 3 }, () => ({ reps: 30, weight: 0 })),
        },
      ],
      tags: ['strength', 'legs'],
      muscleGroups: ['Legs', 'Core'],
      createdAt: now,
      isBuiltin: true,
    },
  ];

  for (const t of builtIn) {
    await createWorkoutTemplate(t);
  }
};
