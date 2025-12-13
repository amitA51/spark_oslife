import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'perseverance';

export const perseveranceQuotes: QuoteData[] = [
    { text: 'זה לא משנה כמה לאט אתה הולך כל עוד אתה לא עוצר.', author: 'קונפוציוס', category: CATEGORY },
    { text: 'ההבדל בין המנצח למפסיד הוא שהמנצח קם פעם אחת יותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשאתה מרגיש שאתה רוצה לוותר, תזכור למה התחלת.', author: 'אנונימי', category: CATEGORY },
    { text: 'נהר חוצה סלע לא בגלל כוחו, אלא בגלל התמדתו.', author: "ג'ים ווטקינס", category: CATEGORY },
    { text: 'הניצחון שייך למתמידים ביותר.', author: 'נפוליאון בונפרטה', category: CATEGORY },
    { text: 'אף פעם אל תוותר. היום קשה, מחר יהיה גרוע יותר, אבל מחרתיים יהיה נפלא.', author: "ג'ק מא", category: CATEGORY },
    { text: 'לא נפילה היא הכישלון, אלא הסירוב לקום.', author: 'פתגם סיני', category: CATEGORY },
    { text: 'כל מה שנראה בלתי אפשרי נשאר כזה עד שמישהו עושה את זה.', author: 'נלסון מנדלה', category: CATEGORY },
    { text: 'ההתמדה היא לא מרוץ ארוך - זה הרבה מרוצים קצרים אחד אחרי השני.', author: 'וולטר אליוט', category: CATEGORY },
    { text: 'אתה לא מפסיד עד שאתה מוותר.', author: 'מייק דיטקה', category: CATEGORY },
    { text: 'הכוח לא בא מניצחון. המאבקים שלך מפתחים את הכוח.', author: 'ארנולד שוורצנגר', category: CATEGORY },
    { text: 'מי שנופל ומסרב לקום הפסיד. מי שממשיך - מנצח.', author: 'אנונימי', category: CATEGORY },
    { text: 'רוב האנשים מוותרים כשהם על סף ההצלחה.', author: 'רוס פרו', category: CATEGORY },
    { text: 'אין כשלון אמיתי מלבד הפסקת הניסיון.', author: 'אלברט האברד', category: CATEGORY },
    { text: 'הדרך להצלחה מלאה במכשולים. רק המתמידים מגיעים.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההצלחה היא לא עניין של כישרון, היא עניין של התמדה.', author: 'אנונימי', category: CATEGORY },
    { text: 'תתמיד גם כשקשה. קשיים זמניים, ויתור הוא לנצח.', author: 'אנונימי', category: CATEGORY },
    { text: 'מי שנשבר מהמכשול הראשון לא היה ראוי להצלחה מלכתחילה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה עובר גיהינום, תמשיך ללכת.', author: "וינסטון צ'רצ'יל", category: CATEGORY },
    { text: 'לא משנה כמה פעמים נפלת - חשוב רק כמה פעמים קמת.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההתמדה מנצחת כישרון כשכישרון לא מתמיד.', author: 'טים נוטקה', category: CATEGORY },
    { text: 'הצלחה היא הנחישות להמשיך כאשר הכל אומר לעצור.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדרך להצלחה ארוכה. אבל מי שמתמיד - מגיע.', author: 'אנונימי', category: CATEGORY },
    { text: 'אף סיפור הצלחה לא התחיל ב"וויתרתי".', author: 'אנונימי', category: CATEGORY },
    { text: 'הניצחון הכי גדול הוא לנצח את עצמך כשאתה רוצה לוותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'ככל שהלילה חשוך יותר, כך הכוכבים בוהקים יותר.', author: 'דוסטויבסקי', category: CATEGORY },
    { text: 'מי שמאמין בסוף מגיע אליו.', author: 'אנונימי', category: CATEGORY },
    { text: 'לעצור זה קל. להתמיד זה קשה. אבל רק התמדה מביאה תוצאות.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל צעד קטן קדימה הוא עדיף על שום צעד בכלל.', author: 'אנונימי', category: CATEGORY },
    { text: 'אמונה בעצמך ובמטרה שלך היא המפתח להתמדה.', author: 'אנונימי', category: CATEGORY },
    { text: 'העתיד שייך למי שמסרב לוותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'לא תמיד קל, לא תמיד נעים, אבל תמיד שווה את זה.', author: 'אנונימי', category: CATEGORY },
    { text: 'מי שמפסיק לנסות - מפסיק להתקדם.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל רגע של כאב הוא צעד לקראת ניצחון.', author: 'אנונימי', category: CATEGORY },
    { text: 'האנשים שמצליחים הם אלו שלא הפסיקו לנסות.', author: 'אנונימי', category: CATEGORY },
];
