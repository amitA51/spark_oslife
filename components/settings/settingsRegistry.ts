/**
 * Settings Registry - Central searchable index for all settings
 * Maps settings to categories, keywords, and navigation targets
 */

export interface SettingItem {
    id: string;
    title: string;
    description: string;
    keywords: string[]; // Hebrew + English search terms
    category: SettingsCategory;
    icon?: string;
    type: 'toggle' | 'select' | 'slider' | 'action' | 'link';
}

export type SettingsCategory =
    | 'profile'
    | 'appearance'
    | 'behavior'
    | 'interface'
    | 'focus'
    | 'workout'
    | 'ai'
    | 'sync'
    | 'data'
    | 'about'
    | 'notifications'
    | 'calendar'
    | 'tasks'
    | 'smart'
    | 'accessibility'
    | 'privacy';

export interface CategoryInfo {
    id: SettingsCategory;
    title: string;
    icon: string;
    gradient: [string, string];
    count: number;
}

export const CATEGORIES: CategoryInfo[] = [
    { id: 'profile', title: 'פרופיל', icon: '◉', gradient: ['#8B5CF6', '#A78BFA'], count: 2 },
    { id: 'appearance', title: 'מראה', icon: '◐', gradient: ['#F59E0B', '#FBBF24'], count: 8 },
    { id: 'behavior', title: 'התנהגות', icon: '⚙', gradient: ['#6366F1', '#818CF8'], count: 6 },
    { id: 'interface', title: 'ממשק', icon: '⊞', gradient: ['#10B981', '#34D399'], count: 5 },
    { id: 'notifications', title: 'התראות', icon: '◎', gradient: ['#F59E0B', '#F97316'], count: 6 },
    { id: 'calendar', title: 'לוח שנה', icon: '▦', gradient: ['#14B8A6', '#2DD4BF'], count: 7 },
    { id: 'tasks', title: 'משימות', icon: '☑', gradient: ['#22C55E', '#4ADE80'], count: 9 },
    { id: 'smart', title: 'תכונות חכמות', icon: '◈', gradient: ['#A855F7', '#C084FC'], count: 8 },
    { id: 'focus', title: 'פוקוס', icon: '◴', gradient: ['#EC4899', '#F472B6'], count: 4 },
    { id: 'workout', title: 'אימון', icon: '◆', gradient: ['#EF4444', '#F87171'], count: 7 },
    { id: 'ai', title: 'AI', icon: '◇', gradient: ['#06B6D4', '#22D3EE'], count: 3 },
    { id: 'accessibility', title: 'נגישות', icon: '◷', gradient: ['#0EA5E9', '#38BDF8'], count: 8 },
    { id: 'privacy', title: 'פרטיות', icon: '◍', gradient: ['#8B5CF6', '#7C3AED'], count: 9 },
    { id: 'sync', title: 'סנכרון', icon: '◌', gradient: ['#3B82F6', '#60A5FA'], count: 4 },
    { id: 'data', title: 'גיבוי', icon: '▣', gradient: ['#84CC16', '#A3E635'], count: 6 },
    { id: 'about', title: 'אודות', icon: '◯', gradient: ['#8B5CF6', '#C4B5FD'], count: 3 },
];

export const SETTINGS_REGISTRY: SettingItem[] = [
    // Profile
    { id: 'user-name', title: 'שם משתמש', description: 'השם שלך באפליקציה', keywords: ['שם', 'משתמש', 'name', 'user', 'profile'], category: 'profile', type: 'action' },
    { id: 'user-emoji', title: 'אימוג\'י', description: 'האימוג\'י שמייצג אותך', keywords: ['אימוג\'י', 'emoji', 'avatar', 'אווטר'], category: 'profile', type: 'action' },

    // Appearance
    { id: 'theme', title: 'ערכת נושא', description: 'בחר את העיצוב הכללי', keywords: ['ערכה', 'נושא', 'theme', 'עיצוב', 'צבע'], category: 'appearance', type: 'action' },
    { id: 'accent-color', title: 'צבע הדגשה', description: 'הצבע הראשי של האפליקציה', keywords: ['צבע', 'הדגשה', 'color', 'accent', 'ראשי'], category: 'appearance', type: 'action' },
    { id: 'font', title: 'גופן', description: 'סוג הפונט באפליקציה', keywords: ['גופן', 'פונט', 'font', 'טקסט'], category: 'appearance', type: 'select' },
    { id: 'font-size', title: 'גודל גופן', description: 'גודל הטקסט', keywords: ['גודל', 'גופן', 'font', 'size', 'טקסט'], category: 'appearance', type: 'slider' },
    { id: 'border-radius', title: 'עיצוב פינות', description: 'סגנון פינות הכרטיסים', keywords: ['פינות', 'עגול', 'radius', 'corners'], category: 'appearance', type: 'select' },
    { id: 'card-style', title: 'סגנון כרטיסים', description: 'מראה הרכיבים', keywords: ['כרטיס', 'סגנון', 'card', 'style', 'זכוכית'], category: 'appearance', type: 'select' },
    { id: 'background', title: 'רקע', description: 'אפקט הרקע', keywords: ['רקע', 'background', 'particles', 'חלקיקים'], category: 'appearance', type: 'select' },
    { id: 'ui-scale', title: 'קנה מידה', description: 'הגדל/הקטן את הממשק', keywords: ['קנה', 'מידה', 'scale', 'zoom', 'גודל'], category: 'appearance', type: 'slider' },

    // Behavior
    { id: 'sounds', title: 'צלילים', description: 'אפקטים קוליים', keywords: ['צליל', 'sound', 'קול', 'audio', 'סאונד'], category: 'behavior', type: 'toggle' },
    { id: 'haptics', title: 'רטט', description: 'משוב רטט בלחיצות', keywords: ['רטט', 'haptic', 'vibration', 'ויברציה'], category: 'behavior', type: 'toggle' },
    { id: 'animations', title: 'אנימציות', description: 'עוצמת האנימציות', keywords: ['אנימציה', 'animation', 'תנועה', 'motion'], category: 'behavior', type: 'select' },
    { id: 'density', title: 'צפיפות', description: 'צפיפות התצוגה', keywords: ['צפיפות', 'density', 'ריווח', 'spacing'], category: 'behavior', type: 'select' },
    { id: 'tooltips', title: 'Tooltips', description: 'מהירות הופעת תיאורים', keywords: ['tooltip', 'עזרה', 'תיאור', 'tip'], category: 'behavior', type: 'select' },
    { id: 'streaks', title: 'רצפים', description: 'הצג מונה ימים רצופים', keywords: ['רצף', 'streak', 'ימים', 'days'], category: 'behavior', type: 'toggle' },

    // Interface
    { id: 'default-screen', title: 'מסך ברירת מחדל', description: 'המסך שנפתח בהפעלה', keywords: ['מסך', 'ברירת מחדל', 'default', 'screen', 'התחלה'], category: 'interface', type: 'select' },
    { id: 'navbar', title: 'סרגל ניווט', description: 'מסכים בסרגל התחתון', keywords: ['ניווט', 'navbar', 'navigation', 'סרגל', 'תחתון'], category: 'interface', type: 'action' },
    { id: 'feed-view', title: 'תצוגת פיד', description: 'סגנון הפיד', keywords: ['פיד', 'feed', 'תצוגה', 'רשימה', 'list'], category: 'interface', type: 'select' },
    { id: 'swipe-actions', title: 'פעולות החלקה', description: 'הגדר פעולות סוויפ', keywords: ['החלקה', 'swipe', 'סוויפ', 'gesture'], category: 'interface', type: 'action' },
    { id: 'add-menu', title: 'תפריט הוספה', description: 'פריטים בתפריט הוספה', keywords: ['הוספה', 'add', 'menu', 'תפריט', 'יצירה'], category: 'interface', type: 'action' },

    // Focus
    { id: 'work-duration', title: 'זמן עבודה', description: 'משך סשן פוקוס', keywords: ['עבודה', 'work', 'זמן', 'duration', 'פומודורו'], category: 'focus', type: 'slider' },
    { id: 'break-duration', title: 'זמן הפסקה', description: 'משך ההפסקה', keywords: ['הפסקה', 'break', 'מנוחה', 'rest'], category: 'focus', type: 'slider' },
    { id: 'auto-start', title: 'התחלה אוטומטית', description: 'התחל סשן אוטומטית', keywords: ['אוטומטי', 'auto', 'start', 'התחלה'], category: 'focus', type: 'toggle' },
    { id: 'focus-sounds', title: 'צלילי פוקוס', description: 'צלילים במהלך פוקוס', keywords: ['צליל', 'sound', 'פוקוס', 'focus'], category: 'focus', type: 'select' },

    // Workout
    { id: 'rest-timer', title: 'טיימר מנוחה', description: 'ברירת מחדל למנוחה', keywords: ['מנוחה', 'rest', 'טיימר', 'timer'], category: 'workout', type: 'slider' },
    { id: 'auto-rest', title: 'מנוחה אוטומטית', description: 'התחל מנוחה אוטומטית', keywords: ['מנוחה', 'אוטומטי', 'auto', 'rest'], category: 'workout', type: 'toggle' },
    { id: 'weight-unit', title: 'יחידת משקל', description: 'ק"ג או פאונד', keywords: ['משקל', 'weight', 'יחידה', 'unit', 'kg', 'lb'], category: 'workout', type: 'select' },
    { id: 'exercise-library', title: 'ספריית תרגילים', description: 'נהל תרגילים מותאמים', keywords: ['תרגיל', 'exercise', 'ספריה', 'library'], category: 'workout', type: 'action' },
    { id: 'warmup-cooldown', title: 'חימום וקירור', description: 'הגדרות חימום', keywords: ['חימום', 'warmup', 'קירור', 'cooldown'], category: 'workout', type: 'action' },
    { id: 'pr-alerts', title: 'התראות שיא', description: 'הודעה בשיא אישי', keywords: ['שיא', 'pr', 'record', 'התראה', 'alert'], category: 'workout', type: 'toggle' },
    { id: 'workout-history', title: 'היסטוריית אימונים', description: 'צפה באימונים קודמים', keywords: ['היסטוריה', 'history', 'אימון', 'workout'], category: 'workout', type: 'action' },

    // AI
    { id: 'ai-enabled', title: 'הפעל AI', description: 'הפעל תכונות AI', keywords: ['ai', 'בינה', 'מלאכותית', 'artificial'], category: 'ai', type: 'toggle' },
    { id: 'ai-personality', title: 'אישיות AI', description: 'סגנון התקשורת', keywords: ['אישיות', 'personality', 'סגנון', 'style'], category: 'ai', type: 'select' },
    { id: 'ai-sparks', title: 'ספארקים AI', description: 'יצירת ספארקים אוטומטית', keywords: ['ספארק', 'spark', 'ai', 'אוטומטי'], category: 'ai', type: 'toggle' },

    // Sync
    { id: 'cloud-sync', title: 'סנכרון ענן', description: 'סנכרון עם Google', keywords: ['סנכרון', 'sync', 'ענן', 'cloud', 'google'], category: 'sync', type: 'action' },
    { id: 'google-tasks', title: 'Google Tasks', description: 'חיבור ל-Google Tasks', keywords: ['google', 'tasks', 'משימות', 'גוגל'], category: 'sync', type: 'action' },
    { id: 'notifications', title: 'התראות', description: 'הגדרות התראות', keywords: ['התראה', 'notification', 'push', 'הודעה'], category: 'sync', type: 'toggle' },
    { id: 'webhooks', title: 'Webhooks', description: 'אינטגרציות חיצוניות', keywords: ['webhook', 'api', 'integration', 'אינטגרציה'], category: 'sync', type: 'action' },

    // Data
    { id: 'export', title: 'ייצוא נתונים', description: 'גיבוי לקובץ', keywords: ['ייצוא', 'export', 'גיבוי', 'backup'], category: 'data', type: 'action' },
    { id: 'import', title: 'ייבוא נתונים', description: 'שחזור מקובץ', keywords: ['ייבוא', 'import', 'שחזור', 'restore'], category: 'data', type: 'action' },
    { id: 'password', title: 'סיסמה', description: 'הגדר סיסמת גיבוי', keywords: ['סיסמה', 'password', 'אבטחה', 'security'], category: 'data', type: 'action' },
    { id: 'delete-data', title: 'מחיקת נתונים', description: 'מחק את כל הנתונים', keywords: ['מחיקה', 'delete', 'איפוס', 'reset'], category: 'data', type: 'action' },

    // About
    { id: 'version', title: 'גרסה', description: 'מידע על הגרסה', keywords: ['גרסה', 'version', 'build'], category: 'about', type: 'link' },
    { id: 'changelog', title: 'מה חדש', description: 'עדכונים אחרונים', keywords: ['חדש', 'changelog', 'עדכון', 'update'], category: 'about', type: 'action' },
    { id: 'feedback', title: 'משוב', description: 'שלח משוב למפתחים', keywords: ['משוב', 'feedback', 'דירוג', 'rate'], category: 'about', type: 'action' },

    // 🔔 Notifications
    { id: 'daily-digest', title: 'סיכום יומי', description: 'קבל סיכום יומי של המשימות', keywords: ['סיכום', 'יומי', 'digest', 'daily'], category: 'notifications', type: 'toggle' },
    { id: 'weekly-review', title: 'סקירה שבועית', description: 'סקירת התקדמות שבועית', keywords: ['שבועי', 'סקירה', 'weekly', 'review'], category: 'notifications', type: 'toggle' },
    { id: 'quiet-hours', title: 'שעות שקט', description: 'השתק התראות בזמנים מסוימים', keywords: ['שקט', 'quiet', 'dnd', 'אל תפריע'], category: 'notifications', type: 'toggle' },
    { id: 'celebrate', title: 'חגיגה בהשלמה', description: 'הצג אנימציה בהשלמת משימה', keywords: ['חגיגה', 'celebrate', 'confetti', 'אנימציה'], category: 'notifications', type: 'toggle' },
    { id: 'task-reminders', title: 'תזכורות משימות', description: 'התראות לפני יעד משימה', keywords: ['תזכורת', 'reminder', 'התראה', 'משימה'], category: 'notifications', type: 'toggle' },
    { id: 'habit-reminders', title: 'תזכורות הרגלים', description: 'תזכורות יומיות להרגלים', keywords: ['הרגל', 'habit', 'תזכורת', 'reminder'], category: 'notifications', type: 'toggle' },

    // 📅 Calendar
    { id: 'week-start', title: 'יום תחילת שבוע', description: 'באיזה יום מתחיל השבוע', keywords: ['שבוע', 'week', 'התחלה', 'start', 'ראשון', 'שני'], category: 'calendar', type: 'select' },
    { id: 'time-format', title: 'פורמט שעון', description: '12 או 24 שעות', keywords: ['שעון', 'time', 'format', '12', '24'], category: 'calendar', type: 'select' },
    { id: 'date-format', title: 'פורמט תאריך', description: 'סדר הצגת התאריך', keywords: ['תאריך', 'date', 'format'], category: 'calendar', type: 'select' },
    { id: 'week-numbers', title: 'מספרי שבוע', description: 'הצג מספר שבוע בלוח השנה', keywords: ['מספר', 'שבוע', 'week', 'number'], category: 'calendar', type: 'toggle' },
    { id: 'event-duration', title: 'משך אירוע', description: 'משך ברירת מחדל לאירועים', keywords: ['אירוע', 'event', 'משך', 'duration'], category: 'calendar', type: 'select' },
    { id: 'working-hours', title: 'שעות עבודה', description: 'הגדר שעות עבודה', keywords: ['עבודה', 'work', 'hours', 'שעות'], category: 'calendar', type: 'action' },
    { id: 'default-reminder', title: 'תזכורת ברירת מחדל', description: 'זמן תזכורת לאירועים', keywords: ['תזכורת', 'reminder', 'default'], category: 'calendar', type: 'select' },

    // ✅ Tasks
    { id: 'default-priority', title: 'עדיפות ברירת מחדל', description: 'עדיפות למשימות חדשות', keywords: ['עדיפות', 'priority', 'default'], category: 'tasks', type: 'select' },
    { id: 'default-due-time', title: 'שעת יעד', description: 'שעה ברירת מחדל למשימות', keywords: ['שעה', 'יעד', 'due', 'time'], category: 'tasks', type: 'action' },
    { id: 'auto-schedule', title: 'העבר באיחור להיום', description: 'העבר משימות באיחור להיום', keywords: ['איחור', 'overdue', 'auto', 'schedule'], category: 'tasks', type: 'toggle' },
    { id: 'subtask-progress', title: 'התקדמות תת-משימות', description: 'הצג אחוז השלמה', keywords: ['תת', 'משימה', 'subtask', 'progress'], category: 'tasks', type: 'toggle' },
    { id: 'auto-archive', title: 'ארכוב אוטומטי', description: 'ארכב משימות שהושלמו', keywords: ['ארכוב', 'archive', 'auto'], category: 'tasks', type: 'toggle' },
    { id: 'sort-completed', title: 'השלמות למטה', description: 'הזז משימות שהושלמו למטה', keywords: ['מיון', 'sort', 'completed', 'bottom'], category: 'tasks', type: 'toggle' },
    { id: 'show-task-age', title: 'גיל משימה', description: 'הצג כמה זמן המשימה פתוחה', keywords: ['גיל', 'age', 'זמן', 'time'], category: 'tasks', type: 'toggle' },
    { id: 'natural-language', title: 'שפה טבעית', description: 'פענח תאריכים מטקסט', keywords: ['שפה', 'natural', 'language', 'מחר', 'tomorrow'], category: 'tasks', type: 'toggle' },
    { id: 'default-view', title: 'תצוגת ברירת מחדל', description: 'תצוגה ראשונית של משימות', keywords: ['תצוגה', 'view', 'default', 'רשימה', 'קנבאן'], category: 'tasks', type: 'select' },

    // 🧠 Smart Features
    { id: 'smart-reminders', title: 'תזכורות חכמות', description: 'הצעות AI לזמני תזכורת', keywords: ['חכם', 'smart', 'reminder', 'ai'], category: 'smart', type: 'toggle' },
    { id: 'auto-tags', title: 'הצעות תגיות', description: 'הצע תגיות בהתבסס על התוכן', keywords: ['תגית', 'tag', 'auto', 'suggest'], category: 'smart', type: 'toggle' },
    { id: 'duplicate-detection', title: 'זיהוי כפילויות', description: 'הזהר על פריטים דומים', keywords: ['כפול', 'duplicate', 'detect', 'similar'], category: 'smart', type: 'toggle' },
    { id: 'smart-reschedule', title: 'תזמון חכם', description: 'הצע זמנים טובים יותר', keywords: ['תזמון', 'reschedule', 'smart'], category: 'smart', type: 'toggle' },
    { id: 'ai-writing', title: 'עזרה בכתיבה', description: 'עזרת AI בכתיבת תוכן', keywords: ['כתיבה', 'writing', 'ai', 'assist'], category: 'smart', type: 'toggle' },
    { id: 'auto-links', title: 'זיהוי קישורים', description: 'הפוך קישורים אוטומטית', keywords: ['קישור', 'link', 'auto', 'detect'], category: 'smart', type: 'toggle' },
    { id: 'markdown', title: 'תמיכה ב-Markdown', description: 'הפעל עיצוב Markdown', keywords: ['markdown', 'md', 'עיצוב', 'format'], category: 'smart', type: 'toggle' },
    { id: 'backlinks', title: 'קישורים חוזרים', description: 'צור קישורים חוזרים אוטומטית', keywords: ['קישור', 'חוזר', 'backlink', 'obsidian'], category: 'smart', type: 'toggle' },

    // ♿ Accessibility
    { id: 'reduce-motion', title: 'הפחת תנועה', description: 'צמצם אנימציות', keywords: ['תנועה', 'motion', 'reduce', 'אנימציה'], category: 'accessibility', type: 'toggle' },
    { id: 'high-contrast', title: 'ניגודיות גבוהה', description: 'הגבר את הניגודיות', keywords: ['ניגודיות', 'contrast', 'high'], category: 'accessibility', type: 'toggle' },
    { id: 'large-text', title: 'טקסט גדול', description: 'הגדל את גודל הטקסט', keywords: ['גדול', 'large', 'text', 'טקסט'], category: 'accessibility', type: 'toggle' },
    { id: 'screen-reader', title: 'קורא מסך', description: 'אופטימיזציה לקורא מסך', keywords: ['קורא', 'מסך', 'screen', 'reader'], category: 'accessibility', type: 'toggle' },
    { id: 'focus-indicators', title: 'מדדי פוקוס', description: 'הצג טבעות פוקוס', keywords: ['פוקוס', 'focus', 'indicator', 'ring'], category: 'accessibility', type: 'toggle' },
    { id: 'color-blind', title: 'עיוורון צבעים', description: 'מצב עיוורון צבעים', keywords: ['צבע', 'color', 'blind', 'עיוור'], category: 'accessibility', type: 'select' },
    { id: 'keyboard-shortcuts', title: 'קיצורי מקלדת', description: 'הפעל קיצורי מקלדת', keywords: ['מקלדת', 'keyboard', 'shortcut', 'קיצור'], category: 'accessibility', type: 'toggle' },
    { id: 'auto-play', title: 'ניגון אוטומטי', description: 'נגן מדיה אוטומטית', keywords: ['ניגון', 'auto', 'play', 'media'], category: 'accessibility', type: 'toggle' },

    // 🔒 Privacy
    { id: 'app-lock', title: 'נעילת אפליקציה', description: 'דרוש נעילה בכניסה', keywords: ['נעילה', 'lock', 'app', 'אבטחה'], category: 'privacy', type: 'toggle' },
    { id: 'biometrics', title: 'ביומטריה', description: 'השתמש בטביעת אצבע/פנים', keywords: ['ביומטריה', 'biometric', 'fingerprint', 'face'], category: 'privacy', type: 'toggle' },
    { id: 'hide-notifications', title: 'הסתר בהתראות', description: 'הסתר תוכן בהתראות', keywords: ['הסתר', 'hide', 'notification', 'privacy'], category: 'privacy', type: 'toggle' },
    { id: 'hide-widgets', title: 'הסתר בווידג\'טים', description: 'הסתר פרטים בווידג\'טים', keywords: ['הסתר', 'widget', 'privacy'], category: 'privacy', type: 'toggle' },
    { id: 'analytics', title: 'אנליטיקה', description: 'אפשר איסוף נתוני שימוש', keywords: ['אנליטיקה', 'analytics', 'usage', 'data'], category: 'privacy', type: 'toggle' },
    { id: 'crash-reports', title: 'דוחות קריסה', description: 'שלח דוחות קריסה', keywords: ['קריסה', 'crash', 'report', 'error'], category: 'privacy', type: 'toggle' },
    { id: 'clear-on-logout', title: 'מחק בהתנתקות', description: 'מחק נתונים בהתנתקות', keywords: ['מחק', 'clear', 'logout', 'התנתקות'], category: 'privacy', type: 'toggle' },
    { id: 'incognito', title: 'מצב פרטי', description: 'השבת מעקב זמני', keywords: ['פרטי', 'incognito', 'private', 'tracking'], category: 'privacy', type: 'toggle' },
    { id: 'confirm-dialogs', title: 'אישורי מחיקה', description: 'בקש אישור לפני מחיקה', keywords: ['אישור', 'confirm', 'delete', 'dialog'], category: 'privacy', type: 'toggle' },

    // 📰 Feed (behavior category)
    { id: 'mark-read-open', title: 'סמן כנקרא', description: 'סמן פריט כנקרא בפתיחה', keywords: ['קרא', 'read', 'open', 'פתיחה'], category: 'behavior', type: 'toggle' },
    { id: 'show-read-items', title: 'הצג נקראו', description: 'הצג פריטים שנקראו בפיד', keywords: ['נקרא', 'read', 'show', 'פיד'], category: 'behavior', type: 'toggle' },
    { id: 'feed-refresh', title: 'רענון פיד', description: 'תדירות רענון אוטומטי', keywords: ['רענון', 'refresh', 'פיד', 'feed'], category: 'behavior', type: 'select' },
    { id: 'feed-sort', title: 'מיון פיד', description: 'מיון ברירת מחדל', keywords: ['מיון', 'sort', 'פיד', 'feed'], category: 'behavior', type: 'select' },
    { id: 'feed-previews', title: 'תצוגה מקדימה', description: 'הצג תוכן מקדים בפיד', keywords: ['תצוגה', 'preview', 'פיד'], category: 'behavior', type: 'toggle' },
    { id: 'read-time', title: 'זמן קריאה', description: 'הצג זמן קריאה משוער', keywords: ['זמן', 'קריאה', 'read', 'time'], category: 'behavior', type: 'toggle' },

    // 🔁 Habits (behavior category)
    { id: 'habit-reminder', title: 'תזכורת הרגל', description: 'שעת תזכורת ברירת מחדל', keywords: ['הרגל', 'habit', 'תזכורת', 'reminder'], category: 'behavior', type: 'action' },
    { id: 'habit-streak', title: 'רצף הרגלים', description: 'הצג מונה רצף ימים', keywords: ['רצף', 'streak', 'הרגל', 'habit'], category: 'behavior', type: 'toggle' },
    { id: 'weekly-goal', title: 'יעד שבועי', description: 'ימי יעד בשבוע', keywords: ['יעד', 'שבוע', 'weekly', 'goal'], category: 'behavior', type: 'slider' },
    { id: 'habit-sound', title: 'צליל השלמה', description: 'צליל בהשלמת הרגל', keywords: ['צליל', 'sound', 'הרגל', 'habit'], category: 'behavior', type: 'toggle' },
    { id: 'habit-reset', title: 'שעת איפוס', description: 'שעת איפוס יומי הרגלים', keywords: ['איפוס', 'reset', 'הרגל'], category: 'behavior', type: 'action' },

    // 🏠 Home (interface category)
    { id: 'show-greeting', title: 'ברכה אישית', description: 'הצג ברכה במסך הבית', keywords: ['ברכה', 'greeting', 'בית', 'home'], category: 'interface', type: 'toggle' },
    { id: 'daily-quote', title: 'ציטוט יומי', description: 'הצג ציטוט היום', keywords: ['ציטוט', 'quote', 'יום', 'daily'], category: 'interface', type: 'toggle' },
    { id: 'productivity-score', title: 'ציון פרודקטיביות', description: 'הצג ציון יומי', keywords: ['ציון', 'score', 'productivity'], category: 'interface', type: 'toggle' },
    { id: 'widget-size', title: 'גודל ווידג\'טים', description: 'גודל ברירת מחדל לווידג\'טים', keywords: ['ווידג\'ט', 'widget', 'size', 'גודל'], category: 'interface', type: 'select' },
    { id: 'calendar-preview', title: 'תצוגת לוח שנה', description: 'הצג אירועים קרובים', keywords: ['לוח', 'calendar', 'preview', 'אירועים'], category: 'interface', type: 'toggle' },

    // ⏱️ Focus (focus category)
    { id: 'daily-focus-goal', title: 'יעד יומי', description: 'יעד פוקוס יומי (דקות)', keywords: ['יעד', 'goal', 'פוקוס', 'focus'], category: 'focus', type: 'slider' },
    { id: 'weekly-focus-goal', title: 'יעד שבועי', description: 'יעד פוקוס שבועי (שעות)', keywords: ['יעד', 'weekly', 'פוקוס', 'focus'], category: 'focus', type: 'slider' },
    { id: 'block-notifications', title: 'חסום התראות', description: 'חסום התראות בזמן פוקוס', keywords: ['חסום', 'block', 'התראה', 'notification'], category: 'focus', type: 'toggle' },
    { id: 'auto-next-session', title: 'התחל אוטומטית', description: 'התחל סשן הבא אוטומטית', keywords: ['אוטומטי', 'auto', 'session', 'סשן'], category: 'focus', type: 'toggle' },
    { id: 'long-break', title: 'הפסקה ארוכה', description: 'הפסקה ארוכה כל X סשנים', keywords: ['הפסקה', 'break', 'ארוך', 'long'], category: 'focus', type: 'select' },
];

/**
 * Fuzzy search settings by query
 * Supports Hebrew and English, with typo tolerance
 */
export function searchSettings(query: string): SettingItem[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();

    return SETTINGS_REGISTRY.filter(setting => {
        // Check title
        if (setting.title.toLowerCase().includes(lowerQuery)) return true;
        // Check description
        if (setting.description.toLowerCase().includes(lowerQuery)) return true;
        // Check keywords
        if (setting.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))) return true;
        return false;
    }).slice(0, 10); // Limit results
}

/**
 * Get settings by category
 */
export function getSettingsByCategory(category: SettingsCategory): SettingItem[] {
    return SETTINGS_REGISTRY.filter(s => s.category === category);
}

/**
 * Get category info by id
 */
export function getCategoryInfo(id: SettingsCategory): CategoryInfo | undefined {
    return CATEGORIES.find(c => c.id === id);
}
