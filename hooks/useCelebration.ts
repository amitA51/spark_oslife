import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useHaptics } from './useHaptics';
import { useSound } from './useSound';

type CelebrationIntensity = 'light' | 'medium' | 'heavy';
type CelebrationType = 'default' | 'streak' | 'levelUp' | 'achievement' | 'workout';

interface CelebrationOptions {
  colors?: string[];
  disableHaptics?: boolean;
  disableSound?: boolean;
  /** Streak count for streak celebrations */
  streakCount?: number;
  /** Type of celebration for specialized effects */
  type?: CelebrationType;
}

/**
 * useCelebration Hook - Enhanced with new haptic and sound effects
 * 
 * Provides celebratory confetti animations with haptic feedback and sound.
 * Now uses enhanced haptic effects (hapticSuccess, triggerEffect) and 
 * enhanced sounds (playComplete, playLevelUp, playStreak).
 */
export const useCelebration = () => {
  // Use enhanced haptics with new effects
  const {
    triggerHaptic,
    hapticSuccess,
    triggerEffect
  } = useHaptics();

  // Use enhanced sound with new effects
  const {
    playSuccess,
    playComplete,
    playLevelUp,
    playStreak,
    playNotification,
  } = useSound();

  /**
   * Get sound and haptic effects based on celebration type
   */
  const getEffects = useCallback((
    type: CelebrationType,
    intensity: CelebrationIntensity,
    streakCount?: number
  ) => {
    switch (type) {
      case 'streak':
        return {
          sound: () => playStreak(streakCount || 1),
          haptic: () => triggerEffect('success', intensity),
        };
      case 'levelUp':
        return {
          sound: () => playLevelUp(),
          haptic: () => triggerEffect('notification', 'heavy'),
        };
      case 'achievement':
        return {
          sound: () => playComplete(),
          haptic: () => triggerEffect('success', 'heavy'),
        };
      case 'workout':
        return {
          sound: () => playComplete(),
          haptic: () => triggerEffect('impact', 'heavy'),
        };
      default:
        return {
          sound: () => playSuccess(),
          haptic: () => hapticSuccess(),
        };
    }
  }, [playStreak, playLevelUp, playComplete, playSuccess, triggerEffect, hapticSuccess]);

  const celebrate = useCallback((
    intensity: CelebrationIntensity = 'medium',
    options: CelebrationOptions = {}
  ) => {
    const {
      colors = ['#00F0FF', '#7B61FF', '#FF006E', '#FFB800'],
      disableHaptics = false,
      disableSound = false,
      type = 'default',
      streakCount,
    } = options;

    // Configuration based on intensity
    const configs: Record<CelebrationIntensity, confetti.Options> = {
      light: {
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        startVelocity: 20,
        gravity: 1.2,
        ticks: 100,
        scalar: 0.8,
      },
      medium: {
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 30,
        gravity: 1,
        ticks: 150,
        scalar: 1,
      },
      heavy: {
        particleCount: 150,
        spread: 180,
        origin: { y: 0.5 },
        startVelocity: 45,
        gravity: 0.8,
        ticks: 200,
        scalar: 1.2,
      },
    };

    // Get type-specific effects
    const effects = getEffects(type, intensity, streakCount);

    // Trigger haptic feedback using enhanced effects
    if (!disableHaptics) {
      effects.haptic();
    }

    // Play sound using enhanced sounds
    if (!disableSound) {
      effects.sound();
    }

    // Fire confetti
    confetti({
      ...configs[intensity],
      colors,
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }, [getEffects]);

  /**
   * Streak celebration with escalating effects
   */
  const celebrateStreak = useCallback((
    streakCount: number,
    options: Omit<CelebrationOptions, 'type' | 'streakCount'> = {}
  ) => {
    // Intensity increases with streak
    const intensity: CelebrationIntensity =
      streakCount >= 7 ? 'heavy' :
        streakCount >= 3 ? 'medium' : 'light';

    celebrate(intensity, {
      ...options,
      type: 'streak',
      streakCount,
      // Golden colors for streaks
      colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFB800'],
    });
  }, [celebrate]);

  /**
   * Level up celebration
   */
  const celebrateLevelUp = useCallback((
    options: Omit<CelebrationOptions, 'type'> = {}
  ) => {
    celebrate('heavy', {
      ...options,
      type: 'levelUp',
      // Purple/gold for level up
      colors: ['#7B61FF', '#FFD700', '#00F0FF', '#FF006E'],
    });
  }, [celebrate]);

  /**
   * Achievement unlocked celebration
   */
  const celebrateAchievement = useCallback((
    options: Omit<CelebrationOptions, 'type'> = {}
  ) => {
    celebrate('heavy', {
      ...options,
      type: 'achievement',
      // Gold/silver for achievements
      colors: ['#FFD700', '#C0C0C0', '#FFB800', '#E5E5E5'],
    });
  }, [celebrate]);

  /**
   * Workout completion celebration
   */
  const celebrateWorkout = useCallback((
    options: Omit<CelebrationOptions, 'type'> = {}
  ) => {
    celebrate('heavy', {
      ...options,
      type: 'workout',
      // Energetic colors for workout
      colors: ['#00F0FF', '#FF006E', '#7B61FF', '#39FF14'],
    });
  }, [celebrate]);

  /**
   * Burst confetti from a specific element
   */
  const celebrateFromElement = useCallback((
    element: HTMLElement,
    intensity: CelebrationIntensity = 'medium',
    options: CelebrationOptions = {}
  ) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    const {
      colors = ['#00F0FF', '#7B61FF', '#FF006E', '#FFB800'],
      disableHaptics = false,
      disableSound = false,
      type = 'default',
      streakCount,
    } = options;

    const effects = getEffects(type, intensity, streakCount);

    if (!disableHaptics) {
      effects.haptic();
    }

    if (!disableSound) {
      effects.sound();
    }

    const particleCounts: Record<CelebrationIntensity, number> = {
      light: 20,
      medium: 50,
      heavy: 100,
    };

    confetti({
      particleCount: particleCounts[intensity],
      spread: 60,
      origin: { x, y },
      colors,
      startVelocity: 25,
      gravity: 1.2,
      scalar: 0.9,
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }, [getEffects]);

  /**
   * Cannon effect - fires from both sides
   */
  const celebrateCannon = useCallback((options: CelebrationOptions = {}) => {
    const {
      colors = ['#00F0FF', '#7B61FF', '#FF006E', '#FFB800'],
      disableHaptics = false,
      disableSound = false,
    } = options;

    if (!disableHaptics) {
      triggerEffect('impact', 'heavy');
    }

    if (!disableSound) {
      playComplete();
    }

    const end = Date.now() + 500;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        disableForReducedMotion: true,
        zIndex: 9999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        disableForReducedMotion: true,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [triggerEffect, playComplete]);

  /**
   * Fireworks effect for major achievements
   */
  const celebrateFireworks = useCallback((options: CelebrationOptions = {}) => {
    const {
      colors = ['#00F0FF', '#7B61FF', '#FF006E', '#FFB800'],
      disableHaptics = false,
      disableSound = false,
    } = options;

    if (!disableHaptics) {
      triggerEffect('notification', 'heavy');
    }

    if (!disableSound) {
      playLevelUp();
    }

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors,
        disableForReducedMotion: true,
      });
    }, 250);
  }, [triggerEffect, playLevelUp]);

  return {
    // Basic celebrations
    celebrate,
    celebrateFromElement,
    celebrateCannon,
    celebrateFireworks,
    // New type-specific celebrations
    celebrateStreak,
    celebrateLevelUp,
    celebrateAchievement,
    celebrateWorkout,
  };
};

export default useCelebration;