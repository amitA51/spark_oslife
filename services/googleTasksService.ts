/**
 * Google Tasks Service
 * Provides two-way synchronization with Google Tasks API
 */

import { getToken, saveToken, removeToken } from './data/authTokenService';

// --- Constants ---
const GOOGLE_TASKS_API = 'https://tasks.googleapis.com/tasks/v1';
const SERVICE_NAME = 'google';

// --- Types ---

export interface GoogleTaskList {
    id: string;
    title: string;
    updated?: string;
}

export interface GoogleTask {
    id: string;
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
    status: 'needsAction' | 'completed';
    completed?: string; // RFC 3339 timestamp
    parent?: string;
    position?: string;
    updated?: string;
}

interface TasksListResponse {
    items?: GoogleTaskList[];
    nextPageToken?: string;
}

interface TasksResponse {
    items?: GoogleTask[];
    nextPageToken?: string;
}

// --- Helper Functions ---

/**
 * Get the current access token
 */
const getAccessToken = async (): Promise<string | null> => {
    const token = await getToken(SERVICE_NAME);
    if (!token) return null;

    // Check if token is expired
    if (token.expires_at && Date.now() > token.expires_at) {
        console.warn('Google token expired, needs refresh');
        // In a full implementation, we would refresh the token here
        return null;
    }

    return token.access_token;
};

/**
 * Make an authenticated request to the Google Tasks API
 */
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('NOT_AUTHENTICATED');
    }

    const response = await fetch(`${GOOGLE_TASKS_API}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 401) {
        // Token expired or invalid
        await removeToken(SERVICE_NAME);
        throw new Error('TOKEN_EXPIRED');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
};

// --- Task Lists API ---

/**
 * Get all task lists
 */
export const listTaskLists = async (): Promise<GoogleTaskList[]> => {
    const response = await apiRequest<TasksListResponse>('/users/@me/lists');
    return response.items || [];
};

/**
 * Get a specific task list by ID
 */
export const getTaskList = async (taskListId: string): Promise<GoogleTaskList> => {
    return apiRequest<GoogleTaskList>(`/lists/${taskListId}`);
};

/**
 * Create a new task list
 */
export const createTaskList = async (title: string): Promise<GoogleTaskList> => {
    return apiRequest<GoogleTaskList>('/users/@me/lists', {
        method: 'POST',
        body: JSON.stringify({ title }),
    });
};

/**
 * Delete a task list
 */
export const deleteTaskList = async (taskListId: string): Promise<void> => {
    await apiRequest<void>(`/lists/${taskListId}`, { method: 'DELETE' });
};

// --- Tasks API ---

/**
 * Get all tasks in a task list
 */
export const listTasks = async (
    taskListId: string,
    options: { showCompleted?: boolean; showHidden?: boolean } = {}
): Promise<GoogleTask[]> => {
    const params = new URLSearchParams();
    if (options.showCompleted !== undefined) {
        params.set('showCompleted', String(options.showCompleted));
    }
    if (options.showHidden !== undefined) {
        params.set('showHidden', String(options.showHidden));
    }

    const queryString = params.toString();
    const endpoint = `/lists/${taskListId}/tasks${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest<TasksResponse>(endpoint);
    return response.items || [];
};

/**
 * Get a specific task
 */
export const getTask = async (taskListId: string, taskId: string): Promise<GoogleTask> => {
    return apiRequest<GoogleTask>(`/lists/${taskListId}/tasks/${taskId}`);
};

/**
 * Create a new task
 */
export const createTask = async (
    taskListId: string,
    task: Partial<GoogleTask>
): Promise<GoogleTask> => {
    return apiRequest<GoogleTask>(`/lists/${taskListId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
    });
};

/**
 * Update a task
 */
export const updateTask = async (
    taskListId: string,
    taskId: string,
    updates: Partial<GoogleTask>
): Promise<GoogleTask> => {
    return apiRequest<GoogleTask>(`/lists/${taskListId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

/**
 * Delete a task
 */
export const deleteTask = async (taskListId: string, taskId: string): Promise<void> => {
    await apiRequest<void>(`/lists/${taskListId}/tasks/${taskId}`, { method: 'DELETE' });
};

/**
 * Mark a task as completed
 */
export const completeTask = async (taskListId: string, taskId: string): Promise<GoogleTask> => {
    return updateTask(taskListId, taskId, {
        status: 'completed',
        completed: new Date().toISOString(),
    });
};

/**
 * Mark a task as not completed
 */
export const uncompleteTask = async (taskListId: string, taskId: string): Promise<GoogleTask> => {
    return updateTask(taskListId, taskId, {
        status: 'needsAction',
        completed: undefined,
    });
};

// --- Sync Functions ---

/**
 * Convert a Spark PersonalItem to a Google Task
 */
export const personalItemToGoogleTask = (item: {
    title?: string;
    content?: string;
    dueDate?: string;
    isCompleted?: boolean;
}): Partial<GoogleTask> => ({
    title: item.title || 'Untitled',
    notes: item.content,
    due: item.dueDate ? new Date(item.dueDate).toISOString() : undefined,
    status: item.isCompleted ? 'completed' : 'needsAction',
    completed: item.isCompleted ? new Date().toISOString() : undefined,
});

/**
 * Convert a Google Task to a Spark PersonalItem format
 */
export const googleTaskToPersonalItem = (task: GoogleTask) => ({
    googleTaskId: task.id,
    title: task.title,
    content: task.notes,
    dueDate: task.due ? new Date(task.due).toISOString().split('T')[0] : undefined,
    isCompleted: task.status === 'completed',
    type: 'task' as const,
});

/**
 * Check if Google Tasks is connected
 */
export const isGoogleTasksConnected = async (): Promise<boolean> => {
    const token = await getAccessToken();
    return !!token;
};

/**
 * Get sync status
 */
export const getSyncStatus = async (): Promise<{
    connected: boolean;
    taskLists: GoogleTaskList[];
    lastSyncError?: string;
}> => {
    try {
        const connected = await isGoogleTasksConnected();
        if (!connected) {
            return { connected: false, taskLists: [] };
        }

        const taskLists = await listTaskLists();
        return { connected: true, taskLists };
    } catch (error) {
        return {
            connected: false,
            taskLists: [],
            lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
