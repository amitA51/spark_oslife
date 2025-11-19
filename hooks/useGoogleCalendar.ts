import { useEffect, useContext, useState, useCallback } from 'react';
import { AppContext } from '../state/AppContext';
import * as googleCalendarService from '../services/googleCalendarService';
import { StatusMessageType } from '../components/StatusMessage';

export const useGoogleCalendar = (showStatus?: (type: StatusMessageType, text: string) => void) => {
    const { state, dispatch } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);

    const isAuthenticated = state.googleAuthState === 'signedIn';

    const listEvents = useCallback(async (start: Date, end: Date) => {
        if (!isAuthenticated) return [];
        setIsLoading(true);
        try {
            return await googleCalendarService.getEventsForDateRange(start, end);
        } catch (error: any) {
            console.error("Failed to fetch events:", error);
            if (showStatus) {
                showStatus('error', 'שגיאה בטעינת אירועים');
            }
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, showStatus]);

    useEffect(() => {
        const handleAuthChange = async (isSignedIn: boolean) => {
            dispatch({ type: 'SET_GOOGLE_AUTH_STATE', payload: isSignedIn ? 'signedIn' : 'signedOut' });
            if (isSignedIn) {
                // Initial fetch for today could go here if needed
            }
        };

        const checkAndInit = async () => {
            if ((window as any).gapi && (window as any).google) {
                try {
                    await googleCalendarService.initGoogleClient(handleAuthChange);
                } catch (error: any) {
                    console.error("Error initializing Google Client:", error);
                    if (showStatus) {
                        showStatus('error', 'שגיאה באתחול החיבור ל-Google');
                    }
                    dispatch({ type: 'SET_GOOGLE_AUTH_STATE', payload: 'signedOut' });
                }
            } else {
                setTimeout(checkAndInit, 100);
            }
        };

        // Only init if not already initialized/initializing to avoid loops if called multiple times
        // For now, simple check
        checkAndInit();

    }, [dispatch, showStatus]);

    return {
        isAuthenticated,
        isLoading,
        listEvents,
        signIn: googleCalendarService.signIn,
        signOut: googleCalendarService.signOut
    };
};
