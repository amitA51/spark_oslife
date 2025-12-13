/**
 * Quotes Data Index
 * 
 * This module provides lazy-loaded access to quotes organized by category.
 * Total: 525 quotes across 15 categories (~35 per category)
 * 
 * Architecture Benefits:
 * - Lazy Loading: Quotes are loaded only when needed
 * - Tree Shaking: Unused categories are not bundled
 * - Memory Efficiency: Only loaded quotes are in memory
 * - Easy Maintenance: Each category is a separate file
 */

import type { Quote, QuoteCategory } from '../../types';

// IMPORTANT: Import initial quotes FIRST (before any exports) to avoid ESM initialization issues
import { motivationQuotes } from './motivationQuotes';
import { stoicismQuotes } from './stoicismQuotes';
import { beliefQuotes } from './beliefQuotes';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

// Export a smaller initial set for immediate availability (sync)
export const INITIAL_QUOTES: QuoteData[] = [
    ...motivationQuotes.slice(0, 5),
    ...stoicismQuotes.slice(0, 5),
    ...beliefQuotes.slice(0, 5),
];

// Category loaders - lazy loaded
const categoryLoaders: Record<Exclude<QuoteCategory, 'custom'>, () => Promise<QuoteData[]>> = {
    motivation: async () => (await import('./motivationQuotes')).motivationQuotes,
    stoicism: async () => (await import('./stoicismQuotes')).stoicismQuotes,
    tech: async () => (await import('./techQuotes')).techQuotes,
    success: async () => (await import('./successQuotes')).successQuotes,
    action: async () => (await import('./actionQuotes')).actionQuotes,
    dreams: async () => (await import('./dreamsQuotes')).dreamsQuotes,
    perseverance: async () => (await import('./perseveranceQuotes')).perseveranceQuotes,
    beginning: async () => (await import('./beginningQuotes')).beginningQuotes,
    sacrifice: async () => (await import('./sacrificeQuotes')).sacrificeQuotes,
    productivity: async () => (await import('./productivityQuotes')).productivityQuotes,
    possibility: async () => (await import('./possibilityQuotes')).possibilityQuotes,
    opportunity: async () => (await import('./opportunityQuotes')).opportunityQuotes,
    belief: async () => (await import('./beliefQuotes')).beliefQuotes,
    change: async () => (await import('./changeQuotes')).changeQuotes,
    passion: async () => (await import('./passionQuotes')).passionQuotes,
};

// Cache for loaded quotes
const quotesCache: Map<QuoteCategory, Quote[]> = new Map();

// Generate unique ID for a quote
const generateQuoteId = (category: QuoteCategory, index: number): string => {
    return `${category}-${index}`;
};

// Convert raw quote data to Quote with id
const toQuote = (data: QuoteData, category: QuoteCategory, index: number): Quote => ({
    ...data,
    id: generateQuoteId(category, index),
    isCustom: false,
});

/**
 * Get quotes by a specific category.
 * Uses lazy loading - quotes are loaded only when first requested.
 */
export const getQuotesByCategory = async (category: QuoteCategory): Promise<Quote[]> => {
    if (category === 'custom') {
        return []; // Custom quotes are stored elsewhere
    }

    // Check cache first
    if (quotesCache.has(category)) {
        return quotesCache.get(category)!;
    }

    // Load quotes for this category
    const loader = categoryLoaders[category];
    if (!loader) {
        console.warn(`No quotes found for category: ${category}`);
        return [];
    }

    try {
        const rawQuotes = await loader();
        const quotes = rawQuotes.map((q, i) => toQuote(q, category, i));
        quotesCache.set(category, quotes);
        return quotes;
    } catch (error) {
        console.error(`Failed to load quotes for category ${category}:`, error);
        return [];
    }
};

/**
 * Get all quotes from all categories.
 * Loads all category files - use sparingly.
 */
export const getAllQuotes = async (): Promise<Quote[]> => {
    const categories: Exclude<QuoteCategory, 'custom'>[] = [
        'motivation', 'stoicism', 'tech', 'success', 'action',
        'dreams', 'perseverance', 'beginning', 'sacrifice',
        'productivity', 'possibility', 'opportunity', 'belief',
        'change', 'passion',
    ];

    const allQuotes: Quote[] = [];

    for (const category of categories) {
        const quotes = await getQuotesByCategory(category);
        allQuotes.push(...quotes);
    }

    return allQuotes;
};

/**
 * Get a random quote from a specific category or all categories.
 */
export const getRandomQuote = async (category?: QuoteCategory | 'all'): Promise<Quote | null> => {
    let quotes: Quote[];

    if (!category || category === 'all') {
        quotes = await getAllQuotes();
    } else if (category === 'custom') {
        return null; // Custom quotes handled separately
    } else {
        quotes = await getQuotesByCategory(category);
    }

    if (quotes.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex] ?? null;
};

/**
 * Get multiple random quotes.
 */
export const getRandomQuotes = async (count: number, category?: QuoteCategory | 'all'): Promise<Quote[]> => {
    let quotes: Quote[];

    if (!category || category === 'all') {
        quotes = await getAllQuotes();
    } else if (category === 'custom') {
        return [];
    } else {
        quotes = await getQuotesByCategory(category);
    }

    if (quotes.length === 0) return [];

    // Shuffle and take first `count` quotes
    const shuffled = [...quotes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

/**
 * Get quote count stats per category.
 */
export const getQuoteCounts = async (): Promise<Record<QuoteCategory, number>> => {
    const counts: Partial<Record<QuoteCategory, number>> = { custom: 0 };

    const categories: Exclude<QuoteCategory, 'custom'>[] = [
        'motivation', 'stoicism', 'tech', 'success', 'action',
        'dreams', 'perseverance', 'beginning', 'sacrifice',
        'productivity', 'possibility', 'opportunity', 'belief',
        'change', 'passion',
    ];

    for (const category of categories) {
        const quotes = await getQuotesByCategory(category);
        counts[category] = quotes.length;
    }

    return counts as Record<QuoteCategory, number>;
};

/**
 * Pre-load all quotes into cache.
 * Call this during app initialization if you want instant access.
 */
export const preloadAllQuotes = async (): Promise<void> => {
    await getAllQuotes();
};

/**
 * Clear the quotes cache.
 * Useful for memory management or after custom quotes are added.
 */
export const clearQuotesCache = (): void => {
    quotesCache.clear();
};
