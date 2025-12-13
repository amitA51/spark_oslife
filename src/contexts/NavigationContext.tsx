/**
 * Navigation Context
 * 
 * Provides screen navigation functionality throughout the app
 * without prop drilling `setActiveScreen`.
 * 
 * Usage:
 * ```tsx
 * import { useNavigation } from './NavigationContext';
 * 
 * const MyComponent = () => {
 *   const { navigate, activeScreen, goBack } = useNavigation();
 *   return <button onClick={() => navigate('settings')}>Settings</button>;
 * };
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Screen } from '../../types';

// ==================================================================================
// Types
// ==================================================================================

interface NavigationContextValue {
    /** Current active screen */
    activeScreen: Screen;
    /** Previous screen (for back navigation) */
    previousScreen: Screen | null;
    /** Navigate to a specific screen */
    navigate: (screen: Screen) => void;
    /** Navigate to a screen with defaults stored in sessionStorage */
    navigateWithDefaults: (screen: Screen, defaults?: Record<string, unknown>) => void;
    /** Go back to previous screen */
    goBack: () => void;
    /** Check if can go back */
    canGoBack: boolean;
    /** Navigate to add screen with pre-selected type */
    navigateToAdd: (itemType: string, defaults?: Record<string, unknown>) => void;
}

interface NavigationProviderProps {
    children: ReactNode;
    defaultScreen?: Screen;
}

// ==================================================================================
// Context
// ==================================================================================

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ==================================================================================
// Provider
// ==================================================================================

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
    children,
    defaultScreen = 'today',
}) => {
    const [activeScreen, setActiveScreen] = useState<Screen>(defaultScreen);
    const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);

    /**
     * Navigate to a screen, tracking history
     */
    const navigate = useCallback((screen: Screen) => {
        setActiveScreen(prev => {
            setPreviousScreen(prev);
            return screen;
        });
    }, []);

    /**
     * Navigate with defaults stored in sessionStorage
     */
    const navigateWithDefaults = useCallback(
        (screen: Screen, defaults?: Record<string, unknown>) => {
            if (defaults) {
                try {
                    sessionStorage.setItem('preselect_add_defaults', JSON.stringify(defaults));
                } catch {
                    console.warn('Failed to store navigation defaults');
                }
            }
            navigate(screen);
        },
        [navigate]
    );

    /**
     * Navigate to add screen with a specific item type
     */
    const navigateToAdd = useCallback(
        (itemType: string, defaults?: Record<string, unknown>) => {
            try {
                sessionStorage.setItem('preselect_add', itemType);
                if (defaults) {
                    sessionStorage.setItem('preselect_add_defaults', JSON.stringify(defaults));
                }
            } catch {
                console.warn('Failed to store add defaults');
            }
            navigate('add');
        },
        [navigate]
    );

    /**
     * Go back to previous screen
     */
    const goBack = useCallback(() => {
        if (previousScreen) {
            setActiveScreen(previousScreen);
            setPreviousScreen(null);
        }
    }, [previousScreen]);

    const canGoBack = previousScreen !== null;

    const value: NavigationContextValue = useMemo(
        () => ({
            activeScreen,
            previousScreen,
            navigate,
            navigateWithDefaults,
            goBack,
            canGoBack,
            navigateToAdd,
        }),
        [activeScreen, previousScreen, navigate, navigateWithDefaults, goBack, canGoBack, navigateToAdd]
    );

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};

// ==================================================================================
// Hook
// ==================================================================================

/**
 * Hook to access navigation functionality
 * @throws Error if used outside NavigationProvider
 */
export const useNavigation = (): NavigationContextValue => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

/**
 * Optional hook that returns null if outside provider (for gradual migration)
 */
export const useNavigationOptional = (): NavigationContextValue | null => {
    return useContext(NavigationContext);
};

export default NavigationContext;
