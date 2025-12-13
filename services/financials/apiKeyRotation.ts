/**
 * Financial Services - API Key Rotation
 * 
 * Manages multiple Alpha Vantage API keys with automatic rotation
 * when rate limits are reached.
 */

import {
    ALPHA_VANTAGE_API_KEYS,
    CACHE_PREFIX,
    RATE_LIMIT_PER_KEY,
} from './config';
import type { ApiKeyState } from './types';

const API_KEY_STATE_KEY = `${CACHE_PREFIX}api_key_state`;

/**
 * Retrieves the current API key state from localStorage.
 */
export function getApiKeyState(): ApiKeyState {
    try {
        const cached = localStorage.getItem(API_KEY_STATE_KEY);
        if (cached) {
            const state: ApiKeyState = JSON.parse(cached);
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            const oneDayAgo = now - 24 * 60 * 60 * 1000;

            // Clean old entries for each key
            for (const key of Object.keys(state.keyUsage)) {
                if (state.keyUsage[key]) {
                    state.keyUsage[key]!.minuteRequests = state.keyUsage[key]!.minuteRequests.filter(t => t > oneMinuteAgo);
                    state.keyUsage[key]!.dayRequests = state.keyUsage[key]!.dayRequests.filter(t => t > oneDayAgo);
                }
            }

            return state;
        }
    } catch {
        // Ignore
    }

    // Initialize with empty usage for all keys
    const keyUsage: ApiKeyState['keyUsage'] = {};
    ALPHA_VANTAGE_API_KEYS.forEach(key => {
        keyUsage[key] = { minuteRequests: [], dayRequests: [] };
    });

    return { keyIndex: 0, keyUsage };
}

/**
 * Saves the API key state to localStorage.
 */
export function saveApiKeyState(state: ApiKeyState): void {
    try {
        localStorage.setItem(API_KEY_STATE_KEY, JSON.stringify(state));
    } catch {
        // Ignore
    }
}

/**
 * Gets an available API key that hasn't exceeded rate limits.
 */
export function getAvailableApiKey(): { key: string; index: number } | null {
    const state = getApiKeyState();

    // Try each key starting from the current index
    for (let i = 0; i < ALPHA_VANTAGE_API_KEYS.length; i++) {
        const index = (state.keyIndex + i) % ALPHA_VANTAGE_API_KEYS.length;
        const key = ALPHA_VANTAGE_API_KEYS[index]!;

        // Initialize usage if not exists
        if (!state.keyUsage[key]) {
            state.keyUsage[key] = { minuteRequests: [], dayRequests: [] };
        }

        const usage = state.keyUsage[key]!;

        // Check if this key is available
        const withinMinuteLimit = usage.minuteRequests.length < RATE_LIMIT_PER_KEY.requestsPerMinute;
        const withinDayLimit = usage.dayRequests.length < RATE_LIMIT_PER_KEY.requestsPerDay;

        if (withinMinuteLimit && withinDayLimit) {
            // If we switched keys, save the new index
            if (index !== state.keyIndex) {
                state.keyIndex = index;
                saveApiKeyState(state);
                console.log(`🔄 Switched to API key #${index + 1}`);
            }
            return { key, index };
        }
    }

    // All keys exhausted
    return null;
}

/**
 * Records usage of an API key.
 */
export function recordApiKeyUsage(key: string): void {
    const state = getApiKeyState();
    const now = Date.now();

    if (!state.keyUsage[key]) {
        state.keyUsage[key] = { minuteRequests: [], dayRequests: [] };
    }

    state.keyUsage[key]!.minuteRequests.push(now);
    state.keyUsage[key]!.dayRequests.push(now);
    saveApiKeyState(state);
}

/**
 * Marks an API key as exhausted (forces rotation to next key).
 */
export function markKeyAsExhausted(key: string): void {
    const state = getApiKeyState();

    // Fill the day requests to mark as exhausted
    if (!state.keyUsage[key]) {
        state.keyUsage[key] = { minuteRequests: [], dayRequests: [] };
    }

    // Add fake requests to fill up the daily limit
    const now = Date.now();
    while (state.keyUsage[key]!.dayRequests.length < RATE_LIMIT_PER_KEY.requestsPerDay) {
        state.keyUsage[key]!.dayRequests.push(now);
    }

    // Move to next key
    state.keyIndex = (state.keyIndex + 1) % ALPHA_VANTAGE_API_KEYS.length;
    saveApiKeyState(state);
    console.log(`⚠️ API key exhausted, switching to key #${state.keyIndex + 1}`);
}

/**
 * Get remaining requests across all API keys.
 */
export function getRemainingRequests(): {
    minute: number;
    day: number;
    totalDayAcrossKeys: number;
    activeKeyIndex: number;
} {
    const state = getApiKeyState();
    const currentKey = ALPHA_VANTAGE_API_KEYS[state.keyIndex];
    if (!currentKey) return { minute: 0, day: 0, totalDayAcrossKeys: 0, activeKeyIndex: state.keyIndex };
    const currentUsage = state.keyUsage[currentKey] || { minuteRequests: [], dayRequests: [] };

    // Calculate total remaining across all keys
    let totalDayRemaining = 0;
    for (const key of ALPHA_VANTAGE_API_KEYS) {
        const usage = state.keyUsage[key] || { dayRequests: [] };
        totalDayRemaining += Math.max(0, RATE_LIMIT_PER_KEY.requestsPerDay - usage.dayRequests.length);
    }

    return {
        minute: Math.max(0, RATE_LIMIT_PER_KEY.requestsPerMinute - currentUsage.minuteRequests.length),
        day: Math.max(0, RATE_LIMIT_PER_KEY.requestsPerDay - currentUsage.dayRequests.length),
        totalDayAcrossKeys: totalDayRemaining,
        activeKeyIndex: state.keyIndex,
    };
}

/**
 * Add a new API key to the rotation.
 */
export function addApiKey(newKey: string): boolean {
    if (!newKey || ALPHA_VANTAGE_API_KEYS.includes(newKey)) {
        return false;
    }

    ALPHA_VANTAGE_API_KEYS.push(newKey);

    // Initialize usage for new key
    const state = getApiKeyState();
    state.keyUsage[newKey] = { minuteRequests: [], dayRequests: [] };
    saveApiKeyState(state);

    console.log(`✅ Added new API key. Total keys: ${ALPHA_VANTAGE_API_KEYS.length}`);
    return true;
}

/**
 * Get the count of available API keys.
 */
export function getApiKeyCount(): number {
    return ALPHA_VANTAGE_API_KEYS.length;
}
