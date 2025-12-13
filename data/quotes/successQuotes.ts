import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'success';

export const successQuotes: QuoteData[] = [
    { text: 'הצלחה היא לא המפתח לאושר. אושר הוא המפתח להצלחה.', author: 'אלברט שווייצר', category: CATEGORY },
    { text: 'אני לא נכשלתי. פשוט מצאתי 10,000 דרכים שלא עובדות.', author: 'תומאס אדיסון', category: CATEGORY },
    { text: 'ההצלחה מגיעה בדרך כלל לאלו שעסוקים מכדי לחפש אותה.', author: 'הנרי דיוויד תורו', category: CATEGORY },
    { text: 'הזדמנויות לא קורות, אתה יוצר אותן.', author: 'כריס גרוסר', category: CATEGORY },
    { text: 'אל תפחד לוותר על הטוב כדי ללכת על המצוין.', author: "ג'ון ד. רוקפלר", category: CATEGORY },
    { text: 'הצלחה היא הליכה מכישלון לכישלון בלי לאבד התלהבות.', author: "וינסטון צ'רצ'יל", category: CATEGORY },
    { text: 'הסוד להצלחה הוא לדעת משהו שאף אחד אחר לא יודע.', author: 'אריסטוטל אונאסיס', category: CATEGORY },
    { text: 'ההצלחה היא סולם שאי אפשר לטפס עליו עם הידיים בכיסים.', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה אמיתית היא למצוא את העבודה שאתה אוהב, לעשות אותה טוב, ולהיות מוערך על כך.', author: 'הווארד וייטמן', category: CATEGORY },
    { text: 'אם אתה רוצה להצליח, הכפל את קצב הכישלונות שלך.', author: 'תומאס ווטסון', category: CATEGORY },
    { text: 'האנשים המצליחים ביותר בעולם הם אלו שלא ויתרו.', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה היא לא כמה כסף אתה מרוויח, זה כמה השפעה יש לך.', author: 'מישל אובמה', category: CATEGORY },
    { text: 'מאחורי כל הצלחה גדולה יש שנים של עבודה שקטה.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההצלחה שווה יותר כשיש למישהו לחלוק איתו.', author: 'הווארד שולץ', category: CATEGORY },
    { text: 'אתה לא צריך לראות את כל המדרגות. רק את הראשונה.', author: 'מרטין לותר קינג', category: CATEGORY },
    { text: 'הצלחה זו לא רק להגיע לפסגה, זה גם לדעת איך להישאר שם.', author: 'אנונימי', category: CATEGORY },
    { text: 'האנשים שמצליחים הם אלה שאומרים "אני רוצה" ולא "הלוואי".', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה היא ביטחון עצמי שהולך לישון בלילה ויודע שעשית את הכי טוב שלך.', author: 'סופיה לורן', category: CATEGORY },
    { text: 'ההבדל בין רגיל למיוחד הוא ה"מעט יותר" הזה.', author: "ג'ימי ג'ונסון", category: CATEGORY },
    { text: 'אין קיצורי דרך להצלחה. המסלול עובר דרך עבודה קשה ותשומת לב לפרטים.', author: 'אנונימי', category: CATEGORY },
    { text: 'להצלחה יש הרבה אבות, לכישלון אף אחד.', author: "ג'ון פ. קנדי", category: CATEGORY },
    { text: 'הצלחה היא שילוב של הזדמנות ומוכנות.', author: 'סנקה', category: CATEGORY },
    { text: 'מה שקובע את ההצלחה שלך הוא מה אתה עושה כשאף אחד לא מסתכל.', author: 'אנונימי', category: CATEGORY },
    { text: 'אנשים מצליחים לא נולדים מצליחים. הם הפכו למצליחים על ידי הרגלים שבנו.', author: 'ויידאל ססון', category: CATEGORY },
    { text: 'הצלחה היא לקום עוד פעם אחת יותר מאשר נפלת.', author: 'אוליבר גולדסמית\'', category: CATEGORY },
    { text: 'הצלחה לא נמדדת בכמות הכסף, אלא בכמות האנשים שעזרת.', author: 'אנונימי', category: CATEGORY },
    { text: 'הם שסומכים על עצמם יודעים איך לסמוך על אחרים.', author: 'ג\'ורג\' מקדונלד', category: CATEGORY },
    { text: 'הכישלון הוא רק ההזדמנות להתחיל שוב. הפעם בצורה יותר חכמה.', author: 'הנרי פורד', category: CATEGORY },
    { text: 'השאיפה לשלמות מובילה להצלחה, השאיפה להצלחה מובילה לכישלון.', author: 'הריש ג\'והרי', category: CATEGORY },
    { text: 'מי שמפחד מכישלון מגביל את הפעילויות שלו.', author: 'הנרי פורד', category: CATEGORY },
    { text: 'להצלחה אמיתית אין תחליף - רק עבודה קשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הסוד להצלחה הוא להתחיל.', author: 'מארק טוויין', category: CATEGORY },
    { text: 'הצלחה היא לא מה שיש לך, זה מי שאתה.', author: 'בו בנט', category: CATEGORY },
    { text: 'כל הצלחה מתחילה עם ההחלטה לנסות.', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה דורשת מחויבות, לא רק עניין.', author: 'קן בלאנצ\'ארד', category: CATEGORY },
];
