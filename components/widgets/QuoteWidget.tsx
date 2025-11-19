import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget';
import { SparklesIcon } from '../icons';
import AddQuoteModal from '../AddQuoteModal';
import * as dataService from '../../services/dataService';
import type { Quote, QuoteCategory } from '../../types';

// Default built-in quotes
const defaultQuotes: Quote[] = [
    { id: 'q1', text: "הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.", author: "פיטר דרוקר", category: "motivation", isCustom: false },
    { id: 'q2', text: "ההצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם יום אחר יום.", author: "רוברט קולייר", category: "success", isCustom: false },
    { id: 'q3', text: "אל תחכה. הזמן לעולם לא יהיה מושלם.", author: "נפוליאון היל", category: "action", isCustom: false },
    { id: 'q4', text: "הדבר היחיד שעומד בינך לבין החלום שלך הוא הרצון לנסות ולאמונה שזה אפשרי.", author: "ג'ואל בראון", category: "dreams", isCustom: false },
    { id: 'q5', text: "הצלחה היא לא סופית, כישלון הוא לא קטלני: האומץ להמשיך הוא מה שחשוב.", author: "וינסטון צ'רצ'יל", category: "perseverance", isCustom: false },
    { id: 'q6', text: "אתה לא צריך להיות נהדר כדי להתחיל, אבל אתה צריך להתחיל כדי להיות נהדר.", author: "זיג זיגלר", category: "beginning", isCustom: false },
    { id: 'q7', text: "הדרך להתחיל היא להפסיק לדבר ולהתחיל לעשות.", author: "וולט דיסני", category: "action", isCustom: false },
    { id: 'q8', text: "ההצלחה שלך נקבעת על ידי מה שאתה מוכן לוותר עליו.", author: "אנונימי", category: "sacrifice", isCustom: false },
    { id: 'q9', text: "אל תספור את הימים, תעשה שהימים יספרו.", author: "מוחמד עלי", category: "productivity", isCustom: false },
    { id: 'q10', text: "הדבר היחיד שבלתי אפשרי הוא מה שאתה לא מנסה.", author: "אנונימי", category: "possibility", isCustom: false },
    { id: 'q11', text: "כל יום הוא הזדמנות חדשה.", author: "אנונימי", category: "opportunity", isCustom: false },
    { id: 'q12', text: "תאמין בעצמך ובכל מה שאתה. דע שיש משהו בתוכך שגדול מכל מכשול.", author: "כריסטיאן לרסון", category: "belief", isCustom: false },
    { id: 'q13', text: "הצעד הראשון הוא תמיד הקשה ביותר.", author: "אנונימי", category: "beginning", isCustom: false },
    { id: 'q14', text: "אתה לא יכול לחזור אחורה ולשנות את ההתחלה, אבל אתה יכול להתחיל מהיום וליצור סוף חדש.", author: "סי.אס. לואיס", category: "change", isCustom: false },
    { id: 'q15', text: "הדרך לעשות דברים גדולים היא לאהוב את מה שאתה עושה.", author: "סטיב ג'ובס", category: "passion", isCustom: false },
];

const CATEGORY_LABELS: Record<QuoteCategory, string> = {
    motivation: 'מוטיבציה',
    stoicism: 'סטואיות',
    tech: 'טכנולוגיה',
    success: 'הצלחה',
    action: 'פעולה',
    dreams: 'חלומות',
    perseverance: 'התמדה',
    beginning: 'התחלה',
    sacrifice: 'הקרבה',
    productivity: 'פרודוקטיביות',
    possibility: 'אפשרות',
    opportunity: 'הזדמנות',
    belief: 'אמונה',
    change: 'שינוי',
    passion: 'תשוקה',
    custom: 'מותאם אישית',
};

const QuoteWidget: React.FC = () => {
    const [allQuotes, setAllQuotes] = useState<Quote[]>(defaultQuotes);
    const [currentQuote, setCurrentQuote] = useState<Quote>(defaultQuotes[0]);
    const [selectedCategory, setSelectedCategory] = useState<QuoteCategory | 'all'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [backgroundIndex, setBackgroundIndex] = useState(0);

    // Load custom quotes on mount
    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        try {
            const customQuotes = await dataService.getCustomQuotes();
            const combined = [...defaultQuotes, ...customQuotes];
            setAllQuotes(combined);

            // Set quote of the day
            const today = new Date();
            const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
            const quoteIndex = dayOfYear % combined.length;
            setCurrentQuote(combined[quoteIndex]);
        } catch (error) {
            console.error('Failed to load custom quotes:', error);
        }
    };

    // Filter quotes by category
    const filteredQuotes = selectedCategory === 'all'
        ? allQuotes
        : allQuotes.filter(q => q.category === selectedCategory);

    // Get available categories from all quotes
    const availableCategories = Array.from(new Set(allQuotes.map(q => q.category)));

    const handleRefresh = () => {
        if (filteredQuotes.length === 0) return;
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        setCurrentQuote(filteredQuotes[randomIndex]);

        // Rotate background image if available
        if (currentQuote.backgroundImage) {
            setBackgroundIndex(prev => prev + 1);
        }
    };

    const handleAddQuote = async (quoteData: { text: string; author: string; category: QuoteCategory; backgroundImage?: string }) => {
        try {
            const newQuote = await dataService.addCustomQuote(quoteData);
            await loadQuotes(); // Reload all quotes
            setCurrentQuote(newQuote); // Show the new quote
        } catch (error) {
            console.error('Failed to add quote:', error);
        }
    };

    const handleCategoryChange = (category: QuoteCategory | 'all') => {
        setSelectedCategory(category);
        // Update current quote to match new filter
        const filtered = category === 'all' ? allQuotes : allQuotes.filter(q => q.category === category);
        if (filtered.length > 0) {
            setCurrentQuote(filtered[0]);
        }
    };

    // Determine background style
    const backgroundStyle = currentQuote.backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${currentQuote.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};

    return (
        <>
            <BaseWidget
                title="ציטוט יומי"
                icon={<SparklesIcon className="w-5 h-5" />}
                size="small"
                onRefresh={handleRefresh}
                actions={
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                        title="הוסף ציטוט"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                }
            >
                <div className="flex flex-col h-full">
                    {/* Category Filter */}
                    <div className="mb-4 px-4">
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value as QuoteCategory | 'all')}
                            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]"
                        >
                            <option value="all">כל הקטגוריות ({allQuotes.length})</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat]} ({allQuotes.filter(q => q.category === cat).length})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quote Display */}
                    <div
                        className="flex-1 flex flex-col items-center justify-center text-center px-4 rounded-lg transition-all duration-500"
                        style={backgroundStyle}
                    >
                        {!currentQuote.backgroundImage && (
                            <div className="mb-4">
                                <svg
                                    className="w-12 h-12 text-[var(--dynamic-accent-start)] opacity-20"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                </svg>
                            </div>
                        )}
                        <p className={`text-lg font-medium mb-4 leading-relaxed ${currentQuote.backgroundImage ? 'text-white drop-shadow-lg' : 'text-[var(--text-primary)]'}`}>
                            "{currentQuote.text}"
                        </p>
                        <p className={`text-sm ${currentQuote.backgroundImage ? 'text-white/90 drop-shadow-lg' : 'text-[var(--text-secondary)]'}`}>
                            — {currentQuote.author}
                        </p>
                        <div className="mt-4 flex gap-2 items-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs ${currentQuote.backgroundImage ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-[var(--dynamic-accent-start)]/10 text-[var(--dynamic-accent-start)]'}`}>
                                {CATEGORY_LABELS[currentQuote.category]}
                            </span>
                            {currentQuote.isCustom && (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs ${currentQuote.backgroundImage ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-purple-500/10 text-purple-500'}`}>
                                    ⭐ מותאם אישית
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quote Count */}
                    <div className="mt-4 px-4 text-center">
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {filteredQuotes.length} ציטוטים זמינים
                            {selectedCategory !== 'all' && ` בקטגוריה זו`}
                        </p>
                    </div>
                </div>
            </BaseWidget>

            {isAddModalOpen && (
                <AddQuoteModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddQuote}
                />
            )}
        </>
    );
};

export default QuoteWidget;
