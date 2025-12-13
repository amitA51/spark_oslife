/**
 * dbCore Service Tests
 * Tests for core IndexedDB operations with retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock IndexedDB
const mockIDBRequest = {
    result: null as any,
    error: null as any,
    onerror: null as any,
    onsuccess: null as any,
    onupgradeneeded: null as any,
    onblocked: null as any,
};







const mockIndexedDB = {
    open: vi.fn(() => mockIDBRequest),
};

// Setup mocks before importing the module
beforeEach(() => {
    vi.stubGlobal('indexedDB', mockIndexedDB);
});

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe('withRetry', () => {
    // Import dynamically to ensure mocks are in place
    let withRetry: typeof import('../../services/data/dbCore').withRetry;

    beforeEach(async () => {
        const module = await import('../../services/data/dbCore');
        withRetry = module.withRetry;
    });

    it('should succeed on first attempt', async () => {
        const successFn = vi.fn().mockResolvedValue('success');

        const result = await withRetry(successFn, 3, 10);

        expect(result).toBe('success');
        expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockRejectedValueOnce(new Error('Fail 2'))
            .mockResolvedValue('success');

        const result = await withRetry(fn, 3, 10);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exceeded', async () => {
        const error = new Error('Always fails');
        const fn = vi.fn().mockRejectedValue(error);

        await expect(withRetry(fn, 3, 10)).rejects.toThrow('Always fails');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff between retries', async () => {
        const startTime = Date.now();
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('Fail'))
            .mockResolvedValue('success');

        await withRetry(fn, 2, 50);

        const elapsed = Date.now() - startTime;
        // Should wait at least 50ms (first retry delay)
        expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small tolerance
    });
});

describe('safeDateSort', () => {
    let safeDateSort: typeof import('../../services/data/dbCore').safeDateSort;

    beforeEach(async () => {
        const module = await import('../../services/data/dbCore');
        safeDateSort = module.safeDateSort;
    });

    it('should sort items by createdAt date (newest first)', () => {
        const items = [
            { createdAt: '2023-01-01' },
            { createdAt: '2023-03-01' },
            { createdAt: '2023-02-01' },
        ];

        const sorted = items.sort(safeDateSort);

        expect(sorted[0]!.createdAt).toBe('2023-03-01');
        expect(sorted[1]!.createdAt).toBe('2023-02-01');
        expect(sorted[2]!.createdAt).toBe('2023-01-01');
    });

    it('should handle invalid dates gracefully', () => {
        const items = [
            { createdAt: 'invalid' },
            { createdAt: '2023-01-01' },
            { createdAt: '' },
        ];

        // Should not throw
        expect(() => items.sort(safeDateSort)).not.toThrow();
    });

    it('should handle missing createdAt', () => {
        const items = [
            { createdAt: '' },
            { createdAt: '2023-01-01' },
        ];

        const sorted = items.sort(safeDateSort);
        expect(sorted[0]!.createdAt).toBe('2023-01-01');
    });
});

describe('Database constants', () => {
    it('should export correct DB_NAME', async () => {
        const { DB_NAME } = await import('../../services/data/dbCore');
        expect(DB_NAME).toBe('SparkDB');
    });

    it('should export correct DB_VERSION', async () => {
        const { DB_VERSION } = await import('../../services/data/dbCore');
        expect(DB_VERSION).toBe(3);
    });

    it('should export OBJECT_STORES array', async () => {
        const { OBJECT_STORES } = await import('../../services/data/dbCore');
        expect(Array.isArray(OBJECT_STORES)).toBe(true);
        expect(OBJECT_STORES.length).toBeGreaterThan(0);
    });
});
