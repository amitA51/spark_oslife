
import type { AppSettings, Screen, HomeScreenComponent, ThemeSettings, UiDensity, AddableType, AnimationIntensity, AiPersonality } from '../types';
import { LOCAL_STORAGE_KEYS as LS } from '../constants';
import { PERSONAL_ITEM_TYPES } from '../constants';

// Updated Themes with Premium, Subtle, and Delicate Colors
const defaultThemes: Record<string, ThemeSettings> = {
    nebula: { name: 'Nebula', accentColor: '#C4B5FD', font: 'inter', cardStyle: 'glass', backgroundEffect: true, borderRadius: 'lg' }, // Soft Violet (Violet 300)
    emerald: { name: 'Sage', accentColor: '#6EE7B7', font: 'inter', cardStyle: 'glass', backgroundEffect: true, borderRadius: 'lg' }, // Soft Emerald (Emerald 300)
    gold: { name: 'Champagne', accentColor: '#FDE047', font: 'lato', cardStyle: 'flat', backgroundEffect: false, borderRadius: 'md' }, // Soft Yellow (Yellow 300)
    oceanic: { name: 'Glacier', accentColor: '#7DD3FC', font: 'inter', cardStyle: 'flat', backgroundEffect: false, borderRadius: 'lg' }, // Soft Sky (Sky 300)
    crimson: { name: 'Rose', accentColor: '#FDA4AF', font: 'rubik', cardStyle: 'bordered', backgroundEffect: false, borderRadius: 'md' }, // Soft Rose (Rose 300)
    midnight: { name: 'Midnight', accentColor: '#818CF8', font: 'inter', cardStyle: 'glass', backgroundEffect: true, borderRadius: 'xl' } // Soft Indigo (Indigo 400)
};

const defaultAddScreenLayout: AddableType[] = [
    'spark', 'task', 'note', 'link', 'idea', 'learning', 
    'book', 'journal', 'workout', 'goal', 'roadmap', 'ticker'
];

const defaultSettings: AppSettings = {
  userName: '',
  userEmoji: '👋',
  aiModel: 'gemini-2.5-flash',
  autoSummarize: false,
  defaultScreen: 'today',
  themeSettings: defaultThemes.nebula,
  lastAddedType: 'task',
  enableIntervalTimer: true,
  enablePeriodicSync: false,
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
    { id: 'google_calendar', isVisible: true },
    { id: 'comfort_zone', isVisible: true },
    { id: 'gratitude', isVisible: true },
    { id: 'habits', isVisible: true },
    { id: 'tasks', isVisible: true },
  ],
  sectionLabels: {
    gratitude: 'הכרת תודה',
    habits: 'הרגלים להיום',
    tasks: 'משימות פתוחות',
    google_calendar: 'סדר יום',
    comfort_zone: 'יציאה מאזור הנוחות',
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
  feedUpdatesEnabled: false,
  aiSuggestionsEnabled: false,

  // Swipe Settings
  swipeRightAction: 'complete',
  swipeLeftAction: 'postpone',
};

// Helper to merge layouts, keeping user's visibility but adding new components if they exist in default
const mergeLayouts = (userLayout: HomeScreenComponent[], defaultLayout: HomeScreenComponent[]): HomeScreenComponent[] => {
    const userLayoutMap = new Map(userLayout.map(c => [c.id, c]));
    const newLayout = defaultLayout.map(defaultComp => 
        userLayoutMap.has(defaultComp.id) 
            ? userLayoutMap.get(defaultComp.id)! 
            : defaultComp
    );
    // Also ensure components user has that are no longer in default are removed
    return newLayout.filter(comp => defaultLayout.some(d => d.id === comp.id));
}


export const loadSettings = (): AppSettings => {
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
          parsed.themeSettings = defaultThemes[parsed.theme as keyof typeof defaultThemes] || defaultThemes.nebula;
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
          themeSettings: { ...defaultSettings.themeSettings, ...parsed.themeSettings },
          screenLabels: { ...defaultSettings.screenLabels, ...parsed.screenLabels },
          intervalTimerSettings: { ...defaultSettings.intervalTimerSettings, ...parsed.intervalTimerSettings },
          sectionLabels: { ...defaultSettings.sectionLabels, ...parsed.sectionLabels },
          homeScreenLayout: parsed.homeScreenLayout ? mergeLayouts(parsed.homeScreenLayout, defaultSettings.homeScreenLayout) : defaultSettings.homeScreenLayout,
          navBarLayout: (Array.isArray(parsed.navBarLayout) && parsed.navBarLayout.length > 0 && !parsed.navBarLayout.includes('investments')) ? parsed.navBarLayout : defaultSettings.navBarLayout,
          enabledMentorIds: parsed.enabledMentorIds || [],
          pomodoroSettings: { ...defaultSettings.pomodoroSettings, ...parsed.pomodoroSettings },
          aiFeedSettings: { ...defaultSettings.aiFeedSettings, ...parsed.aiFeedSettings },
      };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage", error);
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
    console.error("Failed to save settings to localStorage", error);
  }
};
