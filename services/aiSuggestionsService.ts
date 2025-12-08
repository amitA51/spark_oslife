/**
 * AI-Powered Suggestions Service
 * Provides intelligent suggestions based on user behavior, time of day,
 * historical patterns, and contextual awareness.
 */

export interface Suggestion {
  id: string;
  type: 'field' | 'template' | 'action' | 'category' | 'time' | 'priority';
  text: string;
  description?: string;
  confidence: number; // 0-1
  icon?: string;
  action?: () => void;
  metadata?: Record<string, unknown>;
}

export interface UserBehaviorData {
  recentItems: Array<{
    type: string;
    category: string;
    createdAt: Date;
    title: string;
  }>;
  frequentCategories: Record<string, number>;
  preferredTimes: Record<string, number>;
  averageTaskDuration: number;
  completionRate: number;
}

export interface ContextualData {
  currentTime: Date;
  dayOfWeek: number;
  isWeekend: boolean;
  upcomingEvents?: Array<{ title: string; startTime: Date }>;
  recentSearches?: string[];
  currentScreen?: string;
}

// Time-based suggestion patterns
const TIME_PATTERNS = {
  morning: { start: 5, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
  night: { start: 21, end: 5 },
};

// Default templates based on time of day
const TIME_BASED_TEMPLATES: Record<string, Suggestion[]> = {
  morning: [
    {
      id: 'morning-routine',
      type: 'template',
      text: 'Morning Routine',
      description: 'Start your day with intention',
      confidence: 0.85,
      icon: '🌅',
    },
    {
      id: 'daily-planning',
      type: 'template',
      text: 'Daily Planning Session',
      description: 'Set your top 3 priorities for today',
      confidence: 0.9,
      icon: '📋',
    },
    {
      id: 'exercise-reminder',
      type: 'template',
      text: 'Morning Exercise',
      description: 'Move your body to energize',
      confidence: 0.75,
      icon: '🏃',
    },
  ],
  afternoon: [
    {
      id: 'focus-block',
      type: 'template',
      text: 'Focus Work Block',
      description: 'Deep work session - 90 minutes',
      confidence: 0.88,
      icon: '🎯',
    },
    {
      id: 'meeting-notes',
      type: 'template',
      text: 'Meeting Notes',
      description: 'Capture key takeaways',
      confidence: 0.8,
      icon: '📝',
    },
    {
      id: 'quick-break',
      type: 'template',
      text: 'Quick Break',
      description: 'Rest your eyes and stretch',
      confidence: 0.7,
      icon: '☕',
    },
  ],
  evening: [
    {
      id: 'daily-review',
      type: 'template',
      text: 'Daily Review',
      description: 'Reflect on what you accomplished',
      confidence: 0.9,
      icon: '📊',
    },
    {
      id: 'tomorrow-prep',
      type: 'template',
      text: 'Tomorrow Prep',
      description: 'Plan your top 3 for tomorrow',
      confidence: 0.85,
      icon: '🗓️',
    },
    {
      id: 'gratitude',
      type: 'template',
      text: 'Gratitude Entry',
      description: '3 things you are grateful for',
      confidence: 0.8,
      icon: '🙏',
    },
  ],
  night: [
    {
      id: 'wind-down',
      type: 'template',
      text: 'Wind Down Routine',
      description: 'Prepare for restful sleep',
      confidence: 0.85,
      icon: '🌙',
    },
    {
      id: 'quick-note',
      type: 'template',
      text: 'Quick Note',
      description: 'Capture a thought before sleep',
      confidence: 0.9,
      icon: '💭',
    },
  ],
};

// Category-based suggestions
const CATEGORY_SUGGESTIONS: Record<string, Suggestion[]> = {
  task: [
    { id: 'task-deadline', type: 'field', text: 'Add a deadline', description: 'Tasks with deadlines are 3x more likely to be completed', confidence: 0.9, icon: '📅' },
    { id: 'task-priority', type: 'field', text: 'Set priority level', description: 'High priority items get done first', confidence: 0.85, icon: '⚡' },
    { id: 'task-estimate', type: 'field', text: 'Estimate duration', description: 'Better time planning leads to success', confidence: 0.8, icon: '⏱️' },
  ],
  note: [
    { id: 'note-tags', type: 'field', text: 'Add tags for easy finding', description: 'Tagged notes are found 5x faster', confidence: 0.88, icon: '🏷️' },
    { id: 'note-link', type: 'field', text: 'Link to related items', description: 'Build your knowledge graph', confidence: 0.75, icon: '🔗' },
  ],
  habit: [
    { id: 'habit-frequency', type: 'field', text: 'Set frequency', description: 'Daily habits stick better', confidence: 0.92, icon: '🔄' },
    { id: 'habit-reminder', type: 'field', text: 'Add reminder time', description: 'Never miss a day with reminders', confidence: 0.88, icon: '⏰' },
    { id: 'habit-streak', type: 'field', text: 'Enable streak tracking', description: 'Streaks motivate consistency', confidence: 0.85, icon: '🔥' },
  ],
  event: [
    { id: 'event-location', type: 'field', text: 'Add location', description: 'Know where to be', confidence: 0.82, icon: '📍' },
    { id: 'event-attendees', type: 'field', text: 'Add attendees', description: 'Keep everyone in the loop', confidence: 0.78, icon: '👥' },
    { id: 'event-agenda', type: 'field', text: 'Add agenda', description: 'Structured meetings are 40% more effective', confidence: 0.8, icon: '📋' },
  ],
  goal: [
    { id: 'goal-milestone', type: 'field', text: 'Break into milestones', description: 'Big goals need smaller steps', confidence: 0.9, icon: '🎯' },
    { id: 'goal-measure', type: 'field', text: 'Add success metric', description: 'What gets measured gets managed', confidence: 0.88, icon: '📊' },
    { id: 'goal-deadline', type: 'field', text: 'Set target date', description: 'Goals with deadlines get achieved', confidence: 0.92, icon: '🏁' },
  ],
};

// Smart title suggestions based on input patterns
const TITLE_PATTERNS: Array<{ pattern: RegExp; suggestions: string[] }> = [
  {
    pattern: /^(call|phone|ring)/i,
    suggestions: ['Call [Name] about [Topic]', 'Schedule call with [Team]', 'Follow up call - [Subject]'],
  },
  {
    pattern: /^(meet|meeting)/i,
    suggestions: ['Meeting with [Name]', 'Team standup', '1:1 with [Manager]', 'Project kickoff'],
  },
  {
    pattern: /^(buy|shop|get|pick)/i,
    suggestions: ['Buy groceries', 'Pick up [Item]', 'Shopping list for [Event]'],
  },
  {
    pattern: /^(review|check)/i,
    suggestions: ['Review [Document]', 'Check progress on [Project]', 'Code review for [Feature]'],
  },
  {
    pattern: /^(write|draft|create)/i,
    suggestions: ['Write [Document type]', 'Draft proposal for [Topic]', 'Create presentation on [Subject]'],
  },
  {
    pattern: /^(learn|study|read)/i,
    suggestions: ['Learn about [Topic]', 'Study for [Exam/Skill]', 'Read [Book/Article]'],
  },
  {
    pattern: /^(exercise|workout|gym|run)/i,
    suggestions: ['Morning workout', '30-min run', 'Gym session', 'Yoga practice'],
  },
  {
    pattern: /^(email|send|reply)/i,
    suggestions: ['Email [Name] about [Topic]', 'Reply to [Person]', 'Send update to [Team]'],
  },
];

class AISuggestionsService {
  private userBehavior: UserBehaviorData | null = null;
  private storageKey = 'sparkos_user_behavior';

  constructor() {
    this.loadUserBehavior();
  }

  private loadUserBehavior(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.recentItems) {
          parsed.recentItems = parsed.recentItems.map((item: { createdAt: string | Date }) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          }));
        }
        this.userBehavior = parsed;
      }
    } catch (error) {
      console.warn('Failed to load user behavior data:', error);
    }
  }

  private saveUserBehavior(): void {
    try {
      if (this.userBehavior) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.userBehavior));
      }
    } catch (error) {
      console.warn('Failed to save user behavior data:', error);
    }
  }

  /**
   * Record user action for learning
   */
  recordItemCreation(item: { type: string; category: string; title: string }): void {
    if (!this.userBehavior) {
      this.userBehavior = {
        recentItems: [],
        frequentCategories: {},
        preferredTimes: {},
        averageTaskDuration: 30,
        completionRate: 0.7,
      };
    }

    // Add to recent items (keep last 50)
    this.userBehavior.recentItems.unshift({
      ...item,
      createdAt: new Date(),
    });
    if (this.userBehavior.recentItems.length > 50) {
      this.userBehavior.recentItems = this.userBehavior.recentItems.slice(0, 50);
    }

    // Update category frequency
    const category = item.category || item.type;
    this.userBehavior.frequentCategories[category] = 
      (this.userBehavior.frequentCategories[category] || 0) + 1;

    // Update preferred times
    const hour = new Date().getHours();
    const timeSlot = `hour_${hour}`;
    this.userBehavior.preferredTimes[timeSlot] = 
      (this.userBehavior.preferredTimes[timeSlot] || 0) + 1;

    this.saveUserBehavior();
  }

  /**
   * Get current time period
   */
  private getCurrentTimePeriod(): string {
    const hour = new Date().getHours();
    for (const [period, range] of Object.entries(TIME_PATTERNS)) {
      if (range.start <= range.end) {
        if (hour >= range.start && hour < range.end) return period;
      } else {
        // Handle overnight (e.g., night: 21-5)
        if (hour >= range.start || hour < range.end) return period;
      }
    }
    return 'afternoon';
  }

  /**
   * Get time-based template suggestions
   */
  getTimeBasedSuggestions(): Suggestion[] {
    const period = this.getCurrentTimePeriod();
    return TIME_BASED_TEMPLATES[period] || [];
  }

  /**
   * Get suggestions based on category selection
   */
  getCategorySuggestions(category: string): Suggestion[] {
    return CATEGORY_SUGGESTIONS[category.toLowerCase()] || [];
  }

  /**
   * Get smart title completions
   */
  getTitleSuggestions(partialTitle: string): string[] {
    if (!partialTitle || partialTitle.length < 2) return [];

    const suggestions: string[] = [];
    const lowerTitle = partialTitle.toLowerCase();

    // Check pattern matches
    for (const { pattern, suggestions: patternSuggestions } of TITLE_PATTERNS) {
      if (pattern.test(partialTitle)) {
        suggestions.push(...patternSuggestions);
      }
    }

    // Add suggestions from recent items that match
    if (this.userBehavior?.recentItems) {
      const recentMatches = this.userBehavior.recentItems
        .filter(item => item.title.toLowerCase().includes(lowerTitle))
        .map(item => item.title)
        .slice(0, 3);
      suggestions.push(...recentMatches);
    }

    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Get personalized suggestions based on user behavior
   */
  getPersonalizedSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (!this.userBehavior) {
      return this.getTimeBasedSuggestions();
    }

    // Suggest most frequent categories
    const sortedCategories = Object.entries(this.userBehavior.frequentCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sortedCategories.forEach(([category, count], index) => {
      suggestions.push({
        id: `frequent-${category}`,
        type: 'category',
        text: `Create new ${category}`,
        description: `You often create ${category}s (${count} times)`,
        confidence: 0.9 - index * 0.1,
        icon: this.getCategoryIcon(category),
      });
    });

    // Suggest based on similar recent items
    const recentItem = this.userBehavior.recentItems[0];
    if (recentItem) {
      suggestions.push({
        id: 'similar-recent',
        type: 'template',
        text: `Similar to "${recentItem.title}"`,
        description: 'Continue where you left off',
        confidence: 0.75,
        icon: '⏮️',
      });
    }

    return suggestions;
  }

  /**
   * Get all contextual suggestions
   */
  getAllSuggestions(context?: { category?: string; title?: string }): Suggestion[] {
    const allSuggestions: Suggestion[] = [];

    // Time-based suggestions
    allSuggestions.push(...this.getTimeBasedSuggestions());

    // Personalized suggestions
    allSuggestions.push(...this.getPersonalizedSuggestions());

    // Category-specific suggestions
    if (context?.category) {
      allSuggestions.push(...this.getCategorySuggestions(context.category));
    }

    // Sort by confidence and return top suggestions
    return allSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  }

  /**
   * Get smart priority suggestion based on title analysis
   */
  suggestPriority(title: string): { priority: 'low' | 'medium' | 'high'; reason: string } {
    const lowerTitle = title.toLowerCase();

    // High priority indicators
    const urgentKeywords = ['urgent', 'asap', 'important', 'critical', 'deadline', 'today', 'now', 'emergency'];
    if (urgentKeywords.some(kw => lowerTitle.includes(kw))) {
      return { priority: 'high', reason: 'Contains urgency indicators' };
    }

    // Low priority indicators
    const laterKeywords = ['someday', 'maybe', 'consider', 'optional', 'nice to have', 'when possible'];
    if (laterKeywords.some(kw => lowerTitle.includes(kw))) {
      return { priority: 'low', reason: 'Can be done later' };
    }

    return { priority: 'medium', reason: 'Standard priority' };
  }

  /**
   * Suggest estimated duration based on title and type
   */
  suggestDuration(title: string, type: string): { minutes: number; reason: string } {
    const lowerTitle = title.toLowerCase();

    // Quick tasks
    if (['quick', 'brief', 'fast', 'simple', 'short'].some(w => lowerTitle.includes(w))) {
      return { minutes: 15, reason: 'Appears to be a quick task' };
    }

    // Long tasks
    if (['deep', 'complex', 'research', 'review', 'analysis'].some(w => lowerTitle.includes(w))) {
      return { minutes: 90, reason: 'Requires focused attention' };
    }

    // Type-based defaults
    const typeDurations: Record<string, number> = {
      task: 30,
      meeting: 60,
      call: 30,
      note: 15,
      habit: 15,
      event: 60,
      goal: 120,
    };

    return {
      minutes: typeDurations[type.toLowerCase()] || 30,
      reason: `Default for ${type} type`,
    };
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      task: '✅',
      note: '📝',
      habit: '🔄',
      event: '📅',
      goal: '🎯',
      project: '📁',
      reminder: '⏰',
      idea: '💡',
    };
    return icons[category.toLowerCase()] || '📌';
  }

  /**
   * Get greeting based on time of day
   */
  getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Working late';
  }

  /**
   * Get motivational message based on user stats
   */
  getMotivationalMessage(): string {
    if (!this.userBehavior) {
      return 'Ready to make progress?';
    }

    const itemsToday = this.userBehavior.recentItems.filter(
      item => {
        const today = new Date();
        const itemDate = new Date(item.createdAt);
        return itemDate.toDateString() === today.toDateString();
      }
    ).length;

    if (itemsToday === 0) {
      return 'Start your day with a clear intention';
    } else if (itemsToday < 3) {
      return `You've added ${itemsToday} item${itemsToday > 1 ? 's' : ''} today. Keep the momentum!`;
    } else if (itemsToday < 5) {
      return 'Great progress! You are on fire today 🔥';
    } else {
      return `Impressive! ${itemsToday} items created. You are unstoppable!`;
    }
  }
}

// Export singleton instance
export const aiSuggestionsService = new AISuggestionsService();
