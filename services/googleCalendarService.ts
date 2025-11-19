import * as dataService from './dataService';
import type { GoogleCalendarEvent } from '../types';

import * as googleAuthService from './googleAuthService';

export const initGoogleClient = googleAuthService.initGoogleClient;
export const signIn = googleAuthService.signIn;
export const signOut = googleAuthService.signOut;

// Helper to get the GAPI client from the auth service
const getGapiClient = () => {
    return googleAuthService.getGapiClient();
};

export const getEventsForDateRange = async (startDate: Date, endDate: Date): Promise<GoogleCalendarEvent[]> => {
    const client = getGapiClient();
    if (!client.calendar) {
        throw new Error("Calendar API not loaded.");
    }

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const response = await client.calendar.events.list({
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
    const client = getGapiClient();
    if (!client.calendar) {
        throw new Error("Calendar API not loaded.");
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

    const response = await client.calendar.events.insert({
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
    const client = getGapiClient();
    if (!client.calendar) {
        throw new Error("Calendar API not loaded.");
    }

    // Get the current event first
    const currentEvent = await client.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
    });

    const updatedEvent = {
        ...currentEvent.result,
        ...updates,
    };

    const response = await client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent,
    });

    return response.result as GoogleCalendarEvent;
};

// Delete a calendar event
export const deleteEvent = async (eventId: string): Promise<void> => {
    const client = getGapiClient();
    if (!client.calendar) {
        throw new Error("Calendar API not loaded.");
    }

    await client.calendar.events.delete({
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

