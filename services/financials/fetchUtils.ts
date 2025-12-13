/**
 * Financial Services - Fetch Utilities
 * 
 * HTTP fetching with retry logic and Alpha Vantage API wrapper.
 */

import {
    ALPHA_VANTAGE_BASE_URL,
    ERROR_MESSAGES,
} from './config';
import {
    getAvailableApiKey,
    recordApiKeyUsage,
    markKeyAsExhausted,
} from './apiKeyRotation';

/**
 * Fetches a URL with automatic retry on failure.
 */
export async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    maxRetries = 3
): Promise<Response> {
    // let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }

            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`${ERROR_MESSAGES.API_ERROR} (${response.status})`);
            }

            // lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            // lastError = error instanceof Error ? error : new Error(String(error));

            // Wait before retry with exponential backoff
            if (attempt < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
}

/**
 * Fetches and parses JSON data.
 */
export async function fetchData<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetchWithRetry(url, options);
    return response.json() as Promise<T>;
}

/**
 * Fetches data from Alpha Vantage with automatic API key rotation.
 */
export async function fetchAlphaVantage<T = unknown>(params: Record<string, string>): Promise<T> {
    // Get an available API key
    const availableKey = getAvailableApiKey();
    if (!availableKey) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    }

    const searchParams = new URLSearchParams({
        ...params,
        apikey: availableKey.key,
    });

    const url = `${ALPHA_VANTAGE_BASE_URL}?${searchParams.toString()}`;
    const data = await fetchData<T & { Note?: string; Information?: string }>(url);

    // Check for rate limit response from API
    if (data['Note'] || data['Information']) {
        console.warn('Alpha Vantage:', data['Note'] || data['Information']);
        // Mark this key as exhausted and try with the next one
        markKeyAsExhausted(availableKey.key);

        // Try again with a different key (recursive call)
        const nextKey = getAvailableApiKey();
        if (nextKey) {
            const retryParams = new URLSearchParams({
                ...params,
                apikey: nextKey.key,
            });
            const retryUrl = `${ALPHA_VANTAGE_BASE_URL}?${retryParams.toString()}`;
            const retryData = await fetchData<T & { Note?: string; Information?: string }>(retryUrl);

            if (retryData['Note'] || retryData['Information']) {
                throw new Error(ERROR_MESSAGES.RATE_LIMIT);
            }

            recordApiKeyUsage(nextKey.key);
            return retryData;
        }

        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    }

    recordApiKeyUsage(availableKey.key);
    return data;
}
