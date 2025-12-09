import { WorkoutTheme } from '../../types';

/**
 * Workout Theme Definitions
 * Each theme includes colors optimized for workout visibility and accessibility
 */
export const WORKOUT_THEMES: Record<string, WorkoutTheme> = {
  // === Default Theme ===
  deepCosmos: {
    id: 'deepCosmos',
    name: 'Deep Cosmos',
    colors: {
      primary: '#6366f1',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      background: '#0a0a0f',
    },
  },

  // === Energy Themes ===
  fireEnergy: {
    id: 'fireEnergy',
    name: 'Fire Energy',
    colors: {
      primary: '#f97316',
      secondary: '#dc2626',
      accent: '#fbbf24',
      background: '#1a0f0a',
    },
  },

  neonPulse: {
    id: 'neonPulse',
    name: 'Neon Pulse',
    colors: {
      primary: '#00ff88',
      secondary: '#00d4ff',
      accent: '#ff00ff',
      background: '#0a0a0a',
    },
  },

  // === Nature Themes ===
  natureFocus: {
    id: 'natureFocus',
    name: 'Nature Focus',
    colors: {
      primary: '#10b981',
      secondary: '#14b8a6',
      accent: '#06b6d4',
      background: '#0a1f1a',
    },
  },

  oceanDepth: {
    id: 'oceanDepth',
    name: 'Ocean Depth',
    colors: {
      primary: '#0ea5e9',
      secondary: '#3b82f6',
      accent: '#22d3ee',
      background: '#0a1929',
    },
  },

  // === Dark Themes ===
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#c084fc',
      background: '#000000',
    },
  },

  sunsetGlow: {
    id: 'sunsetGlow',
    name: 'Sunset Glow',
    colors: {
      primary: '#f472b6',
      secondary: '#ec4899',
      accent: '#fb7185',
      background: '#1a0f1a',
    },
  },

  // === Light Theme (Accessibility Optimized) ===
  pureLight: {
    id: 'pureLight',
    name: 'Pure Light',
    colors: {
      primary: '#4f46e5', // Darker indigo for better contrast (WCAG AA)
      secondary: '#2563eb', // Blue with 4.5:1 contrast ratio
      accent: '#7c3aed', // Purple with good contrast
      background: '#f8fafc', // Slightly off-white for reduced eye strain
    },
  },
};

/**
 * Get CSS variables for a theme
 * Includes accessibility considerations for light themes
 */
export const getThemeVariables = (themeId: string): Record<string, string> => {
  const theme = WORKOUT_THEMES[themeId] ?? WORKOUT_THEMES['deepCosmos']!;
  const isLight = themeId === 'pureLight';
  const isOLED = themeId === 'midnight';

  // Safe access with fallbacks
  const deepCosmosColors = WORKOUT_THEMES['deepCosmos']!.colors;
  const colors = theme?.colors ?? deepCosmosColors;

  return {
    // Background
    '--cosmos-bg-primary': colors.background,
    '--cosmos-bg-secondary': isLight ? '#f1f5f9' : isOLED ? '#0a0a0a' : 'rgba(15, 23, 42, 0.8)',

    // Accent colors
    '--cosmos-accent-primary': colors.primary,
    '--cosmos-accent-secondary': colors.secondary,
    '--cosmos-accent-cyan': colors.accent,

    // Text colors (WCAG AA compliant)
    '--cosmos-text-primary': isLight ? '#0f172a' : '#f8fafc',
    '--cosmos-text-secondary': isLight ? '#334155' : '#cbd5e1',
    '--cosmos-text-muted': isLight ? '#64748b' : '#94a3b8',

    // Glass effects
    '--cosmos-glass-bg': isLight
      ? 'rgba(255, 255, 255, 0.9)'
      : isOLED
        ? 'rgba(10, 10, 10, 0.95)'
        : 'rgba(15, 23, 42, 0.6)',
    '--cosmos-glass-border': isLight
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.1)',

    // Card backgrounds
    '--cosmos-card-bg': isLight
      ? '#ffffff'
      : isOLED
        ? '#0a0a0a'
        : 'rgba(30, 41, 59, 0.5)',

    // Shadows
    '--cosmos-shadow': isLight
      ? '0 4px 20px rgba(0, 0, 0, 0.08)'
      : `0 4px 30px ${colors.primary}20`,

    // Focus ring (accessibility)
    '--cosmos-focus-ring': isLight
      ? `0 0 0 3px ${colors.primary}40`
      : `0 0 0 3px ${colors.primary}60`,
  };
};

/**
 * Get theme by ID with safe fallback
 */
export const getTheme = (themeId: string): WorkoutTheme => {
  return WORKOUT_THEMES[themeId] ?? WORKOUT_THEMES['deepCosmos']!;
};

/**
 * Get all available theme IDs
 */
export const getThemeIds = (): string[] => {
  return Object.keys(WORKOUT_THEMES);
};

/**
 * Check if a theme is light mode
 */
export const isLightTheme = (themeId: string): boolean => {
  return themeId === 'pureLight';
};
