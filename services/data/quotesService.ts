/**
 * Quotes Service
 * Handles CRUD operations for custom quotes
 */

import { LOCAL_STORAGE_KEYS as LS } from '../../constants';
import { dbGet, dbPut, dbDelete, initializeDefaultData } from './dbCore';
import { ValidationError, NotFoundError } from '../errors';
import type { Quote } from '../../types';

/**
 * Retrieves all custom quotes from storage
 */
export const getCustomQuotes = async (): Promise<Quote[]> => {
    return await initializeDefaultData<Quote>(LS.CUSTOM_QUOTES, []);
};

/**
 * Adds a new custom quote to storage
 */
export const addCustomQuote = async (quoteData: Omit<Quote, 'id'>): Promise<Quote> => {
    if (!quoteData.text || !quoteData.author) {
        throw new ValidationError('Quote text and author are required.');
    }

    const newQuote: Quote = {
        id: `quote-${Date.now()}`,
        isCustom: true,
        ...quoteData,
    };

    await dbPut(LS.CUSTOM_QUOTES, newQuote);
    return newQuote;
};

/**
 * Updates an existing custom quote
 */
export const updateCustomQuote = async (id: string, updates: Partial<Quote>): Promise<Quote> => {
    if (!id) throw new ValidationError('Quote ID is required for update.');

    const quoteToUpdate = await dbGet<Quote>(LS.CUSTOM_QUOTES, id);
    if (!quoteToUpdate) throw new NotFoundError('Quote', id);

    const updatedQuote = { ...quoteToUpdate, ...updates };
    await dbPut(LS.CUSTOM_QUOTES, updatedQuote);
    return updatedQuote;
};

/**
 * Removes a custom quote from storage
 */
export const removeCustomQuote = (id: string): Promise<void> => {
    if (!id) throw new ValidationError('Quote ID is required for deletion.');
    return dbDelete(LS.CUSTOM_QUOTES, id);
};

/**
 * Re-adds a custom quote (used during import)
 */
export const reAddCustomQuote = (quote: Quote): Promise<void> =>
    dbPut(LS.CUSTOM_QUOTES, quote);

/**
 * Get a random quote from custom quotes
 */
export const getRandomCustomQuote = async (): Promise<Quote | null> => {
    const quotes = await getCustomQuotes();
    if (quotes.length === 0) return null;
    return quotes[Math.floor(Math.random() * quotes.length)] || null;
};
