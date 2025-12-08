/**
 * Google Calendar Service
 * Uses Firebase Auth access token for Google Calendar API calls
 */
import type { GoogleCalendarEvent } from '../types';
import { getGoogleAccessToken } from './authService';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

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
    'Content-Type': 'application/json',
  };
};

/**
 * Check if we have a valid Google Calendar connection
 */
export const isCalendarConnected = (): boolean => {
  return !!getGoogleAccessToken();
};

/**
 * Get calendar events for a date range
 */
export const getEventsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<GoogleCalendarEvent[]> => {
  const headers = getAuthHeaders();

  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    showDeleted: 'false',
    singleEvents: 'true',
    maxResults: '250',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `שגיאה בקבלת אירועים: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items as GoogleCalendarEvent[];
};

/**
 * Create a new calendar event
 */
export const createEvent = async (event: {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  reminders?: { useDefault: boolean };
  sparkTaskId?: string;
  isBlockedTime?: boolean;
}): Promise<GoogleCalendarEvent> => {
  const headers = getAuthHeaders();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const eventData: Record<string, unknown> = {
    summary: event.summary,
    description: event.description || '',
    start: {
      dateTime: event.start.dateTime,
      timeZone: event.start.timeZone || timeZone,
    },
    end: {
      dateTime: event.end.dateTime,
      timeZone: event.end.timeZone || timeZone,
    },
    reminders: event.reminders || { useDefault: true },
  };

  // Add custom metadata in description
  if (event.sparkTaskId || event.isBlockedTime) {
    const metadata: string[] = [];
    if (event.sparkTaskId) metadata.push(`[Spark Task: ${event.sparkTaskId}]`);
    if (event.isBlockedTime) metadata.push('[Time Block]');
    eventData.description = `${metadata.join(' ')}\n\n${eventData.description}`;
  }

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(eventData),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `שגיאה ביצירת אירוע: ${response.statusText}`);
  }

  return await response.json() as GoogleCalendarEvent;
};

/**
 * Update an existing calendar event
 */
export const updateEvent = async (
  eventId: string,
  updates: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> => {
  const headers = getAuthHeaders();

  // First get the current event
  const getResponse = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    { headers }
  );

  if (!getResponse.ok) {
    const error = await getResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || `שגיאה בקבלת אירוע: ${getResponse.statusText}`);
  }

  const currentEvent = await getResponse.json();
  const updatedEvent = { ...currentEvent, ...updates };

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedEvent),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `שגיאה בעדכון אירוע: ${response.statusText}`);
  }

  return await response.json() as GoogleCalendarEvent;
};

/**
 * Delete a calendar event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `שגיאה במחיקת אירוע: ${response.statusText}`);
  }
};

/**
 * Block time for a task
 */
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
