/**
 * AI Chat Service Module
 * 
 * Handles chat/assistant functionality and workout coaching.
 */

import type { Chat } from '@google/genai';
import type { FeedItem, PersonalItem } from '../../types';
import { loadSettings } from '../settingsService';
import { ai } from './geminiClient';
import { withRateLimit } from './rateLimiter';

// ============================================================================
// Types
// ============================================================================

export interface ExerciseChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

// ============================================================================
// Chat Functions
// ============================================================================

/**
 * Creates a chat session for the AI Assistant screen, pre-loaded with context.
 */
export const createAssistantChat = async (
    feedItems: FeedItem[],
    personalItems: PersonalItem[]
): Promise<Chat> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const context = `
        Here is some context about the user's data. Use this to answer their questions.
        - The user has ${feedItems.length} items in their feed. Recent titles include: ${feedItems
            .slice(0, 5)
            .map(i => i.title)
            .join(', ')}.
        - The user has ${personalItems.length} personal items. Some of them are: ${personalItems
            .slice(0, 5)
            .map(i => i.title)
            .join(', ')}.
    `;

    const chat = ai.chats.create({
        model: settings.aiModel,
        config: {
            systemInstruction: `You are a helpful personal assistant for the "Spark" app. The user is asking you questions about their personal data.
            Be concise and helpful. Use the context provided.
            ${context}`,
        },
        history: [
            {
                role: 'user',
                parts: [{ text: 'Hello, I have some questions about my data.' }],
            },
            {
                role: 'model',
                parts: [
                    {
                        text: "Hello! I'm ready to help. I have some context about your recent feed and personal items. What would you like to know?",
                    },
                ],
            },
        ],
    });
    return chat;
};

/**
 * Generates an exercise tutorial.
 */
export const getExerciseTutorial = async (
    exerciseName: string,
    options?: { notes?: string }
): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const notes = options?.notes?.slice(0, 500) || '';

    const prompt = `אתה מאמן כוח ותנועה מנוסה.
כתוב מדריך קצר בעברית על התרגיל "${exerciseName}" שמתאים למתאמן מתקדם.
חלק את התשובה לכותרות ברורות:
1. תיאור כללי (שורה-שתיים).
2. טכניקה שלב-אחר-שלב.
3. טעויות נפוצות שצריך להימנע מהן.
4. טיפים מתקדמים לביצוע טוב יותר או עומסים.
${notes
            ? `
הערות אישיות של המשתמש על התרגיל:
${notes}
`
            : ''
        }
שמור על תשובה ממוקדת וקצרה (עד ~180 מילים), עם רשימות נקודות במקום טקסט ארוך.`;

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
 * Answers a question about an exercise.
 */
export const askExerciseQuestion = async (
    exerciseName: string,
    question: string,
    history: ExerciseChatMessage[] = [],
    options?: { notes?: string }
): Promise<string> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const notes = options?.notes?.slice(0, 300) || '';

    const historyText = history
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'מתאמן' : 'מאמן'}: ${m.text}`)
        .join('\n');

    const prompt = `אתה מאמן אישי חכם שמסביר תרגילי כוח בצורה מדויקת ומקצועית.
אנחנו מדברים על התרגיל: "${exerciseName}".
${notes
            ? `
הערות אישיות על התרגיל:
${notes}
`
            : ''
        }

היסטוריית שיחה עד עכשיו:
${historyText || 'אין היסטוריה, זו השאלה הראשונה.'}

שאלת המשתמש עכשיו:
"${question}"

ענה בעברית, בקצרה ובצורה פרקטית. עדיף להשתמש ברשימות נקודות כשאפשר.`;

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
