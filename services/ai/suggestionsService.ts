/**
 * AI Suggestions Service Module
 * 
 * Handles AI-powered suggestions for icons, topics, tags, and exercises.
 */

import { Type } from '@google/genai';
import { loadSettings } from '../settingsService';
import { AVAILABLE_ICONS } from '../../constants';
import { ai, parseAiJson } from './geminiClient';
import { withRateLimit } from './rateLimiter';
import { aiResponseCache } from './responseCache';

// ============================================================================
// Types
// ============================================================================

interface IconSuggestionResult {
    iconName: string;
}

// ============================================================================
// Suggestion Functions
// ============================================================================

/**
 * Suggests an appropriate icon for a given title.
 */
export const suggestIconForTitle = async (title: string): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    // Check cache first
    const cacheKey = `icon:${title}`;
    const cached = aiResponseCache.getValue<string>(cacheKey);
    if (cached && (AVAILABLE_ICONS as readonly string[]).includes(cached)) {
        return cached;
    }

    const prompt = `You are a UI/UX expert. Suggest the most appropriate icon name for the following item title.
Choose from this list of available icons: ${AVAILABLE_ICONS.join(', ')}

Title: "${title}"

Respond with a JSON object containing a single key "iconName" with the chosen icon name.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        iconName: { type: Type.STRING },
                    },
                    required: ['iconName'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            return 'BookOpen';
        }
        const result = parseAiJson<IconSuggestionResult>(text);
        const iconName = (AVAILABLE_ICONS as readonly string[]).includes(result.iconName) ? result.iconName : 'BookOpen';
        aiResponseCache.set(cacheKey, iconName);
        return iconName;
    } catch (error) {
        console.error('Error suggesting icon:', error);
        return 'BookOpen';
    }
};

/**
 * Suggests AI feed topics based on existing ones.
 */
export const suggestAiFeedTopics = async (existingTopics: string[]): Promise<string[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a content recommendation AI. Based on the user's existing interests, suggest 5 new related topics that might interest them.
Topics should be in Hebrew and specific enough to be actionable.

Existing topics: ${existingTopics.join(', ')}

Respond with a JSON object containing a key "topics" with an array of 5 suggested topic strings.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['topics'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            return [];
        }
        const result = JSON.parse(text) as { topics: string[] };
        return result.topics;
    });
};

/**
 * Suggests exercises for a muscle group.
 */
export const suggestExercises = async (
    muscleGroup: string
): Promise<
    {
        name: string;
        muscleGroup: string;
        defaultRestTime: number;
        defaultSets: number;
        tempo: string;
        notes: string;
    }[]
> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a fitness expert. Suggest 5 exercises for the following muscle group in Hebrew.
Each exercise should include practical training parameters.

Muscle Group: "${muscleGroup}"

Respond with a JSON object containing a key "exercises" with an array of objects, each having:
- name: Exercise name in Hebrew
- muscleGroup: The target muscle group
- defaultRestTime: Recommended rest time in seconds (60-180)
- defaultSets: Recommended number of sets (3-5)
- tempo: The tempo notation (e.g., "3-1-2-0")
- notes: Brief execution tips in Hebrew`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        exercises: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    muscleGroup: { type: Type.STRING },
                                    defaultRestTime: { type: Type.NUMBER },
                                    defaultSets: { type: Type.NUMBER },
                                    tempo: { type: Type.STRING },
                                    notes: { type: Type.STRING },
                                },
                                required: ['name', 'muscleGroup', 'defaultRestTime', 'defaultSets', 'tempo', 'notes'],
                            },
                        },
                    },
                    required: ['exercises'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            return [];
        }
        const result = JSON.parse(text) as { exercises: typeof suggestExercises extends (...args: unknown[]) => Promise<infer R> ? R : never };
        return result.exercises;
    });
};

/**
 * Suggests tags for a password manager site.
 */
export const suggestTagsForSite = async (siteName: string): Promise<string[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a categorization expert. Suggest 2-4 relevant tags in Hebrew for the following website/service.
Tags should be broad categories that help organize passwords.

Site: "${siteName}"

Respond with a JSON object containing a key "tags" with an array of tag strings in Hebrew.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['tags'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            return [];
        }
        const result = JSON.parse(text) as { tags: string[] };
        return result.tags;
    } catch (error) {
        console.error('Error suggesting tags:', error);
        return [];
    }
};
