/**
 * AI NLP/Parsing Service Module
 * 
 * Handles natural language processing, text extraction, and input parsing.
 */

import { Type } from '@google/genai';
import type { PersonalItem, Space, NlpResult } from '../../types';
import { loadSettings } from '../settingsService';
import { todayKey } from '../../utils/dateUtils';
import { ai } from './geminiClient';
import { withRateLimit } from './rateLimiter';

// ============================================================================
// Types
// ============================================================================

interface NaturalLanguageTaskResult {
    title: string;
    dueDate: string | null;
}

// ============================================================================
// NLP Functions
// ============================================================================

/**
 * Extracts text from a base64 encoded image using the Gemini API.
 */
export const extractTextFromImage = async (
    base64ImageData: string,
    mimeType: string
): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const imagePart = {
        inlineData: { data: base64ImageData, mimeType },
    };
    const textPart = {
        text: 'Extract all text from this image, in its original language. Respond only with the extracted text.',
    };

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: { parts: [imagePart, textPart] },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return text;
    });
};

/**
 * Parses a natural language query to extract task details.
 */
export const parseNaturalLanguageTask = async (
    query: string
): Promise<NaturalLanguageTaskResult> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const today = todayKey();

    const prompt = `You are a smart task parser for a productivity app. Analyze the following text written in Hebrew and extract the task details.
    Today's date is: ${today}.
    - The 'title' should be the core action of the task.
    - The 'dueDate' should be in YYYY-MM-DD format. Interpret relative terms like "מחר", "מחרתיים", "היום", "בעוד 3 ימים", etc., based on today's date. If no date is mentioned, 'dueDate' should be null.
    - Ignore any time of day information.
    
    Text to parse: "${query}"
    
    Respond ONLY with a valid JSON object matching the specified schema.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: 'The main title of the task.' },
                        dueDate: {
                            type: Type.STRING,
                            description: 'The due date in YYYY-MM-DD format, or null if not specified.',
                        },
                    },
                    required: ['title', 'dueDate'],
                },
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const parsed: NaturalLanguageTaskResult = JSON.parse(text);
        return parsed;
    } catch (error) {
        console.error('Error parsing natural language task:', error);
        return { title: query, dueDate: null };
    }
};

/**
 * Smart input parsing with space suggestion.
 */
export const smartParseInput = async (
    query: string,
    spaces: Space[],
    recentItems: PersonalItem[]
): Promise<NlpResult> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const today = todayKey();

    const spacesContext = spaces
        .filter(s => s.type === 'personal')
        .map(space => {
            const spaceItems = recentItems
                .filter(item => item.spaceId === space.id)
                .slice(0, 5)
                .map(item => item.title);
            return { id: space.id, name: space.name, recentTitles: spaceItems };
        });

    const prompt = `You are a smart capture assistant for a productivity app. Your task is to analyze the user's Hebrew input and convert it into a structured item, including suggesting the best space to file it in.

    Today's date is: ${today}.

    Instructions:
    1. Classify the input into 'task', 'note', 'habit', or 'idea'. Default to 'note' if unsure.
    2. Extract a concise 'title'.
    3. Extract a 'dueDate' (YYYY-MM-DD format) for tasks if mentioned (e.g., "מחר", "ביום שני").
    4. Set 'priority' to 'high' for tasks if keywords like "חשוב" or "דחוף" are present.
    5. **Most importantly**: Analyze the content and the user's existing spaces to suggest the most relevant space ID for this new item. The 'suggestedSpaceId' should be one of the IDs from the provided spaces context. If no space seems relevant, return null for this field.

    User Spaces Context:
    ${JSON.stringify(spacesContext)}
    
    User Input: "${query}"

    Respond ONLY with a valid JSON object matching the specified schema.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['task', 'note', 'habit', 'idea'] },
                        title: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                        suggestedSpaceId: { type: Type.STRING },
                    },
                    required: ['type', 'title'],
                },
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return JSON.parse(text) as NlpResult;
    } catch (error) {
        console.error('Error parsing smart input:', error);
        return { type: 'note', title: query };
    }
};

/**
 * Parses a natural language voice query to classify and extract item details.
 */
export const parseNaturalLanguageInput = async (query: string): Promise<NlpResult> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const today = todayKey();

    const prompt = `You are a Natural Language Processor for a productivity app called "Spark". Your task is to analyze the user's Hebrew voice input and convert it into a structured personal item.

    Today's date is: ${today}.

    Instructions:
    1.  **Classify** the input into one of these types: 'task', 'note', 'habit', 'idea'.
        -   'task': Something to be done, often with a deadline. Look for keywords like "משימה", "להוסיף", "צריך", "לקנות", or time-related words ("מחר", "ביום ראשון").
        -   'habit': A recurring action. Look for keywords like "הרגל", "כל יום", "להתחיל".
        -   'idea': A thought or concept. Look for keywords like "רעיון", "אולי כדאי".
        -   'note': General information to be saved. This is the default if no other type fits. Look for "פתק", "לרשום".
    2.  **Extract the title**: Create a concise, clear title for the item. Remove filler words like "הוסף משימה ל...". For example, "הוסף משימה לקנות חלב" becomes "לקנות חלב".
    3.  **Extract the due date**: If it's a 'task', interpret any date/time information (e.g., "מחר", "בעוד 3 ימים", "ביום ראשון הבא") relative to today's date and return it in YYYY-MM-DD format. If no date is mentioned, dueDate should be null.
    4.  **Extract priority**: If the user mentions "חשוב" or "דחוף", set priority to 'high'. Otherwise, 'medium'.

    Examples:
    -   Input: "הוסף משימה לקנות חלב למחר" -> { "type": "task", "title": "לקנות חלב", "dueDate": (tomorrow's date), "priority": "medium" }
    -   Input: "הרגל חדש לשתות יותר מים כל יום" -> { "type": "habit", "title": "לשתות יותר מים" }
    -   Input: "פתק: מספר ההזמנה הוא 12345" -> { "type": "note", "title": "מספר ההזמנה הוא 12345" }
    -   Input: "רעיון לאפליקציה שמזכירה להשקות את העציצים" -> { "type": "idea", "title": "אפליקציה שמזכירה להשקות את העציצים" }

    User Input: "${query}"

    Respond ONLY with a valid JSON object matching the schema.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['task', 'note', 'habit', 'idea'] },
                        title: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                    },
                    required: ['type', 'title'],
                },
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        return JSON.parse(text) as NlpResult;
    } catch (error) {
        console.error('Error parsing natural language input:', error);
        return { type: 'note', title: query };
    }
};
