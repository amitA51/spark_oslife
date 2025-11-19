
import { useContext, useCallback, useRef } from 'react';
import { AppContext } from '../state/AppContext';

// Singleton AudioContext to reuse across the app
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const useSound = () => {
    const { state } = useContext(AppContext);
    const { enableSounds } = state.settings;

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) => {
        if (!enableSounds) return;
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
            
            gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + startTime);
            osc.stop(ctx.currentTime + startTime + duration);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }, [enableSounds]);

    const playClick = useCallback(() => {
        // Futuristic high-pitch blip
        if (!enableSounds) return;
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, [enableSounds]);

    const playSuccess = useCallback(() => {
        // Ascending major arpeggio "glimmer"
        if (!enableSounds) return;
        const now = 0;
        playTone(440, 'sine', 0.2, now, 0.1);       // A4
        playTone(554.37, 'sine', 0.2, now + 0.1, 0.1); // C#5
        playTone(659.25, 'sine', 0.4, now + 0.2, 0.1); // E5
    }, [enableSounds, playTone]);

    const playToggle = useCallback((isOn: boolean) => {
        if (!enableSounds) return;
        if (isOn) {
            playTone(600, 'sine', 0.1, 0, 0.05);
        } else {
            playTone(300, 'triangle', 0.1, 0, 0.05);
        }
    }, [enableSounds, playTone]);
    
    const playPop = useCallback(() => {
        // Bubble pop sound
        if (!enableSounds) return;
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, [enableSounds]);

    return { playClick, playSuccess, playToggle, playPop };
};
