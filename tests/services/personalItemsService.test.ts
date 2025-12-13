/**
 * Personal Items Service Tests
 * Tests for CRUD operations on personal items (tasks, habits, notes, etc.)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../services/data/dbCore', () => ({
    dbGetAll: vi.fn(),
    dbGet: vi.fn(),
    dbPut: vi.fn(),
    dbDelete: vi.fn(),
    initializeDefaultData: vi.fn(),
    safeDateSort: vi.fn((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    }),
}));

vi.mock('../../config/firebase', () => ({
    auth: { currentUser: null },
}));

vi.mock('../../services/firestoreService', () => ({
    syncPersonalItem: vi.fn(),
    deletePersonalItem: vi.fn(),
}));

vi.mock('../../services/correlationsService', () => ({
    logEvent: vi.fn(),
}));

vi.mock('../../services/webhookService', () => ({
    onTaskCompleted: vi.fn(),
    onHabitCompleted: vi.fn(),
    onItemCreated: vi.fn(),
    onItemDeleted: vi.fn(),
}));

vi.mock('../../services/mockData', () => ({
    defaultPersonalItems: [],
}));

describe('Personal Items Service', () => {
    let personalItemsService: typeof import('../../services/data/personalItemsService');
    let dbCore: typeof import('../../services/data/dbCore');

    beforeEach(async () => {
        vi.clearAllMocks();
        personalItemsService = await import('../../services/data/personalItemsService');
        dbCore = await import('../../services/data/dbCore');
    });

    describe('getPersonalItems', () => {
        it('should return all items sorted by creation date', async () => {
            const mockItems = [
                { id: 'p-1', title: 'Task 1', createdAt: '2024-01-01', type: 'task' },
                { id: 'p-2', title: 'Note 1', createdAt: '2024-03-01', type: 'note' },
            ];

            vi.mocked(dbCore.initializeDefaultData).mockResolvedValue(mockItems);

            const result = await personalItemsService.getPersonalItems();

            expect(result).toHaveLength(2);
            expect(dbCore.initializeDefaultData).toHaveBeenCalled();
        });
    });

    describe('addPersonalItem', () => {
        it('should create a new item with generated id and timestamps', async () => {
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            const itemData = {
                type: 'task' as const,
                title: 'New Task',
                content: 'Task description',
            };

            const result = await personalItemsService.addPersonalItem(itemData);

            expect(result.id).toMatch(/^p-\d+$/);
            expect(result.title).toBe('New Task');
            expect(result.createdAt).toBeDefined();
            expect(result.updatedAt).toBeDefined();
            expect(dbCore.dbPut).toHaveBeenCalled();
        });

        it('should throw validation error for missing title', async () => {
            const itemData = {
                type: 'task' as const,
                title: '',
            };

            await expect(personalItemsService.addPersonalItem(itemData)).rejects.toThrow();
        });

        it('should log journal entries to correlation service', async () => {
            const { logEvent } = await import('../../services/correlationsService');
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            await personalItemsService.addPersonalItem({
                type: 'journal',
                title: 'My Journal Entry',
            });

            expect(logEvent).toHaveBeenCalledWith(
                expect.objectContaining({ eventType: 'journal_entry' })
            );
        });
    });

    describe('updatePersonalItem', () => {
        it('should update an existing item', async () => {
            const existingItem = {
                id: 'p-123',
                title: 'Original',
                type: 'task',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(dbCore.dbGet).mockResolvedValue(existingItem);
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            const result = await personalItemsService.updatePersonalItem('p-123', {
                title: 'Updated Title',
            });

            expect(result.title).toBe('Updated Title');
            expect(result.updatedAt).not.toBe(existingItem.updatedAt);
        });

        it('should throw validation error for missing id', async () => {
            await expect(
                personalItemsService.updatePersonalItem('', { title: 'Test' })
            ).rejects.toThrow();
        });

        it('should throw not found error for non-existent item', async () => {
            vi.mocked(dbCore.dbGet).mockResolvedValue(undefined);

            await expect(
                personalItemsService.updatePersonalItem('p-nonexistent', { title: 'Test' })
            ).rejects.toThrow();
        });

        it('should log task completion events', async () => {
            const { logEvent } = await import('../../services/correlationsService');
            const { onTaskCompleted } = await import('../../services/webhookService');

            const existingItem = {
                id: 'p-123',
                title: 'My Task',
                type: 'task',
                isCompleted: false,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(dbCore.dbGet).mockResolvedValue(existingItem);
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            await personalItemsService.updatePersonalItem('p-123', { isCompleted: true });

            expect(logEvent).toHaveBeenCalledWith(
                expect.objectContaining({ eventType: 'task_completed' })
            );
            expect(onTaskCompleted).toHaveBeenCalled();
        });
    });

    describe('removePersonalItem', () => {
        it('should delete an item by id', async () => {
            vi.mocked(dbCore.dbGet).mockResolvedValue({ id: 'p-123', title: 'Test', type: 'task' });
            vi.mocked(dbCore.dbDelete).mockResolvedValue(undefined);

            await personalItemsService.removePersonalItem('p-123');

            expect(dbCore.dbDelete).toHaveBeenCalled();
        });

        it('should throw validation error for missing id', async () => {
            await expect(personalItemsService.removePersonalItem('')).rejects.toThrow();
        });
    });

    describe('duplicatePersonalItem', () => {
        it('should create a copy with new id and (העתק) suffix', async () => {
            const originalItem = {
                id: 'p-original',
                title: 'Original Task',
                type: 'task',
                content: 'Some content',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(dbCore.dbGet).mockResolvedValue(originalItem);
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            const result = await personalItemsService.duplicatePersonalItem('p-original');

            expect(result.id).not.toBe(originalItem.id);
            expect(result.title).toBe('Original Task (העתק)');
            expect(result.createdAt).not.toBe(originalItem.createdAt);
        });

        it('should reset isCompleted for task duplicates', async () => {
            const completedTask = {
                id: 'p-completed',
                title: 'Completed Task',
                type: 'task',
                isCompleted: true,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(dbCore.dbGet).mockResolvedValue(completedTask);
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            const result = await personalItemsService.duplicatePersonalItem('p-completed');

            expect(result.isCompleted).toBe(false);
        });
    });

    describe('logFocusSession', () => {
        it('should add a focus session to an item', async () => {
            const existingItem = {
                id: 'p-123',
                title: 'Study Task',
                type: 'task',
                focusSessions: [],
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };

            vi.mocked(dbCore.dbGet).mockResolvedValue(existingItem);
            vi.mocked(dbCore.dbPut).mockResolvedValue(undefined);

            const result = await personalItemsService.logFocusSession('p-123', 25);

            expect(result.focusSessions).toHaveLength(1);
            expect(result.focusSessions?.[0]?.duration).toBe(25);
        });

        it('should throw for missing item id', async () => {
            await expect(personalItemsService.logFocusSession('', 25)).rejects.toThrow();
        });
    });
});
