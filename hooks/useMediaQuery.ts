/**
 * useMediaQuery Hook
 * 
 * Reactive media query matching for responsive components.
 */

import { useState, useEffect } from 'react';

/**
 * Common breakpoints matching Tailwind defaults
 */
export const breakpoints = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)',
    mobile: '(max-width: 639px)',
    tablet: '(min-width: 640px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    dark: '(prefers-color-scheme: dark)',
    light: '(prefers-color-scheme: light)',
    reducedMotion: '(prefers-reduced-motion: reduce)',
    portrait: '(orientation: portrait)',
    landscape: '(orientation: landscape)',
} as const;

/**
 * Hook for matching media queries reactively
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 639px)');
 * const isDesktop = useMediaQuery(breakpoints.desktop);
 */
export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

/**
 * Hook that returns current device type
 */
export const useDeviceType = () => {
    const isMobile = useMediaQuery(breakpoints.mobile);
    const isTablet = useMediaQuery(breakpoints.tablet);
    const isDesktop = useMediaQuery(breakpoints.desktop);

    return {
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    };
};

export default useMediaQuery;
