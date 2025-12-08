/**
 * Core IndexedDB wrapper module
 * Provides low-level database operations with retry logic and connection management
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';

// --- Database Configuration ---
export const DB_NAME = 'SparkDB';
export const DB_VERSION = 3;
export const OBJECT_STORES = [
    ...Object.values(LS),
    'body_weight',
    'workout_sessions',
    'workout_templates',
];

let dbPromise: Promise<IDBDatabase> | null = null;
let dbInstance: IDBDatabase | null = null;

/**
 * Retry utility for async operations with exponential backoff
 */
export const withRetry = async <T>(
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
 */
export const initDB = (): Promise<IDBDatabase> => {
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
 */
export const getStore = async (storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> => {
    const db = await initDB();
    return db.transaction(storeName, mode).objectStore(storeName);
};

// --- Generic DB Helper Functions with Retry Logic ---

export const dbGetAll = async <T>(storeName: string): Promise<T[]> => {
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

export const dbGet = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
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

export const dbPut = async <T>(storeName: string, item: T): Promise<void> => {
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

export const dbDelete = async (storeName: string, key: IDBValidKey): Promise<void> => {
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

export const dbClear = async (storeName: string): Promise<void> => {
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
 */
export const initializeDefaultData = async <T>(storeName: string, defaultData: T[]): Promise<T[]> => {
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

export const safeDateSort = (a: { createdAt: string }, b: { createdAt: string }): number => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (isNaN(dateB)) return -1;
    if (isNaN(dateA)) return 1;
    return dateB - dateA;
};
