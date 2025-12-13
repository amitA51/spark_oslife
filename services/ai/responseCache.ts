/**
 * Response Cache Module
 * 
 * LRU cache for AI responses to avoid redundant API calls.
 * Features: TTL expiration, max size limit, LRU eviction, hit/miss metrics,
 * and stale-while-revalidate pattern for improved performance.
 * 
 * @module responseCache
 * @version 2.0.0 - Enhanced with metrics and stale-while-revalidate
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

interface CacheEntry<T> {
    value: T;
    timestamp: number;
    size: number;
    accessCount: number;
}

export interface CacheMetrics {
    size: number;
    maxSize: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    evictionCount: number;
    staleHitCount: number;
    totalBytesStored: number;
}

// ============================================================================
// Response Cache Implementation
// ============================================================================

/**
 * LRU Cache for AI responses with comprehensive metrics.
 * Includes stale-while-revalidate for improved perceived performance.
 */
export class ResponseCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private readonly maxSize: number;
    private readonly ttlMs: number;
    private readonly staleTtlMs: number; // Extended TTL for stale data
    private currentSize = 0;

    // Metrics
    private hitCount = 0;
    private missCount = 0;
    private evictionCount = 0;
    private staleHitCount = 0;
    private totalBytesStored = 0;

    /**
     * Create a new ResponseCache.
     * @param maxSize Maximum number of entries (default: 50)
     * @param ttlMinutes TTL in minutes for fresh data (default: 10)
     * @param staleTtlMinutes Extended TTL for stale data (default: 30)
     */
    constructor(
        maxSize: number = 50,
        ttlMinutes: number = 10,
        staleTtlMinutes: number = 30
    ) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMinutes * 60 * 1000;
        this.staleTtlMs = staleTtlMinutes * 60 * 1000;
    }

    /**
     * Generate a hash for the cache key.
     */
    private hash(key: string): string {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    /**
     * Get a cached value if it exists.
     * Returns fresh data immediately, or stale data with isStale flag.
     */
    get<T>(key: string): { value: T; isStale: boolean } | null {
        const hashedKey = this.hash(key);
        const entry = this.cache.get(hashedKey);

        if (!entry) {
            this.missCount++;
            return null;
        }

        const age = Date.now() - entry.timestamp;

        // Check if completely expired (beyond stale TTL)
        if (age > this.staleTtlMs) {
            this.cache.delete(hashedKey);
            this.currentSize--;
            this.totalBytesStored -= entry.size;
            this.missCount++;
            return null;
        }

        // Move to end for LRU (re-insert)
        this.cache.delete(hashedKey);
        entry.accessCount++;
        this.cache.set(hashedKey, entry);

        // Check if stale but still usable
        if (age > this.ttlMs) {
            this.staleHitCount++;
            this.hitCount++;
            return { value: entry.value as T, isStale: true };
        }

        // Fresh data
        this.hitCount++;
        return { value: entry.value as T, isStale: false };
    }

    /**
     * Simple get that ignores stale status (for backward compatibility).
     */
    getValue<T>(key: string): T | null {
        const result = this.get<T>(key);
        return result ? result.value : null;
    }

    /**
     * Cache a value with automatic LRU eviction if at capacity.
     */
    set<T>(key: string, value: T): void {
        const hashedKey = this.hash(key);
        const size = JSON.stringify(value).length;

        // Check if entry already exists (update case)
        const existingEntry = this.cache.get(hashedKey);
        if (existingEntry) {
            this.totalBytesStored -= existingEntry.size;
            this.cache.delete(hashedKey);
            this.currentSize--;
        }

        // Evict oldest entries if at capacity
        while (this.currentSize >= this.maxSize) {
            const oldest = this.cache.keys().next().value;
            if (oldest) {
                const oldEntry = this.cache.get(oldest);
                if (oldEntry) {
                    this.totalBytesStored -= oldEntry.size;
                }
                this.cache.delete(oldest);
                this.currentSize--;
                this.evictionCount++;
            } else {
                break;
            }
        }

        this.cache.set(hashedKey, {
            value,
            timestamp: Date.now(),
            size,
            accessCount: 0,
        });
        this.currentSize++;
        this.totalBytesStored += size;
    }

    /**
     * Check if a key exists and is fresh.
     */
    has(key: string): boolean {
        const result = this.get(key);
        return result !== null && !result.isStale;
    }

    /**
     * Check if a key exists (even if stale).
     */
    hasAny(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Remove a specific entry from the cache.
     */
    delete(key: string): boolean {
        const hashedKey = this.hash(key);
        const entry = this.cache.get(hashedKey);
        if (entry) {
            this.totalBytesStored -= entry.size;
            this.cache.delete(hashedKey);
            this.currentSize--;
            return true;
        }
        return false;
    }

    /**
     * Clear all cached entries.
     */
    clear(): void {
        this.cache.clear();
        this.currentSize = 0;
        this.totalBytesStored = 0;
    }

    /**
     * Get comprehensive cache statistics.
     */
    getMetrics(): CacheMetrics {
        const total = this.hitCount + this.missCount;
        return {
            size: this.currentSize,
            maxSize: this.maxSize,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: total > 0 ? this.hitCount / total : 0,
            evictionCount: this.evictionCount,
            staleHitCount: this.staleHitCount,
            totalBytesStored: this.totalBytesStored,
        };
    }

    /**
     * Reset metrics (for testing/monitoring purposes).
     */
    resetMetrics(): void {
        this.hitCount = 0;
        this.missCount = 0;
        this.evictionCount = 0;
        this.staleHitCount = 0;
    }

    /**
     * Get basic stats (for backward compatibility).
     */
    getStats(): { size: number; maxSize: number } {
        return {
            size: this.currentSize,
            maxSize: this.maxSize,
        };
    }
}

// Shared cache instance for AI responses (50 entries, 10 minute TTL, 30 minute stale)
export const aiResponseCache = new ResponseCache(50, 10, 30);
