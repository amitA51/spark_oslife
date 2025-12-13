import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'change';

export const changeQuotes: QuoteData[] = [
    { text: 'היה השינוי שאתה רוצה לראות בעולם.', author: 'מהטמה גנדי', category: CATEGORY },
    { text: 'החיים הם 10% מה שקורה לך ו-90% איך אתה מגיב לזה.', author: "צ'ארלס סווינדול", category: CATEGORY },
    { text: 'אם אתה לא אוהב משהו, שנה אותו. אם אתה לא יכול לשנות אותו, שנה את הגישה שלך.', author: "מאיה אנג'לו", category: CATEGORY },
    { text: 'השינוי הוא החוק של החיים.', author: "ג'ון פ. קנדי", category: CATEGORY },
    { text: 'שינוי אמיתי מתחיל מבפנים.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תפחד מהשינוי. פחד מלהישאר במקום.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל שינוי, גם הקשה ביותר, מביא עימו הזדמנות.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה רוצה תוצאות שונות, עשה דברים שונים.', author: 'אלברט איינשטיין', category: CATEGORY },
    { text: 'שינוי קשה בהתחלה, מבולגן באמצע, ומדהים בסוף.', author: 'רובין שארמה', category: CATEGORY },
    { text: 'הדבר היחיד שקבוע הוא השינוי.', author: 'הרקליטוס', category: CATEGORY },
    { text: 'השינוי הוא לא איום, הוא הזדמנות.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתה לא יכול לשנות את העבר, אבל אתה יכול לעצב את העתיד.', author: 'אנונימי', category: CATEGORY },
    { text: 'השינוי מתחיל ברגע שאתה מחליט שהמצב הנוכחי לא מספק אותך.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תדאג מהשינוי. דאג מלהישאר אותו דבר.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל מסע של שינוי מתחיל בצעד קטן.', author: 'לאו דזה', category: CATEGORY },
    { text: 'השינוי הוא הדבר היחיד שמוביל לצמיחה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם לא תשתנה, לא תצמח. אם לא תצמח, לא תחיה באמת.', author: 'גייל שיהי', category: CATEGORY },
    { text: 'אתה תמיד יכול לבחור מחדש.', author: 'אנונימי', category: CATEGORY },
    { text: 'השינוי הוא לא ויתור על מי שאתה - הוא גילוי מי שאתה יכול להיות.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל שינוי מתחיל בהחלטה.', author: 'טוני רובינס', category: CATEGORY },
    { text: 'אל תחכה שהמציאות תשתנה. שנה את עצמך.', author: 'אנונימי', category: CATEGORY },
    { text: 'השינוי הוא לא קל, אבל הוא תמיד אפשרי.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל סיפור הצלחה הוא סיפור של שינוי.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם אתה רוצה לשנות את חייך, התחל לשנות את ההרגלים שלך.', author: "ג'יימס קליר", category: CATEGORY },
    { text: 'השינוי הכי גדול מתחיל בצעד הכי קטן.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תהיה עבד של העבר - היה אדון של העתיד.', author: 'אנונימי', category: CATEGORY },
    { text: 'כשאתה משתנה, העולם סביבך משתנה.', author: 'אנונימי', category: CATEGORY },
    { text: 'השינוי הוא לא סיכון, הוא הזדמנות.', author: 'אנונימי', category: CATEGORY },
    { text: 'מי שמפחד מהשינוי מפחד מהחיים.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל יום הוא הזדמנות להיות גרסה טובה יותר של עצמך.', author: 'אנונימי', category: CATEGORY },
    { text: 'השינוי האמיתי מגיע כשאתה מפסיק להתנגד ומתחיל לזרום.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תפחד לאבד את מי שאתה כדי להפוך למי שאתה מיועד להיות.', author: 'אנונימי', category: CATEGORY },
    { text: 'שינוי הוא הכרחי. צמיחה היא אופציונלית. בחר בחוכמה.', author: "ג'ון מקסוול", category: CATEGORY },
    { text: 'הצעד הראשון לשינוי הוא להודות שצריך לשנות.', author: 'אנונימי', category: CATEGORY },
    { text: 'אם לא עכשיו, מתי? אם לא אתה, מי?', author: 'הילל הזקן', category: CATEGORY },
];
