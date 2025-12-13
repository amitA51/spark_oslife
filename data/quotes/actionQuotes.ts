import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'action';

export const actionQuotes: QuoteData[] = [
    { text: 'עשייה היא תרופת הפלא לפחד.', author: 'דיוויד שוורץ', category: CATEGORY },
    { text: 'אל תגיד לי שהשמיים הם הגבול כשיש עקבות על הירח.', author: 'פול ברנדט', category: CATEGORY },
    { text: 'חלומות לא עובדים אלא אם כן אתה עובד.', author: "ג'ון סי. מקסוול", category: CATEGORY },
    { text: 'המרחק בין חלום למציאות נקרא פעולה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תחכה להזדמנות, צור אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'היום הוא היום שבו אתה יכול לשנות את המחר.', author: 'אנונימי', category: CATEGORY },
    { text: 'עדיף לעשות ולהתחרט מאשר לא לעשות ולהתחרט.', author: 'אנונימי', category: CATEGORY },
    { text: 'הפעולה היא המפתח להכל.', author: 'פבלו פיקאסו', category: CATEGORY },
    { text: 'מי שמחכה מפסיד. מי שפועל מנצח.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תדחה למחר מה שאתה יכול לעשות היום.', author: "בנג'מין פרנקלין", category: CATEGORY },
    { text: 'הזמן הטוב ביותר לפעול הוא עכשיו.', author: 'מארק פישר', category: CATEGORY },
    { text: 'פחות דיבורים, יותר מעשים.', author: 'אנונימי', category: CATEGORY },
    { text: 'הכישרון שלך הוא מתנה מאלוהים. מה שאתה עושה איתו הוא המתנה שלך בחזרה.', author: 'ליאו בוסקליה', category: CATEGORY },
    { text: 'לעשות משהו זה יותר טוב מלעשות כלום.', author: 'אנונימי', category: CATEGORY },
    { text: 'קום ותעשה את זה. אף אחד לא יעשה את זה בשבילך.', author: 'אנונימי', category: CATEGORY },
    { text: 'תפסיק לתכנן, תתחיל לעשות.', author: 'אנונימי', category: CATEGORY },
    { text: 'הפעולה מביאה בהירות, לא ההפך.', author: 'מארי פורליאו', category: CATEGORY },
    { text: 'לא משנה כמה אתה מחכה, אם לא תפעל כלום לא ישתנה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הזמן לפעול הוא עכשיו. לעולם לא מאוחר מדי לעשות משהו.', author: 'אנטואן דה סנט אקזופרי', category: CATEGORY },
    { text: 'כוונה בלי פעולה היא אשליה.', author: 'אנונימי', category: CATEGORY },
    { text: 'בסוף, אנחנו מתחרטים על הדברים שלא עשינו יותר מאלה שעשינו.', author: 'מארק טוויין', category: CATEGORY },
    { text: 'האומץ הוא לא היעדר הפחד, אלא ההחלטה שמשהו אחר חשוב יותר.', author: 'אמברוז רדמון', category: CATEGORY },
    { text: 'אל תמתין לזמן הנכון. צור אותו.', author: "ג'ורג' ברנרד שו", category: CATEGORY },
    { text: 'מחשבות הופכות למעשים, מעשים הופכים להרגלים, הרגלים הופכים לאופי.', author: 'לאו דזה', category: CATEGORY },
    { text: 'הצלחה היא סכום של צעדים קטנים שחוזרים על עצמם יום אחרי יום.', author: 'רוברט קולייר', category: CATEGORY },
    { text: 'לא צריך לרוץ מהר, רק להתחיל ללכת.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מעשה גדול התחיל עם החלטה קטנה.', author: 'אנונימי', category: CATEGORY },
    { text: 'תן לפעולות שלך לדבר חזק יותר מהמילים.', author: 'אנונימי', category: CATEGORY },
    { text: 'מה שאתה עושה היום יכול לשפר את כל המחרים שלך.', author: 'ראלף מרסטון', category: CATEGORY },
    { text: 'הזדמנויות לא מחכות. הן עוברות ליד מי שלא פועל.', author: 'אנונימי', category: CATEGORY },
    { text: 'לפעמים צריך פשוט לקפוץ ולבנות את הכנפיים בדרך למטה.', author: 'ריי ברדבורי', category: CATEGORY },
    { text: 'מי שמהסס - מאבד.', author: 'פתגם לטיני', category: CATEGORY },
    { text: 'הבטחות לא עושות שינוי. פעולות כן.', author: 'אנונימי', category: CATEGORY },
    { text: 'הפעולה היא הגשר בין חלומות למציאות.', author: 'אנונימי', category: CATEGORY },
    { text: 'עכשיו הוא הזמן, כאן הוא המקום.', author: 'דן מילמן', category: CATEGORY },
];
