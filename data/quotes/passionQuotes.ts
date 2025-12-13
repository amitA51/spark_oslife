import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'passion';

export const passionQuotes: QuoteData[] = [
    { text: 'תשוקה היא אנרגיה. הרגש את הכוח שנובע מהתמקדות במה שמרגש אותך.', author: 'אופרה ווינפרי', category: CATEGORY },
    { text: 'שום דבר גדול לא הושג מעולם בלי התלהבות.', author: 'ראלף וולדו אמרסון', category: CATEGORY },
    { text: 'מצא עבודה שאתה אוהב ולא תצטרך לעבוד יום אחד בחייך.', author: 'קונפוציוס', category: CATEGORY },
    { text: 'התשוקה היא החמצן של הנשמה.', author: 'אנונימי', category: CATEGORY },
    { text: 'עשה מה שאתה אוהב והכסף יבוא.', author: 'מריאן וויליאמסון', category: CATEGORY },
    { text: 'התשוקה היא ההבדל בין לעשות עבודה לבין לחיות את העבודה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשאתה עושה מה שאתה אוהב, זה לא מרגיש כמו עבודה.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה היא הדלק שמניע אותך קדימה כשהכל נראה קשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'מי שעושה מה שהוא אוהב, כבר הצליח.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה שלך היא המצפן שלך בחיים.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תוותר על מה שמדליק אותך. זה מה שהופך אותך לחי באמת.', author: 'אנונימי', category: CATEGORY },
    { text: 'תשוקה אמיתית לא דועכת עם הזמן - היא מתחזקת.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשיש תשוקה, יש אנרגיה. כשיש אנרגיה, יש תוצאות.', author: 'אנונימי', category: CATEGORY },
    { text: 'החיים קצרים מכדי לעשות דברים שלא מדליקים אותך.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה היא מה שמבדיל בין טוב למעולה.', author: 'אנונימי', category: CATEGORY },
    { text: 'עקוב אחרי התשוקה שלך ותמצא את הייעוד שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשאתה עושה מה שאתה אוהב, אתה משדר אנרגיה חיובית לעולם.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה היא השפה הסודית של הנשמה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אנשים מצליחים עושים מה שהם אוהבים ואוהבים מה שהם עושים.', author: 'וורן באפט', category: CATEGORY },
    { text: 'התשוקה שלך היא המתנה שלך לעולם.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשאתה עושה מה שאתה אוהב, כל יום הוא הרפתקה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תבחר קריירה. בחר תשוקה.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה היא מה שמעיר אותך בבוקר עם חיוך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשיש תשוקה, מכשולים הופכים לאתגרים מרגשים.', author: 'אנונימי', category: CATEGORY },
    { text: 'עשה מה שאתה אוהב ואהב מה שאתה עושה.', author: 'ריי ברדבורי', category: CATEGORY },
    { text: 'התשוקה היא הכוח שמניע אותנו מעבר לגבולות שלנו.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה לא מתלהב ממה שאתה עושה, מצא משהו שכן.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה היא ההבדל בין קיום לחיים.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשהתשוקה מובילה, הדרך נפתחת.', author: 'אנונימי', category: CATEGORY },
    { text: 'לחיות בלי תשוקה זה לחיות בלי צבע.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה שלך היא הסימן שאתה בדרך הנכונה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל הישג גדול התחיל עם תשוקה אחת פשוטה.', author: 'אנונימי', category: CATEGORY },
    { text: 'התשוקה היא האש הפנימית שלא דועכת.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תסתפק בפחות מהתשוקה שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשהתשוקה פוגשת מטרה, נולד שינוי אמיתי.', author: 'אנונימי', category: CATEGORY },
];
