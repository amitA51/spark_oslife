import { useEffect } from 'react';
import { ThemeSettings, UiDensity, AnimationIntensity } from '../types';
import { generatePalette } from '../services/styleUtils';

interface UseThemeEffectProps {
  themeSettings: ThemeSettings;
  uiDensity: UiDensity;
  animationIntensity: AnimationIntensity;
  fontSizeScale: number;
}

export const useThemeEffect = ({
  themeSettings,
  uiDensity,
  animationIntensity,
  fontSizeScale,
}: UseThemeEffectProps) => {
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;

    // Apply dynamic colors from theme preset
    // Always use the accentColor from themeSettings to ensure consistency
    const palette = generatePalette(themeSettings.name as any, themeSettings.accentColor);
    for (const [key, value] of Object.entries(palette)) {
      root.style.setProperty(key, value);
    }

    // Apply font class
    body.classList.remove(
      'font-inter',
      'font-lato',
      'font-source-code-pro',
      'font-heebo',
      'font-rubik',
      'font-alef',
      'font-poppins',
      'font-marcelo'
    );
    body.classList.add(`font-${themeSettings.font.replace(/_/g, '-')}`);

    // Apply card style class
    body.classList.remove('card-style-glass', 'card-style-flat', 'card-style-bordered');
    body.classList.add(`card-style-${themeSettings.cardStyle}`);

    // Apply UI density with classes
    body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    body.classList.add(`density-${uiDensity}`);

    // Apply Animation Intensity with classes
    body.classList.remove('animations-off', 'animations-subtle', 'animations-default', 'animations-full');
    body.classList.add(`animations-${animationIntensity}`);

    // Apply Font Size Scale
    root.style.setProperty('--font-scale', fontSizeScale.toString());

    // Apply Border Radius
    const radiusMap: Record<string, string> = {
      none: '0px',
      sm: '0.375rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
    };
    const currentRadius = themeSettings.borderRadius || 'lg';
    root.style.setProperty('--radius-card', radiusMap[currentRadius] || '1rem');

    // We also need to update the style tag for utility classes if we want them to match
    const styleId = 'dynamic-theme-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
            :root { --radius-card: ${radiusMap[currentRadius]}; }
            .themed-card, .glass-input, .rounded-2xl, .rounded-xl { border-radius: var(--radius-card) !important; }
        `;

    // Apply Background Image
    if (themeSettings.backgroundImage) {
      root.style.setProperty('--bg-image', `url(${themeSettings.backgroundImage})`);
      root.style.setProperty('--bg-overlay-opacity', '0.85');
    } else {
      root.style.removeProperty('--bg-image');
      root.style.setProperty('--bg-overlay-opacity', '1');
    }

    // Apply Font Weight
    const weightMap: Record<string, string> = {
      normal: '400',
      medium: '500',
      bold: '700',
    };
    root.style.setProperty(
      '--font-weight-base',
      weightMap[themeSettings.fontWeight || 'normal'] || '400'
    );

    // Apply UI Scale
    if (themeSettings.uiScale) {
      root.style.setProperty('--ui-scale', themeSettings.uiScale.toString());
      // Adjust base font size for zoom effect
      const baseSize = 16 * themeSettings.uiScale;
      document.documentElement.style.fontSize = `${baseSize}px`;
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [themeSettings, uiDensity, animationIntensity, fontSizeScale]);
};
