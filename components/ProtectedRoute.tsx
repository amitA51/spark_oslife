import React, { useEffect, useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, checkGoogleRedirectResult } from '../services/authService';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Handles authentication state and Google redirect flow
 * 
 * CRITICAL: On mobile/PWA, Google auth uses redirect flow. When returning from
 * Google, we MUST check the redirect result BEFORE deciding to show login screen.
 * Otherwise, the user sees login briefly before being authenticated.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [continueAsGuest, setContinueAsGuest] = useState(false);
  const hasCheckedRedirect = useRef(false);

  // Step 1: Check for Google redirect result FIRST
  useEffect(() => {
    if (hasCheckedRedirect.current) return;
    hasCheckedRedirect.current = true;

    const checkRedirect = async () => {
      try {
        console.log('[ProtectedRoute] Checking for Google redirect result...');
        const redirectUser = await checkGoogleRedirectResult();
        if (redirectUser) {
          console.log('[ProtectedRoute] Google redirect successful:', redirectUser.email);
          // User will be set by auth state listener
        } else {
          console.log('[ProtectedRoute] No redirect result found');
        }
      } catch (error) {
        console.error('[ProtectedRoute] Redirect check error:', error);
      } finally {
        setIsCheckingRedirect(false);
      }
    };

    checkRedirect();
  }, []);

  // Step 2: Listen for auth state changes (runs in parallel)
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(currentUser => {
      console.log('[ProtectedRoute] Auth state changed:', currentUser?.email || 'null');
      setUser(currentUser);
      // Only stop loading if redirect check is also done
      if (!isCheckingRedirect) {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isCheckingRedirect]);

  // Step 3: Update loading state when redirect check completes
  useEffect(() => {
    if (!isCheckingRedirect) {
      // Give auth state listener a moment to update after redirect
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isCheckingRedirect]);

  // Safety timeout - prevent infinite loading (3 seconds for mobile)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('[ProtectedRoute] Safety timeout reached');
      setIsCheckingRedirect(false);
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  // Show loading while checking redirect or auth state
  if (isLoading || isCheckingRedirect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--dynamic-accent-start)]"></div>
        <p className="text-white/50 text-sm">מאמת...</p>
      </div>
    );
  }

  // If user is logged in or chose to continue as guest, show app
  if (user || continueAsGuest) {
    return <>{children}</>;
  }

  // Show signup or login screen
  if (showSignup) {
    return (
      <SignupScreen
        onNavigateToLogin={() => setShowSignup(false)}
        onSkip={() => setContinueAsGuest(true)}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateToSignup={() => setShowSignup(true)}
      onSkip={() => setContinueAsGuest(true)}
    />
  );
};

export default ProtectedRoute;
