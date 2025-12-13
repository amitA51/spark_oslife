import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'stoicism';

export const stoicismQuotes: QuoteData[] = [
    { text: 'יש לנו שתי אוזניים ופה אחד כדי שנוכל להקשיב כפול ממה שאנחנו מדברים.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'האושר שלך תלוי באיכות המחשבות שלך.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'אל תבזבז זמן בוויכוח על מהו אדם טוב. היה אחד.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'האדם אינו מוטרד מהדברים עצמם, אלא מההשקפה שלו עליהם.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'סבול והתאפק.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'העושר הגדול ביותר הוא להסתפק במועט.', author: 'אפלטון', category: CATEGORY },
    { text: 'שלווה היא לא חוסר בעיות, אלא היכולת להתמודד איתן.', author: 'אנונימי', category: CATEGORY },
    { text: 'הזמן הוא המשאב היקר ביותר, ולמרות זאת הוא המבוזבז ביותר.', author: 'תאופרסטוס', category: CATEGORY },
    { text: 'אנחנו סובלים יותר בדמיון מאשר במציאות.', author: 'סנקה', category: CATEGORY },
    { text: 'החיים קצרים מכדי לבזבז אותם על כעס ושנאה.', author: 'אנונימי', category: CATEGORY },
    { text: 'אין דבר שנעשה בצורה טובה יותר על ידי הכעס.', author: 'סנקה', category: CATEGORY },
    { text: 'הכוח האמיתי הוא לשלוט ברגשות, לא להיות נשלט על ידם.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'מה שלא הורג אותנו עושה אותנו חזקים יותר.', author: 'סנקה', category: CATEGORY },
    { text: 'הדבר היחיד בשליטתך הוא התגובה שלך.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'אל תדרוש שהדברים יקרו כרצונך, אלא רצה שיקרו כפי שהם קורים.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'אתה יכול להיות בלתי מנוצח אם לא נכנס לקרב שאינך יכול לנצח בו.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'הקושי מראה מי האדם באמת.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'זה לא מה שקורה לך, אלא איך אתה מגיב לזה.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'הפחד מהמוות גרוע יותר מהמוות עצמו.', author: 'סנקה', category: CATEGORY },
    { text: 'מי ששולט בעצמו שולט בכל.', author: 'סנקה', category: CATEGORY },
    { text: 'כל מה שאנחנו שומעים הוא דעה, לא עובדה. כל מה שאנחנו רואים הוא נקודת מבט, לא האמת.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'התחל, היה אמיץ, וסמוך על עצמך.', author: 'סנקה', category: CATEGORY },
    { text: 'אל תחפש שהאירועים יקרו כפי שאתה רוצה, אלא רצה אותם כפי שהם קורים.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'החירות האמיתית היא לחיות כפי שאתה רוצה.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'אדם אינו אומלל בגלל אירועים, אלא בגלל הדעות שלו עליהם.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'מי שחי בהרמוניה עם עצמו חי בהרמוניה עם היקום.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'אסור לתת לדברים שאינם בשליטתנו להיות המאסטר שלנו.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'המכשול הוא הדרך.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'אל תבזבז את הזמן הנותר לך בחיים בלהרהר על אחרים.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'הטוב האמיתי נמצא בתוכנו.', author: 'סנקה', category: CATEGORY },
    { text: 'קבל את הדברים שהגורל מביא לך.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'הזמן שלנו מוגבל, אז אל תבזבז אותו בלחיות את החיים של מישהו אחר.', author: 'מרקוס אורליוס', category: CATEGORY },
    { text: 'לא הדברים מציקים לנו, אלא הדעות שלנו עליהם.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'אם רוצים אושר, יש להפסיק להתמקד במה שחסר ולהתחיל להעריך את מה שיש.', author: 'אפיקטטוס', category: CATEGORY },
    { text: 'החיים הם קצרים, והזמן בורח מהר יותר משאנחנו חושבים.', author: 'סנקה', category: CATEGORY },
];
