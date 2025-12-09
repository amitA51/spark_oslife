import type { AppSettings, HomeScreenComponent, ThemeSettings, AddableType } from '../types';
import { LOCAL_STORAGE_KEYS as LS } from '../constants';

// Updated Themes with Premium, Subtle, and Delicate Colors
const defaultThemes: Record<string, ThemeSettings> = {
  nebula: {
    name: 'Nebula',
    accentColor: '#C4B5FD',
    font: 'marcelo',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'lg',
  },
  emerald: {
    name: 'Sage',
    accentColor: '#6EE7B7',
    font: 'marcelo',
    cardStyle: 'glass',
    backgroundEffect: 'particles',
    borderRadius: 'lg',
  },
  gold: {
    name: 'Champagne',
    accentColor: '#FDE047',
    font: 'marcelo',
    cardStyle: 'flat',
    backgroundEffect: 'dark',
    borderRadius: 'md',
  },
  oceanic: {
    name: 'Glacier',
    accentColor: '#7DD3FC',
    font: 'marcelo',
    cardStyle: 'flat',
    backgroundEffect: 'off',
    borderRadius: 'lg',
  },
  crimson: {
    name: 'Rose',
    accentColor: '#FDA4AF',
    font: 'marcelo',
    cardStyle: 'bordered',
    backgroundEffect: 'off',
    borderRadius: 'md',
  },
  midnight: {
    name: 'Midnight',
    accentColor: '#818CF8',
    font: 'marcelo',
    cardStyle: 'glass',
    backgroundEffect: 'dark',
    borderRadius: 'xl',
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
  aiModel: 'gemini-2.5-flash',
  autoSummarize: false,
  defaultScreen: 'today',
  themeSettings: defaultThemes.nebula!,
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
    library: 'המתכנן',
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
  },

  // Tooltip Settings
  tooltipDelay: 'normal',
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
          defaultThemes[parsed.theme as keyof typeof defaultThemes] || defaultThemes.nebula;
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

      // Merge with defaults to ensure new settings are applied
      return {
        ...defaultSettings,
        ...parsed,
        themeSettings: {
          ...defaultSettings.themeSettings,
          ...(parsed.themeSettings || defaultThemes.nebula),
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
      };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    // Remove deprecated properties before saving
    const settingsToSave = { ...settings };
    delete (settingsToSave as any).showGratitude;
    delete (settingsToSave as any).showHabits;
    delete (settingsToSave as any).showTasks;
    delete (settingsToSave as any).theme;

    localStorage.setItem(LS.SETTINGS, JSON.stringify(settingsToSave));
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
};
