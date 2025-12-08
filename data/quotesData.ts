import { Quote } from '../types';

export const INITIAL_QUOTES: Omit<Quote, 'id' | 'isCustom'>[] = [
  // Motivation
  {
    text: 'הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.',
    author: 'פיטר דרוקר',
    category: 'motivation',
  },
  {
    text: 'ההצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם יום אחר יום.',
    author: 'רוברט קולייר',
    category: 'motivation',
  },
  { text: 'אל תחכה. הזמן לעולם לא יהיה מושלם.', author: 'נפוליאון היל', category: 'motivation' },
  {
    text: 'הדבר היחיד שעומד בינך לבין החלום שלך הוא הרצון לנסות והאמונה שזה אפשרי.',
    author: "ג'ואל בראון",
    category: 'motivation',
  },
  {
    text: 'הצלחה היא לא סופית, כישלון הוא לא קטלני: האומץ להמשיך הוא מה שחשוב.',
    author: "וינסטון צ'רצ'יל",
    category: 'motivation',
  },
  {
    text: 'אתה לא צריך להיות נהדר כדי להתחיל, אבל אתה צריך להתחיל כדי להיות נהדר.',
    author: 'זיג זיגלר',
    category: 'motivation',
  },
  {
    text: 'הדרך להתחיל היא להפסיק לדבר ולהתחיל לעשות.',
    author: 'וולט דיסני',
    category: 'motivation',
  },
  {
    text: 'ההצלחה שלך נקבעת על ידי מה שאתה מוכן לוותר עליו.',
    author: 'אנונימי',
    category: 'motivation',
  },
  { text: 'אל תספור את הימים, תעשה שהימים יספרו.', author: 'מוחמד עלי', category: 'motivation' },
  {
    text: 'הדבר היחיד שבלתי אפשרי הוא מה שאתה לא מנסה.',
    author: 'אנונימי',
    category: 'motivation',
  },
  { text: 'כל יום הוא הזדמנות חדשה.', author: 'אנונימי', category: 'motivation' },
  {
    text: 'תאמין בעצמך ובכל מה שאתה. דע שיש משהו בתוכך שגדול מכל מכשול.',
    author: 'כריסטיאן לרסון',
    category: 'motivation',
  },
  { text: 'הצעד הראשון הוא תמיד הקשה ביותר.', author: 'אנונימי', category: 'motivation' },
  {
    text: 'אתה לא יכול לחזור אחורה ולשנות את ההתחלה, אבל אתה יכול להתחיל מהיום וליצור סוף חדש.',
    author: 'סי.אס. לואיס',
    category: 'motivation',
  },
  {
    text: 'הדרך לעשות דברים גדולים היא לאהוב את מה שאתה עושה.',
    author: "סטיב ג'ובס",
    category: 'motivation',
  },

  // Stoicism
  {
    text: 'יש לנו שתי אוזניים ופה אחד כדי שנוכל להקשיב כפול ממה שאנחנו מדברים.',
    author: 'אפיקטטוס',
    category: 'stoicism',
  },
  { text: 'האושר שלך תלוי באיכות המחשבות שלך.', author: 'מרקוס אורליוס', category: 'stoicism' },
  {
    text: 'אל תבזבז זמן בוויכוח על מהו אדם טוב. היה אחד.',
    author: 'מרקוס אורליוס',
    category: 'stoicism',
  },
  {
    text: 'האדם אינו מוטרד מהדברים עצמם, אלא מההשקפה שלו עליהם.',
    author: 'אפיקטטוס',
    category: 'stoicism',
  },
  { text: 'סבול והתאפק.', author: 'אפיקטטוס', category: 'stoicism' },
  { text: 'העושר הגדול ביותר הוא להסתפק במועט.', author: 'אפלטון', category: 'stoicism' },
  {
    text: 'שלווה היא לא חוסר בעיות, אלא היכולת להתמודד איתן.',
    author: 'אנונימי',
    category: 'stoicism',
  },
  {
    text: 'הזמן הוא המשאב היקר ביותר, ולמרות זאת הוא המבוזבז ביותר.',
    author: 'תאופרסטוס',
    category: 'stoicism',
  },
  { text: 'אנחנו סובלים יותר בדמיון מאשר במציאות.', author: 'סנקה', category: 'stoicism' },
  { text: 'החיים קצרים מכדי לבזבז אותם על כעס ושנאה.', author: 'אנונימי', category: 'stoicism' },

  // Tech & Innovation
  { text: 'חדשנות מבדילה בין מנהיג לעוקב.', author: "סטיב ג'ובס", category: 'tech' },
  { text: 'הטכנולוגיה היא הכלי, האנשים הם המנוע.', author: 'אנונימי', category: 'tech' },
  { text: 'הדרך הטובה ביותר לחזות את העתיד היא להמציא אותו.', author: 'אלן קיי', category: 'tech' },
  { text: 'פשטות היא התחכום האולטימטיבי.', author: "לאונרדו דה וינצ'י", category: 'tech' },
  { text: 'תוכנה אוכלת את העולם.', author: 'מארק אנדריסן', category: 'tech' },
  {
    text: 'הבעיה עם העולם היא שטיפשים בטוחים בעצמם וחכמים מלאי ספקות.',
    author: 'ברטרנד ראסל',
    category: 'tech',
  },
  {
    text: 'האינטרנט הוא המקום הראשון בהיסטוריה שבו אתה יכול להיות אנונימי ועדיין להיות מפורסם.',
    author: 'אנונימי',
    category: 'tech',
  },
  {
    text: 'מחשבים הם חסרי תועלת. הם יכולים רק לתת לך תשובות.',
    author: 'פבלו פיקאסו',
    category: 'tech',
  },

  // Success
  {
    text: 'הצלחה היא לא המפתח לאושר. אושר הוא המפתח להצלחה.',
    author: 'אלברט שווייצר',
    category: 'success',
  },
  {
    text: 'אני לא נכשלתי. פשוט מצאתי 10,000 דרכים שלא עובדות.',
    author: 'תומאס אדיסון',
    category: 'success',
  },
  {
    text: 'ההצלחה מגיעה בדרך כלל לאלו שעסוקים מכדי לחפש אותה.',
    author: 'הנרי דיוויד תורו',
    category: 'success',
  },
  { text: 'הזדמנויות לא קורות, אתה יוצר אותן.', author: 'כריס גרוסר', category: 'success' },
  {
    text: 'אל תפחד לוותר על הטוב כדי ללכת על המצוין.',
    author: "ג'ון ד. רוקפלר",
    category: 'success',
  },
  {
    text: 'הצלחה היא הליכה מכישלון לכישלון בלי לאבד התלהבות.',
    author: "וינסטון צ'רצ'יל",
    category: 'success',
  },
  {
    text: 'הסוד להצלחה הוא לדעת משהו שאף אחד אחר לא יודע.',
    author: 'אריסטוטל אונאסיס',
    category: 'success',
  },

  // Action
  { text: 'עשייה היא תרופת הפלא לפחד.', author: 'דיוויד שוורץ', category: 'action' },
  {
    text: 'אל תגיד לי שהשמיים הם הגבול כשיש עקבות על הירח.',
    author: 'פול ברנדט',
    category: 'action',
  },
  { text: 'חלומות לא עובדים אלא אם כן אתה עובד.', author: "ג'ון סי. מקסוול", category: 'action' },
  { text: 'המרחק בין חלום למציאות נקרא פעולה.', author: 'אנונימי', category: 'action' },
  { text: 'אל תחכה להזדמנות, צור אותה.', author: 'אנונימי', category: 'action' },
  { text: 'היום הוא היום שבו אתה יכול לשנות את המחר.', author: 'אנונימי', category: 'action' },

  // Dreams
  {
    text: 'העתיד שייך לאלו שמאמינים ביופי של החלומות שלהם.',
    author: 'אלינור רוזוולט',
    category: 'dreams',
  },
  {
    text: 'כל החלומות שלנו יכולים להתגשם אם יהיה לנו האומץ לרדוף אחריהם.',
    author: 'וולט דיסני',
    category: 'dreams',
  },
  {
    text: 'אל תיתן לפחדים שלך לתפוס את מקומם של החלומות שלך.',
    author: 'אנונימי',
    category: 'dreams',
  },
  { text: 'חלום שלא מתפרש הוא כמו מכתב שלא נקרא.', author: 'התלמוד', category: 'dreams' },
  {
    text: 'העולם זקוק לחולמים והעולם זקוק למבצעים. אבל מעל לכל, העולם זקוק לחולמים שעושים.',
    author: "שרה בנ ברת'נאק",
    category: 'dreams',
  },

  // Perseverance
  {
    text: 'זה לא משנה כמה לאט אתה הולך כל עוד אתה לא עוצר.',
    author: 'קונפוציוס',
    category: 'perseverance',
  },
  {
    text: 'ההבדל בין המנצח למפסיד הוא שהמנצח קם פעם אחת יותר.',
    author: 'אנונימי',
    category: 'perseverance',
  },
  {
    text: 'כשאתה מרגיש שאתה רוצה לוותר, תזכור למה התחלת.',
    author: 'אנונימי',
    category: 'perseverance',
  },
  {
    text: 'נהר חוצה סלע לא בגלל כוחו, אלא בגלל התמדתו.',
    author: "ג'ים ווטקינס",
    category: 'perseverance',
  },
  { text: 'הניצחון שייך למתמידים ביותר.', author: 'נפוליאון בונפרטה', category: 'perseverance' },

  // Beginning
  { text: 'מסע של אלף מיל מתחיל בצעד אחד.', author: 'לאו דזה', category: 'beginning' },
  { text: 'ההתחלה היא החלק החשוב ביותר בעבודה.', author: 'אפלטון', category: 'beginning' },
  {
    text: 'אל תפחד להתחיל מחדש. זו הזדמנות לבנות משהו טוב יותר.',
    author: 'אנונימי',
    category: 'beginning',
  },
  { text: 'כל סוף הוא התחלה חדשה.', author: 'אנונימי', category: 'beginning' },

  // Productivity
  {
    text: 'להיות עסוק זה לא אותו דבר כמו להיות פרודוקטיבי.',
    author: 'אנונימי',
    category: 'productivity',
  },
  {
    text: 'התמקד בלהיות פרודוקטיבי במקום להיות עסוק.',
    author: 'טים פריס',
    category: 'productivity',
  },
  { text: 'זמן אבוד לא יחזור לעולם.', author: "בנג'מין פרנקלין", category: 'productivity' },
  {
    text: 'תכנון הוא הבאת העתיד להווה כדי שתוכל לעשות משהו בנידון עכשיו.',
    author: 'אלן לייקין',
    category: 'productivity',
  },
  {
    text: 'הדרך הטובה ביותר לסיים משימה לא נעימה היא להתחיל אותה.',
    author: 'אנונימי',
    category: 'productivity',
  },

  // Belief
  { text: 'האמן שאתה יכול ואתה כבר בחצי הדרך.', author: 'תאודור רוזוולט', category: 'belief' },
  {
    text: 'מה שהמוח יכול להגות ולהאמין בו, הוא יכול להשיג.',
    author: 'נפוליאון היל',
    category: 'belief',
  },
  {
    text: 'האמונה היא הצעד הראשון, גם כשאתה לא רואה את כל גרם המדרגות.',
    author: 'מרטין לותר קינג',
    category: 'belief',
  },
  {
    text: 'הגבולות היחידים שלנו הם אלו שאנחנו מציבים לעצמנו.',
    author: 'אנונימי',
    category: 'belief',
  },

  // Change
  { text: 'היה השינוי שאתה רוצה לראות בעולם.', author: 'מהטמה גנדי', category: 'change' },
  {
    text: 'החיים הם 10% מה שקורה לך ו-90% איך אתה מגיב לזה.',
    author: "צ'ארלס סווינדול",
    category: 'change',
  },
  {
    text: 'אם אתה לא אוהב משהו, שנה אותו. אם אתה לא יכול לשנות אותו, שנה את הגישה שלך.',
    author: "מאיה אנג'לו",
    category: 'change',
  },
  { text: 'השינוי הוא החוק של החיים.', author: "ג'ון פ. קנדי", category: 'change' },

  // Passion
  {
    text: 'תשוקה היא אנרגיה. הרגש את הכוח שנובע מהתמקדות במה שמרגש אותך.',
    author: 'אופרה ווינפרי',
    category: 'passion',
  },
  {
    text: 'שום דבר גדול לא הושג מעולם בלי התלהבות.',
    author: 'ראלף וולדו אמרסון',
    category: 'passion',
  },
  {
    text: 'מצא עבודה שאתה אוהב ולא תצטרך לעבוד יום אחד בחייך.',
    author: 'קונפוציוס',
    category: 'passion',
  },
  { text: 'התשוקה היא החמצן של הנשמה.', author: 'אנונימי', category: 'passion' },
];
