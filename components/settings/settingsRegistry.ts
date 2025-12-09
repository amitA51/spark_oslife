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
    | 'about';

export interface CategoryInfo {
    id: SettingsCategory;
    title: string;
    icon: string;
    gradient: [string, string];
    count: number;
}

export const CATEGORIES: CategoryInfo[] = [
    { id: 'profile', title: 'פרופיל', icon: '👤', gradient: ['#8B5CF6', '#A78BFA'], count: 2 },
    { id: 'appearance', title: 'מראה', icon: '🎨', gradient: ['#F59E0B', '#FBBF24'], count: 8 },
    { id: 'behavior', title: 'התנהגות', icon: '⚙️', gradient: ['#6366F1', '#818CF8'], count: 6 },
    { id: 'interface', title: 'ממשק', icon: '🏠', gradient: ['#10B981', '#34D399'], count: 5 },
    { id: 'focus', title: 'פוקוס', icon: '⏱️', gradient: ['#EC4899', '#F472B6'], count: 4 },
    { id: 'workout', title: 'אימון', icon: '🏋️', gradient: ['#EF4444', '#F87171'], count: 7 },
    { id: 'ai', title: 'AI', icon: '🤖', gradient: ['#06B6D4', '#22D3EE'], count: 3 },
    { id: 'sync', title: 'סנכרון', icon: '☁️', gradient: ['#3B82F6', '#60A5FA'], count: 4 },
    { id: 'data', title: 'נתונים', icon: '💾', gradient: ['#84CC16', '#A3E635'], count: 4 },
    { id: 'about', title: 'אודות', icon: 'ℹ️', gradient: ['#8B5CF6', '#C4B5FD'], count: 3 },
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
