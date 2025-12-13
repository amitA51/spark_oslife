import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'beginning';

export const beginningQuotes: QuoteData[] = [
    { text: 'מסע של אלף מיל מתחיל בצעד אחד.', author: 'לאו דזה', category: CATEGORY },
    { text: 'ההתחלה היא החלק החשוב ביותר בעבודה.', author: 'אפלטון', category: CATEGORY },
    { text: 'אל תפחד להתחיל מחדש. זו הזדמנות לבנות משהו טוב יותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל סוף הוא התחלה חדשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הזמן הטוב ביותר להתחיל משהו הוא עכשיו.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מסע גדול מתחיל בהחלטה קטנה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תחכה להזדמנות מושלמת - צור אותה.', author: 'ג\'ורג\' ברנרד שו', category: CATEGORY },
    { text: 'הצעד הראשון תמיד הקשה ביותר, אבל גם החשוב ביותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל יום הוא התחלה חדשה. התייחס אליו ככזה.', author: 'אנונימי', category: CATEGORY },
    { text: 'התחלות חדשות דורשות אומץ.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם לא היום, מתי?', author: 'הילל הזקן', category: CATEGORY },
    { text: 'אל תדחה למחר מה שאתה יכול להתחיל היום.', author: "בנג'מין פרנקלין", category: CATEGORY },
    { text: 'הרגע הזה הוא הזרע של כל מה שיבוא.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל בוקר הוא דף חדש בסיפור החיים שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'לא משנה איפה אתה עכשיו - חשוב מה הצעד הבא.', author: 'אנונימי', category: CATEGORY },
    { text: 'התחל מהמקום שבו אתה נמצא, עשה מה שאתה יכול, השתמש במה שיש לך.', author: 'ארתור אש', category: CATEGORY },
    { text: 'העבר לא יכול להשתנות, אבל העתיד עדיין לא נכתב.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל התחלה היא סוף של משהו והתחלה של משהו אחר.', author: 'סנקה', category: CATEGORY },
    { text: 'לפעמים צריך לאבד את הדרך כדי למצוא התחלה חדשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תתמקד בגודל המשימה - רק בצעד הראשון.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההתחלה הכי קשה היא כשלא יודעים לאן הולכים. אבל צריך ללכת.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל דבר גדול התחיל קטן.', author: 'אנונימי', category: CATEGORY },
    { text: 'להתחיל מחדש זה לא לאבד - זה לזכות בהזדמנות נוספת.', author: 'אנונימי', category: CATEGORY },
    { text: 'היום הוא היום הראשון לשארית חייך.', author: 'אבי לבנדר', category: CATEGORY },
    { text: 'התחל כאילו כבר הצלחת.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדרך היחידה לעשות עבודה נהדרת היא להתחיל לעשות.', author: "סטיב ג'ובס", category: CATEGORY },
    { text: 'אל תמתין שהרוח תנשוב - הרם את המפרשים.', author: 'אנונימי', category: CATEGORY },
    { text: 'התחלה קטנה טובה יותר מהתחלה שאינה.', author: 'אנונימי', category: CATEGORY },
    { text: 'עכשיו הוא הרגע המושלם להתחיל.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל שינוי מתחיל ברגע שמחליטים להשתנות.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההתחלה אולי לא קלה, אבל היא שווה את זה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתמול הסתיים. היום הוא יום חדש. תעשה ממנו משהו נהדר.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל פרק חדש בחיים מחייב סגירה של הקודם.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתה לא יכול להתחיל פרק חדש אם אתה ממשיך לקרוא את הישן.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההתחלה הכי טובה היא פשוט להתחיל.', author: 'אנונימי', category: CATEGORY },
];
