import * as googleDriveService from './googleDriveService';
import * as dataService from './dataService';
import { loadSettings, saveSettings } from './settingsService';
import { AppSettings, SyncState, Conflict, AppData, Delta } from '../types';

class SyncService {
    private pollingInterval: NodeJS.Timeout | null = null;
    private autoSaveTimeout: NodeJS.Timeout | null = null;
    private isSyncing = false;
    private lastLocalChange = 0;

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
        // Load settings to check if we have a file ID
        const settings = await loadSettings();
        if (settings.googleDriveBackupId) {
            this.startPolling();
        }
    }

    /**
     * Trigger an auto-save after a short delay (Debounce)
     * Call this whenever data changes locally
     */
    triggerAutoSave() {
        this.lastLocalChange = Date.now();
        this.updateState({ status: 'syncing' }); // Show "Saving..." immediately

        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(async () => {
            try {
                await this.performSync('upload');
            } catch (error) {
                console.error("Auto-save failed:", error);
                this.updateState({ status: 'error', lastError: 'שמירה אוטומטית נכשלה' });
            }
        }, 2000); // Wait 2 seconds of inactivity before saving
    }

    /**
     * Start polling for changes from other devices
     */
    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);

        // Poll every 60 seconds for changes from other devices
        this.pollingInterval = setInterval(async () => {
            if (!this.isSyncing && Date.now() - this.lastLocalChange > 5000) {
                await this.performSync('download');
            }
        }, 60000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async syncNow() {
        if (this.isSyncing) return;
        await this.performSync('smart');
    }

    private async performSync(direction: 'upload' | 'download' | 'smart' = 'smart') {
        if (this.isSyncing) return;
        this.isSyncing = true;
        this.updateState({ status: 'syncing' });

        try {
            const settings = await loadSettings();
            let fileId = settings.googleDriveBackupId;

            // 1. Ensure we have a file ID
            if (!fileId) {
                fileId = await googleDriveService.findBackupFile();
                if (fileId) {
                    await saveSettings({ ...settings, googleDriveBackupId: fileId });
                } else if (direction === 'upload') {
                    // First time upload - create file
                    const json = await dataService.exportAllData();
                    fileId = await googleDriveService.uploadBackup(json);
                    await saveSettings({ ...settings, googleDriveBackupId: fileId });
                    this.updateState({ status: 'idle', lastSyncTime: new Date().toISOString() });
                    this.isSyncing = false;
                    return;
                } else {
                    // Nothing to download
                    this.isSyncing = false;
                    this.updateState({ status: 'idle' });
                    return;
                }
            }

            // 2. Get Remote Metadata
            // In a real implementation, we would check file modified time first
            // For now, we'll implement a basic "Smart Sync"

            if (direction === 'upload') {
                const json = await dataService.exportAllData();
                await googleDriveService.uploadBackup(json, fileId);
            } else if (direction === 'download') {
                const remoteData = await googleDriveService.downloadBackup(fileId);
                // TODO: Implement smart merging here instead of overwrite
                await dataService.importAllData(JSON.stringify(remoteData));
            } else if (direction === 'smart') {
                // For smart sync, we currently default to download if remote is newer, else upload
                // This is a simplification. Real sync needs vector clocks or similar.
                const remoteData = await googleDriveService.downloadBackup(fileId);
                // Assume remote is truth for now to avoid data loss, but ideally we merge
                if (remoteData) {
                    await dataService.importAllData(JSON.stringify(remoteData));
                }
            }

            this.updateState({ status: 'idle', lastSyncTime: new Date().toISOString() });

        } catch (error) {
            console.error('Sync error:', error);
            this.updateState({ status: 'error', lastError: String(error) });
        } finally {
            this.isSyncing = false;
        }
    }

    private updateState(updates: Partial<SyncState>) {
        this.syncState = { ...this.syncState, ...updates };
        this.listeners.forEach(listener => listener(this.syncState));
    }

    getState(): SyncState {
        return this.syncState;
    }

    getConflicts(): Conflict[] {
        return this.conflicts;
    }

    subscribe(listener: (state: SyncState) => void) {
        this.listeners.push(listener);
        listener(this.syncState);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const syncService = new SyncService();
