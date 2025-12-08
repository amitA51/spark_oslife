/**
 * useAISuggestions Hook
 * React hook for integrating AI-powered suggestions into the Add screen
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  aiSuggestionsService,
  Suggestion
} from '../../services/aiSuggestionsService';

interface UseAISuggestionsOptions {
  category?: string;
  title?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAISuggestionsReturn {
  suggestions: Suggestion[];
  titleSuggestions: string[];
  prioritySuggestion: { priority: 'low' | 'medium' | 'high'; reason: string } | null;
  durationSuggestion: { minutes: number; reason: string } | null;
  timeGreeting: string;
  motivationalMessage: string;
  isLoading: boolean;
  refreshSuggestions: () => void;
  recordItemCreation: (item: { type: string; category: string; title: string }) => void;
  dismissSuggestion: (id: string) => void;
  acceptSuggestion: (suggestion: Suggestion) => void;
}

export function useAISuggestions(options: UseAISuggestionsOptions = {}): UseAISuggestionsReturn {
  const { category, title, autoRefresh = false, refreshInterval = 60000 } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load suggestions
  const loadSuggestions = useCallback(() => {
    setIsLoading(true);
    try {
      const allSuggestions = aiSuggestionsService.getAllSuggestions({ category, title });
      // Filter out dismissed suggestions
      const filteredSuggestions = allSuggestions.filter(s => !dismissedIds.has(s.id));
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [category, title, dismissedIds]);

  // Initial load
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadSuggestions, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadSuggestions]);

  // Title suggestions (debounced via component)
  const titleSuggestions = useMemo(() => {
    if (!title || title.length < 2) return [];
    return aiSuggestionsService.getTitleSuggestions(title);
  }, [title]);

  // Priority suggestion based on title
  const prioritySuggestion = useMemo(() => {
    if (!title || title.length < 3) return null;
    return aiSuggestionsService.suggestPriority(title);
  }, [title]);

  // Duration suggestion based on title and category
  const durationSuggestion = useMemo(() => {
    if (!title || title.length < 3) return null;
    return aiSuggestionsService.suggestDuration(title, category || 'task');
  }, [title, category]);

  // Greeting and motivational message
  const timeGreeting = useMemo(() => {
    return aiSuggestionsService.getTimeGreeting();
  }, []);

  const motivationalMessage = useMemo(() => {
    return aiSuggestionsService.getMotivationalMessage();
  }, []);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  // Accept a suggestion (can trigger custom action)
  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    if (suggestion.action) {
      suggestion.action();
    }
    // TODO: Track acceptance for learning analytics
  }, []);

  // Record item creation for learning
  const recordItemCreation = useCallback((item: { type: string; category: string; title: string }) => {
    aiSuggestionsService.recordItemCreation(item);
    // Refresh suggestions after recording
    setTimeout(loadSuggestions, 100);
  }, [loadSuggestions]);

  // Refresh suggestions manually
  const refreshSuggestions = useCallback(() => {
    setDismissedIds(new Set()); // Reset dismissed on manual refresh
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    titleSuggestions,
    prioritySuggestion,
    durationSuggestion,
    timeGreeting,
    motivationalMessage,
    isLoading,
    refreshSuggestions,
    recordItemCreation,
    dismissSuggestion,
    acceptSuggestion,
  };
}

export default useAISuggestions;