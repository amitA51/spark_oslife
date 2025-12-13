import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'opportunity';

export const opportunityQuotes: QuoteData[] = [
    { text: 'הזדמנויות לא קורות, אתה יוצר אותן.', author: 'כריס גרוסר', category: CATEGORY },
    { text: 'ההזדמנות הטובה ביותר היא זו שאתה יוצר לעצמך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשדלת אחת נסגרת, אחרת נפתחת.', author: 'אלכסנדר גרהם בל', category: CATEGORY },
    { text: 'ההזדמנות תמיד נמצאת במקום שאתה הכי פחות מצפה לה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הכנה פוגשת הזדמנות - וזה נקרא מזל.', author: 'סנקה', category: CATEGORY },
    { text: 'אל תחכה להזדמנות. צור אותה.', author: "ג'ורג' ברנרד שו", category: CATEGORY },
    { text: 'כל יום מביא הזדמנות חדשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההזדמנות דופקת בדלת רק פעם אחת. היה מוכן לפתוח.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה לא מוכן לנצל את ההזדמנות, מישהו אחר כן.', author: 'אנונימי', category: CATEGORY },
    { text: 'בכל משבר יש הזדמנות.', author: 'פתגם סיני', category: CATEGORY },
    { text: 'מזל הוא מה שקורה כשההזדמנות פוגשת הכנה.', author: 'סנקה', category: CATEGORY },
    { text: 'אל תחמיץ את ההזדמנות כי היא התחפשה לעבודה קשה.', author: 'תומאס אדיסון', category: CATEGORY },
    { text: 'הזדמנויות קטנות הן לעיתים קרובות התחלה של הישגים גדולים.', author: 'דמוסתנס', category: CATEGORY },
    { text: 'כל בעיה היא הזדמנות שנראית אחרת.', author: 'הנרי קייזר', category: CATEGORY },
    { text: 'ההזדמנות הטובה ביותר לפעמים מתחבאת בתוך האתגר הגדול ביותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'יש הזדמנויות שמגיעות רק פעם בחיים. אל תפספס אותן.', author: 'אנונימי', category: CATEGORY },
    { text: 'הזדמנות למי שמחפש, מזל למי שמוכן.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תמתין שההזדמנות תגיע אליך - לך אליה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל רגע הוא הזדמנות לשינוי.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההזדמנויות הטובות ביותר הן אלו שאנחנו יוצרים בעצמנו.', author: 'אנונימי', category: CATEGORY },
    { text: 'תראה הזדמנות בכל קושי, לא קושי בכל הזדמנות.', author: "וינסטון צ'רצ'יל", category: CATEGORY },
    { text: 'ההזדמנות הכי גדולה שלך נמצאת שם בחוץ. לך לחפש אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתה יכול להמתין שמשהו יקרה, או שאתה יכול לגרום לזה לקרות.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מפגש הוא הזדמנות. כל שיחה היא פתח.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תמתין לרגע המושלם - תפוס את הרגע והפוך אותו למושלם.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההזדמנות לא מחכה למי שמתמהמה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל כישלון הוא הזדמנות ללמוד.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה פותח את העיניים, תראה הזדמנויות בכל מקום.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההזדמנות קיימת תמיד - השאלה היא אם אתה מזהה אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כאשר אתה מוכן, ההזדמנות תגיע.', author: 'אנונימי', category: CATEGORY },
    { text: 'הזדמנויות מתרבות ככל שמנצלים אותן.', author: 'סאן דזו', category: CATEGORY },
    { text: 'כל שינוי בחיים הוא הזדמנות לצמיחה.', author: 'אנונימי', category: CATEGORY },
    { text: 'תחפש הזדמנויות, לא תירוצים.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההזדמנות לא מודיעה על בואה מראש.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל יום חדש הוא הזדמנות חדשה להצליח.', author: 'אנונימי', category: CATEGORY },
];
