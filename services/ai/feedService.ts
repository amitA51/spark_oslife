/**
 * AI Feed Service Module
 * 
 * Handles AI-generated feed items and URL metadata extraction.
 */

import { Type } from '@google/genai';
import type { PersonalItem, AiFeedSettings } from '../../types';
import { loadSettings } from '../settingsService';
import { ai, parseAiJson } from './geminiClient';
import { withRateLimit } from './rateLimiter';

// ============================================================================
// Types
// ============================================================================

interface UrlMetadataResult {
    title: string;
    content: string;
    imageUrl?: string;
}

interface AiGeneratedFeedItem {
    title: string;
    summary_he: string;
    insights: string[];
    topics: string[];
    tags: string[];
    level: 'beginner' | 'intermediate' | 'advanced';
    estimated_read_time_min: number;
    digest: string;
}

interface AiFeedGenerationResponse {
    items: AiGeneratedFeedItem[];
}

// ============================================================================
// Feed Functions
// ============================================================================

/**
 * Fetches and extracts metadata from a URL.
 */
export const getUrlMetadata = async (url: string): Promise<Partial<PersonalItem>> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const prompt = `Fetch the metadata and a brief summary for the following URL.
    URL: ${url}
    Respond with a JSON object containing: "title", "content" (a 2-3 sentence summary in Hebrew), and "imageUrl" (a relevant image URL from the page).`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        imageUrl: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const metadata: UrlMetadataResult = JSON.parse(text);
        return {
            title: metadata.title,
            content: metadata.content,
            imageUrl: metadata.imageUrl,
            url: url,
            domain: new URL(url).hostname,
        };
    } catch (error) {
        console.error('Error fetching URL metadata:', error);
        return { url, title: 'Could not fetch title', content: '' };
    }
};

/**
 * Generates AI feed items based on user preferences.
 */
export const generateAiFeedItems = async (
    aiFeedSettings: AiFeedSettings,
    existingTitles: string[] = []
): Promise<AiGeneratedFeedItem[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const { itemsPerRefresh: count, topics, customPrompt } = aiFeedSettings;
    const topicsString =
        topics && topics.length > 0
            ? topics.join(', ')
            : 'סייבר, פסיכולוגיה, כלכלה התנהגותית, שוק ההון, עסקים ופיננסים';

    const perspectives = [
        'עובדה מפתיעה או לא ידועה',
        'תחזית לעתיד הקרוב',
        'השוואה היסטורית מעניינת',
        'טיפ מעשי ליישום מיידי',
        'ניפוץ מיתוס נפוץ',
        'זווית פסיכולוגית על הנושא',
        'השפעה כלכלית נסתרת',
    ];
    const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];

    console.log(`[AI Feed] Generating ${count} sparks on topics: ${topicsString} (perspective: ${randomPerspective})`);

    const prompt = `
    אתה עוזר שמייצר פיד ידע אישי בעברית.
    צור ${count} פריטי תוכן חדשים, ייחודיים ומעניינים בנושאים: ${topicsString}.
    
    *** הנחיה קריטית ליצירתיות ***:
    הפעם, התמקד בפריטים מהזווית הבאה: "${randomPerspective}".
    אל תחזור על כותרות או רעיונות שכבר מופיעים ברשימה הבאה: ${JSON.stringify(existingTitles.slice(-30))}.
    ${customPrompt ? `הנחיה נוספת מהמשתמש: ${customPrompt}` : ''}

    הנחיות טכניות:
    1. החזר תמיד רק JSON תקין ולא טקסט חופשי, במבנה הבא: { "items": [...] }.
    2. כל פריט בתוך המערך "items" הוא אובייקט עם השדות הבאים בלבד:
       - title: (string) כותרת ייחודית ומושכת.
       - summary_he: (string) תקציר איכותי בעברית, עד 120 מילים.
       - insights: (string[]) מערך של 3 תובנות קצרות ושימושיות מהתקציר.
       - topics: (string[]) מערך של 1-3 נושאים עיקריים (למשל: "סייבר", "פסיכולוגיה").
       - tags: (string[]) מערך של 2-4 תגיות ספציפיות יותר.
       - level: (string) אחת מהרמות: 'beginner', 'intermediate', 'advanced'.
       - estimated_read_time_min: (number) הערכת זמן קריאה בדקות.
       - digest: (string) משפט אחד קצר שמסכם את מהות הפריט.
    3. שמור על עברית ברורה, קצרה ושימושית.
    4. אין להמציא עובדות או ציטוטים לא מבוססים.
    `;

    try {
        const items = await withRateLimit(async () => {
            const response = await ai!.models.generateContent({
                model: settings.aiModel,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.85,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        summary_he: { type: Type.STRING },
                                        insights: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        level: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
                                        estimated_read_time_min: { type: Type.NUMBER },
                                        digest: { type: Type.STRING },
                                    },
                                    required: [
                                        'title',
                                        'summary_he',
                                        'insights',
                                        'topics',
                                        'tags',
                                        'level',
                                        'estimated_read_time_min',
                                        'digest',
                                    ],
                                },
                            },
                        },
                        required: ['items'],
                    },
                },
            });
            const text = response.text;
            if (!text) {
                throw new Error('AI response was empty.');
            }
            const result = parseAiJson<AiFeedGenerationResponse>(text);
            return result.items || [];
        });

        console.log(`[AI Feed] Successfully generated ${items.length} sparks`);
        return items;
    } catch (error) {
        console.error('[AI Feed] Error generating AI feed items:', error);
        return [];
    }
};

// Re-export the type for external use
export type { AiGeneratedFeedItem };
