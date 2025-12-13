import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'dreams';

export const dreamsQuotes: QuoteData[] = [
    { text: 'העתיד שייך לאלו שמאמינים ביופי של החלומות שלהם.', author: 'אלינור רוזוולט', category: CATEGORY },
    { text: 'כל החלומות שלנו יכולים להתגשם אם יהיה לנו האומץ לרדוף אחריהם.', author: 'וולט דיסני', category: CATEGORY },
    { text: 'אל תיתן לפחדים שלך לתפוס את מקומם של החלומות שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'חלום שלא מתפרש הוא כמו מכתב שלא נקרא.', author: 'התלמוד', category: CATEGORY },
    { text: 'העולם זקוק לחולמים והעולם זקוק למבצעים. אבל מעל לכל, העולם זקוק לחולמים שעושים.', author: "שרה בנ ברת'נאק", category: CATEGORY },
    { text: 'חלום גדול מתחיל עם חולם שמאמין.', author: 'האריאט טובמן', category: CATEGORY },
    { text: 'אל תוותר על החלום שלך רק כי זה לוקח זמן להגשים אותו. הזמן יעבור בכל מקרה.', author: 'אל ספדינו', category: CATEGORY },
    { text: 'החלומות הכי גדולים דורשים את העבודה הכי קשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'חלום הוא רק חלום עד שאתה מתחיל לעבוד עליו.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם יש לך חלום, אל תפסיק לרדוף אחריו.', author: 'סטיב הארווי', category: CATEGORY },
    { text: 'החיים קצרים מכדי לחלום קטן.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדרך להגשים את החלומות שלך היא להתעורר.', author: 'פול ולרי', category: CATEGORY },
    { text: 'חולמים לא ישנים. הם מתעוררים.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה יכול לחלום את זה, אתה יכול לעשות את זה.', author: 'וולט דיסני', category: CATEGORY },
    { text: 'לכל חלום יש מחיר. השאלה היא אם אתה מוכן לשלם אותו.', author: 'אנונימי', category: CATEGORY },
    { text: 'חלום ללא תוכנית הוא רק משאלה.', author: 'אנטואן דה סנט אקזופרי', category: CATEGORY },
    { text: 'חלום גדול הוא כמו מפה - הוא מראה לך לאן ללכת.', author: 'אנונימי', category: CATEGORY },
    { text: 'אנשים שמפסיקים לחלום מפסיקים לחיות.', author: 'מלקום פורבס', category: CATEGORY },
    { text: 'החלום שלך לא צריך להיות הגיוני לאחרים. הוא רק צריך להיות אמיתי לך.', author: 'אנונימי', category: CATEGORY },
    { text: 'תמיד יהיו אנשים שיגידו לך שזה בלתי אפשרי. תוכיח להם שהם טועים.', author: 'אנונימי', category: CATEGORY },
    { text: 'הפחד מהכישלון לא צריך להפריע לך לחלום.', author: 'אנונימי', category: CATEGORY },
    { text: 'חלום הוא לא מה שאתה רואה בזמן השינה, אלא מה שלא נותן לך לישון.', author: 'עבדול קלאם', category: CATEGORY },
    { text: 'לכל חלום יש את הזמן שלו להתגשם. אל תמהר ואל תוותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'החלום היחיד שלעולם לא יתגשם הוא החלום שלא מנסים להגשים.', author: 'אנונימי', category: CATEGORY },
    { text: 'החלומות שלנו הם המצפן שלנו בחיים.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם החלום שלך לא מפחיד אותך, הוא לא גדול מספיק.', author: 'אלן ג\'ונסון', category: CATEGORY },
    { text: 'תחלום גדול, תעבוד קשה, תישאר צנוע.', author: 'דין גראזיוסי', category: CATEGORY },
    { text: 'אל תוותר על החלום בגלל הזמן שייקח להגשים אותו - הזמן יעבור ממילא.', author: 'ארל נייטינגייל', category: CATEGORY },
    { text: 'חלום ללא מעשים הוא חלום חלול.', author: 'אנונימי', category: CATEGORY },
    { text: 'לפעמים החלום הכי קרוב הוא גם הכי רחוק - עד שמתחילים ללכת אליו.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מה שהיום מציאות, מתישהו היה חלום.', author: 'אנונימי', category: CATEGORY },
    { text: 'יש רק דבר אחד שהופך את החלום לבלתי אפשרי: הפחד מכישלון.', author: 'פאולו קואלו', category: CATEGORY },
    { text: 'הבא את החלום שלך לידי ביטוי כל יום, ויום אחד הוא יהפוך למציאות.', author: 'אנונימי', category: CATEGORY },
    { text: 'החיים מתחילים ברגע שאתה מתחיל לחיות את החלום שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'חלום גדול הוא לא הזיה - הוא מפה לעתיד.', author: 'אנונימי', category: CATEGORY },
];
