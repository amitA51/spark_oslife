export interface ChangelogVersion {
    version: string;
    date: string;
    features: string[];
    improvements: string[];
    fixes: string[];
}

export const changelogData: ChangelogVersion[] = [
    {
        version: '2.0.0',
        date: '2024-12-05',
        features: [
            'מערכת "ספארק OS" החדשה - עיצוב מחדש מלא',
            'מסך בית חכם עם ווידג\'טים דינמיים',
            'מערכת ניהול משימות מתקדמת עם AI',
            'טיימר פוקוס (פומודורו) מובנה',
            'מעקב אחר הרגלים עם תצוגת רצף',
        ],
        improvements: [
            'שיפור משמעותי בביצועים',
            'תמיכה במצב כהה (Dark Mode) משופר',
            'אנימציות ותגובתיות חלקה יותר',
        ],
        fixes: [
            'תיקון באגים בסנכרון הנתונים',
            'שיפור יציבות ההתחברות ל-Google',
        ],
    },
    {
        version: '1.5.0',
        date: '2024-11-20',
        features: [
            'הוספת אפשרות לגיבוי ושחזור',
            'אינטגרציה עם Google Calendar',
        ],
        improvements: [
            'עיצוב מעודכן למסך ההגדרות',
        ],
        fixes: [],
    },
];
