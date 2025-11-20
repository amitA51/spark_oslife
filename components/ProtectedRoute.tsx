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
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
        );
    }

    // If user is authenticated or in offline mode, render the app
    if (user || isOfflineMode) {
        return <>{children}</>;
    }

    // Otherwise, show login/signup screens
    if (showSignup) {
        return (
            <SignupScreen
                onNavigateToLogin={() => setShowSignup(false)}
            />
        );
    }

    return (
        <LoginScreen
            onNavigateToSignup={() => setShowSignup(true)}
            onSkip={() => setIsOfflineMode(true)}
        />
    );
};

export default ProtectedRoute;
