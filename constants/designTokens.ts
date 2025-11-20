/**
 * Design Tokens for Spark OS
 * Centralized design system values for consistency across the app
 */

// ========================================
// Spacing Scale (4px base unit)
// ========================================
export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
} as const;

// Numeric values for calculations
export const SPACING_NUM = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
} as const;

// ========================================
// Typography Scale
// ========================================
export const FONT_SIZE = {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
} as const;

export const FONT_WEIGHT = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export const LINE_HEIGHT = {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
} as const;

// ========================================
// Border Radius
// ========================================
export const BORDER_RADIUS = {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
} as const;

// ========================================
// Shadows
// ========================================
export const SHADOW = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px var(--dynamic-accent-glow)',
} as const;

// ========================================
// Z-Index Scale (Prevent z-index chaos)
// ========================================
export const Z_INDEX = {
    background: -10,
    base: 0,
    dropdown: 10,
    overlay: 20,
    modal: 30,
    popover: 40,
    toast: 50,
    tooltip: 60,
} as const;

// ========================================
// Transitions & Animations
// ========================================
export const TRANSITION = {
    fast: '150ms ease',
    base: '300ms ease',
    slow: '500ms ease',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const ANIMATION_DURATION = {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
} as const;

// ========================================
// Breakpoints (Mobile-first)
// ========================================
export const BREAKPOINT = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

// ========================================
// Opacity Scale
// ========================================
export const OPACITY = {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    80: '0.8',
    90: '0.9',
    100: '1',
} as const;

// ========================================
// Component-Specific Tokens
// ========================================

export const INPUT_HEIGHT = {
    sm: '32px',
    md: '40px',
    lg: '48px',
} as const;

export const BUTTON_PADDING = {
    sm: `${SPACING.sm} ${SPACING.lg}`,
    md: `${SPACING.md} ${SPACING.xl}`,
    lg: `${SPACING.lg} ${SPACING['2xl']}`,
} as const;

export const CARD_PADDING = {
    sm: SPACING.lg,
    md: SPACING.xl,
    lg: SPACING['2xl'],
} as const;

// ========================================
// Helper Functions
// ========================================

/**
 * Create a consistent spacing string from multiple values
 * @example spacing('lg', 'xl') => '16px 24px'
 */
export const spacing = (...values: (keyof typeof SPACING)[]) =>
    values.map(v => SPACING[v]).join(' ');

/**
 * Create a box shadow with dynamic accent color
 * @example glowShadow('md') => '0 4px 6px -1px var(--dynamic-accent-glow)'
 */
export const glowShadow = (size: keyof typeof SHADOW = 'md') =>
    SHADOW[size].replace('rgba(0, 0, 0', 'var(--dynamic-accent-glow-rgb');

/**
 * Type-safe design token access
 */
export type Spacing = keyof typeof SPACING;
export type FontSize = keyof typeof FONT_SIZE;
export type BorderRadius = keyof typeof BORDER_RADIUS;
export type Shadow = keyof typeof SHADOW;
