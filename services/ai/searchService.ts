/**
 * AI Search Service Module
 * 
 * Handles semantic search and related items discovery using Gemini AI.
 */

import { Type } from '@google/genai';
import type { FeedItem, PersonalItem } from '../../types';
import { loadSettings } from '../settingsService';
import { ai, parseAiJson } from './geminiClient';
import { withRateLimit } from './rateLimiter';

// ============================================================================
// Types
// ============================================================================

interface AiSearchResult {
    answer: string | null;
    itemIds: string[];
}

interface RelatedItemsResult {
    relatedItemIds: string[];
}

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Performs a semantic search over all items using the Gemini API.
 * @param query The user's search query.
 * @param allItems The corpus of items to search through.
 * @returns An object containing the AI's synthesized answer and an array of relevant item IDs.
 */
export const performAiSearch = async (
    query: string,
    allItems: FeedItem[]
): Promise<AiSearchResult> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    // CRITICAL FIX: Limit the search corpus to the 200 most recent items to prevent token limit errors.
    const corpus = allItems
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 200)
        .map(item => ({
            id: item.id,
            title: item.title,
            content: (item.summary_ai || item.content).substring(0, 500), // Truncate content
            tags: item.tags.map(t => t.name),
            type: item.type,
            createdAt: item.createdAt,
        }));

    const prompt = `You are a powerful search and synthesis engine for a personal knowledge base app called "Spark".
The user has provided a search query in Hebrew. Your task is to:
1. Analyze the query to understand its intent (keyword search, question, filtering, request for synthesis, etc.).
2. Search through the provided list of items (JSON format) to find the most relevant ones.
3. If the query is a question or implies synthesis, generate a concise answer in Hebrew based on the content of the relevant items. Use Markdown for formatting.
4. Return a JSON object with two keys:
    - "answer": A string with the synthesized answer in Hebrew (Markdown formatted), or null if not applicable.
    - "itemIds": A JSON array of strings, containing the IDs of the most relevant items, sorted by relevance (up to 15).

User Query: "${query}"

User's Items (Corpus):
${JSON.stringify(corpus)}

Respond ONLY with the JSON object.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return parseAiJson<AiSearchResult>(text);
    });
};

/**
 * Universal AI search across all item types.
 */
export const universalAiSearch = async (
    query: string,
    searchCorpus: { id: string; type: string; title: string; content: string; date: string }[]
): Promise<{ answer: string; sourceIds: string[] }> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a powerful search and synthesis engine for a personal knowledge base app called "Spark". The user has provided a search query in Hebrew. Your task is to:
1. Analyze the query to understand its intent.
2. Search through the provided JSON list of items (the "corpus") to find the most relevant ones. The corpus contains tasks, notes, feed articles, and calendar events.
3. If the query is a question or implies synthesis (e.g., "summarize my articles about AI"), generate a concise answer in Hebrew based on the content of the relevant items. Use Markdown for formatting.
4. Return a JSON object with two keys:
    - "answer": A string with the synthesized answer in Hebrew (Markdown formatted). If the query is a simple keyword search, this can be a very brief summary like "מצאתי X פריטים רלוונטיים."
    - "sourceIds": An array of strings, containing the IDs of the most relevant items from the corpus that you used to generate the answer, sorted by relevance (up to 15).

User Query: "${query}"
Search Corpus (recent 200 items):
${JSON.stringify(searchCorpus.slice(0, 200))}

Respond ONLY with the valid JSON object.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: { type: Type.STRING },
                        sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['answer', 'sourceIds'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return JSON.parse(text) as { answer: string; sourceIds: string[] };
    });
};

/**
 * Finds feed items related to a given item using the Gemini API.
 */
export const findRelatedItems = async (
    currentItem: FeedItem,
    allItems: FeedItem[]
): Promise<FeedItem[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const corpus = allItems
        .filter(item => item.id !== currentItem.id)
        .map(item => ({
            id: item.id,
            title: item.title,
            content: (item.summary_ai || item.content).substring(0, 300),
            tags: item.tags.map(t => t.name),
        }));

    const prompt = `You are a smart content recommender. Based on the "Current Item" provided, find the 3 most relevant items from the "Corpus of Items".
Prioritize items with semantic similarity in content, not just shared tags.
Respond with a JSON object containing a single key "relatedItemIds", which is an array of the top 3 most relevant item IDs.

Current Item:
${JSON.stringify({ title: currentItem.title, content: (currentItem.summary_ai || currentItem.content).substring(0, 500) })}

Corpus of Items:
${JSON.stringify(corpus)}

Respond ONLY with the JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });

        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = parseAiJson<RelatedItemsResult>(text);
        const relatedIds = new Set(result.relatedItemIds);
        return allItems.filter(item => relatedIds.has(item.id));
    } catch (error) {
        console.error('Error finding related items:', error);
        return [];
    }
};

/**
 * Finds personal items related to a given item using the Gemini API.
 */
export const findRelatedPersonalItems = async (
    currentItem: PersonalItem,
    allItems: PersonalItem[]
): Promise<PersonalItem[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const corpus = allItems
        .filter(item => item.id !== currentItem.id)
        .map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            content: (item.content || '').substring(0, 300),
        }));

    const prompt = `You are a smart content recommender for a personal knowledge base. Based on the "Current Item" provided, find the 3 most semantically relevant items from the "Corpus of Items".
Look for thematic connections, related concepts, or items that might be part of the same project, even if not explicitly linked.
Respond with a JSON object containing a single key "relatedItemIds", which is an array of the top 3 most relevant item IDs.

Current Item:
${JSON.stringify({ type: currentItem.type, title: currentItem.title, content: (currentItem.content || '').substring(0, 500) })}

Corpus of Items:
${JSON.stringify(corpus.slice(0, 200))} // Limit corpus size

Respond ONLY with the JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });

        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = parseAiJson<RelatedItemsResult>(text);
        const relatedIds = new Set(result.relatedItemIds);
        return allItems.filter(item => relatedIds.has(item.id));
    } catch (error) {
        console.error('Error finding related personal items:', error);
        return [];
    }
};
