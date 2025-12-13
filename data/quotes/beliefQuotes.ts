import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'belief';

export const beliefQuotes: QuoteData[] = [
    { text: 'האמן שאתה יכול ואתה כבר בחצי הדרך.', author: 'תאודור רוזוולט', category: CATEGORY },
    { text: 'מה שהמוח יכול להגות ולהאמין בו, הוא יכול להשיג.', author: 'נפוליאון היל', category: CATEGORY },
    { text: 'האמונה היא הצעד הראשון, גם כשאתה לא רואה את כל גרם המדרגות.', author: 'מרטין לותר קינג', category: CATEGORY },
    { text: 'הגבולות היחידים שלנו הם אלו שאנחנו מציבים לעצמנו.', author: 'אנונימי', category: CATEGORY },
    { text: 'תאמין בעצמך והכל יהיה אפשרי.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה בעצמך היא הכוח הגדול ביותר שיש לך.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה לא מאמין בעצמך, למה שמישהו אחר יאמין בך?', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה שלך קובעת את המציאות שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מה שאתה מאמין שאתה יכול לעשות - אתה יכול.', author: 'הנרי פורד', category: CATEGORY },
    { text: 'האמונה היא הגשר בין החלום למציאות.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשאתה מאמין, אתה רואה אפשרויות. כשאתה מפקפק, אתה רואה מכשולים.', author: 'אנונימי', category: CATEGORY },
    { text: 'אמונה חזקה יכולה להזיז הרים.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה שלך היא המצפן שלך בחיים.', author: 'אנונימי', category: CATEGORY },
    { text: 'תאמין בדרך שלך, גם אם אחרים לא מבינים אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה מתחילה באמונה שאתה יכול.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה מאמין שאתה יכול או שאתה לא יכול - אתה צודק.', author: 'הנרי פורד', category: CATEGORY },
    { text: 'האמונה היא הדלק של כל הישג גדול.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תיתן לספקות לעצור אותך. האמונה שלך חזקה יותר.', author: 'אנונימי', category: CATEGORY },
    { text: 'מי שמאמין - מצליח. מי שמפקפק - מפספס.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה בעצמך היא ההשקעה הטובה ביותר שאתה יכול לעשות.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל דבר אפשרי למי שמאמין.', author: 'מרקוס 9:23', category: CATEGORY },
    { text: 'האמונה שלך קובעת את הגבולות שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתה יותר חזק ממה שאתה חושב, יותר חכם ממה שאתה מאמין.', author: 'א.א. מילן', category: CATEGORY },
    { text: 'כשאתה מאמין באמת, הדרך נפתחת לפניך.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה אינה תחליף לעבודה, אבל היא הבסיס לה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תוותר על האמונה שלך גם כשהמציאות נראית אחרת.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה היא האור שמאיר את הדרך בחושך.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל הצלחה התחילה באמונה אחת פשוטה: "אני יכול".', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה שלך היא הכלי החזק ביותר שיש לך.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם תאמין בעצמך מספיק חזק, אף אחד לא יוכל לעצור אותך.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה לא מסירה את הקושי, היא נותנת את הכוח להתמודד איתו.', author: 'אנונימי', category: CATEGORY },
    { text: 'הספק והאמונה לא יכולים לדור יחד. בחר באמונה.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מה שאתה צריך להתחיל הוא להאמין שאתה יכול.', author: 'אנונימי', category: CATEGORY },
    { text: 'האמונה היא הצעד הראשון לכל שינוי.', author: 'אנונימי', category: CATEGORY },
    { text: 'תאמין בתהליך, גם כשלא רואים תוצאות מיידיות.', author: 'אנונימי', category: CATEGORY },
];
