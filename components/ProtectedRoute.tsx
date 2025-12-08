import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges } from '../services/authService';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [continueAsGuest, setContinueAsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(currentUser => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--dynamic-accent-start)]"></div>
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
