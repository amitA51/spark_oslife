# Implementation Plan - Private Cloud Sync (Google Drive)

## Goal
Enable users to sync their application data (encrypted JSON) to their personal Google Drive. This allows for cross-device access without a central server.

## User Review Required
> [!IMPORTANT]
> This change requires adding the `https://www.googleapis.com/auth/drive.file` scope to the Google Auth request. Users will see a new permission request when they sign in.

## Proposed Changes

### Services

#### [MODIFY] [googleCalendarService.ts](file:///c:/Users/עילאי/Desktop/life os/copy-of-spark-personal-os-1-test-more-clean12/services/googleCalendarService.ts)
*   **Rename**: To `services/googleIntegrationService.ts` (or keep name and export generic auth). *Decision: Keep name for now to avoid massive refactor, but export generic auth or create new service.*
*   **Better Approach**: Create `services/googleDriveService.ts` and share the auth token/initialization logic.
*   **Refactor**: Extract the Auth initialization into `services/googleAuthService.ts` so both Calendar and Drive can use it.
    *   `initGoogleClient` will accept an array of scopes.
    *   `signIn` will request all needed scopes.

#### [NEW] [services/googleDriveService.ts](file:///c:/Users/עילאי/Desktop/life os/copy-of-spark-personal-os-1-test-more-clean12/services/googleDriveService.ts)
*   `initDriveClient()`: Load the Drive API discovery doc.
*   `findBackupFile()`: Search for a specific file (e.g., `spark_os_backup.json`) in the user's Drive.
*   `uploadBackup(data: string)`: Create or update the backup file.
*   `downloadBackup()`: Retrieve the file content.

### UI Components

#### [MODIFY] [screens/SettingsScreen.tsx](file:///c:/Users/עילאי/Desktop/life os/copy-of-spark-personal-os-1-test-more-clean12/screens/SettingsScreen.tsx)
*   Add a "Cloud Sync" section.
*   "Connect to Google Drive" button (reuses existing Google Auth if possible, or requests additional scope).
*   "Sync Now" button.
*   "Last Synced" timestamp.
*   Toggle for "Auto-sync" (sync on save/exit).

### State Management

#### [MODIFY] [types.ts](file:///c:/Users/עילאי/Desktop/life os/copy-of-spark-personal-os-1-test-more-clean12/types.ts)
*   Add `lastSyncTime` to `AppSettings`.
*   Add `googleDriveBackupId` to `AppSettings` (to store the file ID for easier updates).

## Verification Plan

### Manual Verification
1.  **Auth**: Click "Connect", verify Google popup asks for Drive permissions.
2.  **Upload**: Click "Sync Now", check Google Drive (web) to see if `spark_os_backup.json` is created.
3.  **Update**: Change some data, Sync again, verify file modification time in Drive.
4.  **Download**: Clear local data (incognito), connect, Sync (Download), verify data is restored.
