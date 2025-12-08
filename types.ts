import { ITEM_TYPES, PERSONAL_ITEM_TYPES } from './constants';

export type Screen =
  | 'feed'
  | 'search'
  | 'add'
  | 'today'
  | 'library'
  | 'settings'
  | 'investments'
  | 'assistant'
  | 'dashboard'
  | 'calendar'
  | 'passwords'
  | 'views'
  | 'login'
  | 'signup';
export type ItemType = (typeof ITEM_TYPES)[number];
export type PersonalItemType = (typeof PERSONAL_ITEM_TYPES)[number];

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
  imageUrl?: string;
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
  rpe?: number; // Rate of Perceived Exertion (1-10)
  restTime?: number; // Actual rest time taken in seconds
  completedAt?: string; // ISO timestamp when set was completed
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  targetRestTime?: number; // Target rest time in seconds (default: 90)
  muscleGroup?: string; // e.g., "Chest", "Back", "Legs"
  tempo?: string; // e.g., "3-0-1-0"
  notes?: string; // Exercise-level notes
  tutorialText?: string;
  lastPerformed?: {
    date: string;
    sets: WorkoutSet[];
  };
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  createdAt: string;
  muscleGroups?: string[]; // e.g., ["Chest", "Triceps"]
  tags?: string[];
  isBuiltin?: boolean;
  lastUsed?: string; // ISO timestamp when template was last used
  useCount?: number; // How many times the template was used
}

// Personal Exercise Library - התרגילים האישיים של המשתמש
export interface PersonalExercise {
  id: string;
  name: string;
  muscleGroup?: string;
  category?: 'strength' | 'cardio' | 'flexibility' | 'warmup' | 'cooldown';
  tempo?: string; // e.g., "3-0-1-0"
  defaultRestTime?: number; // זמן מנוחה ברירת מחדל (שניות)
  defaultSets?: number; // מספר סטים ברירת מחדל
  notes?: string;
  createdAt: string;
  lastUsed?: string; // ISO timestamp
  useCount?: number; // כמה פעמים השתמשו בתרגיל
  tutorialText?: string;
  isFavorite?: boolean; // מועדף לבחירה מהירה
}

export interface WorkoutTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export interface WorkoutSession {
  id: string;
  workoutItemId: string;
  startTime: string;
  endTime?: string;
  startWeight?: number; // in kg
  goalType?: WorkoutGoal;
  warmupCompleted?: boolean;
  cooldownCompleted?: boolean;
  exercises: Exercise[];
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number; // kg
  notes?: string;
}

export interface FocusSession {
  date: string; // ISO date string
  duration: number; // in minutes
}

// --- NEW ROADMAP HIERARCHY ---

export interface SubTask {
  // Level 3: A simple sub-task for a parent task
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface RoadmapTask {
  // Level 2: An actionable task within a phase
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string; // ISO Date string
  order: number;
  subTasks?: SubTask[]; // Can have its own sub-tasks
}

export interface RoadmapPhase {
  // Level 1: A major stage or step in the roadmap
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
  title?: string;
  content?: string; // Used for notes, link summaries, journal entries, book summaries
  projectId?: string; // ID of the parent goal/project
  updatedAt: string; // ISO timestamp
  tags?: string[];
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
  workoutStartTime?: string; // ISO timestamp
  workoutEndTime?: string; // ISO timestamp
  workoutDuration?: number; // Total workout duration in seconds
  workoutTemplateId?: string; // Template ID if loaded from template
  isActiveWorkout?: boolean; // True when workout is in progress

  // Task specific
  isCompleted?: boolean;
  isImportant?: boolean;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority?: 'low' | 'medium' | 'high';
  focusSessions?: FocusSession[];
  subTasks?: SubTask[];
  autoDeleteAfter?: number; // In days. 0 or undefined means never.
  isArchived?: boolean;

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
  flashcards?: { id: string; question: string; answer: string }[];

  // Metadata - Strongly typed union instead of 'any'
  metadata?:
  | WorkoutMetadata
  | LearningMetadata
  | JournalMetadata
  | GoalMetadata
  | LinkMetadata
  | BookMetadata;
}

// Specific metadata types (no 'any' allowed)

/**
 * Metadata for workout-related items
 */
export type WorkoutMetadata = {
  duration?: number; // in minutes
  feeling?: 'bad' | 'ok' | 'good' | 'great';
  calories?: number;
  notes?: string;
};

/**
 * Metadata for learning/educational items
 */
export type LearningMetadata = {
  status?: 'to-learn' | 'learning' | 'learned';
  source?: string; // URL, book title, course name, etc.
  key_takeaways?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
};

/**
 * Metadata for journal entries
 */
export type JournalMetadata = {
  mood?: 'awful' | 'bad' | 'ok' | 'good' | 'great';
  gratitude?: string[];
  highlights?: string[];
  lowlights?: string[];
};

/**
 * Metadata for goal tracking
 */
export type GoalMetadata = {
  targetDate?: string;
  milestones?: string[];
  progress?: number; // 0-100
  category?: string;
};

/**
 * Metadata for link/bookmark items (AI suggested)
 */
export type LinkMetadata = {
  suggestedTags?: string[];
  domain?: string;
  readingTime?: number; // in minutes
  isFavorite?: boolean;
};

/**
 * Metadata for book tracking
 */
export type BookMetadata = {
  bookStatus?: 'to-read' | 'reading' | 'finished';
  author?: string;
  pageCount?: number;
  currentPage?: number;
  rating?: number; // 1-5
};

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
export type AppFont =
  | 'inter'
  | 'lato'
  | 'source-code-pro'
  | 'heebo'
  | 'rubik'
  | 'alef'
  | 'poppins'
  | 'marcelo';
export type CardStyle = 'glass' | 'flat' | 'bordered';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type HomeScreenComponentId =
  | 'gratitude'
  | 'habits'
  | 'tasks'
  | 'google_calendar'
  | 'comfort_zone'
  | 'quote'
  | 'quote_comfort_row'
  | 'focus_timer';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';
export type FeedViewMode = 'list' | 'visual';
export type AnimationIntensity = 'off' | 'subtle' | 'default' | 'full';
export type AiPersonality = 'concise' | 'encouraging' | 'formal';
export type SwipeAction = 'complete' | 'delete' | 'postpone' | 'none';
export type BackgroundEffectType = 'particles' | 'dark' | 'off';

export interface ThemeSettings {
  name: string;
  accentColor: string; // hex color
  font: AppFont;
  cardStyle: CardStyle;
  backgroundEffect: BackgroundEffectType;
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

export type WorkoutGoal = 'strength' | 'hypertrophy' | 'endurance' | 'flexibility' | 'general';

export interface WorkoutSettings {
  defaultRestTime: number;
  defaultSets: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  keepAwake: boolean;
  oledMode: boolean;

  // Workout Goals & Preferences
  defaultWorkoutGoal: WorkoutGoal;
  enableWarmup: boolean;
  enableCooldown: boolean;
  warmupPreference: 'always' | 'never' | 'ask';
  cooldownPreference: 'always' | 'never' | 'ask';

  // Reminders
  waterReminderEnabled: boolean;
  waterReminderInterval: number; // minutes
  workoutRemindersEnabled: boolean;
  workoutReminderTime: string; // "HH:mm"
  reminderDays: number[]; // 0-6 (Sunday-Saturday)

  // Theme & Tracking
  selectedTheme: string; // theme id
  trackBodyWeight: boolean;
}

export interface HomeScreenComponent {
  id: HomeScreenComponentId;
  isVisible: boolean;
}

export type SpinnerVariant = 'default' | 'dots' | 'pulse' | 'orbit';

export interface VisualSettings {
  showStreaks: boolean;           // Show streak counters (habits, gratitude)
  showLegends: boolean;           // Show chart legends
  showProgressBars: boolean;      // Show auto-dismiss progress bars (StatusMessage)
  compactTooltips: boolean;       // Use compact tooltips
  spinnerVariant: SpinnerVariant; // LoadingSpinner style
}

export interface AppSettings {
  userName?: string;
  userEmoji?: string;
  aiModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  autoSummarize: boolean;
  defaultScreen: Screen;
  themeSettings: ThemeSettings;
  lastAddedType?: AddableType;
  enableIntervalTimer: boolean;
  screenLabels: Partial<Record<Screen, string>>;

  // New granular settings
  intervalTimerSettings: IntervalTimerSettings;
  homeScreenLayout: HomeScreenComponent[];
  sectionLabels: Record<HomeScreenComponentId, string>;

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
  workoutSettings: WorkoutSettings;

  // Notification Settings
  notificationsEnabled: boolean;
  taskRemindersEnabled: boolean;
  taskReminderTime: 5 | 15 | 30 | 60; // minutes before
  enableHabitReminders: boolean;


  // Swipe Settings
  swipeRightAction: SwipeAction;
  swipeLeftAction: SwipeAction;

  // Cloud Sync
  lastSyncTime?: string; // ISO date string
  googleDriveBackupId?: string;
  autoSyncEnabled?: boolean; // Default true - auto-sync settings to cloud
  syncFrequency?: 'realtime' | 'manual'; // Default realtime

  // Visual Settings for enhanced components
  visualSettings: VisualSettings;
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
export type QuoteCategory =
  | 'motivation'
  | 'stoicism'
  | 'tech'
  | 'success'
  | 'action'
  | 'dreams'
  | 'perseverance'
  | 'beginning'
  | 'sacrifice'
  | 'productivity'
  | 'possibility'
  | 'opportunity'
  | 'belief'
  | 'change'
  | 'passion'
  | 'custom';

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
  location?: string;
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

export interface Conflict<T = unknown> {
  type: 'item' | 'setting';
  path: string;
  local: T;
  remote: T;
  timestamp: string;
}

export interface Delta<T = unknown> {
  added: string[];
  modified: string[];
  deleted: string[];
  changes: Record<string, T>;
}

// --- Authentication Types ---

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface EventLog {
  id: string;
  eventType:
  | 'spark_created'
  | 'task_completed'
  | 'habit_completed'
  | 'journal_entry'
  | 'workout_completed'
  | 'focus_session';
  itemId: string;
  itemTitle: string;
  timestamp: string | Date;
  metadata?: Record<string, string | number | boolean>;
}
