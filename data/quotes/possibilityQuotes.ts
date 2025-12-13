import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'possibility';

export const possibilityQuotes: QuoteData[] = [
    { text: 'כל דבר אפשרי למי שמאמין.', author: 'אנונימי', category: CATEGORY },
    { text: 'הגבולות היחידים שלנו הם אלו שאנחנו מציבים לעצמנו.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה יכול לדמיין את זה, אתה יכול להשיג את זה.', author: 'זיג זיגלר', category: CATEGORY },
    { text: 'מה שנראה בלתי אפשרי היום יהיה המציאות של מחר.', author: 'אנונימי', category: CATEGORY },
    { text: 'האפשרויות הן אינסופיות כשהמוח פתוח.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדבר היחיד שבלתי אפשרי הוא מה שאתה לא מנסה.', author: 'אנונימי', category: CATEGORY },
    { text: 'בלתי אפשרי זו רק דעה.', author: 'פאולו קואלו', category: CATEGORY },
    { text: 'מה שהמוח יכול להגות ולהאמין בו, הוא יכול להשיג.', author: 'נפוליאון היל', category: CATEGORY },
    { text: 'יש תמיד דרך נוספת. רק צריך למצוא אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדברים שנראים בלתי אפשריים נעשים אפשריים על ידי אנשים שלא ידעו שזה בלתי אפשרי.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מכשול הוא רק הזדמנות במסווה.', author: 'אנונימי', category: CATEGORY },
    { text: 'העולם מלא באנשים שעשו את מה שנחשב בלתי אפשרי.', author: 'אנונימי', category: CATEGORY },
    { text: 'תאמין באפשרות ותמצא את הדרך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשסוגרים דלת, נפתח חלון.', author: 'אנונימי', category: CATEGORY },
    { text: 'הכוח להפוך בלתי אפשרי לאפשרי נמצא בתוכך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל דבר גדול שהושג פעם נחשב בלתי אפשרי.', author: 'אנונימי', category: CATEGORY },
    { text: 'האפשרות קיימת תמיד - השאלה היא אם אתה רואה אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'מי שאומר שזה בלתי אפשרי לא צריך להפריע למי שעושה את זה.', author: 'אלברט איינשטיין', category: CATEGORY },
    { text: 'בעולם של אפשרויות, הגבול היחיד הוא הדמיון שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תתן לאף אחד לספר לך מה אתה יכול ומה לא.', author: 'אנונימי', category: CATEGORY },
    { text: 'לפעמים הדרך הכי קצרה לאפשרות היא לשנות את נקודת המבט.', author: 'אנונימי', category: CATEGORY },
    { text: 'היכולת לראות אפשרויות היא היכולת לראות עתיד.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל דבר שקיים היום פעם היה רק רעיון.', author: 'אנונימי', category: CATEGORY },
    { text: 'יש אינסוף דרכים להגיע למטרה - אתה רק צריך למצוא אחת.', author: 'אנונימי', category: CATEGORY },
    { text: 'תפסיק לחשוב למה זה לא יעבוד, והתחל לחשוב איך זה יעבוד.', author: 'אנונימי', category: CATEGORY },
    { text: 'האפשרות היא המקום שבו החלום פוגש את המציאות.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל יום מביא עימו אפשרויות חדשות.', author: 'אנונימי', category: CATEGORY },
    { text: 'הפתיחות לאפשרויות היא הפתיחות לחיים.', author: 'אנונימי', category: CATEGORY },
    { text: 'למי שמחפש אפשרויות - יש תמיד דרך חדשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'בעולם חסר גבולות, האפשרויות הן אינסופיות.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תוותר על מה שנראה בלתי אפשרי - רק על מה שאתה לא רוצה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מה שעכשיו קיים, פעם היה רק אפשרות.', author: 'אנונימי', category: CATEGORY },
    { text: 'עתיד טוב יותר מתחיל באמונה באפשרות.', author: 'אנונימי', category: CATEGORY },
    { text: 'האפשרויות מתרבות בכל פעם שאתה פותח את הדעת.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מה שצריך זה רעיון אחד שישנה את הכל.', author: 'אנונימי', category: CATEGORY },
];
