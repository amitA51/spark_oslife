import * as dataService from './dataService';

declare const gapi: any;
declare const google: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;

// Scopes for both Calendar and Drive (App Data Folder)
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let onAuthChangeCallback: ((isSignedIn: boolean) => void) | null = null;
let gapiInitialized = false;
let gisInitialized = false;

export const initGoogleClient = async (onAuthChange: (isSignedIn: boolean) => void) => {
    onAuthChangeCallback = onAuthChange;

    if (!gapiInitialized) {
        await new Promise<void>((resolve, reject) => {
            gapi.load('client', {
                callback: resolve,
                onerror: reject,
                timeout: 5000,
                ontimeout: () => reject(new Error('gapi.load timed out'))
            });
        });

        // Initialize GAPI client with discovery docs for both APIs
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
                "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
            ],
        });
        gapiInitialized = true;
    }

    if (!gisInitialized) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                    console.error('GIS Error:', tokenResponse.error);
                    onAuthChangeCallback?.(false);
                    return;
                }
                await dataService.saveToken('google_auth', tokenResponse);
                onAuthChangeCallback?.(true);
            },
        });
        gisInitialized = true;
    }

    // Check for existing token
    const token = await dataService.getToken('google_auth');
    if (token && token.access_token) {
        gapi.client.setToken(token);
        // Verify token validity (optional, but good practice)
        onAuthChangeCallback?.(true);
    } else {
        onAuthChangeCallback?.(false);
    }
};

export const signIn = () => {
    if (!tokenClient) {
        console.error("Google GIS client not initialized.");
        return;
    }
    // Request all scopes
    tokenClient.requestAccessToken({ prompt: 'consent' });
};

export const signOut = async () => {
    const token = await dataService.getToken('google_auth');
    if (token && token.access_token) {
        google.accounts.oauth2.revoke(token.access_token, () => { });
    }
    gapi.client.setToken(null);
    await dataService.removeToken('google_auth');
    onAuthChangeCallback?.(false);
};

export const getGapiClient = () => {
    if (!gapiInitialized || !gapi.client) {
        throw new Error("GAPI client not initialized.");
    }
    return gapi.client;
};
