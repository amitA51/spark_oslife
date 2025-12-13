import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BaseWidget from './BaseWidget';
import { SparklesIcon } from '../icons';
import AddQuoteModal from '../AddQuoteModal';
import * as dataService from '../../services/dataService';
import type { Quote, QuoteCategory } from '../../types';
import { INITIAL_QUOTES } from '../../data/quotesData';
import { PremiumSelect } from '../ui/PremiumSelect';

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

interface QuoteWidgetProps {
  title?: string;
}

const QuoteWidget: React.FC<QuoteWidgetProps> = ({ title }) => {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setIsLoading(true);
    try {
      const customQuotes = await dataService.getCustomQuotes();
      const builtInQuotes: Quote[] = INITIAL_QUOTES.map((q, index) => ({
        id: `builtin-${index}`,
        ...q,
        isCustom: false,
      }));
      const combined = [...builtInQuotes, ...customQuotes];
      setAllQuotes(combined);

      // Select random quote initially
      if (combined.length > 0) {
        const randomIdx = Math.floor(Math.random() * combined.length);
        setCurrentQuote(combined[randomIdx] || null);
      }
    } catch (error) {
      console.error('Failed to load custom quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotes =
    selectedCategory === 'all' ? allQuotes : allQuotes.filter(q => q.category === selectedCategory);

  const availableCategories = Array.from(new Set(allQuotes.map(q => q.category)));

  const selectOptions = [
    { value: 'all', label: `כל הקטגוריות (${allQuotes.length})` },
    ...availableCategories.map(cat => ({
      value: cat,
      label: `${CATEGORY_LABELS[cat]} (${allQuotes.filter(q => q.category === cat).length})`
    }))
  ];

  const handleRefresh = () => {
    if (filteredQuotes.length === 0) return;
    // Simple random selection
    const randomIdx = Math.floor(Math.random() * filteredQuotes.length);
    const newQuote = filteredQuotes[randomIdx];

    // Force a small delay if it's the same quote to re-trigger animation key
    if (newQuote && newQuote.id === currentQuote?.id && filteredQuotes.length > 1) {
      handleRefresh(); // Try again
      return;
    }

    if (newQuote) {
      setCurrentQuote(newQuote);
    }
  };

  const handleAddQuote = async (quoteData: {
    text: string;
    author: string;
    category: QuoteCategory;
    backgroundImage?: string;
  }) => {
    try {
      const newQuote = await dataService.addCustomQuote(quoteData);
      await loadQuotes();
      setCurrentQuote(newQuote);
    } catch (error) {
      console.error('Failed to add quote:', error);
    }
  };

  const handleCategoryChange = (categoryValue: string) => {
    const category = categoryValue as QuoteCategory | 'all';
    setSelectedCategory(category);

    const filtered =
      category === 'all' ? allQuotes : allQuotes.filter(q => q.category === category);

    if (filtered.length > 0) {
      // Pick random from new category
      const randomIdx = Math.floor(Math.random() * filtered.length);
      setCurrentQuote(filtered[randomIdx] || null);
    }
  };

  const backgroundStyle = currentQuote?.backgroundImage
    ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${currentQuote.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    : {};

  return (
    <>
      <BaseWidget
        title={title || "השראה יומית"}
        icon={<SparklesIcon className="w-5 h-5 text-amber-300" />}
        size="medium"
        onRefresh={handleRefresh}
        className="relative overflow-hidden group border-white/5 bg-[#0A0A0F]"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
            title="הוסף ציטוט"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        }
      >
        <div className="flex flex-col h-full relative z-10">
          {/* Ambient Background Glow */}
          <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-[var(--dynamic-accent-start)] rounded-full blur-[80px] opacity-10 pointer-events-none" />
          <div className="absolute bottom-[-20px] right-[-20px] w-40 h-40 bg-[var(--dynamic-accent-end)] rounded-full blur-[100px] opacity-10 pointer-events-none" />

          {/* Category Filter */}
          <div className="mb-6 px-4 relative z-20">
            <PremiumSelect
              options={selectOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              placeholder="בחר קטגוריה"
              className="w-full"
            />
          </div>

          {/* Quote Display */}
          <div className="flex-1 relative flex items-center justify-center min-h-[180px]">
            <AnimatePresence mode="wait">
              {currentQuote && !isLoading ? (
                <motion.div
                  key={currentQuote.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="w-full h-full flex flex-col items-center justify-center p-6 text-center rounded-2xl relative overflow-hidden"
                  style={backgroundStyle}
                >
                  {!currentQuote.backgroundImage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <svg
                        className="w-48 h-48 text-[var(--dynamic-accent-start)]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </motion.div>
                  )}

                  <motion.blockquote
                    className={`relative z-10 max-w-sm mx-auto ${currentQuote.backgroundImage ? 'text-white' : 'text-white'}`}
                  >
                    <p className={`text-xl md:text-2xl font-medium leading-relaxed mb-6 font-heading tracking-tight
                                ${currentQuote.backgroundImage ? 'drop-shadow-lg' : 'text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70'}
                            `}>
                      "{currentQuote.text}"
                    </p>

                    <footer className={`flex flex-col items-center gap-2 ${currentQuote.backgroundImage ? 'text-white/90' : 'text-[var(--text-secondary)]'}`}>
                      <cite className="not-italic font-medium text-sm tracking-wide uppercase opacity-80">
                        — {currentQuote.author}
                      </cite>
                      <div className="flex gap-2 mt-2">
                        <span className={`
                                        text-[10px] px-2.5 py-0.5 rounded-full tracking-wider border
                                        ${currentQuote.backgroundImage
                            ? 'bg-black/20 border-white/20 text-white backdrop-blur-md'
                            : 'bg-[var(--dynamic-accent-start)]/5 border-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)]'
                          }
                                     `}>
                          {CATEGORY_LABELS[currentQuote.category]}
                        </span>
                        {currentQuote.isCustom && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full tracking-wider border bg-purple-500/10 border-purple-500/20 text-purple-400">
                            אישי
                          </span>
                        )}
                      </div>
                    </footer>
                  </motion.blockquote>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center p-12"
                >
                  <div className="w-6 h-6 border-2 border-[var(--dynamic-accent-start)] border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 px-4 text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
              {filteredQuotes.length} תובנות לחיים
            </p>
          </div>
        </div>
      </BaseWidget>

      {isAddModalOpen && (
        <AddQuoteModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddQuote} />
      )}
    </>
  );
};

export default QuoteWidget;
