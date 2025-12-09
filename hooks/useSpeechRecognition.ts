/**
 * useSpeechRecognition Hook
 * 
 * Centralized hook for Web Speech API handling.
 * Replaces duplicated speech recognition logic in VoiceInputModal and QuickAddTask.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ERRORS } from '../utils/errorMessages';

// --- Type Definitions ---
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    readonly [index: number]: { readonly transcript: string; readonly confidence: number };
}

interface SpeechRecognitionResultList {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

// Re-export for backward compatibility
export const SPEECH_ERRORS = ERRORS.SPEECH;

// --- Hook Options ---
export interface UseSpeechRecognitionOptions {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onEnd?: (finalTranscript: string) => void;
    onError?: (errorMessage: string) => void;
}

export interface UseSpeechRecognitionReturn {
    isListening: boolean;
    isSupported: boolean;
    transcript: string;
    finalTranscript: string;
    error: string | null;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

// --- Hook Implementation ---
export const useSpeechRecognition = (
    options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
    const {
        lang = 'he-IL',
        continuous = false,
        interimResults = true,
        onTranscript,
        onEnd,
        onError,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef('');

    // Check for browser support
    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setIsSupported(false);
        }
    }, []);

    const getErrorMessage = useCallback((errorCode: string): string => {
        switch (errorCode) {
            case 'no-speech':
            case 'audio-capture':
                return SPEECH_ERRORS.NO_SPEECH;
            case 'not-allowed':
                return SPEECH_ERRORS.NOT_ALLOWED;
            case 'network':
                return SPEECH_ERRORS.NETWORK;
            default:
                return SPEECH_ERRORS.GENERIC;
        }
    }, []);

    const start = useCallback(async () => {
        if (!isSupported) {
            setError(SPEECH_ERRORS.UNSUPPORTED);
            onError?.(SPEECH_ERRORS.UNSUPPORTED);
            return;
        }

        if (isListening) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return;

        // Request microphone permission explicitly for PWA/Mobile support
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Close the stream immediately - we just needed to trigger the permission
            stream.getTracks().forEach(track => track.stop());
        } catch (permissionError) {
            console.error('Microphone permission denied:', permissionError);
            const errorMessage = SPEECH_ERRORS.NOT_ALLOWED;
            setError(errorMessage);
            onError?.(errorMessage);
            return;
        }

        try {
            const recognition = new SpeechRecognitionAPI();
            recognition.lang = lang;
            recognition.continuous = continuous;
            recognition.interimResults = interimResults;

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
                setFinalTranscript('');
                finalTranscriptRef.current = '';
                setError(null);
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const result = event.results[i];
                    const text = result?.[0]?.transcript ?? '';

                    if (result?.isFinal) {
                        final += text;
                    } else {
                        interim += text;
                    }
                }

                setTranscript(interim);

                if (final) {
                    const newFinalTranscript = finalTranscriptRef.current + final;
                    finalTranscriptRef.current = newFinalTranscript;
                    setFinalTranscript(newFinalTranscript);
                    onTranscript?.(final, true);
                } else if (interim) {
                    onTranscript?.(interim, false);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                const errorMessage = getErrorMessage(event.error);
                setError(errorMessage);
                setIsListening(false);
                onError?.(errorMessage);
            };

            recognition.onend = () => {
                setIsListening(false);
                const result = finalTranscriptRef.current || transcript;
                if (result.trim()) {
                    onEnd?.(result.trim());
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (e) {
            console.error('Could not start recognition:', e);
            setError(SPEECH_ERRORS.GENERIC);
            onError?.(SPEECH_ERRORS.GENERIC);
        }
    }, [isSupported, isListening, lang, continuous, interimResults, onTranscript, onEnd, onError, getErrorMessage, transcript]);

    const stop = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const reset = useCallback(() => {
        stop();
        setTranscript('');
        setFinalTranscript('');
        finalTranscriptRef.current = '';
        setError(null);
        setIsListening(false);
    }, [stop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignore abort errors
                }
            }
        };
    }, []);

    return {
        isListening,
        isSupported,
        transcript,
        finalTranscript,
        error,
        start,
        stop,
        reset,
    };
};

export default useSpeechRecognition;
