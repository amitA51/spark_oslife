/**
 * AI Services Index
 * 
 * Re-exports all AI utilities for convenient single-import access.
 * This module provides a unified API for all AI functionality.
 * 
 * @module ai
 * @version 2.0.0 - Enhanced with monitoring and stability features
 */

// Core client and utilities
export {
    ai,
    isAiAvailable,
    parseAiJson,
    loadSettings,
    // Health check
    getAIHealthStatus,
    checkAIConnectivity,
    type AIHealthStatus,
    // Error handling
    parseAIError,
    type AIErrorInfo,
} from './geminiClient';

// Rate limiting with circuit breaker
export {
    RateLimiter,
    rateLimiter,
    withRateLimit,
    type RateLimiterMetrics,
    type CircuitState,
} from './rateLimiter';

// Response caching with metrics
export {
    ResponseCache,
    aiResponseCache,
    type CacheMetrics,
} from './responseCache';

// Search functionality
export {
    performAiSearch,
    universalAiSearch,
    findRelatedItems,
    findRelatedPersonalItems,
} from './searchService';

// NLP and parsing
export {
    extractTextFromImage,
    parseNaturalLanguageTask,
    smartParseInput,
    parseNaturalLanguageInput,
} from './nlpService';

// Content generation
export {
    summarizeItemContent,
    generateMentorContent,
    synthesizeContent,
    generateDailyBriefing,
    generateProductivityForecast,
    summarizeSpaceContent,
    generateFlashcards,
    generateComfortZoneChallenge,
} from './contentService';

// Roadmap generation
export {
    generateTasksForPhase,
    generateRoadmap,
    breakDownRoadmapTask,
} from './roadmapService';

// AI suggestions  
export {
    suggestIconForTitle,
    suggestAiFeedTopics,
    suggestExercises,
    suggestTagsForSite,
} from './suggestionsService';

// Chat and assistant
export {
    createAssistantChat,
    getExerciseTutorial,
    askExerciseQuestion,
    type ExerciseChatMessage,
} from './chatService';

// Feed generation
export {
    getUrlMetadata,
    generateAiFeedItems,
    type AiGeneratedFeedItem,
} from './feedService';

// Centralized metrics and monitoring
export {
    aiMetrics,
    getAIMetrics,
    getAIMetricsSummary,
    recordAIRequest,
    takeMetricsSnapshot,
    logAIMetrics,
    type AIServiceMetrics,
    type PerformanceMetrics,
    type MetricsSnapshot,
} from './aiMetrics';
