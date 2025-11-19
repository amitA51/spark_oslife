import * as dataService from './dataService';

declare const gapi: any;
declare const google: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;

if (!CLIENT_ID) {
    console.error("Configuration Error: GOOGLE_CLIENT_ID is missing. Please add it to your .env.local file.");
}

// Scopes for both Calendar and Drive (App Data Folder)
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let onAuthChangeCallback: ((isSignedIn: boolean) => void) | null = null;
let gapiInitialized = false;
let gisInitialized = false;

// Helper to load scripts dynamically
const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
};

export const isInitialized = () => gapiInitialized && gisInitialized;

export const initGoogleClient = async (onAuthChange: (isSignedIn: boolean) => void) => {
    onAuthChangeCallback = onAuthChange;

    try {
        // 1. Load Scripts Dynamically if missing
        if (typeof gapi === 'undefined') {
            await loadScript('https://apis.google.com/js/api.js');
        }
        if (typeof google === 'undefined') {
            await loadScript('https://accounts.google.com/gsi/client');
        }

        // 2. Initialize GAPI
        if (!gapiInitialized) {
            await new Promise<void>((resolve, reject) => {
                gapi.load('client', {
                    callback: resolve,
                    onerror: reject,
                    timeout: 10000, // Increased timeout
                    ontimeout: () => reject(new Error('gapi.load timed out'))
                });
            });

            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [
                    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
                    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
                ],
            });
            gapiInitialized = true;
            console.log('GAPI Initialized');
        }

        // 3. Initialize GIS (Identity Services)
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
                    console.log('Token received', tokenResponse);
                    await dataService.saveToken('google_auth', tokenResponse);
                    onAuthChangeCallback?.(true);
                },
            });
            gisInitialized = true;
            console.log('GIS Initialized');
        }

        // 4. Check for existing token
        const token = await dataService.getToken('google_auth');
        if (token && token.access_token) {
            gapi.client.setToken(token);
            // Optional: Verify token validity here if needed
            onAuthChangeCallback?.(true);
        } else {
            onAuthChangeCallback?.(false);
        }

    } catch (error) {
        console.error("Google Auth Initialization Failed:", error);
        onAuthChangeCallback?.(false);
        throw error; // Re-throw so UI knows it failed
    }
};

export const signIn = () => {
    if (!tokenClient) {
        console.error("Google GIS client not initialized.");
        alert("Google Client not ready. Please wait a moment or refresh.");
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
