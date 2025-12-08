/**
 * Google Drive Service
 * Uses Firebase Auth access token for Google Drive API calls
 */
import { getGoogleAccessToken } from './authService';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
const BACKUP_FILENAME = 'spark_os_backup.json';

/**
 * Get auth headers for Google API calls
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('לא נמצא טוקן גישה ל-Google. יש להתחבר מחדש.');
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Find existing backup file in Google Drive
 */
export const findBackupFile = async (): Promise<string | null> => {
  const headers = getAuthHeaders();

  const params = new URLSearchParams({
    q: `name = '${BACKUP_FILENAME}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  try {
    const response = await fetch(
      `${DRIVE_API_BASE}/files?${params}`,
      { headers }
    );

    if (!response.ok) {
      console.warn('Drive API error. Make sure you are signed in with Google.');
      return null;
    }

    const data = await response.json();
    const files = data.files;

    if (files && files.length > 0) {
      return files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error searching for backup file:', error);
    throw error;
  }
};

/**
 * Upload backup data to Google Drive
 * Creates a new file or updates existing one
 */
export const uploadBackup = async (data: string, fileId?: string): Promise<string> => {
  const headers = getAuthHeaders();
  const boundary = 'spark_backup_boundary';

  const fileMetadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json',
  };

  const multipartBody = `--${boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(fileMetadata)}

--${boundary}
Content-Type: application/json

${data}

--${boundary}--`;

  try {
    let response;

    if (fileId) {
      // Update existing file
      response = await fetch(
        `${UPLOAD_API_BASE}/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );
    } else {
      // Create new file
      response = await fetch(
        `${UPLOAD_API_BASE}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `שגיאה בהעלאת גיבוי: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error uploading backup:', error);
    throw error;
  }
};

/**
 * Download backup data from Google Drive
 */
export const downloadBackup = async (fileId: string): Promise<unknown> => {
  const headers = getAuthHeaders();

  try {
    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `שגיאה בהורדת גיבוי: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
};
