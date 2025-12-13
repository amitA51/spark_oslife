/**
 * AI Content Generation Service Module
 * 
 * Handles content generation, summarization, and synthesis.
 */

import { Type } from '@google/genai';
import type { FeedItem, PersonalItem, AiPersonality, GoogleCalendarEvent, ProductivityForecast } from '../../types';
import { loadSettings } from '../settingsService';
import { ai, parseAiJson } from './geminiClient';
import { aiResponseCache } from './responseCache';
import { withRateLimit } from './rateLimiter';

// ============================================================================
// Types
// ============================================================================

interface MentorContentResult {
    quotes: string[];
}

interface ChallengeGenerationResponse {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// Content Generation Functions
// ============================================================================

/**
 * Summarizes the content of a single item using the Gemini API.
 */
export const summarizeItemContent = async (content: string): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');

    // Check cache first
    const cacheKey = `summary:${content.substring(0, 200)}`;
    const cached = aiResponseCache.getValue<string>(cacheKey);
    if (cached) {
        return cached;
    }

    const settings = loadSettings();
    const prompt = `Summarize the following text concisely in Hebrew, in 2-4 bullet points. Focus on the key takeaways.

Text:
---
${content}
---

Summary:`;
    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        aiResponseCache.set(cacheKey, text);
        return text;
    } catch (error) {
        console.error('Error summarizing content:', error);
        throw new Error('Failed to summarize content.');
    }
};

/**
 * Generates mentor-style quotes.
 */
export const generateMentorContent = async (mentorName: string): Promise<string[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are ${mentorName}. Generate 3 unique, inspiring, and practical quotes in Hebrew in your distinct voice and philosophy. The quotes should feel authentic to ${mentorName}'s known style and teachings.
Respond with a JSON object containing a single key "quotes", which is an array of 3 strings.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = parseAiJson<MentorContentResult>(text);
        return result.quotes;
    });
};

/**
 * Synthesizes content from multiple feed items.
 */
export const synthesizeContent = async (items: FeedItem[]): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const corpus = items.map(item => ({
        title: item.title,
        content: (item.summary_ai || item.content).substring(0, 500),
    }));

    const prompt = `You are a research assistant. Synthesize the following items into a single cohesive summary in Hebrew.
Highlight key themes, commonalities, and unique insights. Use Markdown for formatting.

Items:
${JSON.stringify(corpus)}

Synthesis:`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return text;
    });
};

/**
 * Generates a personalized daily briefing.
 */
export const generateDailyBriefing = async (
    tasks: PersonalItem[],
    habits: PersonalItem[],
    gratitude: string | null,
    personality: AiPersonality
): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const toneMap: Record<AiPersonality, string> = {
        default: 'friendly and encouraging',
        concise: 'brief and to the point',
        encouraging: 'supportive and motivating',
        formal: 'professional and structured',
        coach: 'motivational and action-oriented like a fitness coach',
        mentor: 'wise and thoughtful like a senior mentor',
        sparky: 'upbeat, with occasional emojis and enthusiasm',
    };

    const prompt = `You are a personal AI assistant for a productivity app. Generate a personalized morning briefing in Hebrew.
Your tone should be ${toneMap[personality]}.

Context:
- Today's tasks: ${JSON.stringify(tasks.slice(0, 5).map(t => t.title))}
- Active habits: ${JSON.stringify(habits.slice(0, 3).map(h => h.title))}
${gratitude ? `- Yesterday's gratitude: "${gratitude}"` : ''}

Create a brief (3-4 sentences), encouraging message that:
1. Acknowledges the user's upcoming day
2. Highlights 1-2 key priorities
3. Ends with a motivating note

Respond in Hebrew only, using Markdown for formatting.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return text;
    });
};

/**
 * Generates productivity forecast based on schedule.
 */
export const generateProductivityForecast = async (
    tasks: PersonalItem[],
    habits: PersonalItem[],
    events: GoogleCalendarEvent[]
): Promise<ProductivityForecast> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a productivity analytics AI. Analyze the user's upcoming day and generate a productivity forecast in Hebrew.

Context:
- Tasks (${tasks.length} total): ${JSON.stringify(tasks.slice(0, 10).map(t => ({ title: t.title, dueDate: t.dueDate, priority: t.priority })))}
- Habits to maintain: ${JSON.stringify(habits.slice(0, 5).map(h => h.title))}
- Calendar events: ${JSON.stringify(events.slice(0, 10).map(e => ({ title: e.summary, start: e.start, end: e.end })))}

Provide a JSON response with:
- score: number 0-100 (predicted productivity score)
- insights: array of 2-3 short insight strings in Hebrew
- recommendations: array of 2-3 actionable recommendations in Hebrew`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        insights: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['score', 'insights', 'recommendations'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return JSON.parse(text) as ProductivityForecast;
    });
};

/**
 * Summarizes all items in a space.
 */
export const summarizeSpaceContent = async (
    items: PersonalItem[],
    spaceName: string
): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const corpus = items.slice(0, 50).map(item => ({
        type: item.type,
        title: item.title,
        content: (item.content || '').substring(0, 200),
    }));

    const prompt = `You are a productivity assistant. Summarize the contents of the "${spaceName}" space in Hebrew.
Provide a brief overview (3-5 sentences) of what this space contains, key themes, and notable items.

Items in this space:
${JSON.stringify(corpus)}

Summary:`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return text;
    });
};

/**
 * Generates flashcards from content.
 */
export const generateFlashcards = async (
    content: string
): Promise<{ id: string; question: string; answer: string }[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `Create 5-8 educational flashcards in Hebrew based on the following content.
Each flashcard should have a question and answer that tests understanding of the material.

Content:
${content.substring(0, 3000)}

Respond with a JSON object containing a key "flashcards" with an array of objects, each having "question" and "answer" fields.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = parseAiJson<{ flashcards: { question: string; answer: string }[] }>(text);
        return result.flashcards.map((fc, idx) => ({
            id: `fc-${Date.now()}-${idx}`,
            question: fc.question,
            answer: fc.answer,
        }));
    });
};

/**
 * Generates a daily Comfort Zone Challenge.
 */
export const generateComfortZoneChallenge = async (
    difficulty: 'easy' | 'medium' | 'hard'
): Promise<ChallengeGenerationResponse> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const difficultyDescriptions: Record<string, string> = {
        easy: 'simple and low-risk, suitable for beginners',
        medium: 'moderately challenging, requires some courage',
        hard: 'significantly outside comfort zone, requires real bravery',
    };

    const prompt = `Generate a daily "Comfort Zone Challenge" in Hebrew.
The challenge should be ${difficultyDescriptions[difficulty]}.
It should be something actionable that can be done today.

Examples:
- Easy: "התחל שיחה עם אדם זר בתור לקפה"
- Medium: "הצע עזרה לשכן שלא דיברת איתו מעולם"
- Hard: "התנדב להציג רעיון בפני קבוצה גדולה"

Respond with a JSON object containing:
- text: the challenge description in Hebrew
- difficulty: the difficulty level`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                    },
                    required: ['text', 'difficulty'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return JSON.parse(text) as ChallengeGenerationResponse;
    });
};
