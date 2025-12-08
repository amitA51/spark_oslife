/**
 * Google OAuth Authentication Service
 * Handles Google Calendar API authentication and client initialization
 */

// Google API Client configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
];
// Calendar full access + Drive file access (only files created by this app)
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file';

// --- GAPI Type Definitions ---

/** Google Calendar API Events resource */
interface CalendarEventsResource {
    list: (params: {
        calendarId: string;
        timeMin?: string;
        timeMax?: string;
        singleEvents?: boolean;
        orderBy?: string;
        maxResults?: number;
    }) => Promise<{ result: { items: unknown[] } }>;
    insert: (params: {
        calendarId: string;
        resource: unknown;
    }) => Promise<{ result: unknown }>;
    update: (params: {
        calendarId: string;
        eventId: string;
        resource: unknown;
    }) => Promise<{ result: unknown }>;
    delete: (params: {
        calendarId: string;
        eventId: string;
    }) => Promise<void>;
}

/** Google Calendar API client */
interface CalendarClient {
    events: CalendarEventsResource;
}

/** Google Drive API Files resource */
interface DriveFilesResource {
    list: (params: {
        q?: string;
        fields?: string;
        spaces?: string;
    }) => Promise<{ result: { files: Array<{ id: string; name: string }> } }>;
    get: (params: {
        fileId: string;
        alt?: string;
    }) => Promise<{ result: unknown }>;
}

/** Google Drive API client */
interface DriveClient {
    files: DriveFilesResource;
}

/** GAPI Client interface */
interface GapiClient {
    calendar?: CalendarClient;
    drive?: DriveClient;
    request: (params: {
        path: string;
        method: string;
        params?: Record<string, string>;
        headers?: Record<string, string>;
        body?: string;
    }) => Promise<{ result: { id: string } }>;
    init: (config: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
    }) => Promise<void>;
}

/** GAPI Auth2 instance */
interface GapiAuth2Instance {
    isSignedIn: {
        get: () => boolean;
        listen: (callback: (isSignedIn: boolean) => void) => void;
    };
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

/** GAPI Auth2 module */
interface GapiAuth2 {
    getAuthInstance: () => GapiAuth2Instance | null;
}

/** Main GAPI object */
interface Gapi {
    load: (
        modules: string,
        callbacks: { callback: () => void; onerror: (error: Error) => void }
    ) => void;
    client: GapiClient;
    auth2: GapiAuth2;
}

/** Window with GAPI */
interface WindowWithGapi extends Window {
    gapi?: Gapi;
}

let gapiClient: Partial<GapiClient> = {};
let authChangeCallback: ((isSignedIn: boolean) => void) | null = null;

/** Helper to get typed gapi from window */
const getGapi = (): Gapi | null => {
    return (window as WindowWithGapi).gapi ?? null;
};

/**
 * Initialize the Google API client
 */
export const initGoogleClient = async (
    onAuthChange: (isSignedIn: boolean) => void
): Promise<void> => {
    authChangeCallback = onAuthChange;

    const gapi = getGapi();
    if (!gapi) {
        console.warn('Google API client not loaded');
        return;
    }

    try {
        // Load the auth2 and client libraries
        await new Promise<void>((resolve, reject) => {
            gapi.load('client:auth2', {
                callback: resolve,
                onerror: reject,
            });
        });

        // Initialize the client
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
        });

        // Store the client
        gapiClient = gapi.client;

        // Listen for sign-in state changes
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance) {
            authInstance.isSignedIn.listen((isSignedIn: boolean) => {
                if (authChangeCallback) {
                    authChangeCallback(isSignedIn);
                }
            });

            // Check current sign-in status
            const isSignedIn = authInstance.isSignedIn.get();
            if (authChangeCallback) {
                authChangeCallback(isSignedIn);
            }
        }
    } catch (error) {
        console.error('Error initializing Google client:', error);
        throw error;
    }
};

/**
 * Sign in to Google
 */
export const signIn = async (): Promise<void> => {
    const gapi = getGapi();
    if (!gapi) {
        throw new Error('Google API client not loaded');
    }

    const authInstance = gapi.auth2.getAuthInstance();

    if (!authInstance) {
        throw new Error('Google Auth not initialized');
    }

    try {
        await authInstance.signIn();
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};

/**
 * Sign out from Google
 */
export const signOut = async (): Promise<void> => {
    const gapi = getGapi();
    if (!gapi) {
        throw new Error('Google API client not loaded');
    }

    const authInstance = gapi.auth2.getAuthInstance();

    if (!authInstance) {
        throw new Error('Google Auth not initialized');
    }

    try {
        await authInstance.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Get the initialized GAPI client
 */
export const getGapiClient = (): Partial<GapiClient> => {
    return gapiClient;
};
