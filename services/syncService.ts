/**
 * Sync Service - Multi-Device Synchronization
 * Uses Google Drive as the sync backend with polling for changes
 */

import * as dataService from './dataService';
import * as googleDriveService from './googleDriveService';
import { loadSettings, saveSettings } from './settingsService';
import type { AppData, ExportData } from '../types';

export interface SyncState {
    status: 'idle' | 'syncing' | 'conflict' | 'error';
    lastSyncTime?: string;
    lastError?: string;
    conflictCount: number;
}

export interface Conflict {
    type: 'item' | 'setting';
    path: string;
    local: any;
    remote: any;
    timestamp: string;
}

export interface Delta {
    added: string[];
    modified: string[];
    deleted: string[];
    changes: Record<string, any>;
}

class SyncService {
    private pollingInterval: NodeJS.Timeout | null = null;
    private syncState: SyncState = {
        status: 'idle',
        conflictCount: 0
    };
    private listeners: ((state: SyncState) => void)[] = [];
    private conflicts: Conflict[] = [];

    /**
     * Initialize the sync service
     */
    async init() {
        console.log('[Sync] Service initialized');
    }

    /**
     * Start polling for changes
     * @param intervalMs Polling interval in milliseconds (default: 30 seconds)
     */
    startPolling(intervalMs: number = 30000) {
        if (this.pollingInterval) {
            console.warn('[Sync] Polling already active');
            return;
        }

        console.log(`[Sync] Starting polling every ${intervalMs}ms`);

        // Initial sync
        this.syncNow();

        // Set up polling
        this.pollingInterval = setInterval(() => {
            this.syncNow();
        }, intervalMs);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('[Sync] Polling stopped');
        }
    }

    /**
     * Force immediate sync
     */
    async syncNow(): Promise<void> {
        if (this.syncState.status === 'syncing') {
            console.log('[Sync] Sync already in progress');
            return;
        }

        try {
            this.updateState({ status: 'syncing' });
            console.log('[Sync] Starting sync...');

            // Get local data
            const localData = await this.getLocalData();

            // Try to get remote data
            const remoteDataStr = await googleDriveService.downloadBackup('spark_os_backup.json');

            if (!remoteDataStr) {
                // No remote data, upload local data
                console.log('[Sync] No remote data found, uploading local data');
                await this.uploadData(localData);
                this.updateState({
                    status: 'idle',
                    lastSyncTime: new Date().toISOString()
                });
                return;
            }

            // Parse remote data
            const remoteData: ExportData = JSON.parse(remoteDataStr);

            // Detect conflicts
            const conflicts = this.detectConflicts(localData, remoteData.data);

            if (conflicts.length > 0) {
                console.log(`[Sync] ${conflicts.length} conflicts detected`);
                this.conflicts = conflicts;
                this.updateState({
                    status: 'conflict',
                    conflictCount: conflicts.length
                });
                return;
            }

            // Merge data (last-write-wins for now)
            const merged = this.mergeData(localData, remoteData.data, remoteData.settings.lastSyncTime);

            // Apply merged data locally
            await this.applyData(merged);

            // Upload merged data
            await this.uploadData(merged);

            this.updateState({
                status: 'idle',
                lastSyncTime: new Date().toISOString()
            });
            console.log('[Sync] Sync completed successfully');

        } catch (error) {
            console.error('[Sync] Sync failed:', error);
            this.updateState({
                status: 'error',
                lastError: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get local data
     */
    private async getLocalData(): Promise<AppData> {
        return {
            tags: await dataService.getTags(),
            rssFeeds: await dataService.getFeeds(),
            feedItems: await dataService.getFeedItems(),
            personalItems: await dataService.getPersonalItems(),
            templates: await dataService.getTemplates(),
            watchlist: await dataService.getWatchlist(),
            spaces: await dataService.getSpaces(),
            customMentors: await dataService.getMentors(),
            customQuotes: await dataService.getCustomQuotes(),
        };
    }

    /**
     * Upload data to Google Drive
     */
    private async uploadData(data: AppData): Promise<void> {
        const exportData: ExportData = {
            settings: loadSettings(),
            data,
            exportDate: new Date().toISOString(),
            version: 3,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        await googleDriveService.uploadBackup(jsonString);

        // Update last sync time in settings
        const settings = loadSettings();
        saveSettings({ ...settings, lastSyncTime: new Date().toISOString() });
    }

    /**
     * Apply data locally
     */
    private async applyData(data: AppData): Promise<void> {
        // Use the import function from dataService which handles everything
        const exportData: ExportData = {
            settings: loadSettings(),
            data,
            exportDate: new Date().toISOString(),
            version: 3,
        };

        await dataService.importAllData(JSON.stringify(exportData));
    }

    /**
     * Detect conflicts between local and remote data
     */
    private detectConflicts(local: AppData, remote: AppData): Conflict[] {
        const conflicts: Conflict[] = [];

        // Compare personal items by ID
        const localItemsMap = new Map(local.personalItems.map(i => [i.id, i]));
        const remoteItemsMap = new Map(remote.personalItems.map(i => [i.id, i]));

        for (const [id, localItem] of localItemsMap) {
            const remoteItem = remoteItemsMap.get(id);
            if (remoteItem) {
                // Check if both were modified (different content)
                if (JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
                    // Compare timestamps to determine which is newer
                    const localTime = new Date(localItem.createdAt).getTime();
                    const remoteTime = new Date(remoteItem.createdAt).getTime();

                    // Only create conflict if times are very close (within 1 minute)
                    if (Math.abs(localTime - remoteTime) < 60000) {
                        conflicts.push({
                            type: 'item',
                            path: `personalItems.${id}`,
                            local: localItem,
                            remote: remoteItem,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        }

        return conflicts;
    }

    /**
     * Merge local and remote data (last-write-wins strategy)
     */
    private mergeData(local: AppData, remote: AppData, remoteLastSync?: string): AppData {
        const merged: AppData = {
            tags: this.mergeArrays(local.tags, remote.tags, 'id'),
            rssFeeds: this.mergeArrays(local.rssFeeds, remote.rssFeeds, 'id'),
            feedItems: this.mergeArrays(local.feedItems, remote.feedItems, 'id'),
            personalItems: this.mergeArraysByTimestamp(local.personalItems, remote.personalItems),
            templates: this.mergeArrays(local.templates, remote.templates, 'id'),
            watchlist: this.mergeArrays(local.watchlist, remote.watchlist, 'id'),
            spaces: this.mergeArrays(local.spaces, remote.spaces, 'id'),
            customMentors: this.mergeArrays(local.customMentors, remote.customMentors, 'id'),
            customQuotes: this.mergeArrays(local.customQuotes, remote.customQuotes, 'id'),
        };

        return merged;
    }

    /**
     * Merge arrays by ID (union)
     */
    private mergeArrays<T extends { id: string }>(local: T[], remote: T[], key: keyof T): T[] {
        const map = new Map<string, T>();

        // Add remote items first
        remote.forEach(item => map.set(item[key] as string, item));

        // Add/override with local items
        local.forEach(item => map.set(item[key] as string, item));

        return Array.from(map.values());
    }

    /**
     * Merge arrays by timestamp (last-write-wins)
     */
    private mergeArraysByTimestamp<T extends { id: string; createdAt: string }>(local: T[], remote: T[]): T[] {
        const map = new Map<string, T>();

        // Add all remote items
        remote.forEach(item => map.set(item.id, item));

        // Add/override with local items if newer
        local.forEach(localItem => {
            const remoteItem = map.get(localItem.id);
            if (!remoteItem || new Date(localItem.createdAt) >= new Date(remoteItem.createdAt)) {
                map.set(localItem.id, localItem);
            }
        });

        return Array.from(map.values());
    }

    /**
     * Resolve conflicts with user choice
     */
    async resolveConflicts(resolutions: { conflictIndex: number; choice: 'local' | 'remote' | 'merge' }[]): Promise<void> {
        // Apply resolutions
        for (const resolution of resolutions) {
            const conflict = this.conflicts[resolution.conflictIndex];
            if (!conflict) continue;

            // For now, we'll just keep the chosen version
            // In a real implementation, you'd apply this to the actual data
        }

        // Clear conflicts
        this.conflicts = [];
        this.updateState({ status: 'idle', conflictCount: 0 });

        // Retry sync
        await this.syncNow();
    }

    /**
     * Get current sync state
     */
    getState(): SyncState {
        return { ...this.syncState };
    }

    /**
     * Get pending conflicts
     */
    getConflicts(): Conflict[] {
        return [...this.conflicts];
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: SyncState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Update state and notify listeners
     */
    private updateState(updates: Partial<SyncState>) {
        this.syncState = { ...this.syncState, ...updates };
        this.listeners.forEach(listener => listener(this.syncState));
    }

    /**
     * Calculate delta between two data sets
     */
    getDelta(oldData: AppData, newData: AppData): Delta {
        const delta: Delta = {
            added: [],
            modified: [],
            deleted: [],
            changes: {}
        };

        // Compare personal items as an example
        const oldIds = new Set(oldData.personalItems.map(i => i.id));
        const newIds = new Set(newData.personalItems.map(i => i.id));

        // Find added items
        newData.personalItems.forEach(item => {
            if (!oldIds.has(item.id)) {
                delta.added.push(item.id);
                delta.changes[item.id] = item;
            }
        });

        // Find deleted items
        oldData.personalItems.forEach(item => {
            if (!newIds.has(item.id)) {
                delta.deleted.push(item.id);
            }
        });

        // Find modified items
        oldData.personalItems.forEach(oldItem => {
            const newItem = newData.personalItems.find(i => i.id === oldItem.id);
            if (newItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                delta.modified.push(oldItem.id);
                delta.changes[oldItem.id] = newItem;
            }
        });

        return delta;
    }
}

export const syncService = new SyncService();
