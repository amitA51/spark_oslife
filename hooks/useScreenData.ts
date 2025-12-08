/**
 * useScreenData Hook
 * 
 * Lazy loads data based on the active screen.
 * This improves initial load time by only fetching what's needed.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useData } from '../src/contexts/DataContext';
import type { Screen } from '../types';

// Track which data types have been loaded globally
const loadedDataTypes = new Set<string>();

// Map screens to their required data
const screenDataRequirements: Record<Screen, string[]> = {
    today: ['personalItems'],
    dashboard: ['personalItems'],
    feed: ['feedItems'],
    library: ['personalItems', 'spaces'],
    calendar: ['personalItems'],
    settings: [], // Settings loaded separately
    add: ['personalItems', 'spaces'],
    search: ['personalItems', 'feedItems'],
    assistant: ['personalItems'],
    views: ['personalItems'],
    investments: [],
    passwords: [],
    login: [],
    signup: [],
};

export const useScreenData = (activeScreen: Screen) => {
    const { loadDataType, isLoading } = useData();
    const loadedRef = useRef(new Set<string>());

    const loadScreenData = useCallback(async () => {
        const requirements = screenDataRequirements[activeScreen] || [];

        for (const dataType of requirements) {
            // Only load if not already loaded
            if (!loadedDataTypes.has(dataType) && !loadedRef.current.has(dataType)) {
                loadedRef.current.add(dataType);
                try {
                    await loadDataType(dataType);
                    loadedDataTypes.add(dataType);
                } catch (error) {
                    console.error(`Failed to load ${dataType}:`, error);
                    loadedRef.current.delete(dataType);
                }
            }
        }
    }, [activeScreen, loadDataType]);

    useEffect(() => {
        void loadScreenData();
    }, [loadScreenData]);

    return { isLoading };
};

// Preload data for commonly accessed screens
export const useDataPrefetch = (screens: Screen[], delay = 3000) => {
    const { loadDataType } = useData();

    useEffect(() => {
        const timer = setTimeout(() => {
            const allRequirements = new Set<string>();

            for (const screen of screens) {
                const requirements = screenDataRequirements[screen] || [];
                requirements.forEach(req => allRequirements.add(req));
            }

            // Load in background without blocking
            for (const dataType of allRequirements) {
                if (!loadedDataTypes.has(dataType)) {
                    loadDataType(dataType).then(() => {
                        loadedDataTypes.add(dataType);
                    }).catch(console.error);
                }
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [screens, delay, loadDataType]);
};

export default useScreenData;
