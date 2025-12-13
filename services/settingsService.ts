import type { AppSettings, HomeScreenComponent, ThemeSettings, AddableType } from '../types';
import { LOCAL_STORAGE_KEYS as LS } from '../constants';

// Premium Theme Collection - $100M Quality with Stunning Gradients
const defaultThemes: Record<string, ThemeSettings> = {
  // 🌌 Aurora Borealis - Ethereal Northern Lights
  aurora: {
    name: 'Aurora Borealis',
    accentColor: '#4ADE80',
    font: 'satoshi',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'xl',
    gradientStart: '#22D3EE',
    gradientEnd: '#4ADE80',
    glowColor: '#22D3EE',
    secondaryAccent: '#A78BFA',
  },

  // 🌅 Sunset Glow - Warm California Vibes
  sunset: {
    name: 'Sunset Glow',
    accentColor: '#FB923C',
    font: 'clash-display',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'lg',
    gradientStart: '#F472B6',
    gradientEnd: '#FB923C',
    glowColor: '#FB923C',
    secondaryAccent: '#FBBF24',
  },

  // 🌊 Deep Ocean - Mysterious Depths
  ocean: {
    name: 'Deep Ocean',
    accentColor: '#22D3EE',
    font: 'marcelo',
    cardStyle: 'glass',
    backgroundEffect: 'dark',
    borderRadius: 'lg',
    gradientStart: '#0EA5E9',
    gradientEnd: '#22D3EE',
    glowColor: '#0EA5E9',
    secondaryAccent: '#38BDF8',
  },

  // 🌸 Cherry Blossom - Japanese Elegance
  sakura: {
    name: 'Cherry Blossom',
    accentColor: '#F472B6',
    font: 'poppins',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'xl',
    gradientStart: '#FB7185',
    gradientEnd: '#F9A8D4',
    glowColor: '#F472B6',
    secondaryAccent: '#FBBF24',
  },

  // 💎 Diamond - Pure Luxury
  diamond: {
    name: 'Diamond',
    accentColor: '#E0E7FF',
    font: 'inter',
    cardStyle: 'bordered',
    backgroundEffect: 'dark',
    borderRadius: 'lg',
    gradientStart: '#C7D2FE',
    gradientEnd: '#F1F5F9',
    glowColor: '#818CF8',
    secondaryAccent: '#A5B4FC',
  },

  // 🔥 Ember - Fiery Passion
  ember: {
    name: 'Ember',
    accentColor: '#F87171',
    font: 'clash-display',
    cardStyle: 'flat',
    backgroundEffect: 'dark',
    borderRadius: 'md',
    gradientStart: '#EF4444',
    gradientEnd: '#FBBF24',
    glowColor: '#F87171',
    secondaryAccent: '#FB923C',
  },

  // 🌿 Forest - Natural Serenity
  forest: {
    name: 'Forest',
    accentColor: '#34D399',
    font: 'rubik',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'lg',
    gradientStart: '#059669',
    gradientEnd: '#6EE7B7',
    glowColor: '#10B981',
    secondaryAccent: '#84CC16',
  },

  // 🌙 Moonlight - Gentle Night
  moonlight: {
    name: 'Moonlight',
    accentColor: '#A5B4FC',
    font: 'satoshi',
    cardStyle: 'glass',
    backgroundEffect: 'dark',
    borderRadius: 'xl',
    gradientStart: '#6366F1',
    gradientEnd: '#C7D2FE',
    glowColor: '#818CF8',
    secondaryAccent: '#DDD6FE',
  },

  // 🎭 Noir - Classic Elegance
  noir: {
    name: 'Noir',
    accentColor: '#FBBF24',
    font: 'inter',
    cardStyle: 'bordered',
    backgroundEffect: 'dark',
    borderRadius: 'md',
    gradientStart: '#F59E0B',
    gradientEnd: '#FDE047',
    glowColor: '#FBBF24',
    secondaryAccent: '#D4D4D8',
  },

  // 🦋 Morpho - Electric Blue
  morpho: {
    name: 'Morpho',
    accentColor: '#60A5FA',
    font: 'poppins',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'xl',
    gradientStart: '#3B82F6',
    gradientEnd: '#A78BFA',
    glowColor: '#60A5FA',
    secondaryAccent: '#C084FC',
  },

  // ✨ Stardust - Magical Sparkle (Default)
  stardust: {
    name: 'Stardust',
    accentColor: '#C084FC',
    font: 'satoshi',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'xl',
    gradientStart: '#A855F7',
    gradientEnd: '#F472B6',
    glowColor: '#C084FC',
    secondaryAccent: '#FB7185',
  },

  // 🍇 Grape - Rich & Bold
  grape: {
    name: 'Grape',
    accentColor: '#A78BFA',
    font: 'marcelo',
    cardStyle: 'glass',
    backgroundEffect: 'dark',
    borderRadius: 'lg',
    gradientStart: '#7C3AED',
    gradientEnd: '#C4B5FD',
    glowColor: '#8B5CF6',
    secondaryAccent: '#DDD6FE',
  },
};

const defaultAddScreenLayout: AddableType[] = [
  'note',
  'workout',
  'roadmap',
  'learning',
  'idea',
  'book',
  'journal',
];

const defaultSettings: AppSettings = {
  userName: '',
  userEmoji: '👋',
  aiModel: 'gemini-2.0-flash',
  autoSummarize: false,
  defaultScreen: 'today',
  themeSettings: defaultThemes.stardust!,
  lastAddedType: 'task',
  enableIntervalTimer: true,
  uiDensity: 'comfortable',
  navBarLayout: ['feed', 'today', 'add', 'library', 'search'],
  enabledMentorIds: [],
  feedViewMode: 'list',
  screenLabels: {
    feed: 'פיד',
    today: 'היום',
    add: 'הוספה',
    investments: 'השקעות',
    library: 'ספרייה',
    search: 'חיפוש',
    settings: 'הגדרות',
  },
  intervalTimerSettings: {
    restDuration: 90,
    workDuration: 25 * 60,
    autoStartNext: true,
  },
  homeScreenLayout: [
    { id: 'tasks', isVisible: true },
    { id: 'quote_comfort_row', isVisible: true },
    { id: 'focus_timer', isVisible: true },
    { id: 'google_calendar', isVisible: true },
    { id: 'gratitude', isVisible: true },
  ],
  sectionLabels: {
    gratitude: 'הכרת תודה',
    habits: 'הרגלים להיום',
    tasks: 'משימות פתוחות',
    google_calendar: 'סדר יום',
    comfort_zone: 'יציאה מאזור הנוחות',
    quote: 'ציטוט יומי',
    quote_comfort_row: 'ציטוט ואתגר',
    focus_timer: 'טיימר למידה',
  },
  // New Personalization Settings
  hapticFeedback: true,
  enableSounds: true,
  animationIntensity: 'default',
  fontSizeScale: 1.0,
  addScreenLayout: defaultAddScreenLayout,
  aiPersonality: 'encouraging',
  pomodoroSettings: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  },
  aiFeedSettings: {
    isEnabled: true,
    topics: ['סייבר', 'פסיכולוגיה', 'כלכלה התנהגותית', 'שוק ההון', 'עסקים', 'פיננסים'],
    itemsPerRefresh: 3,
    customPrompt: '',
  },
  // Notification Settings
  notificationsEnabled: true,
  taskRemindersEnabled: true,
  taskReminderTime: 15,
  enableHabitReminders: true,

  // Swipe Settings
  swipeRightAction: 'complete',
  swipeLeftAction: 'postpone',

  workoutSettings: {
    defaultRestTime: 60,
    defaultSets: 3,
    soundEnabled: true,
    hapticsEnabled: true,
    keepAwake: true,
    oledMode: true,
    defaultWorkoutGoal: 'hypertrophy',
    enableWarmup: true,
    enableCooldown: true,
    warmupPreference: 'ask',
    cooldownPreference: 'ask',
    waterReminderEnabled: false,
    waterReminderInterval: 15,
    workoutRemindersEnabled: false,
    workoutReminderTime: '18:00',
    reminderDays: [],
    selectedTheme: 'deepCosmos',
    trackBodyWeight: true,
  },

  // Cloud Sync
  autoSyncEnabled: true,
  syncFrequency: 'realtime',

  // Visual Settings
  visualSettings: {
    showStreaks: true,
    showLegends: true,
    showProgressBars: true,
    compactTooltips: false,
    spinnerVariant: 'default',
    enableGlowEffects: true,
    statusMessageStyle: 'default',
    enableCelebrations: true,
  },

  // Tooltip Settings
  tooltipDelay: 'normal',

  // Extended Notification Settings
  dailyDigestEnabled: false,
  dailyDigestTime: '21:00',
  weeklyReviewEnabled: true,
  weeklyReviewDay: 0, // Sunday
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  celebrateCompletions: true,

  // 📅 Calendar Settings
  calendarSettings: {
    weekStartsOn: 0,
    timeFormat: '24h',
    dateFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    defaultEventDuration: 60,
    defaultReminderTime: 15,
    showDeclinedEvents: false,
    workingHoursEnabled: true,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
  },

  // ✅ Task Settings
  taskSettings: {
    defaultPriority: 'medium',
    defaultDueTime: '09:00',
    autoScheduleOverdue: true,
    showSubtaskProgress: true,
    autoArchiveCompleted: false,
    autoArchiveDays: 14,
    sortCompletedToBottom: true,
    showTaskAge: false,
    enableNaturalLanguage: true,
    defaultListView: 'list',
  },

  // 🧠 Smart Features
  smartFeaturesSettings: {
    smartReminders: true,
    autoTagSuggestions: true,
    duplicateDetection: true,
    smartReschedule: false,
    aiWritingAssist: true,
    autoLinkDetection: true,
    markdownEnabled: true,
    autoBacklinks: false,
  },

  // ♿ Accessibility
  accessibilitySettings: {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderOptimized: false,
    focusIndicators: true,
    colorBlindMode: 'none',
    keyboardShortcutsEnabled: true,
    autoPlayMedia: true,
  },

  // 🔒 Privacy  
  privacySettings: {
    lockAppEnabled: false,
    lockTimeout: 5,
    useBiometrics: false,
    hidePreviewsInNotifications: false,
    hideDetailsInWidgets: false,
    analyticsEnabled: true,
    crashReportsEnabled: true,
    clearDataOnLogout: false,
    incognitoMode: false,
  },

  // 💾 Backup Settings
  backupSettings: {
    autoBackupEnabled: true,
    backupFrequency: 'weekly',
    backupLocation: 'google_drive',
    backupRetentionDays: 30,
    includeAttachments: true,
    encryptBackups: false,
  },

  // ⚡ Quick Actions
  quickAddEnabled: true,
  defaultQuickAddType: 'task',
  showConfirmDialogs: true,

  // 📰 Feed Settings
  feedSettings: {
    markAsReadOnOpen: true,
    showReadItems: true,
    feedRefreshInterval: 30,
    defaultFeedSort: 'newest',
    showFeedPreviews: true,
    showReadTime: true,
    autoSummarizeAI: false,
    compactFeedView: false,
  },

  // 🔁 Habits Settings
  habitsSettings: {
    defaultReminderTime: '09:00',
    showStreakCounter: true,
    weeklyGoalDays: 5,
    showHabitStats: true,
    resetTime: '04:00',
    habitCompletionSound: true,
    showMissedHabits: true,
    groupHabitsByTime: false,
  },

  // 🏠 Home Screen Settings
  homeSettings: {
    showGreeting: true,
    greetingStyle: 'detailed',
    showDailyQuote: true,
    showProductivityScore: true,
    widgetSize: 'medium',
    showCalendarPreview: true,
    showWeatherWidget: false,
    quickActionsEnabled: true,
  },

  // ⏱️ Focus Goals
  focusGoalSettings: {
    dailyGoalMinutes: 120,
    weeklyGoalHours: 10,
    blockNotificationsDuringFocus: true,
    autoStartNextSession: false,
    showFocusStats: true,
    longBreakInterval: 4,
    longBreakDuration: 30,
  },
};

export { defaultSettings };

// Helper to merge layouts, keeping user's visibility but adding new components if they exist in default
const mergeLayouts = (
  userLayout: HomeScreenComponent[],
  defaultLayout: HomeScreenComponent[]
): HomeScreenComponent[] => {
  const userLayoutMap = new Map(userLayout.map(c => [c.id, c]));
  const newLayout = defaultLayout.map(defaultComp =>
    userLayoutMap.has(defaultComp.id) ? userLayoutMap.get(defaultComp.id)! : defaultComp
  );
  // Also ensure components user has that are no longer in default are removed
  return newLayout.filter(comp => defaultLayout.some(d => d.id === comp.id));
};

// Check if localStorage is available (handles private browsing mode)
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const loadSettings = (): AppSettings => {
  // Handle localStorage unavailability (e.g., private browsing)
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, using default settings');
    return defaultSettings;
  }

  try {
    const storedSettings = localStorage.getItem(LS.SETTINGS);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);

      // Migration for users who had 'home' as default
      if (parsed.defaultScreen === 'home') {
        parsed.defaultScreen = 'today';
      }

      // Migration from old show/hide toggles to new layout object
      if (parsed.showGratitude !== undefined && !parsed.homeScreenLayout) {
        parsed.homeScreenLayout = [
          { id: 'gratitude', isVisible: parsed.showGratitude },
          { id: 'habits', isVisible: parsed.showHabits },
          { id: 'tasks', isVisible: parsed.showTasks },
        ];
        // Clean up old properties
        delete parsed.showGratitude;
        delete parsed.showHabits;
        delete parsed.showTasks;
      }

      // MIGRATION: from simple theme string to ThemeSettings object
      if (typeof parsed.theme === 'string' && !parsed.themeSettings) {
        parsed.themeSettings =
          defaultThemes[parsed.theme as keyof typeof defaultThemes] || defaultThemes.stardust;
        delete parsed.theme;
      }

      // MIGRATION: Ensure addScreenLayout contains all possible types for existing users
      if (parsed.addScreenLayout) {
        const userLayoutSet = new Set(parsed.addScreenLayout);
        const newItems = defaultAddScreenLayout.filter(item => !userLayoutSet.has(item));
        if (newItems.length > 0) {
          parsed.addScreenLayout = [...parsed.addScreenLayout, ...newItems];
        }
      }

      // MIGRATION: Rename 'המתכנן' to 'ספרייה' in screenLabels
      if (parsed.screenLabels?.library === 'המתכנן') {
        parsed.screenLabels.library = 'ספרייה';
      }

      // Merge with defaults to ensure new settings are applied
      return {
        ...defaultSettings,
        ...parsed,
        themeSettings: {
          ...defaultSettings.themeSettings,
          ...(parsed.themeSettings || defaultThemes.stardust),
        },
        screenLabels: { ...defaultSettings.screenLabels, ...parsed.screenLabels },
        intervalTimerSettings: {
          ...defaultSettings.intervalTimerSettings,
          ...parsed.intervalTimerSettings,
        },
        sectionLabels: { ...defaultSettings.sectionLabels, ...parsed.sectionLabels },
        homeScreenLayout: parsed.homeScreenLayout
          ? mergeLayouts(parsed.homeScreenLayout, defaultSettings.homeScreenLayout)
          : defaultSettings.homeScreenLayout,
        navBarLayout:
          Array.isArray(parsed.navBarLayout) &&
            parsed.navBarLayout.length > 0 &&
            !parsed.navBarLayout.includes('investments')
            ? parsed.navBarLayout
            : defaultSettings.navBarLayout,
        enabledMentorIds: parsed.enabledMentorIds || [],
        pomodoroSettings: { ...defaultSettings.pomodoroSettings, ...parsed.pomodoroSettings },
        aiFeedSettings: { ...defaultSettings.aiFeedSettings, ...parsed.aiFeedSettings },
        visualSettings: { ...defaultSettings.visualSettings, ...parsed.visualSettings },
        // New settings mergers
        calendarSettings: { ...defaultSettings.calendarSettings, ...parsed.calendarSettings },
        taskSettings: { ...defaultSettings.taskSettings, ...parsed.taskSettings },
        smartFeaturesSettings: { ...defaultSettings.smartFeaturesSettings, ...parsed.smartFeaturesSettings },
        accessibilitySettings: { ...defaultSettings.accessibilitySettings, ...parsed.accessibilitySettings },
        privacySettings: { ...defaultSettings.privacySettings, ...parsed.privacySettings },
        backupSettings: { ...defaultSettings.backupSettings, ...parsed.backupSettings },
        // Additional settings mergers
        feedSettings: { ...defaultSettings.feedSettings, ...parsed.feedSettings },
        habitsSettings: { ...defaultSettings.habitsSettings, ...parsed.habitsSettings },
        homeSettings: { ...defaultSettings.homeSettings, ...parsed.homeSettings },
        focusGoalSettings: { ...defaultSettings.focusGoalSettings, ...parsed.focusGoalSettings },
      };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    // Remove deprecated properties before saving using destructuring
    const {
      showGratitude: _g,
      showHabits: _h,
      showTasks: _t,
      theme: _theme,
      ...settingsToSave
    } = settings as typeof settings & {
      showGratitude?: unknown;
      showHabits?: unknown;
      showTasks?: unknown;
      theme?: unknown;
    };

    localStorage.setItem(LS.SETTINGS, JSON.stringify(settingsToSave));
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
};
