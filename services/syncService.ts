import { exportAllData, importAllData } from './dataService';
import { uploadBackup, findBackupFile, downloadBackup } from './googleDriveService';
import { auth } from '../config/firebase';

class SyncService {
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private isAutoSavePending = false;
  private readonly AUTO_SAVE_DELAY = 5000; // 5 seconds debounce
  private backupFileId: string | null = null;

  init() {
    // Setup listeners if needed, or just ensure auth state
    if (!auth) return;
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('SyncService: User authenticated, ready to sync.');
        try {
          this.backupFileId = await findBackupFile();
        } catch (error) {
          console.error('SyncService: Failed to find initial backup file', error);
        }
      } else {
        this.backupFileId = null;
      }
    });
  }

  triggerAutoSave() {
    if (this.isAutoSavePending) return;

    this.isAutoSavePending = true;

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(async () => {
      await this.performAutoSave();
      this.isAutoSavePending = false;
    }, this.AUTO_SAVE_DELAY);
  }

  private async performAutoSave() {
    const user = auth?.currentUser;
    if (!user) {
      console.log('SyncService: No user logged in, skipping auto-save.');
      return;
    }

    try {
      console.log('SyncService: Starting auto-save...');
      // Export data without password for cloud backup (assuming user's drive is secure)
      // Or we could implement a user setting for backup password later.
      const data = await exportAllData();

      // Refresh file ID if we don't have it (might have been created since init)
      if (!this.backupFileId) {
        this.backupFileId = await findBackupFile();
      }

      const newFileId = await uploadBackup(data, this.backupFileId || undefined);

      // Update our cache if it was a new file
      if (newFileId) {
        this.backupFileId = newFileId;
      }

      console.log('SyncService: Auto-save completed successfully.');
    } catch (error) {
      console.error('SyncService: Auto-save failed:', error);
    }
  }

  /**
   * Restore data manually from Google Drive
   */
  async restoreFromBackup(): Promise<boolean> {
    try {
      console.log('SyncService: Starting restore...');
      const backupId = this.backupFileId || await findBackupFile();

      if (!backupId) {
        throw new Error('לא נמצא קובץ גיבוי ב-Google Drive.');
      }

      const backupData = await downloadBackup(backupId);

      if (!backupData) {
        throw new Error('קובץ הגיבוי ריק.');
      }

      // Convert to string for importAllData if it's already an object
      const jsonString = typeof backupData === 'string' ? backupData : JSON.stringify(backupData);

      await importAllData(jsonString);
      console.log('SyncService: Restore completed.');
      return true;
    } catch (error) {
      console.error('SyncService: Restore failed:', error);
      throw error;
    }
  }
}

export const syncService = new SyncService();
