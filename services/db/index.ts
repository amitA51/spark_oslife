/**
 * Database Services Index
 * 
 * Re-exports all database services for convenient single-import access.
 */

// Core database utilities
export {
    DB_NAME,
    DB_VERSION,
    OBJECT_STORES,
    initDB,
    getStore,
    dbGet,
    dbGetAll,
    dbPut,
    dbDelete,
    dbClear,
    withRetry,
    syncWithRetry,
    initializeDefaultData,
    safeDateSort,
} from './indexedDBCore';

// Auth Tokens
export {
    saveToken,
    getToken,
    removeToken,
    type OAuthToken,
    type StoredAuthToken,
} from './authTokensDb';

// Personal Items
export {
    getPersonalItems,
    getPersonalItemsByProjectId,
    addPersonalItem,
    updatePersonalItem,
    removePersonalItem,
    reAddPersonalItem,
    duplicatePersonalItem,
    logFocusSession,
    replacePersonalItemsFromCloud,
    initializeCloudSync,
    migrateLocalDataToCloud,
} from './personalItemsDb';

// Feed Items
export {
    getFeedItems,
    updateFeedItem,
    removeFeedItem,
    reAddFeedItem,
    saveFeedItems,
    addSpark,
    convertFeedItemToPersonalItem,
} from './feedItemsDb';

// Workout
export {
    // Templates
    getWorkoutTemplates,
    getWorkoutTemplate,
    createWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
    loadWorkoutFromTemplate,
    reAddWorkoutTemplate,
    replaceWorkoutTemplatesFromCloud,
    // Sessions
    saveWorkoutSession,
    getWorkoutSessions,
    reAddWorkoutSession,
    replaceWorkoutSessionsFromCloud,
    // Body Weight
    saveBodyWeight,
    getBodyWeightHistory,
    getLatestBodyWeight,
    reAddBodyWeight,
    replaceBodyWeightFromCloud,
    // Exercises
    getPersonalExercises,
    getPersonalExercise,
    createPersonalExercise,
    updatePersonalExercise,
    deletePersonalExercise,
    incrementExerciseUse,
} from './workoutDb';
