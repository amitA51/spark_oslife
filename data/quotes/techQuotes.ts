import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'tech';

export const techQuotes: QuoteData[] = [
    { text: 'חדשנות מבדילה בין מנהיג לעוקב.', author: "סטיב ג'ובס", category: CATEGORY },
    { text: 'הטכנולוגיה היא הכלי, האנשים הם המנוע.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדרך הטובה ביותר לחזות את העתיד היא להמציא אותו.', author: 'אלן קיי', category: CATEGORY },
    { text: 'פשטות היא התחכום האולטימטיבי.', author: "לאונרדו דה וינצ'י", category: CATEGORY },
    { text: 'תוכנה אוכלת את העולם.', author: 'מארק אנדריסן', category: CATEGORY },
    { text: 'הבעיה עם העולם היא שטיפשים בטוחים בעצמם וחכמים מלאי ספקות.', author: 'ברטרנד ראסל', category: CATEGORY },
    { text: 'האינטרנט הוא המקום הראשון בהיסטוריה שבו אתה יכול להיות אנונימי ועדיין להיות מפורסם.', author: 'אנונימי', category: CATEGORY },
    { text: 'מחשבים הם חסרי תועלת. הם יכולים רק לתת לך תשובות.', author: 'פבלו פיקאסו', category: CATEGORY },
    { text: 'הטכנולוגיה הטובה ביותר היא זו שאתה לא מרגיש שהיא שם.', author: 'אנונימי', category: CATEGORY },
    { text: 'תמיד יש מקום לשיפור, לא משנה כמה אתה טוב.', author: 'אילון מאסק', category: CATEGORY },
    { text: 'המחשב נולד כדי לפתור בעיות שלא היו קיימות לפניו.', author: 'ביל גייטס', category: CATEGORY },
    { text: 'כל טכנולוגיה מספיק מתקדמת אינה ניתנת להבחנה מקסם.', author: 'ארתור סי. קלארק', category: CATEGORY },
    { text: 'האינטרנט הוא הדבר הכי קרוב לגן עדן שיש לנו.', author: 'טים ברנרס-לי', category: CATEGORY },
    { text: 'תכנות הוא כמו לכתוב ספר... מלבד שאם אתה מפספס פסיק בעמוד 126, הכל נהרס.', author: 'אנונימי', category: CATEGORY },
    { text: 'הקוד הטוב ביותר הוא קוד שאתה לא צריך לכתוב.', author: 'ג\'ף אטווד', category: CATEGORY },
    { text: 'בעולם הדיגיטלי, אין מרחקים.', author: 'אנונימי', category: CATEGORY },
    { text: 'הנתונים הם הנפט החדש.', author: 'קלייב האמבי', category: CATEGORY },
    { text: 'טכנולוגיה היא רק כלי. בכל הנוגע לעבודה משותפת ומוטיבציה, האנשים הם הדבר החשוב.', author: 'סטיב ג\'ובס', category: CATEGORY },
    { text: 'כל מה שאפשר לאוטומט, יאוטמט.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה חושב שהטכנולוגיה יכולה לפתור את בעיות האבטחה שלך, אז אתה לא מבין את הבעיות ואתה לא מבין את הטכנולוגיה.', author: 'ברוס שנייר', category: CATEGORY },
    { text: 'AI לא יחליף אותך. אדם שמשתמש ב-AI יחליף אותך.', author: 'אנונימי', category: CATEGORY },
    { text: 'הסטארטאפ הטוב ביותר הוא זה שפותר בעיה שהמייסד עצמו חווה.', author: 'פול גרהם', category: CATEGORY },
    { text: 'לתכנת זה ללמוד לחשוב.', author: 'סימור פפרט', category: CATEGORY },
    { text: 'הספר הוא הטכנולוגיה הטובה ביותר שהומצאה אי פעם.', author: 'אנונימי', category: CATEGORY },
    { text: 'קודם תפתור את הבעיה, ואז תכתוב את הקוד.', author: "ג'ון ג'ונסון", category: CATEGORY },
    { text: 'באגים לא מתקנים את עצמם.', author: 'אנונימי', category: CATEGORY },
    { text: 'הדרך הטובה ביותר ללמוד לתכנת היא לתכנת.', author: 'אנונימי', category: CATEGORY },
    { text: 'העתיד כבר כאן - הוא פשוט לא מופץ באופן שווה.', author: 'ויליאם גיבסון', category: CATEGORY },
    { text: 'טכנולוגיה בלי חזון היא רק כלי.', author: 'אנונימי', category: CATEGORY },
    { text: 'המחשב הוא אופניים למוח.', author: "סטיב ג'ובס", category: CATEGORY },
    { text: 'תוכנה טובה היא כמו הומור טוב - קשה להסביר אבל אתה מזהה אותה כשאתה רואה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הטעות הגדולה ביותר היא לחשוב שהטכנולוגיה לבדה יכולה לפתור בעיות חברתיות.', author: 'אנונימי', category: CATEGORY },
    { text: 'הרעיון שווה 1%. הביצוע שווה 99%.', author: 'תומאס אדיסון', category: CATEGORY },
    { text: 'המתכנת הטוב ביותר הוא זה שיודע מתי לא לתכנת.', author: 'אנונימי', category: CATEGORY },
    { text: 'למד לקודד, קודד ללמוד.', author: 'מיטש רזניק', category: CATEGORY },
];
