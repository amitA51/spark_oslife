/**
 * AI Roadmap Service Module
 * 
 * Handles roadmap generation, task breakdown, and phase management.
 */

import { Type } from '@google/genai';
import type { RoadmapPhase, SubTask } from '../../types';
import { loadSettings } from '../settingsService';
import { todayKey } from '../../utils/dateUtils';
import { ai, parseAiJson } from './geminiClient';
import { withRateLimit } from './rateLimiter';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Roadmap Functions
// ============================================================================

/**
 * Generates tasks for a specific roadmap phase.
 */
export const generateTasksForPhase = async (phaseTitle: string): Promise<RoadmapTaskResponse[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a project planning AI. Generate 3-5 specific, actionable tasks for the following roadmap phase in Hebrew.
Each task should be concise but clear.

Phase: "${phaseTitle}"

Respond with a JSON object containing a key "tasks" with an array of objects, each having a "title" field.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                },
                                required: ['title'],
                            },
                        },
                    },
                    required: ['tasks'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = JSON.parse(text) as { tasks: RoadmapTaskResponse[] };
        return result.tasks;
    });
};

/**
 * Generates a complete roadmap from a goal description.
 */
export const generateRoadmap = async (
    goal: string
): Promise<Omit<RoadmapPhase, 'id' | 'order' | 'notes'>[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();
    const today = todayKey();

    const prompt = `You are a strategic planning AI. Create a detailed roadmap in Hebrew for achieving the following goal.
Today's date is: ${today}.

Goal: "${goal}"

Generate 3-6 phases, each with:
- title: A clear phase name
- description: What this phase accomplishes (1-2 sentences)
- duration: Estimated duration (e.g., "2 שבועות", "חודש")
- tasks: 2-4 specific tasks for this phase

Make the roadmap practical and achievable. Start dates should flow logically from today.

Respond with a JSON object containing a key "phases" as an array.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = parseAiJson<RoadmapResponse>(text);

        // Transform the response into the expected format
        const start = new Date();
        return result.phases.map((phase, index) => {
            const phaseStart = new Date(start);
            phaseStart.setDate(phaseStart.getDate() + index * 14); // 2 weeks per phase by default
            const phaseEnd = new Date(phaseStart);
            phaseEnd.setDate(phaseEnd.getDate() + 14);

            return {
                title: phase.title,
                description: phase.description,
                duration: phase.duration,
                startDate: phaseStart.toISOString().split('T')[0] || '',
                endDate: phaseEnd.toISOString().split('T')[0] || '',
                tasks: phase.tasks.map((task, taskIndex) => ({
                    id: `task-${Date.now()}-${index}-${taskIndex}`,
                    title: task.title,
                    isCompleted: false,
                    order: taskIndex,
                })),
                attachments: [],
                status: index === 0 ? 'active' : 'pending' as const,
                dependencies: [],
                estimatedHours: 20,
            };
        });
    });
};

/**
 * Breaks down a roadmap task into sub-tasks.
 */
export const breakDownRoadmapTask = async (taskTitle: string): Promise<Partial<SubTask>[]> => {
    if (!ai) throw new Error('API Key not configured.');
    const settings = loadSettings();

    const prompt = `You are a task breakdown AI. Break down the following task into 3-5 smaller, actionable sub-tasks in Hebrew.
Each sub-task should be specific and completable in a single work session.

Task: "${taskTitle}"

Respond with a JSON object containing a key "subTasks" with an array of objects, each having a "title" field.`;

    return withRateLimit(async () => {
        const response = await ai!.models.generateContent({
            model: settings.aiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subTasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                },
                                required: ['title'],
                            },
                        },
                    },
                    required: ['subTasks'],
                },
            },
        });
        const text = response.text;
        if (!text) {
            throw new Error('AI response was empty.');
        }
        const result = JSON.parse(text) as SubTaskResponse;
        return result.subTasks.map((st, idx) => ({
            id: `subtask-${Date.now()}-${idx}`,
            title: st.title,
            isCompleted: false,
        }));
    });
};
