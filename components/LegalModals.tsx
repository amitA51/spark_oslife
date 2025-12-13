import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, FileIcon } from '../components/icons';
import { createPortal } from 'react-dom';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'terms' | 'privacy';
}

const LegalModals: React.FC<LegalModalProps> = ({ isOpen, onClose, title, type }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-colors"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:top-10 md:bottom-10 md:left-1/2 md:-translate-x-1/2 md:w-[600px] 
                     bg-[var(--bg-secondary)] rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col border border-white/10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[var(--bg-secondary)]/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--dynamic-accent-start)]/20 rounded-xl text-[var(--dynamic-accent-start)]">
                                    <FileIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold font-heading">{title}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Scroller */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                            <div className="prose prose-invert prose-sm max-w-none dir-rtl text-right">
                                {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-[var(--bg-secondary)] flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-[var(--dynamic-accent-start)] hover:bg-[var(--dynamic-accent-end)] 
                         text-white font-medium rounded-xl transition-all shadow-lg shadow-[var(--dynamic-accent-glow)]/20"
                            >
                                הבנתי, תודה
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

const TermsContent = () => (
    <div className="space-y-6 text-[var(--text-secondary)]">
        <section>
            <h4 className="text-white text-lg font-bold mb-2">1. מבוא</h4>
            <p>
                ברוכים הבאים ל-Spark OS. השימוש באפליקציה מעיד על הסכמתך לתנאים אלו.
                אנו שואפים לספק את החוויה הטובה ביותר לניהול החיים והמטרות שלך.
            </p>
        </section>

        <section>
            <h4 className="text-white text-lg font-bold mb-2">2. שימוש בשירות</h4>
            <p>
                השירות מיועד לשימוש אישי בלבד. אין לעשות שימוש לרעה בפלטפורמה, לנסות לפרוץ אליה,
                או להשתמש בה למטרות לא חוקיות. אנו שומרים לעצמנו את הזכות להשעות חשבונות שמפרים כללים אלו.
            </p>
        </section>

        <section>
            <h4 className="text-white text-lg font-bold mb-2">3. קניין רוחני</h4>
            <p>
                כל התוכן, העיצוב והקוד ב-Spark OS הם רכושנו הבלעדי. התוכן שאתה יוצר (משימות, יומנים) הוא שלך,
                אבל אתה מעניק לנו רשיון לאחסן ולהציג אותו עבורך במסגרת השירות.
            </p>
        </section>

        <section>
            <h4 className="text-white text-lg font-bold mb-2">4. אחריות</h4>
            <p>
                השירות מסופק "כמות שהוא" (AS-IS). אנו עושים מאמצים רבים להבטיח את זמינות ואבטחת השירות,
                אך לא נוכל להתחייב לכך ב-100%. השימוש באפליקציה הוא על אחריותך בלבד.
            </p>
        </section>
    </div>
);

const PrivacyContent = () => (
    <div className="space-y-6 text-[var(--text-secondary)]">
        <section>
            <h4 className="text-white text-lg font-bold mb-2">1. המידע שאנו אוספים</h4>
            <p>
                אנו אוספים מידע שאתה מספק לנו ישירות: שם, אימייל, ותוכן שאתה יוצר (משימות, מטרות).
                אנו עשויים לאסוף גם מידע טכני אוטומטי לצרכי שיפור השירות וניתוח ביצועים.
            </p>
        </section>

        <section>
            <h4 className="text-white text-lg font-bold mb-2">2. שימוש במידע</h4>
            <p>
                המידע משמש אך ורק לתפעול האפליקציה, שיפור חווית המשתמש, ואבטחת החשבון שלך.
                אנחנו לא מוכרים את המידע שלך לצדדים שלישיים.
            </p>
        </section>

        <section>
            <h4 className="text-white text-lg font-bold mb-2">3. אבטחת מידע</h4>
            <p>
                אנו משתמשים בטכנולוגיות מתקדמות (כגון הצפנה ו-Firebase Security Rules) כדי להגן על המידע שלך.
                עם זאת, שום מערכת אינה חסינה לחלוטין.
            </p>
        </section>

        <section>
            <h4 className="text-white text-lg font-bold mb-2">4. מחיקת מידע</h4>
            <p>
                זכותך המלאה לבקש מחיקה של כל המידע שלך בכל עת. ניתן לעשות זאת דרך הגדרות האפליקציה ("אזור סכנה").
            </p>
        </section>
    </div>
);

export default LegalModals;
