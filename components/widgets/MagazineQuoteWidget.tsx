import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { SparklesIcon, RefreshIcon, PlusIcon, ShareIcon, HeartIcon } from '../icons';
import AddQuoteModal from '../AddQuoteModal';
import * as dataService from '../../services/dataService';
import type { Quote, QuoteCategory } from '../../types';
import { getAllQuotes } from '../../data/quotesData';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';

// Key for persisting liked quotes
const LIKED_QUOTES_KEY = 'spark_liked_quotes';
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

const CATEGORY_GRADIENTS: Record<QuoteCategory, string> = {
  motivation: 'from-amber-500/20 via-orange-500/10 to-transparent',
  stoicism: 'from-slate-400/20 via-zinc-500/10 to-transparent',
  tech: 'from-cyan-500/20 via-blue-500/10 to-transparent',
  success: 'from-emerald-500/20 via-green-500/10 to-transparent',
  action: 'from-red-500/20 via-rose-500/10 to-transparent',
  dreams: 'from-purple-500/20 via-violet-500/10 to-transparent',
  perseverance: 'from-indigo-500/20 via-blue-500/10 to-transparent',
  beginning: 'from-teal-500/20 via-cyan-500/10 to-transparent',
  sacrifice: 'from-rose-500/20 via-pink-500/10 to-transparent',
  productivity: 'from-lime-500/20 via-green-500/10 to-transparent',
  possibility: 'from-sky-500/20 via-blue-500/10 to-transparent',
  opportunity: 'from-yellow-500/20 via-amber-500/10 to-transparent',
  belief: 'from-violet-500/20 via-purple-500/10 to-transparent',
  change: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
  passion: 'from-red-500/20 via-orange-500/10 to-transparent',
  custom: 'from-accent-cyan/20 via-accent-violet/10 to-transparent',
};

interface MagazineQuoteWidgetProps {
  title?: string;
}

const MagazineQuoteWidget: React.FC<MagazineQuoteWidgetProps> = ({ title }) => {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [likedQuoteIds, setLikedQuoteIds] = useState<Set<string>>(new Set());

  // Throttle ref to prevent rapid clicking
  const lastLikeTime = useRef(0);
  const LIKE_THROTTLE_MS = 300;

  // Enhanced haptics and sounds
  const { hapticTap, hapticSelection, triggerEffect } = useHaptics();
  const { playClick, playSwipe } = useSound();

  const likeScale = useSpring(1, { stiffness: 400, damping: 15 });
  const likeRotation = useSpring(0, { stiffness: 400, damping: 15 });

  // Load liked quotes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIKED_QUOTES_KEY);
      if (stored) {
        setLikedQuoteIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.warn('Failed to load liked quotes:', e);
    }
  }, []);

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, []);

  // Check if current quote is liked when quote changes
  useEffect(() => {
    if (currentQuote) {
      setIsLiked(likedQuoteIds.has(currentQuote.id));
    }
  }, [currentQuote, likedQuoteIds]);

  const loadQuotes = async () => {
    try {
      // Load built-in quotes using lazy loading (525 quotes across 15 categories)
      const builtInQuotes = await getAllQuotes();
      // Load custom quotes from storage
      const customQuotes = await dataService.getCustomQuotes();
      const combined = [...builtInQuotes, ...customQuotes];
      setAllQuotes(combined);
      if (combined.length > 0) {
        const randomIdx = Math.floor(Math.random() * combined.length);
        setCurrentQuote(combined[randomIdx] || null);
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
    }
  };

  const filteredQuotes =
    selectedCategory === 'all' ? allQuotes : allQuotes.filter(q => q.category === selectedCategory);

  const availableCategories = Array.from(new Set(allQuotes.map(q => q.category)));

  const handleRefresh = useCallback(() => {
    if (filteredQuotes.length === 0 || isAnimating) return;

    setIsAnimating(true);
    hapticTap();
    playSwipe('right');

    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * filteredQuotes.length);
      const newQuote = filteredQuotes[randomIdx];
      if (newQuote) {
        setCurrentQuote(newQuote);
        setIsLiked(false);
      }
      setIsAnimating(false);
    }, 300);
  }, [filteredQuotes, isAnimating, hapticTap, playSwipe]);

  const handleLike = useCallback(() => {
    // Throttle rapid clicks
    const now = Date.now();
    if (now - lastLikeTime.current < LIKE_THROTTLE_MS) return;
    lastLikeTime.current = now;

    if (!currentQuote) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    // Persist to localStorage
    const newLikedIds = new Set(likedQuoteIds);
    if (newIsLiked) {
      newLikedIds.add(currentQuote.id);
    } else {
      newLikedIds.delete(currentQuote.id);
    }
    setLikedQuoteIds(newLikedIds);
    try {
      localStorage.setItem(LIKED_QUOTES_KEY, JSON.stringify([...newLikedIds]));
    } catch (e) {
      console.warn('Failed to save liked quotes:', e);
    }

    triggerEffect('success', 'medium');
    playClick();
    likeScale.set(1.4);
    likeRotation.set(newIsLiked ? 15 : 0);
    setTimeout(() => {
      likeScale.set(1);
      likeRotation.set(0);
    }, 200);
  }, [isLiked, currentQuote, likedQuoteIds, triggerEffect, playClick, likeScale, likeRotation]);

  const handleShare = useCallback(async () => {
    if (!currentQuote) return;
    hapticTap();
    playClick();

    const shareText = `"${currentQuote.text}"\n— ${currentQuote.author}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ציטוט מעורר השראה',
          text: shareText,
        });
      } catch {
        // User cancelled share - no action needed
      }
    } else {
      navigator.clipboard.writeText(shareText);
    }
  }, [currentQuote, hapticTap, playClick]);

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
    hapticSelection();
    playClick();
    const filtered =
      category === 'all' ? allQuotes : allQuotes.filter(q => q.category === category);
    if (filtered.length > 0) {
      const randomIdx = Math.floor(Math.random() * filtered.length);
      setCurrentQuote(filtered[randomIdx] || null);
      setIsLiked(false);
    }
  };

  const categoryGradient = currentQuote
    ? CATEGORY_GRADIENTS[currentQuote.category]
    : 'from-accent-cyan/20 via-accent-violet/10 to-transparent';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="spark-card relative overflow-hidden"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} pointer-events-none`} />

        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />

        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-cyan via-accent-violet to-accent-magenta opacity-60" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--dynamic-accent-color)] border border-white/10 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5" style={{ color: 'var(--dynamic-accent-start)' }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-tight">{title || 'ציטוט יומי'}</h3>
                <p className="text-xs text-gray-400">{filteredQuotes.length} ציטוטים</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
                title="שתף"
              >
                <ShareIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddModalOpen(true)}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
                title="הוסף ציטוט"
              >
                <PlusIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isAnimating}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-accent-cyan/10 text-white/50 hover:text-accent-cyan transition-colors disabled:opacity-50"
                title="ציטוט חדש"
              >
                <RefreshIcon className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${selectedCategory === 'all'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white/80'
                }`}
            >
              הכל
            </button>
            {availableCategories.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${selectedCategory === cat
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white/80'
                  }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {currentQuote && (
              <motion.div
                key={currentQuote.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative"
              >
                <div className="absolute -right-4 -top-4 text-[120px] leading-none font-serif text-white/[0.03] select-none pointer-events-none">
                  ״
                </div>

                <blockquote className="relative">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-relaxed mb-6 font-serif line-clamp-6" style={{ fontFamily: 'Georgia, serif' }}>
                    {currentQuote.text}
                  </p>

                  <footer className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-accent-cyan to-accent-violet rounded-full" />
                      <div>
                        <cite className="not-italic font-medium text-white/90 block">
                          {currentQuote.author}
                        </cite>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-400 border border-white/5">
                            {CATEGORY_LABELS[currentQuote.category]}
                          </span>
                          {currentQuote.isCustom && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                              מותאם אישית
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      style={{ scale: likeScale, rotate: likeRotation }}
                      onClick={handleLike}
                      className={`p-3 rounded-full transition-colors ${isLiked
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </motion.button>
                  </footer>
                </blockquote>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>לחץ על הכפתור לציטוט חדש</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                מתעדכן יומית
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {isAddModalOpen && (
        <AddQuoteModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddQuote} />
      )}
    </>
  );
};

export default MagazineQuoteWidget;