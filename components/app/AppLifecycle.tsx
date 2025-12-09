import React, { useEffect, useState } from 'react';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useData } from '../../src/contexts/DataContext';
import * as dataService from '../../services/dataService';
import { checkGoogleRedirectResult } from '../../services/authService';
import type { Screen } from '../../types';

interface AppLifecycleProps {
  isGuest: boolean;
  setIsGuest: (isGuest: boolean) => void;
  setActiveScreen: (screen: Screen | ((prev: Screen) => Screen)) => void;
  defaultScreen: Screen;
  setIsAuthLoading: (loading: boolean) => void;
}

/**
 * AppLifecycle Component
 *
 * Manages application lifecycle events:
 * - Authentication state monitoring
 * - Auto cleanup of completed tasks
 * - Built-in workout template initialization
 */
const AppLifecycle: React.FC<AppLifecycleProps> = ({
  isGuest,
  setIsGuest,
  setActiveScreen,
  defaultScreen,
  setIsAuthLoading,
}) => {
  const { removePersonalItem } = useData();
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  // Handle Google redirect result FIRST (for mobile auth flow)
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const user = await checkGoogleRedirectResult();
        if (user) {
          console.log('Google redirect sign-in successful in AppLifecycle');
          // User signed in via redirect - navigate to default screen
          setActiveScreen(defaultScreen);
        }
      } catch (error) {
        console.error('Error checking Google redirect result:', error);
      } finally {
        setIsCheckingRedirect(false);
        setIsAuthLoading(false);
      }
    };

    handleRedirect();
  }, [defaultScreen, setActiveScreen, setIsAuthLoading]);

  // Auth State Listener - Only runs after redirect check is complete
  useEffect(() => {
    if (!auth || isCheckingRedirect) return;

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        // User is logged in - redirect from auth screens
        setActiveScreen(prev => (prev === 'login' || prev === 'signup' ? defaultScreen : prev));
      } else {
        // User is logged out - redirect to login unless guest
        if (!isGuest) {
          setActiveScreen(prev => (prev !== 'signup' && prev !== 'login' ? 'login' : prev));
        }
      }
    });
    return () => unsubscribe();
  }, [isGuest, defaultScreen, setActiveScreen, isCheckingRedirect]);

  // Auto-cleanup hook - remove expired completed tasks
  useEffect(() => {
    const cleanup = async () => {
      const deletedIds = await dataService.cleanupCompletedTasks();
      if (deletedIds.length > 0) {
        // Tasks were auto-cleaned - update state
        await Promise.all(deletedIds.map(id => removePersonalItem(id)));
      }
    };
    cleanup();
  }, [removePersonalItem]);

  // Initialize built-in templates on mount
  useEffect(() => {
    dataService.initializeBuiltInWorkoutTemplates();
  }, []);

  // This component doesn't render anything - it's purely for side effects
  return null;
};

export default AppLifecycle;
