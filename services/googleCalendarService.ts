import * as dataService from './dataService';
import type { GoogleCalendarEvent } from '../types';

declare const gapi: any;
declare const google: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

let tokenClient: any;
let onAuthChangeCallback: ((isSignedIn: boolean) => void) | null = null;
let gapiInitialized = false;
let gisInitialized = false;

export const initGoogleClient = async (onAuthChange: (isSignedIn: boolean) => void) => {
    onAuthChangeCallback = onAuthChange;

    if (!gapiInitialized) {
        await new Promise<void>((resolve, reject) => {
            // gapi.load now includes error handling and a timeout
            gapi.load('client', {
                callback: resolve,
                onerror: reject,
                timeout: 5000, // 5 seconds
                ontimeout: () => reject(new Error('gapi.load timed out'))
            });
        });
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
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

    const token = await dataService.getToken('google_auth');
    if (token && token.access_token) {
        gapi.client.setToken(token);
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

export const getEventsForDateRange = async (startDate: Date, endDate: Date): Promise<GoogleCalendarEvent[]> => {
    if (!gapi.client.calendar) {
        throw new Error("GAPI client or calendar API not loaded.");
    }

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const response = await gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': timeMin,
        'timeMax': timeMax,
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 5,
        'orderBy': 'startTime'
    });

    return response.result.items as GoogleCalendarEvent[];
};

// Create a new calendar event
export const createEvent = async (event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    reminders?: { useDefault: boolean };
    sparkTaskId?: string;
    isBlockedTime?: boolean;
}): Promise<GoogleCalendarEvent> => {
    if (!gapi.client.calendar) {
        throw new Error("GAPI client or calendar API not loaded.");
    }

    const eventData: any = {
        summary: event.summary,
        description: event.description || '',
        start: {
            dateTime: event.start.dateTime,
            timeZone: event.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: event.end.dateTime,
            timeZone: event.end.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: event.reminders || { useDefault: true },
    };

    // Add custom metadata in description
    if (event.sparkTaskId || event.isBlockedTime) {
        const metadata = [];
        if (event.sparkTaskId) metadata.push(`[Spark Task: ${event.sparkTaskId}]`);
        if (event.isBlockedTime) metadata.push('[Time Block]');
        eventData.description = `${metadata.join(' ')}\n\n${eventData.description}`;
    }

    const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventData,
    });

    return response.result as GoogleCalendarEvent;
};

// Update an existing calendar event
export const updateEvent = async (
    eventId: string,
    updates: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> => {
    if (!gapi.client.calendar) {
        throw new Error("GAPI client or calendar API not loaded.");
    }

    // Get the current event first
    const currentEvent = await gapi.client.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
    });

    const updatedEvent = {
        ...currentEvent.result,
        ...updates,
    };

    const response = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent,
    });

    return response.result as GoogleCalendarEvent;
};

// Delete a calendar event
export const deleteEvent = async (eventId: string): Promise<void> => {
    if (!gapi.client.calendar) {
        throw new Error("GAPI client or calendar API not loaded.");
    }

    await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
    });
};

// Block time for a task
export const blockTimeForTask = async (
    taskId: string,
    taskTitle: string,
    startTime: Date,
    durationMinutes: number
): Promise<GoogleCalendarEvent> => {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    return createEvent({
        summary: `🎯 ${taskTitle}`,
        description: `Time blocked for task: ${taskTitle}`,
        start: {
            dateTime: startTime.toISOString(),
        },
        end: {
            dateTime: endTime.toISOString(),
        },
        reminders: { useDefault: true },
        sparkTaskId: taskId,
        isBlockedTime: true,
    });
};

