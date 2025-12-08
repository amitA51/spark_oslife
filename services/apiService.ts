/**
 * @fileoverview Centralized service for making external API requests.
 * Provides a robust `fetch` wrapper with timeouts and structured error handling,
 * fulfilling the requirement for a centralized API function.
 */

import { ApiError } from './errors';

/**
 * A wrapper around the native `fetch` API that adds a timeout.
 * This is a critical utility for handling unresponsive external services.
 *
 * @param {string} resource The URL to fetch.
 * @param {RequestInit & { timeout?: number }} options Fetch options, including an optional `timeout` in milliseconds.
 * @returns {Promise<Response>} A promise that resolves to the Fetch API's Response object.
 * @throws {ApiError} Throws an ApiError if the request times out or a network error occurs.
 *
 * @unittest
 * // Test timeout functionality
 * const longRequest = fetchWithTimeout('https://httpbin.org/delay/5', { timeout: 2000 });
 * await expect(longRequest).rejects.toThrow(ApiError);
 * await expect(longRequest).rejects.toThrow('Request timed out after 2000ms');
 */
async function fetchWithTimeout(
  resource: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 15000 } = options; // Default timeout of 15 seconds

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeout}ms`, 408);
    }
    // Generic network error
    throw new ApiError('Network request failed. Check your internet connection.');
  } finally {
    clearTimeout(id);
  }
}

/**
 * A generic data fetching function that handles JSON parsing and error wrapping.
 * It ensures all API calls have consistent error handling and timeouts.
 *
 * @template T The expected type of the JSON response.
 * @param {string} url The URL to fetch data from.
 * @param {RequestInit & { timeout?: number }} [options] Optional fetch options.
 * @returns {Promise<T>} A promise that resolves to the parsed JSON data.
 * @throws {ApiError} Throws an ApiError for network issues or non-ok HTTP responses.
 */
export async function fetchData<T>(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Could not read error body.');
    console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
    throw new ApiError(
      `Request to ${new URL(url).hostname} failed with status ${response.status}.`,
      response.status
    );
  }

  try {
    return (await response.json()) as T;
  } catch (e) {
    throw new ApiError('Failed to parse JSON response from API.');
  }
}

/**
 * A generic data fetching function that returns the response as raw text.
 * Useful for APIs that return non-JSON data like XML or plain text.
 *
 * @param {string} url The URL to fetch data from.
 * @param {RequestInit & { timeout?: number }} [options] Optional fetch options.
 * @returns {Promise<string>} A promise that resolves to the response text.
 * @throws {ApiError} Throws an ApiError for network issues or non-ok HTTP responses.
 */
export async function fetchAsText(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<string> {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Could not read error body.');
    console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
    throw new ApiError(`Request failed with status ${response.status}.`, response.status);
  }

  return response.text();
}
