/**
 * Workout Database Service
 * 
 * CRUD operations for workout-related entities: templates, sessions, body weight, and exercises.
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import type {
    WorkoutTemplate,
    WorkoutSession,
    BodyWeightEntry,
    PersonalExercise,
    PersonalItem,
} from '../../types';
import { dbGet, dbGetAll, dbPut, dbDelete, dbClear, initDB, syncWithRetry } from './indexedDBCore';
import { ValidationError, NotFoundError } from '../errors';
import { auth } from '../../config/firebase';
import {
    syncWorkoutTemplate,
    deleteWorkoutTemplate as deleteCloudWorkoutTemplate,
    syncWorkoutSession,
    syncBodyWeight,
} from '../firestoreService';
import { addPersonalItem } from './personalItemsDb';

// ==================== WORKOUT TEMPLATES ====================

/**
 * Gets all workout templates.
 */
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
    const templates = await dbGetAll<WorkoutTemplate>(LS.WORKOUT_TEMPLATES);
    return templates || [];
};

/**
 * Gets a single workout template by ID.
 */
export const getWorkoutTemplate = (id: string): Promise<WorkoutTemplate | null> => {
    if (!id) throw new ValidationError('Template ID is required.');
    return dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id).then(res => res || null);
};

/**
 * Creates a new workout template.
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

    // Cloud Sync with retry
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
 * Updates an existing workout template.
 */
export const updateWorkoutTemplate = async (
    id: string,
    updates: Partial<WorkoutTemplate>
): Promise<WorkoutTemplate> => {
    const template = await dbGet<WorkoutTemplate>(LS.WORKOUT_TEMPLATES, id);
    if (!template) throw new NotFoundError('WorkoutTemplate', id);

    const updatedTemplate = { ...template, ...updates };
    await dbPut(LS.WORKOUT_TEMPLATES, updatedTemplate);

    // Cloud Sync with retry
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
 * Deletes a workout template.
 */
export const deleteWorkoutTemplate = async (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Template ID is required for deletion.');
    await dbDelete(LS.WORKOUT_TEMPLATES, id);

    // Cloud Sync with retry
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => deleteCloudWorkoutTemplate(userId, id),
            `deleteWorkoutTemplate:${id}`
        );
    }
};

/**
 * Loads a workout template into a new workout item.
 */
export const loadWorkoutFromTemplate = async (templateId: string): Promise<PersonalItem> => {
    const template = await getWorkoutTemplate(templateId);
    if (!template) throw new NotFoundError('WorkoutTemplate', templateId);

    const newWorkout: Omit<PersonalItem, 'id' | 'createdAt' | 'updatedAt'> = {
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

    return await addPersonalItem(newWorkout);
};

/**
 * Re-add workout template from cloud (no cloud sync trigger).
 */
export const reAddWorkoutTemplate = (template: WorkoutTemplate): Promise<void> =>
    dbPut(LS.WORKOUT_TEMPLATES, template);

/**
 * Replace all workout templates with cloud data.
 */
export const replaceWorkoutTemplatesFromCloud = async (templates: WorkoutTemplate[]): Promise<void> => {
    await dbClear(LS.WORKOUT_TEMPLATES);
    await Promise.all(templates.map(template => dbPut(LS.WORKOUT_TEMPLATES, template)));
};

// ==================== WORKOUT SESSIONS ====================

/**
 * Save a workout session.
 */
export const saveWorkoutSession = async (session: WorkoutSession): Promise<void> => {
    await dbPut(LS.WORKOUT_SESSIONS, session);

    // Cloud Sync with retry
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => syncWorkoutSession(userId, session),
            `saveWorkoutSession:${session.id}`
        );
    }
};

/**
 * Get workout sessions, sorted by start time (newest first).
 */
export const getWorkoutSessions = async (limit: number = 20): Promise<WorkoutSession[]> => {
    const sessions = await dbGetAll<WorkoutSession>(LS.WORKOUT_SESSIONS);
    return sessions
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
};

/**
 * Re-add workout session from cloud (no cloud sync trigger).
 */
export const reAddWorkoutSession = (session: WorkoutSession): Promise<void> =>
    dbPut(LS.WORKOUT_SESSIONS, session);

/**
 * Replace all workout sessions with cloud data.
 */
export const replaceWorkoutSessionsFromCloud = async (sessions: WorkoutSession[]): Promise<void> => {
    await dbClear(LS.WORKOUT_SESSIONS);
    await Promise.all(sessions.map(session => dbPut(LS.WORKOUT_SESSIONS, session)));
};

// ==================== BODY WEIGHT ====================

/**
 * Save a body weight entry.
 */
export const saveBodyWeight = async (entry: BodyWeightEntry): Promise<void> => {
    await dbPut(LS.BODY_WEIGHT, entry);

    // Cloud Sync with retry
    if (auth?.currentUser) {
        const userId = auth.currentUser.uid;
        syncWithRetry(
            () => syncBodyWeight(userId, entry),
            `saveBodyWeight:${entry.id}`
        );
    }
};

/**
 * Get body weight history, sorted by date (newest first).
 */
export const getBodyWeightHistory = async (): Promise<BodyWeightEntry[]> => {
    const entries = await dbGetAll<BodyWeightEntry>(LS.BODY_WEIGHT);
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get the latest body weight.
 */
export const getLatestBodyWeight = async (): Promise<number | null> => {
    const history = await getBodyWeightHistory();
    return history.length > 0 && history[0] ? history[0].weight : null;
};

/**
 * Re-add body weight entry from cloud (no cloud sync trigger).
 */
export const reAddBodyWeight = (entry: BodyWeightEntry): Promise<void> =>
    dbPut(LS.BODY_WEIGHT, entry);

/**
 * Replace all body weight entries with cloud data.
 */
export const replaceBodyWeightFromCloud = async (entries: BodyWeightEntry[]): Promise<void> => {
    await dbClear(LS.BODY_WEIGHT);
    await Promise.all(entries.map(entry => dbPut(LS.BODY_WEIGHT, entry)));
};

// ==================== PERSONAL EXERCISES ====================

/**
 * Get all personal exercises, sorted by last used.
 * Seeds built-in exercises if library is empty.
 */
export const getPersonalExercises = async (): Promise<PersonalExercise[]> => {
    let exercises = await dbGetAll<PersonalExercise>(LS.PERSONAL_EXERCISES);

    if (exercises.length === 0) {
        const now = new Date().toISOString();
        const builtIn = getBuiltInExercises(now);
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
 * Get a single personal exercise by ID.
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
 * Create a new personal exercise.
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
 * Update an existing personal exercise.
 */
export const updatePersonalExercise = async (
    id: string,
    updates: Partial<PersonalExercise>
): Promise<void> => {
    const existing = await getPersonalExercise(id);
    if (!existing) throw new NotFoundError('PersonalExercise', id);

    const updated = { ...existing, ...updates, id };

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
 * Delete a personal exercise.
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
 * Increment use count and update last used timestamp.
 */
export const incrementExerciseUse = async (id: string): Promise<void> => {
    const exercise = await getPersonalExercise(id);
    if (!exercise) return;

    await updatePersonalExercise(id, {
        useCount: (exercise.useCount || 0) + 1,
        lastUsed: new Date().toISOString(),
    });
};

// --- Built-in Exercises Data ---
function getBuiltInExercises(now: string): Omit<PersonalExercise, 'id' | 'createdAt'>[] {
    return [
        { name: 'Jumping Jacks', muscleGroup: 'Cardio', category: 'warmup', tempo: '1-0-1-0', defaultRestTime: 30, defaultSets: 2, notes: 'Whole-body warmup.', tutorialText: 'Stand tall, jump feet out while raising arms overhead.', lastUsed: now, useCount: 0 },
        { name: 'Back Squat', muscleGroup: 'Legs', category: 'strength', tempo: '3-1-1-1', defaultRestTime: 120, defaultSets: 4, notes: 'Focus on full range of motion.', tutorialText: 'Bar on upper back, sit back and down until parallel.', lastUsed: now, useCount: 0 },
        { name: 'Bench Press', muscleGroup: 'Chest', category: 'strength', tempo: '2-1-1-0', defaultRestTime: 120, defaultSets: 4, notes: 'Classic horizontal press.', tutorialText: 'Lower bar to mid-chest, press up without locking.', lastUsed: now, useCount: 0 },
        { name: 'Pull Up', muscleGroup: 'Back', category: 'strength', tempo: '2-1-1-1', defaultRestTime: 120, defaultSets: 4, notes: 'Full range of motion.', tutorialText: 'Pull chest toward bar, lower fully.', lastUsed: now, useCount: 0 },
        { name: 'Overhead Press', muscleGroup: 'Shoulders', category: 'strength', tempo: '2-1-1-0', defaultRestTime: 90, defaultSets: 3, notes: 'Strict press for strength.', tutorialText: 'Press bar overhead with tight core.', lastUsed: now, useCount: 0 },
        { name: 'Romanian Deadlift', muscleGroup: 'Legs', category: 'strength', tempo: '3-1-1-0', defaultRestTime: 90, defaultSets: 3, notes: 'Target hamstrings and glutes.', tutorialText: 'Hinge at hips with slight knee bend.', lastUsed: now, useCount: 0 },
        { name: 'Plank', muscleGroup: 'Core', category: 'strength', tempo: 'isometric', defaultRestTime: 45, defaultSets: 3, notes: 'Don\'t let hips sag.', tutorialText: 'Elbows under shoulders, body in straight line.', lastUsed: now, useCount: 0 },
    ];
}
