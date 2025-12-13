/**
 * Data Service
 * 
 * Main entry point for all data operations in SparkOS.
 * This file re-exports functions from domain-specific modules in ./db/
 * and contains remaining operations not yet extracted.
 * 
 * @deprecated Direct imports from this file are deprecated. 
 * Prefer importing from './db' or specific db modules.
 */

import { LOCAL_STORAGE_KEYS as LS } from '../constants';
import {
  defaultTags,
  defaultTemplates,
  defaultMentors,
} from './mockData';
import { todayKey } from '../utils/dateUtils';
import {
  PersonalItem,
  Tag,
  AppData,
  ExportData,
  Template,
  Mentor,
  ComfortZoneChallenge,
  Quote,
} from '../types';
import { loadSettings, saveSettings } from './settingsService';
import { ValidationError, NotFoundError } from './errors';
import { deriveKey, encryptString, decryptToString, generateSalt, ab2b64, b642ab } from './cryptoService';
import { auth } from '../config/firebase';
import {
  syncQuote,
  deleteQuote as deleteCloudQuote,
} from './firestoreService';

// ============================================================================
// RE-EXPORTS FROM NEW MODULAR SERVICES
// ============================================================================

// Core DB utilities
export {
  DB_NAME,
  DB_VERSION,
  OBJECT_STORES,
  initDB,
  dbGet,
  dbGetAll,
  dbPut,
  dbDelete,
  dbClear,
  withRetry,
  syncWithRetry,
  initializeDefaultData,
  safeDateSort,
} from './db/indexedDBCore';

// Auth Tokens
export { saveToken, getToken, removeToken } from './db/authTokensDb';
export type { OAuthToken, StoredAuthToken } from './db/authTokensDb';

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
} from './db/personalItemsDb';

// Feed Items
export {
  getFeedItems,
  updateFeedItem,
  removeFeedItem,
  reAddFeedItem,
  saveFeedItems,
  addSpark,
  convertFeedItemToPersonalItem,
} from './db/feedItemsDb';

// Workout
export {
  getWorkoutTemplates,
  getWorkoutTemplate,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  loadWorkoutFromTemplate,
  reAddWorkoutTemplate,
  replaceWorkoutTemplatesFromCloud,
  saveWorkoutSession,
  getWorkoutSessions,
  reAddWorkoutSession,
  replaceWorkoutSessionsFromCloud,
  saveBodyWeight,
  getBodyWeightHistory,
  getLatestBodyWeight,
  reAddBodyWeight,
  replaceBodyWeightFromCloud,
  getPersonalExercises,
  getPersonalExercise,
  createPersonalExercise,
  updatePersonalExercise,
  deletePersonalExercise,
  incrementExerciseUse,
} from './db/workoutDb';

// Spaces (New Encapsulated Module)
export {
  getSpaces,
  addSpace,
  updateSpace,
  removeSpace,
  reAddSpace
} from './db/spacesDb';

// Feeds (New Encapsulated Module)
export {
  getFeeds,
  addFeed,
  removeFeed,
  reAddFeed,
  updateFeed
} from './db/feedsDb';

// Watchlist (New Encapsulated Module)
export {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
} from './db/watchlistDb';

// Import what we need from the new modules internally
import {
  dbGet,
  dbPut,
  dbDelete,
  dbClear,
  dbGetAll,
  initializeDefaultData,
  syncWithRetry,
  DB_VERSION,
} from './db/indexedDBCore';
import { getPersonalItems } from './db/personalItemsDb';
import { createWorkoutTemplate as _createWorkoutTemplate, getWorkoutTemplates } from './db/workoutDb';
import { getSpaces } from './db/spacesDb';
import { getFeeds } from './db/feedsDb';
import { getWatchlist } from './db/watchlistDb';

// ============================================================================
// REMAINING OPERATIONS (not yet extracted to dedicated modules)
// ============================================================================

// --- Tags and Templates Management ---

export const getTags = (): Promise<Tag[]> => initializeDefaultData(LS.TAGS, defaultTags);

export const getTemplates = (): Promise<Template[]> =>
  initializeDefaultData(LS.TEMPLATES, defaultTemplates);

// --- Comfort Zone Challenge ---
export const getComfortZoneChallenge = (): ComfortZoneChallenge | null => {
  try {
    const stored = localStorage.getItem(LS.COMFORT_CHALLENGE);
    if (!stored) return null;
    return JSON.parse(stored) as ComfortZoneChallenge;
  } catch (error) {
    console.warn('Failed to get ComfortZoneChallenge:', error);
    return null;
  }
};

export const setComfortZoneChallenge = (challenge: ComfortZoneChallenge): void => {
  try {
    localStorage.setItem(LS.COMFORT_CHALLENGE, JSON.stringify(challenge));
  } catch (error) {
    console.error('Failed to save ComfortZoneChallenge:', error);
  }
};

// --- Mentors ---
export const getMentors = async (): Promise<Mentor[]> => {
  const customMentors = await initializeDefaultData<Mentor>(LS.CUSTOM_MENTORS, []);
  return [...defaultMentors, ...customMentors];
};

export const reAddCustomMentor = (mentor: Mentor): Promise<void> =>
  dbPut(LS.CUSTOM_MENTORS, mentor);

// --- Task Utilities ---
export const rollOverIncompleteTasks = async (): Promise<{ id: string; updates: Partial<PersonalItem> }[]> => {
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
    if (item.type !== 'task' || !item.isCompleted || !item.autoDeleteAfter || item.autoDeleteAfter <= 0)
      return false;
    if (!item.lastCompleted) return false;
    const completedDate = new Date(item.lastCompleted);
    const timeDiff = now.getTime() - completedDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff > item.autoDeleteAfter;
  });

  if (tasksToDelete.length > 0) {
    await Promise.all(
      tasksToDelete.map(item => {
        deletedIds.push(item.id);
        return dbDelete(LS.PERSONAL_ITEMS, item.id);
      })
    );
  }
  return deletedIds;
};

// --- Templates ---
export const addTemplate = async (templateData: Omit<Template, 'id'>): Promise<Template> => {
  const newTemplate: Template = { id: `template-${Date.now()}`, ...templateData };
  await dbPut(LS.TEMPLATES, newTemplate);
  return newTemplate;
};

// --- Custom Quotes Management ---
export const getCustomQuotes = async (): Promise<Quote[]> => {
  return await initializeDefaultData<Quote>(LS.CUSTOM_QUOTES, []);
};

// Quote length limits to prevent UI layout breaking
const MAX_QUOTE_TEXT_LENGTH = 500;
const MAX_QUOTE_AUTHOR_LENGTH = 100;

export const addCustomQuote = async (quoteData: Omit<Quote, 'id'>): Promise<Quote> => {
  if (!quoteData.text || !quoteData.author) {
    throw new ValidationError('Quote text and author are required.');
  }
  if (quoteData.text.length > MAX_QUOTE_TEXT_LENGTH) {
    throw new ValidationError(`Quote text is too long. Maximum ${MAX_QUOTE_TEXT_LENGTH} characters allowed.`);
  }
  if (quoteData.author.length > MAX_QUOTE_AUTHOR_LENGTH) {
    throw new ValidationError(`Author name is too long. Maximum ${MAX_QUOTE_AUTHOR_LENGTH} characters allowed.`);
  }
  const newQuote: Quote = { id: `quote-${Date.now()}`, isCustom: true, ...quoteData };
  await dbPut(LS.CUSTOM_QUOTES, newQuote);

  const currentUser = auth?.currentUser;
  if (currentUser) {
    syncWithRetry(() => syncQuote(currentUser.uid, newQuote), `addCustomQuote:${newQuote.id}`);
  }
  return newQuote;
};

export const updateCustomQuote = async (id: string, updates: Partial<Quote>): Promise<Quote> => {
  if (!id) throw new ValidationError('Quote ID is required for update.');
  const quoteToUpdate = await dbGet<Quote>(LS.CUSTOM_QUOTES, id);
  if (!quoteToUpdate) throw new NotFoundError('Quote', id);
  const updatedQuote = { ...quoteToUpdate, ...updates };
  await dbPut(LS.CUSTOM_QUOTES, updatedQuote);

  const currentUser = auth?.currentUser;
  if (currentUser) {
    syncWithRetry(() => syncQuote(currentUser.uid, updatedQuote), `updateCustomQuote:${id}`);
  }
  return updatedQuote;
};

export const removeCustomQuote = async (id: string): Promise<void> => {
  if (!id) throw new ValidationError('Quote ID is required for deletion.');
  await dbDelete(LS.CUSTOM_QUOTES, id);

  const currentUser = auth?.currentUser;
  if (currentUser) {
    syncWithRetry(() => deleteCloudQuote(currentUser.uid, id), `removeCustomQuote:${id}`);
  }
};

export const reAddCustomQuote = (quote: Quote): Promise<void> => dbPut(LS.CUSTOM_QUOTES, quote);

// --- Theme Preferences ---
export const saveThemePreference = async (themeId: string): Promise<void> => {
  const settings = loadSettings();
  const newSettings = {
    ...settings,
    workoutSettings: { ...settings.workoutSettings, selectedTheme: themeId },
  };
  saveSettings(newSettings);
};

export const getThemePreference = (): string => {
  const settings = loadSettings();
  return settings.workoutSettings?.selectedTheme || 'deepCosmos';
};

// --- Data Export/Import ---
export const exportAllData = async (password?: string): Promise<string> => {
  const data: AppData = {
    tags: await dbGetAll(LS.TAGS),
    rssFeeds: await getFeeds(), // Use the new imported function
    feedItems: await dbGetAll(LS.FEED_ITEMS),
    personalItems: await getPersonalItems(),
    templates: await dbGetAll(LS.TEMPLATES),
    watchlist: await getWatchlist(), // Use the new imported function
    spaces: await getSpaces(), // Use the new imported function
    customMentors: await dbGetAll(LS.CUSTOM_MENTORS),
    customQuotes: await dbGetAll(LS.CUSTOM_QUOTES),
    bodyWeight: await dbGetAll(LS.BODY_WEIGHT),
    workoutSessions: await dbGetAll(LS.WORKOUT_SESSIONS),
    workoutTemplates: await dbGetAll(LS.WORKOUT_TEMPLATES),
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
    return JSON.stringify({ version: DB_VERSION, isEncrypted: true, salt: ab2b64(salt), iv: encrypted.iv, data: encrypted.data }, null, 2);
  }

  return jsonString;
};

export const importAllData = async (jsonData: string, password?: string): Promise<void> => {
  let importData: ExportData;
  const parsed = JSON.parse(jsonData);

  if (parsed.isEncrypted) {
    if (!password) throw new Error('PASSWORD_REQUIRED');
    try {
      const salt = b642ab(parsed.salt);
      const key = await deriveKey(password, salt, 100000);
      const decryptedString = await decryptToString(parsed.data, parsed.iv, key);
      importData = JSON.parse(decryptedString);
    } catch {
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
    { name: LS.BODY_WEIGHT, data: data.bodyWeight },
    { name: LS.WORKOUT_SESSIONS, data: data.workoutSessions },
    { name: LS.WORKOUT_TEMPLATES, data: data.workoutTemplates },
  ];

  const importErrors: string[] = [];
  for (const storeInfo of storesToImport) {
    if (storeInfo.data && storeInfo.data.length > 0) {
      try {
        await Promise.all(storeInfo.data.map((item: unknown) => dbPut(storeInfo.name, item)));
      } catch (error) {
        importErrors.push(`${storeInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  if (importErrors.length > 0) {
    throw new Error(`PARTIAL_IMPORT_FAILURE: ${importErrors.join('; ')}`);
  }
};

export const wipeAllData = async (resetSettings = true): Promise<void> => {
  const OBJECT_STORES = Object.values(LS);
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

// --- Built-in Workout Templates Initialization ---
export const initializeBuiltInWorkoutTemplates = async (): Promise<void> => {
  // Use static import since we are already importing from this module statically
  const existing = await getWorkoutTemplates();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const builtInTemplates = [
    {
      id: 'template-full-body',
      name: 'Full Body Foundation',
      description: 'Balanced full-body routine 3x per week.',
      exercises: [
        { id: 'tmpl-squat', name: 'Back Squat', muscleGroup: 'Legs', targetRestTime: 120, tempo: '3-1-1-1', sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: 0 })) },
        { id: 'tmpl-bench', name: 'Bench Press', muscleGroup: 'Chest', targetRestTime: 120, tempo: '2-1-1-0', sets: Array.from({ length: 3 }, () => ({ reps: 8, weight: 0 })) },
        { id: 'tmpl-row', name: 'Seated Row', muscleGroup: 'Back', targetRestTime: 90, tempo: '2-1-2-0', sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 })) },
      ],
      tags: ['strength', 'full-body', 'beginner'],
      muscleGroups: ['Legs', 'Chest', 'Back'],
      createdAt: now,
      isBuiltin: true,
    },
  ];

  for (const t of builtInTemplates) {
    await _createWorkoutTemplate(t);
  }
};
