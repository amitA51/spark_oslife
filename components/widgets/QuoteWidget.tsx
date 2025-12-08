import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget';
import { SparklesIcon } from '../icons';
import AddQuoteModal from '../AddQuoteModal';
import * as dataService from '../../services/dataService';
import type { Quote, QuoteCategory } from '../../types';

import { INITIAL_QUOTES } from '../../data/quotesData';

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

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const customQuotes = await dataService.getCustomQuotes();
      const builtInQuotes: Quote[] = INITIAL_QUOTES.map((q, index) => ({
        id: `builtin-${index}`,
        ...q,
        isCustom: false,
      }));
      const combined = [...builtInQuotes, ...customQuotes];
      setAllQuotes(combined);
      if (combined.length > 0) {
        const randomIdx = Math.floor(Math.random() * combined.length);
        setCurrentQuote(combined[randomIdx] || null);
      }
    } catch (error) {
      console.error('Failed to load custom quotes:', error);
    }
  };

  const filteredQuotes =
    selectedCategory === 'all' ? allQuotes : allQuotes.filter(q => q.category === selectedCategory);

  const availableCategories = Array.from(new Set(allQuotes.map(q => q.category)));

  const handleRefresh = () => {
    if (filteredQuotes.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredQuotes.length);
    const newQuote = filteredQuotes[randomIdx];
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

  const handleCategoryChange = (category: QuoteCategory | 'all') => {
    setSelectedCategory(category);
    const filtered =
      category === 'all' ? allQuotes : allQuotes.filter(q => q.category === category);
    if (filtered.length > 0) {
      setCurrentQuote(filtered[0] || null);
    }
  };

  const backgroundStyle = currentQuote?.backgroundImage
    ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${currentQuote.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    : {};

  return (
    <>
      <BaseWidget
        title={title || "ציטוט יומי"}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        }
      >
        <div className="flex flex-col h-full">
          {/* Category Filter */}
          <div className="mb-4 px-4">
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value as QuoteCategory | 'all')}
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
            {!currentQuote?.backgroundImage && (
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
            {currentQuote && (
              <>
                <p
                  className={`text-lg font-medium mb-4 leading-relaxed ${currentQuote.backgroundImage ? 'text-white drop-shadow-lg' : 'text-[var(--text-primary)]'}`}
                >
                  "{currentQuote.text}"
                </p>
                <p
                  className={`text-sm ${currentQuote.backgroundImage ? 'text-white/90 drop-shadow-lg' : 'text-[var(--text-secondary)]'}`}
                >
                  — {currentQuote.author}
                </p>
                <div className="mt-4 flex gap-2 items-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs ${currentQuote.backgroundImage ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-[var(--dynamic-accent-start)]/10 text-[var(--dynamic-accent-start)]'}`}
                  >
                    {CATEGORY_LABELS[currentQuote.category]}
                  </span>
                  {currentQuote.isCustom && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs ${currentQuote.backgroundImage ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-purple-500/10 text-purple-500'}`}
                    >
                      ⭐ מותאם אישית
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quote Count */}
          <div className="mt-4 px-4 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">
              {filteredQuotes.length} ציטוטים זמינים{selectedCategory !== 'all' && ` בקטגוריה זו`}
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
