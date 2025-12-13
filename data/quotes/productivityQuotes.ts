import type { Quote, QuoteCategory } from '../../types';

type QuoteData = Omit<Quote, 'id' | 'isCustom'>;

const CATEGORY: QuoteCategory = 'productivity';

export const productivityQuotes: QuoteData[] = [
    { text: 'להיות עסוק זה לא אותו דבר כמו להיות פרודוקטיבי.', author: 'אנונימי', category: CATEGORY },
    { text: 'התמקד בלהיות פרודוקטיבי במקום להיות עסוק.', author: 'טים פריס', category: CATEGORY },
    { text: 'זמן אבוד לא יחזור לעולם.', author: "בנג'מין פרנקלין", category: CATEGORY },
    { text: 'תכנון הוא הבאת העתיד להווה כדי שתוכל לעשות משהו בנידון עכשיו.', author: 'אלן לייקין', category: CATEGORY },
    { text: 'הדרך הטובה ביותר לסיים משימה לא נעימה היא להתחיל אותה.', author: 'אנונימי', category: CATEGORY },
    { text: 'העבודה הקשה ביותר היא לבחור במה לעבוד.', author: 'פול גרהם', category: CATEGORY },
    { text: 'אל תתחיל את היום עד שסיימת אותו על נייר.', author: "ג'ים רון", category: CATEGORY },
    { text: 'הזמן הוא המשאב היחיד שאי אפשר לקנות או למכור.', author: 'אנונימי', category: CATEGORY },
    { text: 'כל דקה שאתה מתכנן חוסכת עשר דקות בביצוע.', author: 'בריאן טרייסי', category: CATEGORY },
    { text: 'עדיף לעשות דבר אחד טוב מעשרה דברים בינוניים.', author: 'אנונימי', category: CATEGORY },
    { text: 'פחות זה יותר. התמקד במעט הקריטי, לא בהרבה השוליים.', author: 'אנונימי', category: CATEGORY },
    { text: 'המפתח לפרודוקטיביות הוא פשטות ומיקוד.', author: "סטיב ג'ובס", category: CATEGORY },
    { text: 'תמקד את האנרגיה שלך על מה שחשוב באמת.', author: 'אנונימי', category: CATEGORY },
    { text: 'אל תבזבז זמן על דברים שלא משרתים את המטרות שלך.', author: 'אנונימי', category: CATEGORY },
    { text: 'הצלחה היא לעבוד חכם, לא רק קשה.', author: 'אנונימי', category: CATEGORY },
    { text: 'הפסקה קצרה עכשיו יכולה לחסוך שעות ארוכות אחר כך.', author: 'אנונימי', category: CATEGORY },
    { text: 'אין זמן טוב או רע - יש רק זמן שמנוצל או מבוזבז.', author: 'אנונימי', category: CATEGORY },
    { text: 'תעדוף את מה שחשוב לפני מה שדחוף.', author: 'סטיבן קאבי', category: CATEGORY },
    { text: 'המולטיטסקינג הוא אויב הפרודוקטיביות.', author: 'גארי קלר', category: CATEGORY },
    { text: 'כל משימה שנמנעים ממנה גדלה בעיניים.', author: 'אנונימי', category: CATEGORY },
    { text: 'הסח דעת הוא הגנב הכי גדול של הזמן שלך.', author: 'אנונימי', category: CATEGORY },
    { text: '80% מהתוצאות מגיעות מ-20% מהמאמצים.', author: 'פארטו', category: CATEGORY },
    { text: 'כל שעה מתוכננת חוסכת שלוש שעות בביצוע.', author: 'בריאן טרייסי', category: CATEGORY },
    { text: 'כשאתה אומר כן לדבר אחד, אתה אומר לא לכל השאר.', author: 'אנונימי', category: CATEGORY },
    { text: 'השקעה במערכת טובה יותר משתלמת יותר מהשקעה בעבודה נוספת.', author: 'אנונימי', category: CATEGORY },
    { text: 'התחל עם המשימה הקשה ביותר קודם - השאר יהיה קל יותר.', author: 'מארק טוויין', category: CATEGORY },
    { text: 'תסדר את הסביבה שלך כך שההחלטות הנכונות יהיו הקלות.', author: 'אנונימי', category: CATEGORY },
    { text: 'אתה לא צריך לראות את כל הדרך - רק את הצעד הבא.', author: 'מרטין לותר קינג', category: CATEGORY },
    { text: 'הזמן הטוב ביותר לעשות משהו היה אתמול. הזמן השני הכי טוב הוא עכשיו.', author: 'פתגם סיני', category: CATEGORY },
    { text: 'תפסיק לחכות לזמן הנכון - הזמן הנכון הוא עכשיו.', author: 'אנונימי', category: CATEGORY },
    { text: 'פשט את התהליך והתוצאות ישתפרו.', author: 'אנונימי', category: CATEGORY },
    { text: 'רוטינה טובה היא הבסיס לפרודוקטיביות גבוהה.', author: 'אנונימי', category: CATEGORY },
    { text: 'לא לכל דבר דחוף יש חשיבות, ולא לכל דבר חשוב יש דחיפות.', author: 'אייזנהאואר', category: CATEGORY },
    { text: 'למד לומר לא לדברים שלא משרתים את המטרה שלך.', author: 'וורן באפט', category: CATEGORY },
    { text: 'הרגלים קטנים מובילים לשינויים גדולים.', author: "ג'יימס קליר", category: CATEGORY },
];
