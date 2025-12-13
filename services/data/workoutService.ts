/**
 * Workout Service
 * Handles workout-related data operations: templates, sessions, exercises, body weight
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete, dbGetAll, dbClear, withRetry } from './dbCore';
import { ValidationError, NotFoundError } from '../errors';
import { auth } from '../../config/firebase';
import {
    syncBodyWeight,
    syncWorkoutSession,
    syncWorkoutTemplate,
    deleteWorkoutTemplate as deleteCloudWorkoutTemplate,
} from '../firestoreService';
import type {
    WorkoutTemplate,
    WorkoutSession,
    BodyWeightEntry,
    PersonalExercise,
    PersonalItem
} from '../../types';
import { loadSettings, saveSettings } from '../settingsService';

// --- Sync Helper ---
const syncWithRetry = (
    operation: () => Promise<void>,
    operationName: string
): void => {
    withRetry(operation, 3, 500).catch(error => {
        console.error(`Cloud sync failed after retries (${operationName}):`, error);
    });
};

// ==================== WORKOUT TEMPLATES ====================

/**
 * Gets all workout templates
 */
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
    const templates = await dbGetAll<WorkoutTemplate>(LS.WORKOUT_TEMPLATES);
    return templates || [];
};

/**
 * Gets a single workout template by ID
 */
export const getWorkoutTemplate = async (id: string): Promise<WorkoutTemplate | null> => {
    if (!id) throw new ValidationError('Template ID is required.');
    const template = await dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id);
    return template || null;
};

/**
 * Creates a new workout template
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

    // Cloud Sync
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => syncWorkoutTemplate(userId, newTemplate),
            `createWorkoutTemplate:${newTemplate.id}`
        );
    }

    return newTemplate;
};

/**
 * Updates an existing workout template
 */
export const updateWorkoutTemplate = async (
    id: string,
    updates: Partial<WorkoutTemplate>
): Promise<WorkoutTemplate> => {
    const template = await dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id);
    if (!template) throw new NotFoundError('WorkoutTemplate', id);

    const updatedTemplate = { ...template, ...updates };
    await dbPut(LS.WORKOUT_TEMPLATES, updatedTemplate);

    // Cloud Sync
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => syncWorkoutTemplate(userId, updatedTemplate),
            `updateWorkoutTemplate:${id}`
        );
    }

    return updatedTemplate;
};

/**
 * Deletes a workout template
 */
export const deleteWorkoutTemplate = async (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Template ID is required for deletion.');
    await dbDelete(LS.WORKOUT_TEMPLATES, id);

    // Cloud Sync
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => deleteCloudWorkoutTemplate(userId, id),
            `deleteWorkoutTemplate:${id}`
        );
    }
};

/**
 * Re-add workout template from cloud (no cloud sync trigger)
 */
export const reAddWorkoutTemplate = (template: WorkoutTemplate): Promise<void> =>
    dbPut(LS.WORKOUT_TEMPLATES, template);

/**
 * Replace all workout templates with cloud data
 */
export const replaceWorkoutTemplatesFromCloud = async (templates: WorkoutTemplate[]): Promise<void> => {
    await dbClear(LS.WORKOUT_TEMPLATES);
    await Promise.all(templates.map(template => dbPut(LS.WORKOUT_TEMPLATES, template)));
};

// ==================== WORKOUT SESSIONS ====================

/**
 * Save a workout session
 */
export const saveWorkoutSession = async (session: WorkoutSession): Promise<void> => {
    await dbPut(LS.WORKOUT_SESSIONS, session);

    // Cloud Sync
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => syncWorkoutSession(userId, session),
            `saveWorkoutSession:${session.id}`
        );
    }
};

/**
 * Get workout sessions with optional limit
 */
export const getWorkoutSessions = async (limit: number = 20): Promise<WorkoutSession[]> => {
    const sessions = await dbGetAll<WorkoutSession>(LS.WORKOUT_SESSIONS);
    return sessions
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
};

/**
 * Re-add workout session from cloud (no cloud sync trigger)
 */
export const reAddWorkoutSession = (session: WorkoutSession): Promise<void> =>
    dbPut(LS.WORKOUT_SESSIONS, session);

/**
 * Replace all workout sessions with cloud data
 */
export const replaceWorkoutSessionsFromCloud = async (sessions: WorkoutSession[]): Promise<void> => {
    await dbClear(LS.WORKOUT_SESSIONS);
    await Promise.all(sessions.map(session => dbPut(LS.WORKOUT_SESSIONS, session)));
};

// ==================== BODY WEIGHT ====================

/**
 * Save a body weight entry
 */
export const saveBodyWeight = async (entry: BodyWeightEntry): Promise<void> => {
    await dbPut(LS.BODY_WEIGHT, entry);

    // Cloud Sync
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => syncBodyWeight(userId, entry),
            `saveBodyWeight:${entry.id}`
        );
    }
};

/**
 * Get body weight history sorted by date (newest first)
 */
export const getBodyWeightHistory = async (): Promise<BodyWeightEntry[]> => {
    const entries = await dbGetAll<BodyWeightEntry>(LS.BODY_WEIGHT);
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get the latest body weight
 */
export const getLatestBodyWeight = async (): Promise<number | null> => {
    const history = await getBodyWeightHistory();
    return history.length > 0 && history[0] ? history[0].weight : null;
};

/**
 * Re-add body weight entry from cloud (no cloud sync trigger)
 */
export const reAddBodyWeight = (entry: BodyWeightEntry): Promise<void> =>
    dbPut(LS.BODY_WEIGHT, entry);

/**
 * Replace all body weight entries with cloud data
 */
export const replaceBodyWeightFromCloud = async (entries: BodyWeightEntry[]): Promise<void> => {
    await dbClear(LS.BODY_WEIGHT);
    await Promise.all(entries.map(entry => dbPut(LS.BODY_WEIGHT, entry)));
};

// ==================== PERSONAL EXERCISES ====================

/**
 * Get all personal exercises
 */
export const getPersonalExercises = async (): Promise<PersonalExercise[]> => {
    const exercises = await dbGetAll<PersonalExercise>(LS.PERSONAL_EXERCISES);

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
    return dbGet<PersonalExercise>(LS.PERSONAL_EXERCISES, id);
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

    await dbPut(LS.PERSONAL_EXERCISES, newExercise);
    return newExercise;
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
    await dbPut(LS.PERSONAL_EXERCISES, updated);
};

/**
 * Delete a personal exercise
 */
export const deletePersonalExercise = async (id: string): Promise<void> => {
    await dbDelete(LS.PERSONAL_EXERCISES, id);
};

/**
 * Increment use count and update last used timestamp
 */
export const incrementExerciseUse = async (id: string): Promise<void> => {
    const exercise = await getPersonalExercise(id);
    if (!exercise) return;

    await updatePersonalExercise(id, {
        useCount: (exercise.useCount || 0) + 1,
        lastUsed: new Date().toISOString(),
    });
};

// ==================== THEME PREFERENCES ====================

/**
 * Save workout theme preference
 */
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

/**
 * Get current workout theme preference
 */
export const getThemePreference = (): string => {
    const settings = loadSettings();
    return settings.workoutSettings?.selectedTheme || 'deepCosmos';
};

// ==================== HELPER: Load Workout from Template ====================

/**
 * Loads a workout template into a new workout item structure
 * Note: This doesn't save the item, just creates the data structure
 */
export const createWorkoutFromTemplate = async (templateId: string): Promise<Omit<PersonalItem, 'id' | 'createdAt' | 'updatedAt'>> => {
    const template = await getWorkoutTemplate(templateId);
    if (!template) throw new NotFoundError('WorkoutTemplate', templateId);

    return {
        type: 'workout',
        title: template.name,
        content: template.description || '',
        exercises: template.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(set => ({
                reps: set.reps,
                weight: set.weight,
            })),
        })),
        workoutTemplateId: templateId,
        workoutStartTime: new Date().toISOString(),
        isActiveWorkout: true,
    };
};
