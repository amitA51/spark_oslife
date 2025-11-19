/**
 * @fileoverview Defines custom error classes for the application.
 * This allows for more specific error handling throughout the app,
 * differentiating between API errors, validation errors, etc.
 */

/**
 * Base class for custom application errors, allowing for easy identification
 * of app-specific exceptions.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Represents an error from an external API call (e.g., network failure, 4xx/5xx response).
 * It can optionally hold the HTTP status code.
 */
export class ApiError extends AppError {
  public readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Represents an error specifically from the Gemini API.
 */
export class GeminiError extends AppError {}

/**
 * Represents an error due to invalid input data provided to a function
 * (e.g., missing required fields, incorrect format).
 */
export class ValidationError extends AppError {}

/**
 * Represents an error when a requested resource (e.g., an item from the DB) is not found.
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} resource The type of resource that was not found (e.g., 'Item', 'Feed').
   * @param {string} id The ID of the resource.
   */
  constructor(resource: string, id: string) {
    super(`${resource} with ID "${id}" not found.`);
  }
}

/**
 * Represents an error during a cryptographic operation (e.g., encryption, decryption, key derivation).
 */
export class CryptoError extends AppError {}
