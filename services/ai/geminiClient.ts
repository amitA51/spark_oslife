/**
 * Gemini AI Client Module
 * 
 * Core initialization and utility functions for the Gemini AI service.
 * 
 * @module geminiClient
 * @version 2.0.0 - Enhanced with health check and error handling
 */

import { GoogleGenAI } from '@google/genai';

// SECURITY: Use Vite's import.meta.env for client-side environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// DEBUG: Log API key status at startup (only in development)
if (import.meta.env.DEV) {
    console.log('[GeminiService] API Key loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('[GeminiService] All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

// Singleton AI client instance
export let ai: GoogleGenAI | null = null;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    if (import.meta.env.DEV) {
        console.log('[GeminiService] GoogleGenAI initialized successfully');
    }
} else {
    console.warn(
        'VITE_GEMINI_API_KEY is not set. AI features will be disabled. ' +
        'Add it to your .env.local file.'
    );
}

/**
 * Checks if AI service is available (API key is configured).
 * Use this to conditionally show AI features in the UI.
 */
export const isAiAvailable = (): boolean => {
    return ai !== null;
};

// ============================================================================
// Health Check
// ============================================================================

export interface AIHealthStatus {
    available: boolean;
    apiKeyConfigured: boolean;
    lastCheck: string;
    status: 'healthy' | 'degraded' | 'unavailable';
    message: string;
}

/**
 * Performs a lightweight health check on the AI service.
 * Does NOT make an API call - just checks configuration.
 * Use checkAIConnectivity() for a full connectivity test.
 */
export const getAIHealthStatus = (): AIHealthStatus => {
    const apiKeyConfigured = !!API_KEY;
    const available = ai !== null;

    let status: AIHealthStatus['status'] = 'unavailable';
    let message = 'AI service not configured';

    if (available) {
        status = 'healthy';
        message = 'AI service ready';
    } else if (apiKeyConfigured) {
        status = 'degraded';
        message = 'API key configured but client initialization failed';
    }

    return {
        available,
        apiKeyConfigured,
        lastCheck: new Date().toISOString(),
        status,
        message,
    };
};

/**
 * Performs a full connectivity test to the AI service.
 * Makes a minimal API call to verify the connection works.
 * Use sparingly as it consumes API quota.
 */
export const checkAIConnectivity = async (): Promise<AIHealthStatus> => {
    const baseStatus = getAIHealthStatus();

    if (!ai || !baseStatus.available) {
        return baseStatus;
    }

    try {
        // Minimal API call to test connectivity
        await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: 'Hi',
            config: {
                maxOutputTokens: 1,
            },
        });

        return {
            ...baseStatus,
            status: 'healthy',
            message: 'AI service connected and responding',
            lastCheck: new Date().toISOString(),
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            ...baseStatus,
            status: 'degraded',
            message: `Connectivity test failed: ${errorMessage}`,
            lastCheck: new Date().toISOString(),
        };
    }
};

// ============================================================================
// Error Handling
// ============================================================================

export interface AIErrorInfo {
    code: string;
    message: string;
    messageHebrew: string;
    isRetryable: boolean;
}

/**
 * Parses an AI error and returns user-friendly information.
 */
export const parseAIError = (error: unknown): AIErrorInfo => {
    const errorObj = error as { status?: number; message?: string; code?: string };
    const status = errorObj?.status;
    const message = errorObj?.message || 'Unknown error';

    // Rate limit error
    if (status === 429 || message.includes('429') || message.toLowerCase().includes('rate')) {
        return {
            code: 'RATE_LIMIT',
            message: 'Too many requests',
            messageHebrew: 'יותר מדי בקשות. נסה שוב בעוד מספר שניות.',
            isRetryable: true,
        };
    }

    // Authentication error
    if (status === 401 || status === 403) {
        return {
            code: 'AUTH_ERROR',
            message: 'Authentication failed',
            messageHebrew: 'שגיאת אימות. בדוק את מפתח ה-API.',
            isRetryable: false,
        };
    }

    // Server error
    if (status && status >= 500) {
        return {
            code: 'SERVER_ERROR',
            message: 'Server error',
            messageHebrew: 'שגיאת שרת זמנית. נסה שוב בעוד מספר דקות.',
            isRetryable: true,
        };
    }

    // Circuit breaker
    if (message.includes('CIRCUIT_OPEN')) {
        return {
            code: 'CIRCUIT_OPEN',
            message: 'Service temporarily unavailable',
            messageHebrew: 'שירות ה-AI זמנית לא זמין. נסה שוב בעוד 30 שניות.',
            isRetryable: true,
        };
    }

    // Generic error
    return {
        code: 'UNKNOWN',
        message,
        messageHebrew: 'שגיאה לא צפויה. נסה שוב.',
        isRetryable: true,
    };
};

// ============================================================================
// JSON Parsing
// ============================================================================

/**
 * A robust utility to parse potentially malformed JSON from an AI response.
 * @param responseText The raw text response from the AI model.
 * @returns The parsed JSON object.
 * @throws {Error} if the JSON is unparseable.
 */
export const parseAiJson = <T>(responseText: string): T => {
    const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    try {
        return JSON.parse(cleanedText);
    } catch (parseError) {
        console.error('AI response was not valid JSON:', cleanedText, parseError);
        throw new Error('תגובת ה-AI לא הייתה בפורמט JSON תקין.');
    }
};

/**
 * Gets the current AI model setting from user preferences.
 */
export { loadSettings } from '../settingsService';
