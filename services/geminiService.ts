
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { FeedItem, Tag, PersonalItem, Space, RoadmapPhase, AiPersonality, AiFeedSettings, RoadmapTask, SubTask, GoogleCalendarEvent, ProductivityForecast, NlpResult, UniversalSearchResult, ComfortZoneChallenge } from '../types';
import { loadSettings } from './settingsService';
// FIX: Removed imports from dataService to break circular dependency.
import { AVAILABLE_ICONS } from '../constants';

// This service is now SOLELY responsible for interacting with the Gemini API.
// All local data persistence has been moved to `dataService.ts`.

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY is not set. AI features will not work.");
}

// ==================================================================================
// --- Type Definitions for AI Responses ---
// ==================================================================================

interface AiSearchResult {
  answer: string | null;
  itemIds: string[];
}
interface NaturalLanguageTaskResult {
  title: string;
  dueDate: string | null;
}
interface RelatedItemsResult {
  relatedItemIds: string[];
}
interface UrlMetadataResult {
  title: string;
  content: string;
  imageUrl?: string;
}
interface MentorContentResult {
  quotes: string[];
}
interface Flashcard {
    question: string;
    answer: string;
}
interface FlashcardResponse {
    flashcards: Flashcard[];
}
interface RoadmapTaskResponse {
    title: string;
}
interface RoadmapPhaseResponse {
    title: string;
    description: string;
    duration: string;
    tasks: RoadmapTaskResponse[];
}
interface RoadmapResponse {
    phases: RoadmapPhaseResponse[];
}
interface SubTaskResponse {
    subTasks: { title: string }[];
}
interface IconSuggestionResult {
    iconName: string;
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

interface ChallengeGenerationResponse {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
}


// ==================================================================================
// --- GEMINI AI SERVICES ---
// ==================================================================================

/**
 * A robust utility to parse potentially malformed JSON from an AI response.
 * @param responseText The raw text response from the AI model.
 * @returns The parsed JSON object.
 * @throws {Error} if the JSON is unparseable.
 */
const parseAiJson = <T>(responseText: string): T => {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("AI response was not valid JSON:", cleanedText, parseError);
        throw new Error("תגובת ה-AI לא הייתה בפורמט JSON תקין.");
    }
};


/**
 * Extracts text from a base64 encoded image using the Gemini API.
 * @param base64ImageData The base64 encoded image data.
 * @param mimeType The mimeType of the image.
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured.");
    const imagePart = {
        inlineData: { data: base64ImageData, mimeType },
    };
    const textPart = { text: 'Extract all text from this image, in its original language. Respond only with the extracted text.' };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw new Error("Failed to extract text from image.");
    }
};

/**
 * Performs a semantic search over all items using the Gemini API.
 * @param query The user's search query.
 * @param allItems The corpus of items to search through.
 * @returns An object containing the AI's synthesized answer and an array of relevant item IDs.
 */
export const performAiSearch = async (query: string, allItems: FeedItem[]): Promise<AiSearchResult> => {
    if (!ai) throw new Error("API Key not configured.");
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
        createdAt: item.createdAt
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

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });

        return parseAiJson<AiSearchResult>(response.text);

    } catch (error) {
        console.error("Error performing AI search:", error);
        throw new Error("Failed to perform AI search.");
    }
};


export const universalAiSearch = async (query: string, searchCorpus: {id: string, type: string, title: string, content: string, date: string}[]): Promise<{answer: string, sourceIds: string[]}> => {
    if (!ai) throw new Error("API Key not configured.");
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

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: { type: Type.STRING },
                        sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['answer', 'sourceIds']
                }
            }
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Error performing Universal AI search:", error);
        throw new Error("Failed to perform Universal AI search.");
    }
};


/**
 * Parses a natural language query to extract task details.
 * @param query The user's input string.
 * @returns An object containing the task title and due date.
 */
export const parseNaturalLanguageTask = async (query: string): Promise<NaturalLanguageTaskResult> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const today = new Date().toISOString().split('T')[0];

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
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The main title of the task." },
                        dueDate: { type: Type.STRING, description: "The due date in YYYY-MM-DD format, or null if not specified." }
                    },
                    required: ['title', 'dueDate']
                }
            }
        });
        
        const parsed: NaturalLanguageTaskResult = JSON.parse(response.text);
        return parsed;
    } catch (error) {
        console.error("Error parsing natural language task:", error);
        return { title: query, dueDate: null };
    }
};

export const smartParseInput = async (query: string, spaces: Space[], recentItems: PersonalItem[]): Promise<NlpResult> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const today = new Date().toISOString().split('T')[0];

    const spacesContext = spaces.filter(s => s.type === 'personal').map(space => {
        const spaceItems = recentItems
            .filter(item => item.spaceId === space.id)
            .slice(0, 5) // Get up to 5 recent items for context
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
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['task', 'note', 'habit', 'idea'] },
                        title: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                        suggestedSpaceId: { type: Type.STRING }
                    },
                    required: ['type', 'title']
                }
            }
        });
        
        return JSON.parse(response.text) as NlpResult;

    } catch (error) {
        console.error("Error parsing smart input:", error);
        return { type: 'note', title: query };
    }
};

/**
 * Parses a natural language voice query to classify and extract item details.
 * @param query The user's voice input as a string.
 * @returns A structured object with the classified type, title, and other details.
 */
export const parseNaturalLanguageInput = async (query: string): Promise<NlpResult> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const today = new Date().toISOString().split('T')[0];

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
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['task', 'note', 'habit', 'idea'] },
                        title: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
                    },
                    required: ['type', 'title']
                }
            }
        });
        
        return JSON.parse(response.text) as NlpResult;

    } catch (error) {
        console.error("Error parsing natural language input:", error);
        // Fallback to creating a simple note on failure
        return { type: 'note', title: query };
    }
};


/**
 * Summarizes the content of a single item using the Gemini API.
 * @param content The text content to summarize.
 * @returns The AI-generated summary.
 */
export const summarizeItemContent = async (content: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured.");
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
        return response.text;
    } catch (error) {
        console.error("Error summarizing content:", error);
        throw new Error("Failed to summarize content.");
    }
};

/**
 * Finds feed items related to a given item using the Gemini API.
 * @param currentItem The item to find relations for.
 * @param allItems The corpus of items to search through.
 * @returns An array of related FeedItems.
 */
export const findRelatedItems = async (currentItem: FeedItem, allItems: FeedItem[]): Promise<FeedItem[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const corpus = allItems
        .filter(item => item.id !== currentItem.id)
        .map(item => ({
            id: item.id,
            title: item.title,
            content: (item.summary_ai || item.content).substring(0, 300),
            tags: item.tags.map(t => t.name)
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
        
        const result = parseAiJson<RelatedItemsResult>(response.text);
        const relatedIds = new Set(result.relatedItemIds);
        return allItems.filter(item => relatedIds.has(item.id));

    } catch (error) {
        console.error("Error finding related items:", error);
        return [];
    }
};

/**
 * Finds personal items related to a given item using the Gemini API.
 * @param currentItem The item to find relations for.
 * @param allItems The corpus of personal items to search through.
 * @returns An array of related PersonalItems.
 */
export const findRelatedPersonalItems = async (currentItem: PersonalItem, allItems: PersonalItem[]): Promise<PersonalItem[]> => {
    if (!ai) throw new Error("API Key not configured.");
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
        
        const result = parseAiJson<RelatedItemsResult>(response.text);
        if (!result.relatedItemIds) return [];

        const relatedIds = new Set(result.relatedItemIds);
        return allItems.filter(item => relatedIds.has(item.id));

    } catch (error) {
        console.error("Error finding related personal items:", error);
        return [];
    }
};

/**
 * Creates a chat session for the AI Assistant screen, pre-loaded with context.
 */
// FIX: Changed signature to accept items as arguments to break circular dependency.
export const createAssistantChat = async (feedItems: FeedItem[], personalItems: PersonalItem[]): Promise<Chat> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();

    const context = `
        Here is some context about the user's data. Use this to answer their questions.
        - The user has ${feedItems.length} items in their feed. Recent titles include: ${feedItems.slice(0, 5).map(i => i.title).join(', ')}.
        - The user has ${personalItems.length} personal items. Some of them are: ${personalItems.slice(0, 5).map(i => i.title).join(', ')}.
    `;

    const chat = ai.chats.create({
        model: settings.aiModel,
        config: {
            systemInstruction: `You are a helpful personal assistant for the "Spark" app. The user is asking you questions about their personal data.
            Be concise and helpful. Use the context provided.
            ${context}`,
        },
        history: [{
            role: 'user',
            parts: [{ text: "Hello, I have some questions about my data." }],
        }, {
            role: 'model',
            parts: [{ text: "Hello! I'm ready to help. I have some context about your recent feed and personal items. What would you like to know?" }],
        }]
    });
    return chat;
};

export const getUrlMetadata = async (url: string): Promise<Partial<PersonalItem>> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const prompt = `Fetch the metadata and a brief summary for the following URL.
    URL: ${url}
    Respond with a JSON object containing: "title", "content" (a 2-3 sentence summary in Hebrew), and "imageUrl" (a relevant image URL from the page).`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        imageUrl: { type: Type.STRING },
                    },
                    required: ['title', 'content']
                }
            }
        });
        const metadata: UrlMetadataResult = JSON.parse(response.text);
        return {
            title: metadata.title,
            content: metadata.content,
            imageUrl: metadata.imageUrl,
            url: url,
            domain: new URL(url).hostname,
        };
    } catch (error) {
        console.error("Error fetching URL metadata:", error);
        return { url, title: 'Could not fetch title', content: '' };
    }
};

export const generateMentorContent = async (mentorName: string): Promise<string[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const prompt = `Generate a list of 7 short, powerful, and insightful quotes or pieces of advice in Hebrew, in the style of ${mentorName}.
    Return the response as a JSON object with a single key "quotes" which is an array of 7 strings.`;
    
     try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quotes: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                    },
                    required: ['quotes']
                }
            }
        });
        const result: MentorContentResult = JSON.parse(response.text);
        return result.quotes;
    } catch (error) {
        console.error("Error generating mentor content:", error);
        return [];
    }
};

export const synthesizeContent = async (items: FeedItem[]): Promise<string> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const contentToSynthesize = items.map(item => `
        ### ${item.title}
        ${item.summary_ai || item.content}
    `).join('\n---\n');

    const prompt = `Synthesize the key themes and takeaways from the following articles. Provide a concise summary in Hebrew using Markdown formatting.

        Content:
        ---
        ${contentToSynthesize}
        ---

        Synthesis:`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error synthesizing content:", error);
        throw new Error("Failed to synthesize content.");
    }
};

export const generateDailyBriefing = async (tasks: PersonalItem[], habits: PersonalItem[], gratitude: string | null, personality: AiPersonality): Promise<string> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    
    let personalityInstruction = "Create a short, encouraging, and focused summary for the user's day.";
    if (personality === 'concise') {
        personalityInstruction = "Create a very short, direct, and to-the-point summary for the user's day. Use bullet points.";
    } else if (personality === 'formal') {
        personalityInstruction = "Create a formal and structured summary of the user's objectives for the day.";
    }

    const prompt = `
    You are a personal assistant creating a daily briefing in Hebrew.
    Based on the following data and the requested personality, ${personalityInstruction}
    Use Markdown for formatting. Address the user directly ("היום", "יש לך", etc.).
    - Start with a suitable opening for the personality.
    - Highlight the top 1-3 most important tasks.
    - Mention the habits for today and their current streaks.
    - If a gratitude entry is available, reflect on it.
    - End with a closing statement that matches the personality.

    Data:
    - Today's Date: ${new Date().toLocaleDateString('he-IL')}
    - Top Tasks: ${tasks.length > 0 ? JSON.stringify(tasks.map(t => t.title)) : "No tasks today."}
    - Habits: ${habits.length > 0 ? JSON.stringify(habits.map(h => ({ title: h.title, streak: h.streak || 0 }))) : "No habits for today."}
    - Gratitude: ${gratitude || "Not provided."}

    Briefing:
    `;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating daily briefing:", error);
        throw new Error("Failed to generate briefing.");
    }
};

export const generateProductivityForecast = async (tasks: PersonalItem[], habits: PersonalItem[], events: GoogleCalendarEvent[]): Promise<ProductivityForecast> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();

    const relevantTasks = tasks.filter(t => t.type === 'task' && !t.isCompleted).map(t => ({
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
    }));

    const relevantHabits = habits.filter(h => h.type === 'habit').map(h => ({
        title: h.title,
        streak: h.streak || 0,
    }));

    const relevantEvents = events.map(e => ({
        summary: e.summary,
        startTime: e.start?.dateTime,
    }));

    const prompt = `
    You are a productivity coach AI for the "Spark" app. Your goal is to provide a "Productivity Score" and a short, encouraging forecast in Hebrew.

    Analyze the user's data for today:
    - Tasks: ${JSON.stringify(relevantTasks.slice(0, 15))}
    - Habits: ${JSON.stringify(relevantHabits.slice(0, 10))}
    - Calendar Events: ${JSON.stringify(relevantEvents.slice(0, 10))}

    Based on this data, calculate a score from 0 to 100 representing the user's potential productivity and ability to handle their workload for the day.
    - A low score (0-40) means a very high, potentially overwhelming load or many overdue tasks.
    - A medium score (41-75) means a manageable but busy day.
    - A high score (76-100) means a well-balanced day with high potential for success.

    Also, write a short, one-sentence "forecastText" in Hebrew. This text should be encouraging and actionable, reflecting the score. For example:
    - For a high score: "יום מאוזן לפניך, הזדמנות מצוינת להתקדם במטרות החשובות."
    - For a medium score: "יום עמוס אך אפשרי. התמקד במשימה אחת בכל פעם."
    - For a low score: "עומס גבוה היום. שקול לדחות משימות לא דחופות כדי להתמקד בעיקר."

    Respond ONLY with a valid JSON object with two keys: "score" (a number) and "forecastText" (a string).
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        forecastText: { type: Type.STRING },
                    },
                    required: ['score', 'forecastText']
                }
            }
        });
        
        return JSON.parse(response.text) as ProductivityForecast;

    } catch (error) {
        console.error("Error generating productivity forecast:", error);
        // Return a default/fallback state on error
        return { score: 50, forecastText: "לא ניתן היה לחשב תחזית. נסה להתמקד במשימות שלך." };
    }
};


export const summarizeSpaceContent = async (items: PersonalItem[], spaceName: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const content = items.slice(0, 20).map(item => `
        Type: ${item.type}
        Title: ${item.title}
        Content: ${(item.content || '').substring(0, 300)}
    `).join('\n---\n');

    const prompt = `You are an AI assistant. Summarize the content of the personal space named "${spaceName}".
    Identify the main themes, projects, and areas of focus based on the items provided.
    The summary should be in Hebrew and formatted in Markdown.

    Items:
    ${content}

    Summary:`;
    
    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing space:", error);
        throw new Error("Failed to summarize space.");
    }
};

export const generateFlashcards = async (content: string): Promise<{id: string; question: string; answer: string}[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const prompt = `Based on the following text, generate 3-5 question/answer flashcards in Hebrew to help with learning the key concepts.
    Return a JSON object with a key "flashcards", which is an array of objects, each with "question" and "answer" keys.

    Text:
    ${content}

    JSON Response:`;
    
    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        flashcards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    answer: { type: Type.STRING },
                                },
                                required: ['question', 'answer']
                            }
                        },
                    },
                    required: ['flashcards']
                }
            }
        });
        const result: FlashcardResponse = JSON.parse(response.text);
        return result.flashcards.map((fc) => ({...fc, id: `fc-${Date.now()}-${Math.random()}`}));
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw new Error("Failed to generate flashcards.");
    }
};

// FIX: Added function to generate tasks for a specific roadmap phase.
export const generateTasksForPhase = async (phaseTitle: string): Promise<RoadmapTaskResponse[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const prompt = `Based on the roadmap phase title "${phaseTitle}", generate a list of 3-5 smaller, actionable tasks.
    Return a JSON object with a key "tasks", which is an array of objects, each with a "title" key. The response must be in Hebrew.`;
    
    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING }
                                },
                                required: ['title']
                            }
                        }
                    },
                    required: ['tasks']
                }
            }
        });
        const result: { tasks: RoadmapTaskResponse[] } = JSON.parse(response.text);
        return result.tasks;
    } catch (error) {
        console.error("Error generating tasks for phase:", error);
        throw new Error("Failed to generate tasks for phase.");
    }
};

export const generateRoadmap = async (goal: string): Promise<Omit<RoadmapPhase, 'id' | 'order' | 'notes'>[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const prompt = `Based on the following goal, generate a high-level roadmap.
The roadmap should consist of 3-5 main phases. Each phase should have a title, a short description, an estimated duration (e.g., "1 week", "2 days"), and a list of 2-4 concrete tasks.
Return a JSON object with a key "phases", which is an array of phase objects. Each phase object must contain "title", "description", "duration", and a "tasks" array. Each object in the "tasks" array should have a "title". The response must be in Hebrew.

    Goal:
    ${goal}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        phases: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    duration: { type: Type.STRING },
                                    tasks: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                title: { type: Type.STRING }
                                            },
                                            required: ['title']
                                        }
                                    }
                                },
                                required: ['title', 'description', 'duration', 'tasks']
                            }
                        },
                    },
                    required: ['phases']
                }
            }
        });
        const result: RoadmapResponse = JSON.parse(response.text);
        return result.phases.map(phase => ({
            ...phase,
            // FIX: Add missing properties to satisfy the Omit<RoadmapPhase, ...> type.
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            attachments: [],
            status: 'pending',
            dependencies: [],
            estimatedHours: 0,
            tasks: phase.tasks.map((task, index) => ({
                ...task,
                id: `task-${Date.now()}-${Math.random()}`,
                isCompleted: false,
                order: index
            }))
        }));
    } catch (error) {
        console.error("Error generating roadmap:", error);
        throw new Error("Failed to generate roadmap.");
    }
};

export const breakDownRoadmapTask = async (taskTitle: string): Promise<Partial<SubTask>[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    const prompt = `Break down the following complex task into a list of 3-5 smaller, actionable sub-tasks.
    Return a JSON object with a key "subTasks", which is an array of objects, each with a "title" key. The response must be in Hebrew.

    Task to break down:
    "${taskTitle}"
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subTasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING }
                                },
                                required: ['title']
                            }
                        }
                    },
                    required: ['subTasks']
                }
            }
        });
        const result: SubTaskResponse = JSON.parse(response.text);
        return result.subTasks;
    } catch (error) {
        console.error("Error breaking down task:", error);
        throw new Error("Failed to break down task.");
    }
};

export const suggestIconForTitle = async (title: string): Promise<string> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();
    
    const prompt = `You are an intelligent icon assigner for a productivity app. Your task is to select the most relevant icon for a new item based on its title.
    
    Choose exactly one icon name from this list: ${JSON.stringify(AVAILABLE_ICONS)}
    
    Analyze the title and pick the icon that best represents the item's category or purpose. For example, for "Read 'Atomic Habits'", you should choose "book-open". For "Plan Q3 marketing strategy", choose "target".
    
    Title: "${title}"
    
    Respond ONLY with a valid JSON object with a single key "iconName" containing the chosen icon name string.`;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        iconName: { 
                            type: Type.STRING,
                            // FIX: The `enum` property expects a mutable `string[]`, not a `readonly` array.
                            // Spreading into a new array `[...AVAILABLE_ICONS]` creates a mutable copy that satisfies the type.
                            enum: [...AVAILABLE_ICONS],
                            description: "The single best icon name from the provided list."
                        }
                    },
                    required: ['iconName']
                }
            }
        });
        const result = JSON.parse(response.text) as IconSuggestionResult;
        if ([...AVAILABLE_ICONS].includes(result.iconName as any)) {
            return result.iconName;
        }
        return 'sparkles'; // Fallback
    } catch (error) {
        console.error("Error suggesting icon:", error);
        return 'sparkles'; // Fallback on error
    }
};

export const generateAiFeedItems = async (aiFeedSettings: AiFeedSettings, existingTitles: string[] = []): Promise<AiGeneratedFeedItem[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();

    const { itemsPerRefresh: count, topics, customPrompt } = aiFeedSettings;
    const topicsString = (topics && topics.length > 0) ? topics.join(', ') : 'סייבר, פסיכולוגיה, כלכלה התנהגותית, שוק ההון, עסקים ופיננסים';

    const perspectives = [
        "עובדה מפתיעה או לא ידועה",
        "תחזית לעתיד הקרוב",
        "השוואה היסטורית מעניינת",
        "טיפ מעשי ליישום מיידי",
        "ניפוץ מיתוס נפוץ",
        "זווית פסיכולוגית על הנושא",
        "השפעה כלכלית נסתרת"
    ];
    const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];

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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.85, // Higher temperature for more creativity
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
                                    digest: { type: Type.STRING }
                                },
                                required: ['title', 'summary_he', 'insights', 'topics', 'tags', 'level', 'estimated_read_time_min', 'digest']
                            }
                        }
                    },
                    required: ['items']
                }
            }
        });
        const result = parseAiJson<AiFeedGenerationResponse>(response.text);
        return result.items || [];
    } catch (error) {
        console.error("Error generating AI feed items:", error);
        return [];
    }
};

export const suggestAiFeedTopics = async (existingTopics: string[]): Promise<string[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();

    const prompt = `
    אתה עוזר יצירתי שממליץ על נושאים חדשים ומעניינים לפיד ידע אישי.
    בהתבסס על הנושאים הקיימים, הצע 5 נושאים חדשים, קשורים אך שונים, בעברית.
    הימנע מהצעת נושאים שכבר קיימים ברשימה.

    נושאים קיימים: ${JSON.stringify(existingTopics)}
    
    החזר רק מערך JSON של 5 מחרוזות.
    `;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                    }
                }
            }
        });
        return JSON.parse(response.text) as string[];
    } catch (error) {
        console.error("Error suggesting AI feed topics:", error);
        throw new Error("שגיאה בהצעת נושאים חדשים.");
    }
};

/**
 * Suggests tags for a given site name for the password manager.
 * @param siteName The name of the site or service.
 * @returns A promise that resolves to an array of suggested tags.
 */
export const suggestTagsForSite = async (siteName: string): Promise<string[]> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();

    const prompt = `
    Given the site name "${siteName}", suggest up to 3 relevant tags in Hebrew from the following list: 
    ['עבודה', 'פיננסי', 'אישי', 'רשת חברתית', 'קניות', 'בידור', 'חדשות', 'נסיעות', 'בריאות', 'לימודים'].
    
    For example:
    - "GitHub" -> ["עבודה"]
    - "Bank Leumi" -> ["פיננסי"]
    - "Facebook" -> ["רשת חברתית", "אישי"]
    - "Amazon" -> ["קניות"]
    - "Netflix" -> ["בידור"]

    Respond ONLY with a JSON array of strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const tags = JSON.parse(response.text) as string[];
        return tags;
    } catch (error) {
        console.error("Error suggesting tags for site:", error);
        return [];
    }
};

/**
 * Generates a daily Comfort Zone Challenge.
 * @param difficulty The desired difficulty level.
 * @returns A promise resolving to a ChallengeGenerationResponse.
 */
export const generateComfortZoneChallenge = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<ChallengeGenerationResponse> => {
    if (!ai) throw new Error("API Key not configured.");
    const settings = loadSettings();

    const prompt = `
    Generate a single, unique, and actionable "Comfort Zone Crusher" challenge in Hebrew.
    The challenge should be designed to push the user slightly out of their social or psychological comfort zone to build resilience and confidence.
    
    Difficulty: ${difficulty}
    
    Examples (do not copy):
    - Easy: Ask a stranger for the time.
    - Medium: Compliment a stranger on their outfit.
    - Hard: Lie down on the floor in a public place for 10 seconds.

    Instructions:
    - Keep it short (under 15 words).
    - Make it specific and actionable.
    - It must be safe and legal.

    Respond ONLY with a JSON object containing "text" (string) and "difficulty" (string matching input).
    `;

    try {
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
                    },
                    required: ['text', 'difficulty']
                }
            }
        });
        
        return JSON.parse(response.text) as ChallengeGenerationResponse;
    } catch (error) {
        console.error("Error generating comfort challenge:", error);
        return { text: "צא להליכה של 10 דקות בלי הטלפון.", difficulty: 'easy' }; // Fallback
    }
};
