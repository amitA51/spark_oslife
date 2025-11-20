/**
 * Life Correlations Engine
 * Analyzes user behavior patterns and finds correlations between different life areas
 * 
 * Example insights:
 * - "You complete 30% fewer tasks on days you skip your morning coffee habit"
 * - "Your productivity increases by 45% on days with workout sessions"  
 * - "You're more likely to journal when you get 7+ hours of sleep"
 */

import type { PersonalItem } from '../types';

// ========================================
// Types
// ========================================

export interface EventLog {
    id: string;
    timestamp: Date;
    eventType: 'habit_completed' | 'task_completed' | 'workout_completed' | 'journal_entry' | 'spark_created' | 'focus_session';
    itemId: string;
    itemTitle: string;
    metadata?: Record<string, any>;
}

export interface Correlation {
    id: string;
    variable1: string;
    variable2: string;
    correlationScore: number;
    strength: 'weak' | 'moderate' | 'strong';
    direction: 'positive' | 'negative';
    sampleSize: number;
    confidenceLevel: number;
    insight: string;
    lastUpdated: Date;
}

export interface Pattern {
    id: string;
    type: 'streak' | 'time_of_day' | 'day_of_week';
    title: string;
    description: string;
    frequency: number;
    lastSeen: Date;
}

// ========================================
// Event Logging
// ========================================

const EVENT_LOG_KEY = 'spark_event_log';

export const logEvent = (event: Omit<EventLog, 'id' | 'timestamp'>): void => {
    try {
        const eventLog = getEventLog();
        const newEvent: EventLog = {
            ...event,
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };

        eventLog.push(newEvent);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const filteredEvents = eventLog.filter(e => new Date(e.timestamp) > ninetyDaysAgo);

        localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(filteredEvents));
    } catch (error) {
        console.error('Failed to log event:', error);
    }
};

export const getEventLog = (): EventLog[] => {
    try {
        const stored = localStorage.getItem(EVENT_LOG_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return parsed.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
        }));
    } catch (error) {
        console.error('Failed to retrieve event log:', error);
        return [];
    }
};

// ========================================
// Basic Insights (placeholder for full implementation)
// ========================================

export const getInsightsSummary = (personalItems: PersonalItem[]) => {
    return {
        correlations: [],
        patterns: [],
        totalEvents: getEventLog().length,
        lastAnalysis: new Date(),
    };
};
