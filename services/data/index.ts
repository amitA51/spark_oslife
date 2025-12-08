/**
 * Data Services Index
 * Re-exports all data-related services for convenient importing
 */

// Core database operations
export {
    initDB,
    getStore,
    dbGetAll,
    dbGet,
    dbPut,
    dbDelete,
    dbClear,
    initializeDefaultData,
    safeDateSort,
    withRetry,
    DB_NAME,
    DB_VERSION,
    OBJECT_STORES,
} from './dbCore';

// Auth token management
export {
    saveToken,
    getToken,
    removeToken,
    type OAuthToken,
    type StoredAuthToken,
} from './authTokenService';

// Personal items (tasks, habits, notes, etc.)
export {
    getPersonalItems,
    addPersonalItem,
    updatePersonalItem,
    removePersonalItem,
    duplicatePersonalItem,
    reAddPersonalItem,
    getPersonalItemsByProjectId,
    logFocusSession,
    convertFeedItemToPersonalItem,
} from './personalItemsService';

// Spaces/categories
export {
    getSpaces,
    addSpace,
    updateSpace,
    removeSpace,
    reAddSpace,
    reorderSpaces,
} from './spacesService';
