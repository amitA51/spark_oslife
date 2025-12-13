import React, { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import type { FinancialAsset } from '../types';
import type { Screen } from '../types';
import * as dataService from '../services/dataService';
import * as financialsService from '../services/financialsService';
import {
  TrashIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FlameIcon,
  SearchIcon,
  FeedIcon,
  CalendarIcon,
  RefreshIcon,
  SparklesIcon,
} from '../components/icons';
import StatusMessage, { StatusMessageType } from '../components/StatusMessage';
import AssetDetailModal from '../components/AssetDetailModal';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const REFRESH_INTERVAL_MS = 30000;
const CACHE_KEY = 'investments_cached_data';
const SORT_KEY = 'investments_sort_preference';
const FILTER_KEY = 'investments_filter_preference';

type SortOption = 'default' | 'change_desc' | 'change_asc' | 'price_desc' | 'price_asc' | 'name';
type FilterOption = 'all' | 'stocks' | 'crypto';

const CRYPTO_TICKERS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC', 'ATOM', 'SHIB', 'APT', 'ARB', 'OP', 'NEAR'];

const isUSMarketOpen = (): boolean => {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  if (day === 0 || day === 6) return false;
  if (timeInMinutes < 9 * 60 + 30) return false;
  if (timeInMinutes >= 16 * 60) return false;
  return true;
};

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `לפני ${seconds} שניות`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `לפני ${minutes} דקות`;
  return `לפני ${Math.floor(minutes / 60)} שעות`;
};

const getCachedData = (): { watchlist: FinancialAsset[]; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
};

const setCachedData = (watchlist: FinancialAsset[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ watchlist, timestamp: Date.now() }));
  } catch { /* ignore */ }
};

const getSavedSort = (): SortOption => {
  try { return (localStorage.getItem(SORT_KEY) as SortOption) || 'default'; } catch { return 'default'; }
};

const getSavedFilter = (): FilterOption => {
  try { return (localStorage.getItem(FILTER_KEY) as FilterOption) || 'all'; } catch { return 'all'; }
};

// ============================================================================
// FAMOUS STOCKS
// ============================================================================

const FAMOUS_STOCKS = [
  { ticker: 'AAPL', name: 'Apple', emoji: '🍎', type: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft', emoji: '💻', type: 'stock' },
  { ticker: 'TSLA', name: 'Tesla', emoji: '⚡', type: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA', emoji: '🎮', type: 'stock' },
  { ticker: 'BTC', name: 'Bitcoin', emoji: '₿', type: 'crypto' },
  { ticker: 'ETH', name: 'Ethereum', emoji: '💎', type: 'crypto' },
  { ticker: 'GOOGL', name: 'Google', emoji: '🔍', type: 'stock' },
  { ticker: 'AMZN', name: 'Amazon', emoji: '📦', type: 'stock' },
  { ticker: 'SOL', name: 'Solana', emoji: '☀️', type: 'crypto' },
  { ticker: 'META', name: 'Meta', emoji: '👓', type: 'stock' },
];

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = memo(({
  value,
  prefix = '',
  suffix = '',
  decimals = 2
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;

    // PERFORMANCE: Skip animation for micro-changes (< 0.01% difference)
    const percentChange = Math.abs((end - start) / (start || 1));
    if (percentChange < 0.0001) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
});

// ============================================================================
// TICKER TAPE
// ============================================================================

const TickerTapeItem: React.FC<{ symbol: string; price: number; change: number }> = memo(({ symbol, price, change }) => (
  <div className="flex items-center gap-3 px-5 border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
    <span className="font-bold text-white/90 text-xs">{symbol}</span>
    <span className="font-mono text-white/60 text-xs">${price.toFixed(2)}</span>
    <span className={`text-[10px] font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
    </span>
  </div>
));

const TickerTape: React.FC<{ items: financialsService.TopMover[] }> = memo(({ items }) => {
  if (!items.length) return null;

  return (
    <div className="w-full bg-black/50 border-b border-white/5 backdrop-blur-md overflow-hidden flex h-9 items-center">
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {items.map((item, i) => (
          <TickerTapeItem key={`${item.ticker}-${i}`} symbol={item.ticker} price={item.price} change={item.changePercent} />
        ))}
        {items.map((item, i) => (
          <TickerTapeItem key={`dup-${item.ticker}-${i}`} symbol={item.ticker} price={item.price} change={item.changePercent} />
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
});

// ============================================================================
// FILTER & SORT TABS
// ============================================================================

const FilterTabs: React.FC<{ value: FilterOption; onChange: (v: FilterOption) => void }> = memo(({ value, onChange }) => {
  const tabs: { key: FilterOption; label: string; icon: string }[] = [
    { key: 'all', label: 'הכל', icon: '📊' },
    { key: 'stocks', label: 'מניות', icon: '📈' },
    { key: 'crypto', label: 'קריפטו', icon: '₿' },
  ];

  return (
    <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${value === tab.key
            ? 'bg-white/[0.08] text-white shadow-sm'
            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
            }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
});

const SortDropdown: React.FC<{ value: SortOption; onChange: (v: SortOption) => void }> = memo(({ value, onChange }) => {
  const options: { key: SortOption; label: string }[] = [
    { key: 'default', label: 'ברירת מחדל' },
    { key: 'change_desc', label: '📈 עליות' },
    { key: 'change_asc', label: '📉 ירידות' },
    { key: 'price_desc', label: '💰 מחיר ↓' },
    { key: 'price_asc', label: '💰 מחיר ↑' },
    { key: 'name', label: '🔤 שם' },
  ];

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as SortOption)}
      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-purple-500/50 cursor-pointer"
    >
      {options.map(opt => (
        <option key={opt.key} value={opt.key} className="bg-gray-900 text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
});

// ============================================================================
// NEWS & MACRO
// ============================================================================

const NewsCard: React.FC<{ news: financialsService.NewsItem }> = memo(({ news }) => (
  <a
    href={news.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all group"
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1 text-[10px] text-white/40">
        <span className="uppercase font-bold tracking-wider text-purple-400">{news.source}</span>
        <span>•</span>
        <span>{new Date(news.datetime * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <h4 className="text-xs font-bold text-white/90 leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">
        {news.headline}
      </h4>
    </div>
  </a>
));

const MacroItem: React.FC<{ label: string; value: number | string; change?: number; icon?: string }> = memo(({ label, value, change, icon }) => (
  <div className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer min-w-[110px] shrink-0">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-base">{icon}</span>
      <span className="text-[10px] text-white/50 font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-sm font-bold text-white font-mono">
        {typeof value === 'number' ? <AnimatedCounter value={value} decimals={2} /> : value}
      </span>
      {change !== undefined && (
        <span className={`text-[9px] font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      )}
    </div>
  </div>
));

// ============================================================================
// CORE COMPONENTS
// ============================================================================

const MiniChart: React.FC<{ data?: number[]; isPositive: boolean; height?: number }> = memo(({
  data,
  isPositive,
  height = 32
}) => {
  if (!data || data.length < 2) return <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = (height - 2) - ((d - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  const color = isPositive ? '#10B981' : '#EF4444';

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`cg-${isPositive ? 1 : 0}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#cg-${isPositive ? 1 : 0})`} points={`0,${height} ${points} 100,${height}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
});

const MarketStatusBadge: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <div className={`
    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase
    ${isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}
  `}>
    <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
    {isOpen ? 'פתוח' : 'סגור'}
  </div>
);

const QuickAddChip: React.FC<{ ticker: string; emoji: string; isAdded: boolean; onAdd: () => void; isLoading?: boolean }> = memo(({ ticker, emoji, isAdded, onAdd, isLoading }) => (
  <button
    onClick={onAdd}
    disabled={isAdded || isLoading}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 shrink-0 ${isAdded
      ? 'bg-emerald-500/10 text-emerald-400'
      : isLoading
        ? 'bg-white/[0.03] text-white/30 animate-pulse'
        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white active:scale-95'
      }`}
  >
    <span>{emoji}</span>
    <span>{ticker}</span>
    {isAdded && <span className="text-[8px]">✓</span>}
  </button>
));

const AssetCard = memo(function AssetCard({
  asset,
  onRemove,
  onClick,
  isCrypto
}: {
  asset: FinancialAsset;
  onRemove: (ticker: string) => void;
  onClick: (asset: FinancialAsset) => void;
  isCrypto: boolean;
}) {
  const isPositive = (asset.change24h || 0) >= 0;
  const changeAbs = Math.abs(asset.change24h || 0);
  const isHot = changeAbs > 5;

  const handleClick = useCallback(() => {
    onClick(asset);
  }, [onClick, asset]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(asset.ticker);
  }, [onRemove, asset.ticker]);

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden bg-[var(--ql-surface-base)] backdrop-blur-md border border-[var(--ql-border-invisible)] hover:border-[var(--ql-border-subtle)] rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.99] cursor-pointer"
      style={{ boxShadow: 'var(--ql-shadow-subtle)' }}
    >
      {/* Hot indicator */}
      {isHot && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[8px] font-bold">
          <FlameIcon className="w-2.5 h-2.5" />
          חם!
        </div>
      )}

      {/* Side indicator */}
      <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />

      {/* Type badge */}
      <div className="absolute top-2 right-2 opacity-40 text-[10px]">
        {isCrypto ? '₿' : '📈'}
      </div>

      <div className="flex justify-between items-start mb-2 pl-3 pr-6">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight font-mono">{asset.ticker}</h3>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{asset.name}</span>
        </div>
        <div className="text-left">
          <div className="text-lg font-bold text-white font-mono">
            <AnimatedCounter value={asset.price || 0} prefix="$" />
          </div>
          <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
            <span className="font-mono">{isPositive ? '+' : ''}{asset.change24h?.toFixed(2) || '0.00'}%</span>
          </div>
        </div>
      </div>

      <div className="h-8 mt-2 opacity-60 group-hover:opacity-100 transition-opacity pl-3">
        <MiniChart data={asset.sparkline} isPositive={isPositive} height={32} />
      </div>

      <button
        onClick={handleRemove}
        className="absolute bottom-2 right-2 p-2 rounded-full text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
});

const PortfolioSummary: React.FC<{ watchlist: FinancialAsset[]; filter: FilterOption }> = memo(({ watchlist, filter }) => {
  const filtered = useMemo(() => {
    if (filter === 'all') return watchlist;
    if (filter === 'crypto') return watchlist.filter(a => CRYPTO_TICKERS.includes(a.ticker));
    return watchlist.filter(a => !CRYPTO_TICKERS.includes(a.ticker));
  }, [watchlist, filter]);

  const totalValue = filtered.reduce((sum, a) => sum + (a.price || 0), 0);
  const avgChange = filtered.length > 0
    ? filtered.reduce((sum, a) => sum + (a.change24h || 0), 0) / filtered.length
    : 0;
  const isPositive = avgChange >= 0;

  if (watchlist.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-white/10 mb-4">
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
          {filter === 'all' ? 'סה"כ תיק' : filter === 'crypto' ? 'סה"כ קריפטו' : 'סה"כ מניות'}
        </p>
        <p className="text-xl font-black text-white font-mono">
          <AnimatedCounter value={totalValue} prefix="$" />
        </p>
      </div>
      <div className={`text-left px-4 py-2 rounded-xl ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">שינוי ממוצע</p>
        <p className={`text-lg font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          <AnimatedCounter value={avgChange} prefix={isPositive ? '+' : ''} suffix="%" />
        </p>
      </div>
    </div>
  );
});

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }> = ({ icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-3 mt-5 px-1">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-purple-300">{icon}</div>
      <div>
        <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-[10px] text-white/40 font-medium">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl p-4 bg-white/5 border border-white/5 animate-pulse">
    <div className="flex justify-between mb-3">
      <div>
        <div className="h-5 w-14 bg-white/10 rounded mb-2" />
        <div className="h-3 w-20 bg-white/5 rounded" />
      </div>
      <div className="text-left">
        <div className="h-5 w-16 bg-white/10 rounded mb-2" />
        <div className="h-3 w-10 bg-white/5 rounded" />
      </div>
    </div>
    <div className="h-8 w-full bg-white/5 rounded" />
  </div>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================

interface InvestmentsScreenProps { setActiveScreen: (screen: Screen) => void; }

const InvestmentsScreen: React.FC<InvestmentsScreenProps> = ({ setActiveScreen }) => {
  const [watchlist, setWatchlist] = useState<FinancialAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [newTicker, setNewTicker] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<FinancialAsset | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: StatusMessageType; text: string; id: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [marketOpen, setMarketOpen] = useState(isUSMarketOpen());

  // Filter & Sort
  const [filter, setFilter] = useState<FilterOption>(getSavedFilter());
  const [sort, setSort] = useState<SortOption>(getSavedSort());

  // Market data
  const [topMovers, setTopMovers] = useState<financialsService.TopMoversData | null>(null);
  const [news, setNews] = useState<financialsService.NewsItem[]>([]);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Persist filter & sort
  useEffect(() => { localStorage.setItem(FILTER_KEY, filter); }, [filter]);
  useEffect(() => { localStorage.setItem(SORT_KEY, sort); }, [sort]);

  const showStatus = useCallback((type: StatusMessageType, text: string) => {
    if (type === 'error' && window.navigator.vibrate) window.navigator.vibrate(100);
    if (type === 'success' && window.navigator.vibrate) window.navigator.vibrate([50]);
    setStatusMessage({ type, text, id: Date.now() });
  }, []);

  // Filtered & sorted watchlist
  const displayedWatchlist = useMemo(() => {
    let result = [...watchlist];

    // Filter
    if (filter === 'crypto') {
      result = result.filter(a => CRYPTO_TICKERS.includes(a.ticker));
    } else if (filter === 'stocks') {
      result = result.filter(a => !CRYPTO_TICKERS.includes(a.ticker));
    }

    // Sort
    switch (sort) {
      case 'change_desc':
        result.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
        break;
      case 'change_asc':
        result.sort((a, b) => (a.change24h || 0) - (b.change24h || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [watchlist, filter, sort]);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    try {
      const cached = getCachedData();
      if (cached && cached.watchlist.length > 0) {
        setWatchlist(cached.watchlist);
        setLastUpdated(cached.timestamp);
        setIsLoading(false);
      }

      const currentWatchlist = await dataService.getWatchlist();
      if (currentWatchlist.length === 0) {
        setWatchlist([]);
        setIsLoading(false);
        return;
      }

      const data = await financialsService.fetchWatchlistData(currentWatchlist);
      setWatchlist(data);
      setLastUpdated(Date.now());
      setCachedData(data);

    } catch (error) {
      console.error('Failed to load watchlist:', error);
      if (isInitialMount.current) {
        showStatus('error', 'שגיאה בטעינת נתונים');
      }
    } finally {
      setIsLoading(false);
      isInitialMount.current = false;
    }
  }, [showStatus]);

  const loadMarketData = useCallback(async () => {
    try {
      const [movers, fetchedNews] = await Promise.all([
        financialsService.fetchTopMovers(),
        financialsService.fetchNewsForTicker('MARKET', 'stock').catch(() => []),
      ]);
      setTopMovers(movers);
      setNews(fetchedNews.slice(0, 3));
    } catch { /* silent */ }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadData(false), loadMarketData()]);
    setIsRefreshing(false);
    showStatus('success', 'הנתונים עודכנו!');
  }, [loadData, loadMarketData, showStatus]);

  useEffect(() => {
    loadData();
    loadMarketData();

    const marketInterval = setInterval(() => {
      setMarketOpen(isUSMarketOpen());
    }, 60000);

    refreshIntervalRef.current = setInterval(() => {
      loadData(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(marketInterval);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [loadData, loadMarketData]);

  const handleAdd = useCallback(async (ticker: string) => {
    if (!ticker || isAdding) return;

    const tickerUpper = ticker.toUpperCase();

    if (watchlist.some(a => a.ticker === tickerUpper)) {
      showStatus('info', `${tickerUpper} כבר ברשימה`);
      return;
    }

    setIsAdding(tickerUpper);

    try {
      const newWatchlistItem = await dataService.addToWatchlist(tickerUpper);
      const newData = await financialsService.fetchWatchlistData([newWatchlistItem]);

      if (newData?.length > 0) {
        setWatchlist(prev => {
          const updated = [newData[0] as FinancialAsset, ...prev];
          setCachedData(updated);
          return updated;
        });
        setNewTicker('');
        showStatus('success', `${tickerUpper} נוסף!`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'שגיאה';
      showStatus('error', message);
    } finally {
      setIsAdding(null);
    }
  }, [isAdding, watchlist, showStatus]);

  const handleRemove = useCallback(async (ticker: string) => {
    setWatchlist(prev => {
      const updated = prev.filter(a => a.ticker !== ticker);
      setCachedData(updated);
      return updated;
    });

    await dataService.removeFromWatchlist(ticker);
    showStatus('info', `${ticker} הוסר`);
  }, [showStatus]);

  // PERFORMANCE: Memoized handler to avoid re-renders in AssetCard
  const handleAssetClick = useCallback((asset: FinancialAsset) => {
    setSelectedAsset(asset);
  }, []);

  const allTopMovers = topMovers ? [...topMovers.gainers, ...topMovers.losers, ...topMovers.mostActive] : [];
  const marqueeItems = Array.from(new Map(allTopMovers.map(item => [item.ticker, item])).values());

  return (
    <div className="min-h-screen pb-32 -mx-4">

      {/* TICKER TAPE */}
      {marqueeItems.length > 0 && (
        <div className="sticky top-0 z-30">
          <TickerTape items={marqueeItems} />
        </div>
      )}

      <div className="px-4">

        {/* HERO SECTION */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 shadow-2xl mt-4 mb-6 transition-all duration-500"
          style={{
            background: 'radial-gradient(circle at top left, rgba(100, 50, 150, 0.1) 0%, transparent 50%), linear-gradient(135deg, rgba(20,10,35,0.9) 0%, rgba(15,8,28,0.95) 100%)',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.05)'
          }}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-black text-white mb-1">שוק ההון</h1>
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{new Date().toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span>•</span>
                  <span className={isRefreshing ? 'animate-pulse' : ''}>{formatTimeAgo(lastUpdated)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MarketStatusBadge isOpen={marketOpen} />
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90 disabled:opacity-50"
                >
                  <RefreshIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAdd(newTicker); }} className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/30">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={newTicker}
                onChange={e => setNewTicker(e.target.value.toUpperCase())}
                placeholder="חפש מניה או מטבע..."
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-purple-500/50 rounded-xl py-3 pr-4 pl-10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono uppercase text-sm transition-all"
              />
            </form>
          </div>
        </div>

        {/* QUICK ADD CHIPS */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {FAMOUS_STOCKS.map(s => (
            <QuickAddChip
              key={s.ticker}
              ticker={s.ticker}
              emoji={s.emoji}
              isAdded={watchlist.some(a => a.ticker === s.ticker)}
              isLoading={isAdding === s.ticker}
              onAdd={() => handleAdd(s.ticker)}
            />
          ))}
        </div>

        {/* FILTER & SORT */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <FilterTabs value={filter} onChange={setFilter} />
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {/* PORTFOLIO SUMMARY */}
        <PortfolioSummary watchlist={watchlist} filter={filter} />

        {/* WATCHLIST */}
        <SectionHeader
          icon={<ChartBarIcon className="w-4 h-4" />}
          title={filter === 'all' ? 'התיק שלי' : filter === 'crypto' ? 'קריפטו' : 'מניות'}
          subtitle={displayedWatchlist.length > 0 ? `${displayedWatchlist.length} נכסים` : undefined}
        />

        <div className="space-y-3">
          {isLoading && watchlist.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : displayedWatchlist.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5 border-dashed">
              <ChartBarIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">
                {watchlist.length === 0 ? 'הרשימה ריקה' : `אין ${filter === 'crypto' ? 'קריפטו' : 'מניות'} ברשימה`}
              </p>
              <p className="text-white/30 text-xs mt-1">הוסף נכסים מהכפתורים למעלה</p>
            </div>
          ) : (
            displayedWatchlist.map((asset) => (
              <AssetCard
                key={asset.ticker}
                asset={asset}
                isCrypto={CRYPTO_TICKERS.includes(asset.ticker)}
                onRemove={handleRemove}
                onClick={handleAssetClick}
              />
            ))
          )}
        </div>

        {/* TOP MOVERS */}
        {topMovers && topMovers.gainers.length > 0 && (
          <>
            <SectionHeader
              icon={<FlameIcon className="w-4 h-4 text-orange-400" />}
              title="תנועות בולטות"
              subtitle="Top Gainers"
            />
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {topMovers.gainers.slice(0, 5).map(m => (
                <MacroItem key={m.ticker} label={m.ticker} value={m.price} change={m.changePercent} icon="📈" />
              ))}
            </div>
          </>
        )}

        {/* NEWS FEED */}
        {news.length > 0 && (
          <>
            <SectionHeader
              icon={<FeedIcon className="w-4 h-4 text-blue-400" />}
              title="חדשות שוק"
              subtitle="עדכונים אחרונים"
            />
            <div className="space-y-2 pb-6">
              {news.map(item => <NewsCard key={item.id} news={item} />)}
            </div>
          </>
        )}

        {/* Tips for new users */}
        {watchlist.length === 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-300">התחל כאן!</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              לחץ על אחד מהכפתורים למעלה כדי להוסיף מניה או מטבע דיגיטלי לרשימה שלך.
              המחירים מתעדכנים אוטומטית כל 30 שניות! 🚀
            </p>
          </div>
        )}

      </div>

      {selectedAsset && <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
      {statusMessage && <StatusMessage key={statusMessage.id} type={statusMessage.type} message={statusMessage.text} onDismiss={() => setStatusMessage(null)} />}
    </div>
  );
};

export default InvestmentsScreen;
