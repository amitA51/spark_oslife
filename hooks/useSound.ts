/**
 * Enhanced Sound Effects Hook
 * Provides a comprehensive library of UI sounds using Web Audio API
 * Features: Multiple sound types, volume control, presets, spatial audio
 */

import { useCallback, useRef, useMemo } from 'react';
import { useSettings } from '../src/contexts/SettingsContext';

// Types
export type SoundPreset =
  | 'minimal'    // Very subtle sounds
  | 'modern'     // Default, balanced
  | 'playful'    // Game-like sounds
  | 'retro';     // 8-bit style

export interface SoundOptions {
  volume?: number;      // 0-1
  pitch?: number;       // Multiplier (0.5 = half, 2 = double)
  pan?: number;         // -1 (left) to 1 (right)
  delay?: number;       // Start delay in seconds
}

// Singleton AudioContext
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Sound configurations for different presets
const PRESETS: Record<SoundPreset, { volumeMultiplier: number; pitchMultiplier: number }> = {
  minimal: { volumeMultiplier: 0.3, pitchMultiplier: 1.2 },
  modern: { volumeMultiplier: 0.5, pitchMultiplier: 1.0 },
  playful: { volumeMultiplier: 0.7, pitchMultiplier: 0.9 },
  retro: { volumeMultiplier: 0.6, pitchMultiplier: 0.8 },
};

export const useSound = (preset: SoundPreset = 'modern') => {
  const { settings } = useSettings();
  const { enableSounds } = settings;

  // Track active oscillators for cleanup
  const activeNodesRef = useRef<Set<OscillatorNode>>(new Set());

  // Get preset configuration
  const presetConfig = useMemo(() => PRESETS[preset], [preset]);

  /**
   * Create a gain node with optional stereo panning
   */
  const createAudioChain = useCallback((
    ctx: AudioContext,
    volume: number,
    pan: number = 0
  ): { input: GainNode; output: AudioNode } => {
    const gain = ctx.createGain();
    gain.gain.value = volume * presetConfig.volumeMultiplier;

    if (pan !== 0) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      panner.connect(ctx.destination);
      return { input: gain, output: panner };
    }

    gain.connect(ctx.destination);
    return { input: gain, output: gain };
  }, [presetConfig.volumeMultiplier]);

  /**
   * Play a custom tone
   */
  const playTone = useCallback((
    freq: number,
    type: OscillatorType,
    duration: number,
    startTime: number = 0,
    vol: number = 0.1,
    options: SoundOptions = {}
  ) => {
    if (!enableSounds) return;

    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const { input } = createAudioChain(ctx, vol * (options.volume ?? 1), options.pan);

      const adjustedFreq = freq * presetConfig.pitchMultiplier * (options.pitch ?? 1);

      osc.type = type;
      osc.frequency.setValueAtTime(adjustedFreq, ctx.currentTime + startTime);

      input.gain.setValueAtTime(vol, ctx.currentTime + startTime);
      input.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

      osc.connect(input);
      activeNodesRef.current.add(osc);

      osc.start(ctx.currentTime + startTime + (options.delay ?? 0));
      osc.stop(ctx.currentTime + startTime + duration + (options.delay ?? 0));

      osc.onended = () => {
        activeNodesRef.current.delete(osc);
      };
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, [enableSounds, createAudioChain, presetConfig.pitchMultiplier]);

  // ==========================================================================
  // UI Interaction Sounds
  // ==========================================================================

  const playClick = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const { input } = createAudioChain(ctx, 0.05, options?.pan);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 * presetConfig.pitchMultiplier, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400 * presetConfig.pitchMultiplier, ctx.currentTime + 0.1);

    input.gain.setValueAtTime(0.05 * (options?.volume ?? 1), ctx.currentTime);
    input.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(input);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [enableSounds, createAudioChain, presetConfig.pitchMultiplier]);

  const playPop = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const { input } = createAudioChain(ctx, 0.1, options?.pan);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 * presetConfig.pitchMultiplier, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600 * presetConfig.pitchMultiplier, ctx.currentTime + 0.1);

    input.gain.setValueAtTime(0.1 * (options?.volume ?? 1), ctx.currentTime);
    input.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(input);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [enableSounds, createAudioChain, presetConfig.pitchMultiplier]);

  const playToggle = useCallback((isOn: boolean, options?: SoundOptions) => {
    if (!enableSounds) return;
    if (isOn) {
      playTone(600, 'sine', 0.1, 0, 0.05, options);
    } else {
      playTone(300, 'triangle', 0.1, 0, 0.05, options);
    }
  }, [enableSounds, playTone]);

  // ==========================================================================
  // Feedback Sounds
  // ==========================================================================

  const playSuccess = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Ascending major arpeggio
    playTone(440, 'sine', 0.2, 0, 0.1, options);       // A4
    playTone(554.37, 'sine', 0.2, 0.1, 0.1, options);  // C#5
    playTone(659.25, 'sine', 0.4, 0.2, 0.1, options);  // E5
  }, [enableSounds, playTone]);

  const playError = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Descending minor - sounds "wrong"
    playTone(440, 'sawtooth', 0.15, 0, 0.08, options);
    playTone(349.23, 'sawtooth', 0.15, 0.1, 0.08, options);
    playTone(293.66, 'sawtooth', 0.3, 0.2, 0.08, options);
  }, [enableSounds, playTone]);

  const playWarning = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Two-tone alert
    playTone(880, 'triangle', 0.15, 0, 0.06, options);
    playTone(660, 'triangle', 0.15, 0.15, 0.06, options);
    playTone(880, 'triangle', 0.15, 0.3, 0.06, options);
  }, [enableSounds, playTone]);

  const playNotification = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Gentle chime
    playTone(523.25, 'sine', 0.3, 0, 0.08, options);    // C5
    playTone(659.25, 'sine', 0.3, 0.15, 0.08, options); // E5
    playTone(783.99, 'sine', 0.5, 0.3, 0.08, options);  // G5
  }, [enableSounds, playTone]);

  // ==========================================================================
  // Task & Progress Sounds
  // ==========================================================================

  const playComplete = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Triumphant fanfare
    playTone(523.25, 'sine', 0.15, 0, 0.1, options);     // C5
    playTone(659.25, 'sine', 0.15, 0.1, 0.1, options);   // E5
    playTone(783.99, 'sine', 0.15, 0.2, 0.1, options);   // G5
    playTone(1046.5, 'sine', 0.5, 0.3, 0.12, options);   // C6
  }, [enableSounds, playTone]);

  const playLevelUp = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Ascending scale with sparkle
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    notes.forEach((freq, i) => {
      playTone(freq, 'sine', 0.1, i * 0.05, 0.08, options);
    });
    // Final sparkle
    playTone(1046.5, 'sine', 0.5, 0.45, 0.1, options);
  }, [enableSounds, playTone]);

  const playStreak = useCallback((count: number, options?: SoundOptions) => {
    if (!enableSounds) return;
    // Rising pitch based on streak count
    const baseFreq = 400 + (count * 50);
    playTone(baseFreq, 'sine', 0.15, 0, 0.08, options);
    playTone(baseFreq * 1.25, 'sine', 0.15, 0.08, 0.08, options);
    playTone(baseFreq * 1.5, 'sine', 0.25, 0.16, 0.1, options);
  }, [enableSounds, playTone]);

  // ==========================================================================
  // Navigation Sounds
  // ==========================================================================

  const playSwipe = useCallback((direction: 'left' | 'right', options?: SoundOptions) => {
    if (!enableSounds) return;
    const pan = direction === 'left' ? -0.5 : 0.5;
    const startFreq = direction === 'left' ? 600 : 400;
    const endFreq = direction === 'left' ? 400 : 600;

    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const { input } = createAudioChain(ctx, 0.05, pan);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.15);

    input.gain.setValueAtTime(0.05, ctx.currentTime);
    input.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(input);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, [enableSounds, createAudioChain]);

  const playOpen = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Expanding "whoosh"
    playTone(200, 'sine', 0.2, 0, 0.05, options);
    playTone(400, 'sine', 0.15, 0.05, 0.05, options);
  }, [enableSounds, playTone]);

  const playClose = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Contracting "whoosh"
    playTone(400, 'sine', 0.15, 0, 0.05, options);
    playTone(200, 'sine', 0.2, 0.05, 0.05, options);
  }, [enableSounds, playTone]);

  // ==========================================================================
  // Timer Sounds
  // ==========================================================================

  const playTick = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    playTone(1000, 'sine', 0.03, 0, 0.02, options);
  }, [enableSounds, playTone]);

  const playTimerEnd = useCallback((options?: SoundOptions) => {
    if (!enableSounds) return;
    // Alarm-like sound
    for (let i = 0; i < 3; i++) {
      playTone(880, 'square', 0.15, i * 0.3, 0.06, options);
      playTone(698.46, 'square', 0.15, i * 0.3 + 0.15, 0.06, options);
    }
  }, [enableSounds, playTone]);

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  const stopAll = useCallback(() => {
    activeNodesRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
    });
    activeNodesRef.current.clear();
  }, []);

  const setMasterVolume = useCallback((_volume: number) => {
    // Master volume control requires a gain node architecture refactor
    // Currently volume is handled per-sound via the preset multipliers
  }, []);

  return {
    // Core
    playTone,
    stopAll,
    setMasterVolume,

    // UI Interactions
    playClick,
    playPop,
    playToggle,

    // Feedback
    playSuccess,
    playError,
    playWarning,
    playNotification,

    // Progress
    playComplete,
    playLevelUp,
    playStreak,

    // Navigation
    playSwipe,
    playOpen,
    playClose,

    // Timer
    playTick,
    playTimerEnd,

    // State
    isEnabled: enableSounds,
    preset,
  };
};

export default useSound;
