/**
 * useReducedMotion Hook
 * 
 * Detects if the user prefers reduced motion for accessibility.
 * Respects both system preference and app setting.
 */

import { useState, useEffect } from 'react';
import { useSettings } from '../src/contexts/SettingsContext';

/**
 * Returns true if animations should be reduced based on:
 * 1. System preference (prefers-reduced-motion)
 * 2. App setting (accessibilitySettings.reduceMotion)
 */
export const useReducedMotion = (): boolean => {
    const { settings } = useSettings();
    const [systemPrefersReduced, setSystemPrefersReduced] = useState(false);

    useEffect(() => {
        // Check system preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setSystemPrefersReduced(mediaQuery.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setSystemPrefersReduced(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Return true if either system or app setting prefers reduced motion
    return systemPrefersReduced || settings.accessibilitySettings?.reduceMotion || false;
};

/**
 * Returns animation config based on reduced motion preference.
 * Use this to conditionally disable animations.
 */
export const useAnimationConfig = () => {
    const shouldReduceMotion = useReducedMotion();

    return {
        shouldReduceMotion,
        // Animation variants for framer-motion
        transition: shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.3, ease: 'easeOut' },
        // For conditionally rendering animated vs static elements
        animate: !shouldReduceMotion,
    };
};

/**
 * Accessibility-aware animation wrapper
 * Returns either animated props or static props based on preference
 */
export const useA11yAnimation = <T extends object>(
    animatedProps: T,
    staticProps: Partial<T> = {}
): T => {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return { ...animatedProps, ...staticProps } as T;
    }

    return animatedProps;
};

export default useReducedMotion;
