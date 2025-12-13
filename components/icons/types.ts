/**
 * Icon Components - Types and Utilities
 * 
 * Shared types and helper functions for icon components.
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface IconProps {
    className?: string;
    filled?: boolean;
    strokeWidth?: number;
    style?: React.CSSProperties;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generates a hash value from a string for consistent color generation.
 */
export const stringToHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    return hash;
};

/**
 * Generates consistent tag colors based on the tag name.
 */
export const getTagColor = (tagName: string): { backgroundColor: string; textColor: string } => {
    const hue = Math.abs(stringToHash(tagName)) % 360;
    return {
        backgroundColor: `hsla(${hue}, 70%, 20%, 0.5)`,
        textColor: `hsl(${hue}, 90%, 85%)`,
    };
};
