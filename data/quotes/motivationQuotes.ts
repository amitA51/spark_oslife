import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'motivation';

export const motivationQuotes: QuoteData[] = [
    { text: 'הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.', author: 'פיטר דרוקר', category: CATEGORY },
    { text: 'ההצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם יום אחר יום.', author: 'רוברט קולייר', category: CATEGORY },
    { text: 'אל תחכה. הזמן לעולם לא יהיה מושלם.', author: 'נפוליאון היל', category: CATEGORY },
    { text: 'הדבר היחיד שעומד בינך לבין החלום שלך הוא הרצון לנסות והאמונה שזה אפשרי.', author: "ג'ואל בראון", category: CATEGORY },
    { text: 'הצלחה היא לא סופית, כישלון הוא לא קטלני: האומץ להמשיך הוא מה שחשוב.', author: "וינסטון צ'רצ'יל", category: CATEGORY },
    { text: 'אתה לא צריך להיות נהדר כדי להתחיל, אבל אתה צריך להתחיל כדי להיות נהדר.', author: 'זיג זיגלר', category: CATEGORY },
    { text: 'הדרך להתחיל היא להפסיק לדבר ולהתחיל לעשות.', author: 'וולט דיסני', category: CATEGORY },
    { text: 'ההצלחה שלך נקבעת על ידי מה שאתה מוכן לוותר עליו.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תספור את הימים, תעשה שהימים יספרו.', author: 'מוחמד עלי', category: CATEGORY },
    { text: 'הדבר היחיד שבלתי אפשרי הוא מה שאתה לא מנסה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל יום הוא הזדמנות חדשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'תאמין בעצמך ובכל מה שאתה. דע שיש משהו בתוכך שגדול מכל מכשול.', author: 'כריסטיאן לרסון', category: CATEGORY },
    { text: 'הצעד הראשון הוא תמיד הקשה ביותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתה לא יכול לחזור אחורה ולשנות את ההתחלה, אבל אתה יכול להתחיל מהיום וליצור סוף חדש.', author: 'סי.אס. לואיס', category: CATEGORY },
    { text: 'הדרך לעשות דברים גדולים היא לאהוב את מה שאתה עושה.', author: "סטיב ג'ובס", category: CATEGORY },
    { text: 'המוטיבציה היא מה שמתחיל אותך. ההרגל הוא מה שמחזיק אותך.', author: "ג'ים ריין", category: CATEGORY },
    { text: 'אל תתן לאתמול לקחת יותר מדי מהיום.', author: 'וויל רוג\'רס', category: CATEGORY },
    { text: 'הכישלון הוא רק ההזדמנות להתחיל שוב, הפעם בצורה חכמה יותר.', author: 'הנרי פורד', category: CATEGORY },
    { text: 'אתה חזק יותר ממה שאתה חושב.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל רגע הוא התחלה חדשה.', author: 'ט.ס. אליוט', category: CATEGORY },
    { text: 'אל תפחד מהשינוי. אתה עלול לאבד משהו טוב, אבל אתה עלול לזכות במשהו טוב יותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה היא לקום פעם אחת יותר ממה שנפלת.', author: 'אוליבר גולדסמית\'', category: CATEGORY },
    { text: 'אין דרך קיצור להצלחה. עבודה קשה היא המפתח.', author: 'אנונימי', category: CATEGORY },
    { text: 'המטרה שלך צריכה להפחיד אותך קצת ולהלהיב אותך מאוד.', author: 'ג\'ו ויטאלה', category: CATEGORY },
    { text: 'אתה לא מפסיד עד שאתה מוותר.', author: 'מייק דיטקה', category: CATEGORY },
    { text: 'תפסיק לחכות לתנאים מושלמים. התחל עכשיו עם מה שיש לך.', author: 'אנונימי', category: CATEGORY },
    { text: 'ההצלחה לא מגיעה אליך, אתה הולך אליה.', author: 'מרווה קולינס', category: CATEGORY },
    { text: 'כל יום הוא צעד קדימה או צעד אחורה. אתה בוחר.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה יכול לחלום את זה, אתה יכול לעשות את זה.', author: 'וולט דיסני', category: CATEGORY },
    { text: 'ההבדל בין מי שאתה למי שאתה רוצה להיות הוא מה שאתה עושה.', author: 'אנונימי', category: CATEGORY },
    { text: 'קשיים הם מה שעושה את החיים מעניינים. להתגבר עליהם הוא מה שעושה אותם משמעותיים.', author: "ג'ושוע מרין", category: CATEGORY },
    { text: 'אל תוותר. סבל של היום הוא הניצחון של מחר.', author: 'רוברט שולר', category: CATEGORY },
    { text: 'כל דקה שאתה כועס, אתה מאבד שישים שניות של אושר.', author: 'ראלף וולדו אמרסון', category: CATEGORY },
    { text: 'אתה יותר אמיץ ממה שאתה מאמין, יותר חזק ממה שאתה נראה, ויותר חכם ממה שאתה חושב.', author: 'א.א. מילן', category: CATEGORY },
    { text: 'הזמן הטוב ביותר לשתול עץ היה לפני עשרים שנה. הזמן הטוב השני הוא עכשיו.', author: 'פתגם סיני', category: CATEGORY },
];
