/**
 * Financial Services - Cache Utilities
 * 
 * LocalStorage-based caching with TTL support.
 */

import { CACHE_PREFIX } from './config';
import type { CacheEntry } from './types';

/**
 * Generates a cache key with the standard prefix.
 */
export function getCacheKey(type: string, identifier: string): string {
    return `${CACHE_PREFIX}${type}_${identifier}`;
}

/**
 * Retrieves data from cache if not expired.
 */
export function getFromCache<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);
        if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Stores data in cache with expiration.
 */
export function setCache<T>(key: string, data: T, durationMs: number): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + durationMs,
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        console.warn('Cache write failed:', e);
    }
}

/**
 * Clears all expired cache entries.
 */
export function clearExpiredCache(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const entry = JSON.parse(cached);
                    if (Date.now() > entry.expiresAt) {
                        keysToRemove.push(key);
                    }
                }
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
        // Ignore errors
    }
}
