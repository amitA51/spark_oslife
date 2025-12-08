import { useState, useEffect, useMemo } from 'react';
import type { Screen, PersonalItem, UniversalSearchResult, SearchFilters } from '../types';
import { universalAiSearch } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon, SparklesIcon, SettingsIcon, FilterIcon } from '../components/icons';
import MarkdownRenderer from '../components/MarkdownRenderer';
import SearchResultItem from '../components/SearchResultItem';
import SearchFilterPanel from '../components/SearchFilterPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import { useData } from '../src/contexts/DataContext';
import { useCalendar } from '../src/contexts/CalendarContext';
import { useSettings } from '../src/contexts/SettingsContext';
import PremiumHeader from '../components/PremiumHeader';

interface SearchScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

export default function SearchScreen({ setActiveScreen }: SearchScreenProps) {
  const { personalItems, feedItems } = useData();
  const { calendarEvents } = useCalendar();
  const { settings } = useSettings();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);

  const [isAiSearch, setIsAiSearch] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSourceIds, setAiSourceIds] = useState<Set<string>>(new Set());

  const [localResults, setLocalResults] = useState<UniversalSearchResult[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    status: 'all',
  });

  const allSearchableData = useMemo((): UniversalSearchResult[] => {
    const personal: UniversalSearchResult[] = personalItems.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title || '',
      content: item.content || '',
      date: item.createdAt,
      item,
    }));
    const feed: UniversalSearchResult[] = feedItems.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.summary_ai || item.content,
      date: item.createdAt,
      item,
    }));
    const calendar: UniversalSearchResult[] = calendarEvents.map(event => ({
      id: event.htmlLink || event.id || '',
      type: 'calendar',
      title: event.summary,
      content: '',
      date: event.start?.dateTime || event.start?.date || new Date().toISOString(),
      item: event,
    }));
    return [...personal, ...feed, ...calendar].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [personalItems, feedItems, calendarEvents]);

  useEffect(() => {
    if (debouncedQuery.length > 1 && !isAiSearch) {
      const lowerCaseQuery = debouncedQuery.toLowerCase();
      const results = allSearchableData.filter(
        item =>
          item.title.toLowerCase().includes(lowerCaseQuery) ||
          item.content.toLowerCase().includes(lowerCaseQuery)
      );
      setLocalResults(results);
    } else if (debouncedQuery.length <= 1) {
      setLocalResults([]);
    }
  }, [debouncedQuery, allSearchableData, isAiSearch]);

  const handleAiSearch = async () => {
    if (!query || isAiLoading) return;
    setIsAiLoading(true);
    setIsAiSearch(true);
    setAiAnswer(null);
    setAiSourceIds(new Set());
    setLocalResults([]);

    try {
      const searchCorpus = allSearchableData.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content.substring(0, 400),
        date: item.date,
      }));
      const result = await universalAiSearch(query, searchCorpus);
      setAiAnswer(result.answer);
      setAiSourceIds(new Set(result.sourceIds));
    } catch (e) {
      console.error('AI Search failed', e);
      setAiAnswer('התנצלותי, נתקלתי בשגיאה בעת ביצוע החיפוש החכם.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    // If user clears query or starts typing again, switch back to local search
    if (isAiSearch && q.length < debouncedQuery.length) {
      setIsAiSearch(false);
      setAiAnswer(null);
      setAiSourceIds(new Set());
    }
  };

  const displayedResults = useMemo(() => {
    const source = isAiSearch
      ? allSearchableData.filter(item => aiSourceIds.has(item.id))
      : localResults;

    return source.filter(item => {
      // Type filter
      if (filters.type !== 'all' && item.type !== filters.type) return false;

      // Status filter
      if (filters.status !== 'all') {
        const pItem = item.item as PersonalItem;
        if (filters.status === 'completed' && !pItem.isCompleted) return false;
        if (filters.status === 'open' && pItem.isCompleted) return false;
        if (filters.status === 'important' && !pItem.isImportant) return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const itemDate = new Date(item.date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (filters.dateRange === 'today' && itemDate < today) return false;
        if (filters.dateRange === 'week') {
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);
          if (itemDate < oneWeekAgo) return false;
        }
        if (filters.dateRange === 'month') {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);
          if (itemDate < oneMonthAgo) return false;
        }
      }

      return true;
    });
  }, [localResults, aiSourceIds, isAiSearch, filters, allSearchableData]);

  const resultsByCategory = useMemo(() => {
    return displayedResults.reduce<Record<string, UniversalSearchResult[]>>((acc, item) => {
      const category = item.type;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [displayedResults]);

  const categoryLabels: Record<string, string> = {
    task: 'משימות',
    note: 'פתקים',
    idea: 'רעיונות',
    link: 'קישורים',
    learning: 'למידה',
    journal: 'יומן',
    book: 'ספרים',
    goal: 'פרויקטים',
    workout: 'אימונים',
    roadmap: 'מפות דרכים',
    spark: 'ספארקים',
    rss: 'פיד',
    calendar: 'לוח שנה',
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <SearchFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
      />
      <div className="flex-1 pt-4 pb-4 px-4 flex flex-col">
        <PremiumHeader
          title={settings.screenLabels?.search || 'חיפוש'}
          subtitle="חפש בכל הפריטים האישיים"
          actions={
            <>
              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors"
              >
                <FilterIcon className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveScreen('settings')}
                className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            </>
          }
        >
          <div className="relative flex items-center gap-2 w-full">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <input
                type="search"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                placeholder="חפש או שאל את AI..."
                className={`w-full border text-[var(--text-primary)] rounded-2xl py-3 pr-11 pl-4 focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)] transition-all ${settings.themeSettings.cardStyle === 'glass' ? 'bg-white/10 border-white/10 backdrop-blur-sm' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)]'}`}
              />
            </div>
            <button
              onClick={handleAiSearch}
              disabled={isAiLoading || query.length < 2}
              className="p-3 bg-[var(--accent-gradient)] text-white rounded-2xl transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              <SparklesIcon className={`h-6 w-6 ${isAiLoading ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </PremiumHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {isAiLoading && (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {aiAnswer && (
            <section className="relative themed-card p-4 animate-item-enter-fi">
              <h2 className="text-sm font-semibold text-[var(--accent-highlight)] uppercase tracking-wider mb-2 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" /> תשובת AI
              </h2>
              <MarkdownRenderer content={aiAnswer} />
            </section>
          )}

          {!isAiLoading && debouncedQuery && displayedResults.length === 0 && !aiAnswer && (
            <div className="text-center text-secondary mt-16 flex flex-col items-center">
              <SearchIcon className="w-16 h-16 text-muted mb-4" />
              <p className="max-w-xs">לא נמצאו תוצאות עבור "{debouncedQuery}"</p>
            </div>
          )}

          {/* FIX: Explicitly typed `items` as `UniversalSearchResult[]` to resolve an issue where TypeScript inferred its type as `unknown`, causing an error on the `.map` call. */}
          {Object.entries(resultsByCategory).map(
            ([category, items]: [string, UniversalSearchResult[]]) => (
              <section key={category}>
                <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3 px-1">
                  {categoryLabels[category] || category}
                </h2>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <SearchResultItem key={item.id + index} result={item} query={debouncedQuery} />
                  ))}
                </div>
              </section>
            )
          )}

          {!query && !isAiLoading && (
            <div className="text-center text-muted mt-16 flex flex-col items-center">
              <SearchIcon className="w-16 h-16 text-muted mb-4" />
              <h2 className="text-lg font-semibold text-primary">חיפוש בכל הידע שלך</h2>
              <p className="max-w-xs">הזן מונח חיפוש, או שאל את AI שאלה כדי לקבל תשובה מסונתזת.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
