

import { ITEM_TYPES, PERSONAL_ITEM_TYPES } from './constants';

export type Screen = 'feed' | 'search' | 'add' | 'today' | 'library' | 'settings' | 'investments' | 'assistant' | 'dashboard' | 'calendar' | 'passwords';
export type ItemType = typeof ITEM_TYPES[number];
export type PersonalItemType = typeof PERSONAL_ITEM_TYPES[number];

export interface Tag {
  id: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  icon: string; // Icon identifier
  color: string; // Hex color or CSS variable
  type: 'personal' | 'feed';
  order: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'drive' | 'local';
  url: string; // Google Drive link or Data URL for local file
  mimeType: string;
  size: number; // in bytes
}

export interface FeedItem {
  id: string;
  type: 'rss' | 'spark' | 'news' | 'mentor';
  title: string;
  link?: string;
  content: string;
  summary_ai?: string;
  is_read: boolean;
  is_spark: boolean;
  isImportant?: boolean;
  tags: Tag[];
  createdAt: string;
  attachments?: Attachment[];
  source?: string; // e.g., 'BTC' for news, RSS feed ID, or mentor ID `mentor:jordan-peterson`
  insights?: string[];
  topics?: string[];
  level?: string;
  estimated_read_time_min?: number;
  source_trust_score?: number;
  digest?: string;
}

export interface RssFeed {
  id: string;
  url: string;
  name: string;
  spaceId?: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface FocusSession {
  date: string; // ISO date string
  duration: number; // in minutes
}

// --- NEW ROADMAP HIERARCHY ---

export interface SubTask { // Level 3: A simple sub-task for a parent task
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface RoadmapTask { // Level 2: An actionable task within a phase
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  subTasks?: SubTask[]; // Can have its own sub-tasks
}

export interface RoadmapPhase { // Level 1: A major stage or step in the roadmap
  id: string;
  title: string;
  description: string;
  duration: string; // Deprecated, but kept for old data. New logic uses dates.
  startDate: string; // ISO Date string 'YYYY-MM-DD'
  endDate: string; // ISO Date string 'YYYY-MM-DD'
  notes?: string;
  tasks: RoadmapTask[];
  order: number;
  attachments: Attachment[];
  status: 'pending' | 'active' | 'completed';
  dependencies: string[]; // Array of other phase IDs this phase depends on
  estimatedHours: number;
  // New fields for premium features
  aiSummary?: string;
  aiActions?: string[];
  aiQuote?: string;
}


export interface SubHabit {
  id: string;
  title: string;
}

export interface PersonalItem {
  id: string;
  type: PersonalItemType;
  createdAt: string;
  title: string;
  content: string; // Used for notes, link summaries, journal entries, book summaries
  projectId?: string; // ID of the parent goal/project
  spaceId?: string; // New: For categorization into Spaces
  attachments?: Attachment[];
  icon?: string; // Icon identifier for the item
  order?: number; // For user-defined ordering

  // Link specific
  url?: string;
  domain?: string;
  imageUrl?: string;

  // Workout specific
  exercises?: Exercise[];

  // Task specific
  isCompleted?: boolean;
  isImportant?: boolean;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority?: 'low' | 'medium' | 'high';
  focusSessions?: FocusSession[];
  subTasks?: SubTask[];
  autoDeleteAfter?: number; // In days. 0 or undefined means never.

  // Habit specific
  habitType?: 'good' | 'bad'; // 'good' = build habit, 'bad' = quit habit
  streak?: number;
  lastCompleted?: string; // ISO date string (For 'bad' habits, this is the last Relapse date)
  completionHistory?: { date: string }[];
  frequency?: 'daily' | 'weekly';
  reminderEnabled?: boolean;
  reminderTime?: string; // "HH:mm" format
  subHabits?: SubHabit[];
  lastCompletedSubHabits?: Record<string, string>; // { [subHabitId]: ISO_DATE_STRING }

  // Book specific
  author?: string;
  totalPages?: number;
  currentPage?: number;
  quotes?: string[];
  coverImageUrl?: string;

  // Roadmap specific
  phases?: RoadmapPhase[]; // Replaces 'steps' with the new hierarchical structure

  // For Kanban board view
  status?: 'todo' | 'doing' | 'done';

  // Learning specific
  flashcards?: { id: string; question: string; answer: string; }[];

  // Metadata for various types
  metadata?: {
    // For workouts
    duration?: number; // in minutes
    feeling?: 'bad' | 'ok' | 'good' | 'great';
    // For learning
    status?: 'to-learn' | 'learning' | 'learned';
    source?: string; // Can be a URL, but also a book title etc.
    key_takeaways?: string[];
    // For goals
    targetDate?: string;
    // For journal
    mood?: 'awful' | 'bad' | 'ok' | 'good' | 'great';
    // For links (AI suggested)
    suggestedTags?: string[];
    // For books
    bookStatus?: 'to-read' | 'reading' | 'finished';
  };
}

export interface Template {
  id: string;
  name: string;
  type: PersonalItem['type'];
  // The content is a partial PersonalItem that holds the template data
  content: Partial<PersonalItem>;
}

// --- Comfort Zone Challenge ---
export interface ComfortZoneChallenge {
  id: string;
  date: string; // ISO Date (day)
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'hidden' | 'active' | 'completed' | 'failed';
  revealedAt?: string; // ISO Timestamp
}


// --- New Types for Settings and Data Management ---

export type AddableType = PersonalItemType | 'spark' | 'ticker';
export type AppFont = 'inter' | 'lato' | 'source-code-pro' | 'heebo' | 'rubik' | 'alef' | 'poppins';
export type CardStyle = 'glass' | 'flat' | 'bordered';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type HomeScreenComponentId = 'gratitude' | 'habits' | 'tasks' | 'google_calendar' | 'comfort_zone';
export type UiDensity = 'comfortable' | 'compact';
export type FeedViewMode = 'list' | 'visual';
export type AnimationIntensity = 'off' | 'subtle' | 'default' | 'full';
export type AiPersonality = 'concise' | 'encouraging' | 'formal';
export type SwipeAction = 'complete' | 'delete' | 'postpone' | 'none';

export interface ThemeSettings {
  name: string; // e.g., "Gold", "Crimson", "Custom"
  accentColor: string; // hex color
  font: AppFont;
  cardStyle: CardStyle;
  backgroundEffect: boolean;
  borderRadius: BorderRadius;
  // New Customizations
  backgroundImage?: string; // Data URL
  fontWeight?: 'normal' | 'medium' | 'bold';
  uiScale?: number; // 0.8 to 1.2
}

export interface IntervalTimerSettings {
  restDuration: number; // in seconds
  workDuration: number; // in seconds
  autoStartNext: boolean;
}

export interface AiFeedSettings {
  isEnabled: boolean;
  topics: string[];
  itemsPerRefresh: number;
  customPrompt: string;
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreak: number; // minutes
  longBreak: number; // minutes
  sessionsUntilLongBreak: number;
}

export interface HomeScreenComponent {
  id: HomeScreenComponentId;
  isVisible: boolean;
}

export interface AppSettings {
  userName?: string;
  userEmoji?: string;
  aiModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  autoSummarize: boolean;
  defaultScreen: 'feed' | 'today';
  themeSettings: ThemeSettings;
  lastAddedType?: AddableType;
  enableIntervalTimer: boolean;
  screenLabels: Partial<Record<Screen, string>>;

  // New granular settings
  intervalTimerSettings: IntervalTimerSettings;
  homeScreenLayout: HomeScreenComponent[];
  sectionLabels: Record<HomeScreenComponentId, string>;
  enablePeriodicSync: boolean; // Added for PWA background sync
  uiDensity: UiDensity;
  navBarLayout: Screen[];
  enabledMentorIds: string[];
  feedViewMode: FeedViewMode;

  // Personalization
  hapticFeedback: boolean;
  enableSounds: boolean;
  animationIntensity: AnimationIntensity;
  fontSizeScale: number;
  addScreenLayout: AddableType[];
  aiPersonality: AiPersonality;
  pomodoroSettings: PomodoroSettings;
  aiFeedSettings: AiFeedSettings;

  // Notification Settings
  notificationsEnabled: boolean;
  taskRemindersEnabled: boolean;
  taskReminderTime: 5 | 15 | 30 | 60; // minutes before
  enableHabitReminders: boolean;
  feedUpdatesEnabled: boolean;
  aiSuggestionsEnabled: boolean;

  // Swipe Settings
  swipeRightAction: SwipeAction;
  swipeLeftAction: SwipeAction;

  // Cloud Sync
  lastSyncTime?: string; // ISO date string
  googleDriveBackupId?: string;

  // Dashboard Widgets
  dashboardLayouts?: DashboardLayout[];
  activeDashboardId?: string;
}

// --- Widget System Types ---
export type WidgetType =
  | 'tasks-today'
  | 'habits-tracker'
  | 'calendar-upcoming'
  | 'quote-daily'
  | 'productivity-stats'
  | 'recent-notes'
  | 'roadmap-progress';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: { x: number; y: number; w: number; h: number };
  settings?: Record<string, any>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  isDefault?: boolean;
}

export interface WatchlistItem {
  id: string; // e.g., 'bitcoin' for crypto, 'TSLA' for stock
  name: string; // e.g., 'Bitcoin', 'Tesla Inc.'
  ticker: string; // e.g., 'BTC', 'TSLA'
  type: 'crypto' | 'stock';
}

export interface FinancialAsset extends WatchlistItem {
  price?: number;
  change24h?: number;
  marketCap?: number;
  sparkline?: number[]; // for 7d chart
  dailyChart?: { time: number; price: number }[];
}

export interface AppData {
  tags: Tag[];
  rssFeeds: RssFeed[];
  feedItems: FeedItem[];
  personalItems: PersonalItem[];
  templates: Template[];
  watchlist: WatchlistItem[];
  spaces: Space[];
  customMentors: Mentor[];
  customQuotes: Quote[];
}

export interface ExportData {
  settings: AppSettings;
  data: AppData;
  exportDate: string;
  version: number;
}

// --- New Mentor Types ---
export interface Mentor {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean; // To identify user-added mentors
  quotes: string[]; // The AI-generated or default content
}

// --- Quote System Types ---
export type QuoteCategory = 'motivation' | 'stoicism' | 'tech' | 'success' | 'action' | 'dreams' | 'perseverance' | 'beginning' | 'sacrifice' | 'productivity' | 'possibility' | 'opportunity' | 'belief' | 'change' | 'passion' | 'custom';

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: QuoteCategory;
  backgroundImage?: string; // Optional URL or data URL
  isCustom?: boolean;
}

// --- Google Calendar Integration Types ---
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
  // Enhanced fields for Spark integration
  sparkTaskId?: string; // Link to a task in Spark
  isBlockedTime?: boolean; // Whether this is a time block for a task
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

// --- New Types for Password Manager ---
export interface EncryptedField {
  iv: string;
  data: string; // encrypted string
}
export interface PasswordItem {
  id: string;
  site: string;
  username: string;
  password: string | EncryptedField;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isSensitive?: boolean;
}

export interface EncryptedVault {
  iv: string;
  data: string; // encrypted JSON of PasswordItem[] (where some passwords may be EncryptedField)
  salt: string; // base64 encoded
  iterations: number;
  lastBackup?: string; // ISO date string
}

export interface ProductivityForecast {
  score: number; // 0-100
  forecastText: string; // A short, insightful sentence
}

export interface NlpResult {
  type: 'task' | 'note' | 'habit' | 'idea';
  title: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: 'low' | 'medium' | 'high';
  suggestedSpaceId?: string;
}

export type SplitScreenComponentId = 'dashboard' | 'feed' | 'assistant';

export interface SplitViewConfig {
  isActive: boolean;
  left: SplitScreenComponentId;
  right: SplitScreenComponentId;
}

// --- Universal Search Types ---
export type UniversalSearchResultType = PersonalItemType | FeedItem['type'] | 'calendar';
export interface UniversalSearchResult {
  id: string;
  type: UniversalSearchResultType;
  title: string;
  content: string;
  date: string; // ISO string
  item: PersonalItem | FeedItem | GoogleCalendarEvent;
}
export type FilterDateRange = 'all' | 'today' | 'week' | 'month';
export interface SearchFilters {
  type: 'all' | UniversalSearchResultType;
  dateRange: FilterDateRange;
  status: 'all' | 'open' | 'completed' | 'important';
}

// --- Sync Types ---
export interface SyncState {
  status: 'idle' | 'syncing' | 'conflict' | 'error';
  lastSyncTime?: string;
  lastError?: string;
  conflictCount: number;
}

export interface Conflict {
  type: 'item' | 'setting';
  path: string;
  local: any;
  remote: any;
  timestamp: string;
}

export interface Delta {
  added: string[];
  modified: string[];
  deleted: string[];
  changes: Record<string, any>;
}