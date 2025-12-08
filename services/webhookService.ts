/**
 * Webhook Service
 * Manages webhook configurations and triggers external actions on events
 */

import { LOCAL_STORAGE_KEYS as LS } from '../constants';

// --- Types ---

export type WebhookEvent =
    | 'task.completed'
    | 'task.created'
    | 'habit.completed'
    | 'item.created'
    | 'item.deleted'
    | 'workout.completed';

export interface Webhook {
    id: string;
    name: string;
    url: string;
    events: WebhookEvent[];
    isActive: boolean;
    secret?: string; // For signing requests
    createdAt: string;
    lastTriggeredAt?: string;
    failureCount: number;
}

export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, unknown>;
}

export interface WebhookLog {
    id: string;
    webhookId: string;
    event: WebhookEvent;
    timestamp: string;
    success: boolean;
    statusCode?: number;
    error?: string;
    responseTime?: number;
}

// --- Storage Keys ---
const WEBHOOKS_KEY = 'spark_webhooks';
const WEBHOOK_LOGS_KEY = 'spark_webhook_logs';

// --- Storage Functions ---

/**
 * Get all configured webhooks
 */
export const getWebhooks = (): Webhook[] => {
    const stored = localStorage.getItem(WEBHOOKS_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * Save webhooks to storage
 */
const saveWebhooks = (webhooks: Webhook[]): void => {
    localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
};

/**
 * Get webhook logs
 */
export const getWebhookLogs = (webhookId?: string, limit: number = 50): WebhookLog[] => {
    const stored = localStorage.getItem(WEBHOOK_LOGS_KEY);
    let logs: WebhookLog[] = stored ? JSON.parse(stored) : [];

    if (webhookId) {
        logs = logs.filter(log => log.webhookId === webhookId);
    }

    return logs.slice(0, limit);
};

/**
 * Save a webhook log entry
 */
const addWebhookLog = (log: WebhookLog): void => {
    const logs = getWebhookLogs(undefined, 500);
    logs.unshift(log);
    // Keep only last 500 logs
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
};

// --- CRUD Operations ---

/**
 * Add a new webhook
 */
export const addWebhook = (webhookData: Omit<Webhook, 'id' | 'createdAt' | 'failureCount'>): Webhook => {
    const webhooks = getWebhooks();

    const newWebhook: Webhook = {
        id: `webhook-${Date.now()}`,
        createdAt: new Date().toISOString(),
        failureCount: 0,
        ...webhookData,
    };

    webhooks.push(newWebhook);
    saveWebhooks(webhooks);

    return newWebhook;
};

/**
 * Update a webhook
 */
export const updateWebhook = (id: string, updates: Partial<Webhook>): Webhook | null => {
    const webhooks = getWebhooks();
    const index = webhooks.findIndex(w => w.id === id);

    if (index === -1) return null;

    webhooks[index] = { ...webhooks[index], ...updates };
    saveWebhooks(webhooks);

    return webhooks[index];
};

/**
 * Remove a webhook
 */
export const removeWebhook = (id: string): boolean => {
    const webhooks = getWebhooks();
    const filtered = webhooks.filter(w => w.id !== id);

    if (filtered.length === webhooks.length) return false;

    saveWebhooks(filtered);
    return true;
};

/**
 * Toggle webhook active state
 */
export const toggleWebhook = (id: string): Webhook | null => {
    const webhooks = getWebhooks();
    const webhook = webhooks.find(w => w.id === id);

    if (!webhook) return null;

    return updateWebhook(id, { isActive: !webhook.isActive });
};

// --- Trigger Functions ---

/**
 * Generate HMAC signature for webhook payload
 */
const generateSignature = async (payload: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Trigger a single webhook
 */
const triggerSingleWebhook = async (
    webhook: Webhook,
    event: WebhookEvent,
    data: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string; responseTime: number }> => {
    const startTime = Date.now();

    const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
    };

    const payloadString = JSON.stringify(payload);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Spark-Event': event,
        'X-Spark-Delivery': `${Date.now()}`,
    };

    // Add signature if secret is configured
    if (webhook.secret) {
        headers['X-Spark-Signature'] = await generateSignature(payloadString, webhook.secret);
    }

    try {
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: payloadString,
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
            return { success: true, statusCode: response.status, responseTime };
        } else {
            return {
                success: false,
                statusCode: response.status,
                error: `HTTP ${response.status}`,
                responseTime,
            };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
            responseTime,
        };
    }
};

/**
 * Trigger all webhooks subscribed to an event
 */
export const triggerWebhooks = async (
    event: WebhookEvent,
    data: Record<string, unknown>
): Promise<void> => {
    const webhooks = getWebhooks().filter(w => w.isActive && w.events.includes(event));

    for (const webhook of webhooks) {
        const result = await triggerSingleWebhook(webhook, event, data);

        // Log the result
        addWebhookLog({
            id: `log-${Date.now()}-${webhook.id}`,
            webhookId: webhook.id,
            event,
            timestamp: new Date().toISOString(),
            success: result.success,
            statusCode: result.statusCode,
            error: result.error,
            responseTime: result.responseTime,
        });

        // Update webhook stats
        updateWebhook(webhook.id, {
            lastTriggeredAt: new Date().toISOString(),
            failureCount: result.success ? 0 : webhook.failureCount + 1,
        });

        // Disable webhook after 5 consecutive failures
        if (!result.success && webhook.failureCount >= 4) {
            console.warn(`Disabling webhook ${webhook.name} after 5 consecutive failures`);
            updateWebhook(webhook.id, { isActive: false });
        }
    }
};

/**
 * Test a webhook by sending a test event
 */
export const testWebhook = async (
    webhookId: string
): Promise<{ success: boolean; statusCode?: number; error?: string; responseTime: number }> => {
    const webhook = getWebhooks().find(w => w.id === webhookId);

    if (!webhook) {
        return { success: false, error: 'Webhook not found', responseTime: 0 };
    }

    return triggerSingleWebhook(webhook, 'task.completed', {
        test: true,
        message: 'This is a test webhook from Spark Personal OS',
    });
};

// --- Convenience Functions for Common Events ---

export const onTaskCompleted = (task: { id: string; title: string;[key: string]: unknown }) => {
    triggerWebhooks('task.completed', { task });
};

export const onTaskCreated = (task: { id: string; title: string;[key: string]: unknown }) => {
    triggerWebhooks('task.created', { task });
};

export const onHabitCompleted = (habit: { id: string; title: string;[key: string]: unknown }) => {
    triggerWebhooks('habit.completed', { habit });
};

export const onItemCreated = (item: { id: string; type: string; title: string;[key: string]: unknown }) => {
    triggerWebhooks('item.created', { item });
};

export const onItemDeleted = (item: { id: string; type: string; title: string }) => {
    triggerWebhooks('item.deleted', { item });
};

export const onWorkoutCompleted = (workout: { id: string; duration: number; exercises: number }) => {
    triggerWebhooks('workout.completed', { workout });
};
