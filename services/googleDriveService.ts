import { getGapiClient } from './googleAuthService';

const BACKUP_FILENAME = 'spark_os_backup.json';

export const findBackupFile = async (): Promise<string | null> => {
    const client = getGapiClient();
    try {
        const response = await client.drive.files.list({
            q: `name = '${BACKUP_FILENAME}' and trashed = false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            return files[0].id;
        }
        return null;
    } catch (error) {
        console.error("Error searching for backup file:", error);
        throw error;
    }
};

export const uploadBackup = async (data: string, fileId?: string): Promise<string> => {
    const client = getGapiClient();
    const fileMetadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json'
    };

    const media = {
        mimeType: 'application/json',
        body: data
    };

    try {
        let response;
        if (fileId) {
            // Update existing file
            response = await client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
                body: `
--foo_bar_baz
Content-Type: application/json; charset=UTF-8

${JSON.stringify({ name: BACKUP_FILENAME })}

--foo_bar_baz
Content-Type: application/json

${data}

--foo_bar_baz--`
            });
        } else {
            // Create new file
            response = await client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
                body: `
--foo_bar_baz
Content-Type: application/json; charset=UTF-8

${JSON.stringify(fileMetadata)}

--foo_bar_baz
Content-Type: application/json

${data}

--foo_bar_baz--`
            });
        }

        return response.result.id;
    } catch (error) {
        console.error("Error uploading backup:", error);
        throw error;
    }
};

export const downloadBackup = async (fileId: string): Promise<any> => {
    const client = getGapiClient();
    try {
        const response = await client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.result;
    } catch (error) {
        console.error("Error downloading backup:", error);
        throw error;
    }
};
