/**
 * useGoogleCalendar Hook
 * Uses Firebase Auth state for Google Calendar integration
 */
import { useEffect, useState, useCallback } from 'react';
import { useCalendar } from '../src/contexts/CalendarContext';
import { useUser } from '../src/contexts/UserContext';
import * as googleCalendarService from '../services/googleCalendarService';
import { hasGoogleApiAccess, signInWithGoogle, clearGoogleAccessToken } from '../services/authService';
import { StatusMessageType } from '../types';

export const useGoogleCalendar = (showStatus?: (type: StatusMessageType, text: string) => void) => {
  const { setGoogleAuthState } = useCalendar();
  const { isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Check if we have Google API access (Firebase Auth + token)
  const hasApiAccess = hasGoogleApiAccess();
  const isGoogleAuthenticated = isAuthenticated && hasApiAccess;

  // Update context state based on auth
  useEffect(() => {
    if (isGoogleAuthenticated) {
      setGoogleAuthState('signedIn');
    } else {
      setGoogleAuthState('signedOut');
    }
  }, [isGoogleAuthenticated, setGoogleAuthState]);

  const listEvents = useCallback(
    async (start: Date, end: Date) => {
      if (!isGoogleAuthenticated) return [];
      setIsLoading(true);
      try {
        return await googleCalendarService.getEventsForDateRange(start, end);
      } catch (error: unknown) {
        console.error('Failed to fetch events:', error);
        if (showStatus) {
          showStatus('error', 'שגיאה בטעינת אירועים');
        }
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [isGoogleAuthenticated, showStatus]
  );

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setGoogleAuthState('signedIn');
    } catch (error) {
      console.error('Failed to sign in:', error);
      if (showStatus) {
        showStatus('error', 'שגיאה בהתחברות ל-Google');
      }
    } finally {
      setIsLoading(false);
    }
  }, [setGoogleAuthState, showStatus]);

  const signOut = useCallback(() => {
    clearGoogleAccessToken();
    setGoogleAuthState('signedOut');
  }, [setGoogleAuthState]);

  return {
    isAuthenticated: isGoogleAuthenticated,
    isLoading,
    listEvents,
    signIn,
    signOut,
  };
};
