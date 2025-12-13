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

// Feed items (RSS items, sparks, news)
export {
    getFeedItems,
    reAddFeedItem,
    updateFeedItem,
    removeFeedItem,
    saveFeedItems,
    addSpark,
    markFeedItemAsRead,
    toggleSparkStatus,
    getUnreadFeedItemsCount,
    getSparkItems,
} from './feedItemsService';

// Workout-related operations
export {
    // Templates
    getWorkoutTemplates,
    getWorkoutTemplate,
    createWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
    reAddWorkoutTemplate,
    replaceWorkoutTemplatesFromCloud,
    // Sessions
    saveWorkoutSession,
    getWorkoutSessions,
    reAddWorkoutSession,
    replaceWorkoutSessionsFromCloud,
    // Body weight
    saveBodyWeight,
    getBodyWeightHistory,
    getLatestBodyWeight,
    reAddBodyWeight,
    replaceBodyWeightFromCloud,
    // Personal exercises
    getPersonalExercises,
    getPersonalExercise,
    createPersonalExercise,
    updatePersonalExercise,
    deletePersonalExercise,
    incrementExerciseUse,
    // Theme preferences
    saveThemePreference,
    getThemePreference,
    // Helper
    createWorkoutFromTemplate,
} from './workoutService';

// Custom quotes
export {
    getCustomQuotes,
    addCustomQuote,
    updateCustomQuote,
    removeCustomQuote,
    reAddCustomQuote,
    getRandomCustomQuote,
} from './quotesService';

// RSS feeds
export {
    getFeeds,
    addFeed,
    removeFeed,
    reAddFeed,
    updateFeed,
    getFeedsBySpace,
} from './rssFeedsService';
