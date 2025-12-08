/**
 * Enhanced Haptic Feedback Hook
 * Provides rich tactile feedback across different devices and platforms
 */

import { useCallback, useMemo } from 'react';
import { useSettings } from '../src/contexts/SettingsContext';

// Haptic intensity levels with corresponding vibration patterns
export type HapticIntensity = 'light' | 'medium' | 'heavy';

// Haptic effect types for different interactions
export type HapticEffect =
  | 'tap'           // Simple tap feedback
  | 'success'       // Task completion, positive action
  | 'error'         // Error or failed action
  | 'warning'       // Warning or caution
  | 'selection'     // Item selection change
  | 'impact'        // Physical collision feel
  | 'notification'  // Incoming notification
  | 'swipe'         // Swipe gesture feedback
  | 'longPress';    // Long press recognition

// Vibration patterns for each effect (in milliseconds)
// Format: [vibrate, pause, vibrate, pause, ...]
const VIBRATION_PATTERNS: Record<HapticEffect, number[]> = {
  tap: [15],
  success: [30, 50, 30],          // Double pulse
  error: [80, 40, 80, 40, 80],    // Triple strong pulse
  warning: [50, 100, 50],         // Double with longer pause
  selection: [10],                 // Very light
  impact: [40],                    // Medium single
  notification: [20, 80, 20, 80, 40], // Attention-grabbing pattern
  swipe: [5, 10, 5],              // Light sliding feel
  longPress: [60],                // Strong confirmation
};

// Intensity multipliers for vibration duration
const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  light: 0.6,
  medium: 1.0,
  heavy: 1.5,
};

/**
 * Check if the device supports vibration
 */
const supportsVibration = (): boolean => {
  return typeof window !== 'undefined' &&
    'navigator' in window &&
    'vibrate' in window.navigator;
};

/**
 * Check if running on iOS (different haptic system)
 */
const isIOS = (): boolean => {
  return typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Enhanced haptic feedback hook with multiple effect types and platform support
 */
export const useHaptics = () => {
  const { settings } = useSettings();
  const { hapticFeedback } = settings;

  // Check device capabilities once
  const capabilities = useMemo(() => ({
    supportsVibration: supportsVibration(),
    isIOS: isIOS(),
  }), []);

  /**
   * Apply intensity multiplier to a vibration pattern
   */
  const applyIntensity = useCallback((pattern: number[], intensity: HapticIntensity): number[] => {
    const multiplier = INTENSITY_MULTIPLIERS[intensity];
    return pattern.map((duration, index) => {
      // Only modify vibration durations (even indices), not pauses (odd indices)
      if (index % 2 === 0) {
        return Math.round(duration * multiplier);
      }
      return duration;
    });
  }, []);

  /**
   * Trigger a simple haptic with intensity
   */
  const triggerHaptic = useCallback(
    (intensity: HapticIntensity = 'light') => {
      if (!hapticFeedback || !capabilities.supportsVibration) return;

      const duration = intensity === 'light' ? 15 : intensity === 'medium' ? 30 : 50;

      try {
        window.navigator.vibrate(duration);
      } catch (e) {
        console.warn('Vibration failed:', e);
      }
    },
    [hapticFeedback, capabilities.supportsVibration]
  );

  /**
   * Trigger a specific haptic effect
   */
  const triggerEffect = useCallback(
    (effect: HapticEffect, intensity: HapticIntensity = 'medium') => {
      if (!hapticFeedback) return;

      // For iOS, we can only do simple vibrations via AudioContext workaround
      // The Taptic Engine requires native code, so we fall back to simple patterns
      if (capabilities.isIOS) {
        // iOS Safari doesn't support vibration API, so we skip silently
        return;
      }

      if (!capabilities.supportsVibration) return;

      const pattern = VIBRATION_PATTERNS[effect];
      const adjustedPattern = applyIntensity(pattern, intensity);

      try {
        window.navigator.vibrate(adjustedPattern);
      } catch (e) {
        console.warn('Haptic effect failed:', e);
      }
    },
    [hapticFeedback, capabilities, applyIntensity]
  );

  /**
   * Stop any ongoing vibration
   */
  const stopHaptic = useCallback(() => {
    if (capabilities.supportsVibration) {
      try {
        window.navigator.vibrate(0);
      } catch (e) {
        // Ignore errors when stopping
      }
    }
  }, [capabilities.supportsVibration]);

  /**
   * Convenience methods for common effects
   */
  const hapticSuccess = useCallback(() => triggerEffect('success', 'medium'), [triggerEffect]);
  const hapticError = useCallback(() => triggerEffect('error', 'heavy'), [triggerEffect]);
  const hapticWarning = useCallback(() => triggerEffect('warning', 'medium'), [triggerEffect]);
  const hapticTap = useCallback(() => triggerEffect('tap', 'light'), [triggerEffect]);
  const hapticSelection = useCallback(() => triggerEffect('selection', 'light'), [triggerEffect]);
  const hapticNotification = useCallback(() => triggerEffect('notification', 'medium'), [triggerEffect]);

  return {
    // Basic haptic
    triggerHaptic,

    // Advanced effects
    triggerEffect,
    stopHaptic,

    // Convenience methods
    hapticSuccess,
    hapticError,
    hapticWarning,
    hapticTap,
    hapticSelection,
    hapticNotification,

    // Device capabilities info
    isSupported: capabilities.supportsVibration,
    isIOS: capabilities.isIOS,
  };
};
