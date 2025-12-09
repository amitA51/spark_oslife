/**
 * Centralized Error Messages - Spark OS
 * 
 * All user-facing Hebrew error messages in one place.
 * Benefits: consistent UX, easier i18n, single source of truth.
 */

export const ERRORS = {
    // ========================================
    // Speech Recognition
    // ========================================
    SPEECH: {
        NO_SPEECH: 'לא זוהה דיבור או שאין גישה למיקרופון. נסה שוב.',
        NOT_ALLOWED: 'הגישה למיקרופון נדחתה. נא לאשר בהגדרות הדפדפן.',
        NETWORK: 'שגיאת רשת בזיהוי דיבור.',
        GENERIC: 'אירעה שגיאה בזיהוי הדיבור.',
        PARSE_FAILED: 'שגיאה בניתוח הטקסט.',
        UNSUPPORTED: 'הדפדפן שלך לא תומך בזיהוי דיבור.',
    },

    // ========================================
    // Authentication
    // ========================================
    AUTH: {
        GOOGLE_FAILED: 'שגיאה בהתחברות עם Google',
        GOOGLE_CONNECT: 'שגיאה בהתחברות ל-Google.',
        LOGOUT_FAILED: 'שגיאה בהתנתקות.',
        GENERIC: 'אירעה שגיאה בהתחברות',
    },

    // ========================================
    // Google Services
    // ========================================
    GOOGLE: {
        CALENDAR: {
            LOAD_EVENTS: 'שגיאה בטעינת אירועים',
            CREATE_EVENT: 'שגיאה ביצירת אירוע',
            UPDATE_EVENT: 'שגיאה בעדכון אירוע',
            DELETE_EVENT: 'שגיאה במחיקת אירוע',
            GET_EVENT: 'שגיאה בקבלת אירוע',
            TIME_BLOCK: 'שגיאה בחסימת הזמן. ודא שאתה מחובר ל-Google Calendar.',
        },
        DRIVE: {
            UPLOAD_BACKUP: 'שגיאה בהעלאת גיבוי',
            DOWNLOAD_BACKUP: 'שגיאה בהורדת גיבוי',
        },
        SYNC: 'שגיאה בסנכרון הנתונים.',
        DISCONNECT: 'שגיאה בניתוק.',
    },

    // ========================================
    // Data Operations (CRUD)
    // ========================================
    DATA: {
        CREATE_ITEM: 'שגיאה ביצירת הפריט.',
        UPDATE_ITEM: 'שגיאה בעדכון הפריט.',
        DELETE_ITEM: 'שגיאה במחיקת הפריטים.',
        SAVE_ITEM: 'שגיאה בשמירה',
        ADD_TO_LIBRARY: 'שגיאה בהוספה לספרייה',
        CREATE_ROADMAP: 'שגיאה ביצירת מפת הדרכים',
        SAVE_NOTE: 'שגיאה בשמירת הפתק',
        SAVE_TEMPLATE: 'שגיאה בשמירת התבנית, נסה שוב',
        CREATE_VAULT: 'שגיאה ביצירת הכספת. נסה שוב.',
        IMPORT_FILE: 'שגיאה בייבוא הקובץ. ודא שהקובץ תקין והסיסמה נכונה.',
        ADD_FEED: 'שגיאה בהוספת פיד',
    },

    // ========================================
    // AI / Analysis
    // ========================================
    AI: {
        ASSISTANT_FAILED: 'שגיאה בהפעלת היועץ. נסה שוב מאוחר יותר.',
        BRIEFING_FAILED: 'שגיאה בעת יצירת התדריך. אנא נסה שוב.',
        SUMMARY_FAILED: 'שגיאה בעת יצירת הסיכום.',
        SEARCH_FAILED: 'התנצלותי, נתקלתי בשגיאה בעת ביצוע החיפוש החכם.',
        TOPIC_SUGGEST_FAILED: 'שגיאה בהצעת נושאים חדשים.',
        SUMMARIZE_FAILED: 'שגיאה בעת ניסיון הסיכום.',
        MESSAGE_SEND_FAILED: 'שגיאה בשליחת ההודעה. נסה שוב.',
        PARSE_TEXT: 'שגיאה בניתוח הטקסט.',
    },

    // ========================================
    // Feed
    // ========================================
    FEED: {
        REFRESH_FAILED: 'שגיאה בעת רענון הפידים.',
    },

    // ========================================
    // Investments
    // ========================================
    INVESTMENTS: {
        LOAD_MARKET: 'שגיאה בטעינת נתוני השוק',
        ADD_ASSET: 'שגיאה בהוספת נכס',
    },

    // ========================================
    // Generic
    // ========================================
    GENERIC: 'אירעה שגיאה',
} as const;

/**
 * Type-safe error key lookup
 */
export type ErrorCategory = keyof typeof ERRORS;
