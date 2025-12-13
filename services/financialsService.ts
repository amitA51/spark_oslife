import type { WatchlistItem, FinancialAsset } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Alpha Vantage API Keys (for stocks - free plan)
// Add multiple API keys here for automatic rotation when one is exhausted
// Total: 7 keys × 25 requests/day = 175 requests/day
const ALPHA_VANTAGE_API_KEYS: string[] = (import.meta.env.VITE_ALPHA_VANTAGE_KEYS || '').split(',').filter(Boolean);

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// FreeCryptoAPI (for crypto data)
const FREECRYPTOAPI_KEY = import.meta.env.VITE_FREECRYPTO_KEY || '';
const FREECRYPTO_BASE_URL = 'https://api.freecryptoapi.com/v1';

// Cache configuration
const CACHE_PREFIX = 'spark_finance_';
const CACHE_DURATIONS = {
  quote: 5 * 60 * 1000,        // 5 minutes for quotes
  chart: 30 * 60 * 1000,       // 30 minutes for charts
  news: 15 * 60 * 1000,        // 15 minutes for news
  company: 24 * 60 * 60 * 1000, // 24 hours for company info
  topMovers: 10 * 60 * 1000,   // 10 minutes for top gainers/losers
};

// Rate limiting per API key (Alpha Vantage free: 25/day, 5/minute)
const RATE_LIMIT_PER_KEY = {
  requestsPerMinute: 5,
  requestsPerDay: 25,
  minDelayMs: 12000, // 12 seconds between requests
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
}

export interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  eps: number;
  high52Week: number;
  low52Week: number;
}

export interface TopMover {
  ticker: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
}

export interface TopMoversData {
  gainers: TopMover[];
  losers: TopMover[];
  mostActive: TopMover[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}



// Hebrew error messages
const ERROR_MESSAGES = {
  RATE_LIMIT: 'חרגת ממגבלת הבקשות היומית. נסה שוב מחר.',
  RATE_LIMIT_MINUTE: 'יותר מדי בקשות. נסה שוב בעוד דקה.',
  NETWORK_ERROR: 'שגיאת רשת. בדוק את החיבור לאינטרנט.',
  NO_DATA: 'לא נמצאו נתונים עבור הסימול הזה.',
  API_ERROR: 'שגיאה בשרת. נסה שוב מאוחר יותר.',
  INVALID_SYMBOL: 'סימול לא תקין.',
};

// ============================================================================
// CACHE UTILITIES
// ============================================================================

function getCacheKey(type: string, identifier: string): string {
  return `${CACHE_PREFIX}${type}_${identifier}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, durationMs: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

function clearExpiredCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry = JSON.parse(cached);
          if (Date.now() > entry.expiresAt) {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// API KEY ROTATION & RATE LIMITER
// ============================================================================

const API_KEY_STATE_KEY = `${CACHE_PREFIX}api_key_state`;

interface ApiKeyState {
  keyIndex: number;
  keyUsage: Record<string, {
    minuteRequests: number[];
    dayRequests: number[];
  }>;
}

function getApiKeyState(): ApiKeyState {
  try {
    const cached = localStorage.getItem(API_KEY_STATE_KEY);
    if (cached) {
      const state: ApiKeyState = JSON.parse(cached);
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Clean old entries for each key
      for (const key of Object.keys(state.keyUsage)) {
        if (state.keyUsage[key]) {
          state.keyUsage[key].minuteRequests = state.keyUsage[key].minuteRequests.filter(t => t > oneMinuteAgo);
          state.keyUsage[key].dayRequests = state.keyUsage[key].dayRequests.filter(t => t > oneDayAgo);
        }
      }

      return state;
    }
  } catch {
    // Ignore
  }

  // Initialize with empty usage for all keys
  const keyUsage: ApiKeyState['keyUsage'] = {};
  ALPHA_VANTAGE_API_KEYS.forEach(key => {
    keyUsage[key] = { minuteRequests: [], dayRequests: [] };
  });

  return { keyIndex: 0, keyUsage };
}

function saveApiKeyState(state: ApiKeyState): void {
  try {
    localStorage.setItem(API_KEY_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

function getAvailableApiKey(): { key: string; index: number } | null {
  const state = getApiKeyState();


  // Try each key starting from the current index
  for (let i = 0; i < ALPHA_VANTAGE_API_KEYS.length; i++) {
    const index = (state.keyIndex + i) % ALPHA_VANTAGE_API_KEYS.length;
    const key = ALPHA_VANTAGE_API_KEYS[index];

    // const key = ALPHA_VANTAGE_API_KEYS[index];
    if (!key) continue;

    // Initialize usage if not exists
    if (!state.keyUsage[key]) {
      state.keyUsage[key] = { minuteRequests: [], dayRequests: [] };
    }

    const usage = state.keyUsage[key];

    // Check if this key is available
    const withinMinuteLimit = usage.minuteRequests.length < RATE_LIMIT_PER_KEY.requestsPerMinute;
    const withinDayLimit = usage.dayRequests.length < RATE_LIMIT_PER_KEY.requestsPerDay;

    if (withinMinuteLimit && withinDayLimit) {
      // If we switched keys, save the new index
      if (index !== state.keyIndex) {
        state.keyIndex = index;
        saveApiKeyState(state);
        console.log(`🔄 Switched to API key #${index + 1}`);
      }
      return { key, index };
    }
  }

  // All keys exhausted
  return null;
}

function recordApiKeyUsage(key: string): void {
  const state = getApiKeyState();
  const now = Date.now();

  if (!state.keyUsage[key]) {
    state.keyUsage[key] = { minuteRequests: [], dayRequests: [] };
  }

  state.keyUsage[key].minuteRequests.push(now);
  state.keyUsage[key].dayRequests.push(now);
  saveApiKeyState(state);
}

function markKeyAsExhausted(key: string): void {
  const state = getApiKeyState();

  // Fill the day requests to mark as exhausted
  if (!state.keyUsage[key]) {
    state.keyUsage[key] = { minuteRequests: [], dayRequests: [] };
  }

  // Add fake requests to fill up the daily limit
  const now = Date.now();
  while (state.keyUsage[key].dayRequests.length < RATE_LIMIT_PER_KEY.requestsPerDay) {
    state.keyUsage[key].dayRequests.push(now);
  }

  // Move to next key
  state.keyIndex = (state.keyIndex + 1) % ALPHA_VANTAGE_API_KEYS.length;
  saveApiKeyState(state);
  console.log(`⚠️ API key exhausted, switching to key #${state.keyIndex + 1}`);
}

/**
 * Get remaining requests across all API keys
 */
export function getRemainingRequests(): { minute: number; day: number; totalDayAcrossKeys: number; activeKeyIndex: number } {
  const state = getApiKeyState();
  const currentKey = ALPHA_VANTAGE_API_KEYS[state.keyIndex];
  const currentUsage = (currentKey && state.keyUsage[currentKey]) || { minuteRequests: [], dayRequests: [] };

  // Calculate total remaining across all keys
  let totalDayRemaining = 0;
  for (const key of ALPHA_VANTAGE_API_KEYS) {
    const usage = state.keyUsage[key] || { dayRequests: [] };
    totalDayRemaining += Math.max(0, RATE_LIMIT_PER_KEY.requestsPerDay - usage.dayRequests.length);
  }

  return {
    minute: Math.max(0, RATE_LIMIT_PER_KEY.requestsPerMinute - currentUsage.minuteRequests.length),
    day: Math.max(0, RATE_LIMIT_PER_KEY.requestsPerDay - currentUsage.dayRequests.length),
    totalDayAcrossKeys: totalDayRemaining,
    activeKeyIndex: state.keyIndex,
  };
}

/**
 * Add a new API key to the rotation
 */
export function addApiKey(newKey: string): boolean {
  if (!newKey || ALPHA_VANTAGE_API_KEYS.includes(newKey)) {
    return false;
  }

  ALPHA_VANTAGE_API_KEYS.push(newKey);

  // Initialize usage for new key
  const state = getApiKeyState();
  state.keyUsage[newKey] = { minuteRequests: [], dayRequests: [] };
  saveApiKeyState(state);

  console.log(`✅ Added new API key. Total keys: ${ALPHA_VANTAGE_API_KEYS.length}`);
  return true;
}

/**
 * Get the count of available API keys
 */
export function getApiKeyCount(): number {
  return ALPHA_VANTAGE_API_KEYS.length;
}

// ============================================================================
// FETCH UTILITIES WITH RETRY LOGIC
// ============================================================================

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {


  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`${ERROR_MESSAGES.API_ERROR} (${response.status})`);
      }

      // lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      // lastError = error instanceof Error ? error : new Error(String(error));

      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
}

async function fetchData(url: string, options?: RequestInit) {
  const response = await fetchWithRetry(url, options);
  return response.json();
}

async function fetchAlphaVantage(params: Record<string, string>) {
  // Get an available API key
  const availableKey = getAvailableApiKey();
  if (!availableKey) {
    throw new Error(ERROR_MESSAGES.RATE_LIMIT);
  }

  const searchParams = new URLSearchParams({
    ...params,
    apikey: availableKey.key,
  });

  const url = `${ALPHA_VANTAGE_BASE_URL}?${searchParams.toString()}`;
  const data = await fetchData(url);

  // Check for rate limit response from API
  if (data['Note'] || data['Information']) {
    console.warn('Alpha Vantage:', data['Note'] || data['Information']);
    // Mark this key as exhausted and try with the next one
    markKeyAsExhausted(availableKey.key);

    // Try again with a different key (recursive call)
    const nextKey = getAvailableApiKey();
    if (nextKey) {
      const retryParams = new URLSearchParams({
        ...params,
        apikey: nextKey.key,
      });
      const retryUrl = `${ALPHA_VANTAGE_BASE_URL}?${retryParams.toString()}`;
      const retryData = await fetchData(retryUrl);

      if (retryData['Note'] || retryData['Information']) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
      }

      recordApiKeyUsage(nextKey.key);
      return retryData;
    }

    throw new Error(ERROR_MESSAGES.RATE_LIMIT);
  }

  recordApiKeyUsage(availableKey.key);
  return data;
}

// ============================================================================
// CRYPTO DATA (FreeCryptoAPI)
// ============================================================================

async function fetchCryptoData(assets: WatchlistItem[]): Promise<FinancialAsset[]> {
  if (assets.length === 0) return [];

  try {
    const results = await Promise.all(
      assets.map(async asset => {
        // Check cache first
        const cacheKey = getCacheKey('crypto_quote', asset.ticker);
        const cached = getFromCache<FinancialAsset>(cacheKey);
        if (cached) return cached;

        try {
          const url = `${FREECRYPTO_BASE_URL}/getData?symbol=${asset.ticker}&token=${FREECRYPTOAPI_KEY}`;
          const data = await fetchData(url);

          if (data.status === 'success' && data.symbols && data.symbols.length > 0) {
            const symbolData = data.symbols[0];
            const price = parseFloat(symbolData.last);
            const change24h = parseFloat(symbolData.daily_change_percentage);

            const high = parseFloat(symbolData.highest);
            const low = parseFloat(symbolData.lowest);
            const sparkline = Array.from({ length: 24 }, (_, i) => {
              const t = i / 23;
              return low + (high - low) * (0.5 + 0.3 * Math.sin(t * Math.PI * 2) + 0.2 * Math.random());
            });
            sparkline[23] = price;

            const result = { ...asset, price, change24h, sparkline };
            setCache(cacheKey, result, CACHE_DURATIONS.quote);
            return result;
          }

          console.warn(`No data for ${asset.ticker}`);
          return { ...asset, price: 0, change24h: 0 };
        } catch (err) {
          console.error(`Failed to fetch data for ${asset.ticker}:`, err);
          return { ...asset, price: 0, change24h: 0 };
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Error in fetchCryptoData:', error);
    return assets.map(asset => ({ ...asset, price: 0, change24h: 0 }));
  }
}

// ============================================================================
// STOCK DATA (Alpha Vantage)
// ============================================================================

async function fetchStockData(assets: WatchlistItem[]): Promise<FinancialAsset[]> {
  if (assets.length === 0) return [];

  const results: FinancialAsset[] = [];

  for (const asset of assets) {
    // Check cache first
    const cacheKey = getCacheKey('stock_quote', asset.ticker);
    const cached = getFromCache<FinancialAsset>(cacheKey);
    if (cached) {
      results.push(cached);
      continue;
    }

    try {
      const data = await fetchAlphaVantage({
        function: 'GLOBAL_QUOTE',
        symbol: asset.ticker,
      });

      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        const price = parseFloat(quote['05. price']) || 0;
        const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

        const open = parseFloat(quote['02. open']) || price;
        const high = parseFloat(quote['03. high']) || price;
        const low = parseFloat(quote['04. low']) || price;

        const result: FinancialAsset = {
          ...asset,
          price,
          change24h: changePercent,
          sparkline: [open, high, low, price],
        };

        setCache(cacheKey, result, CACHE_DURATIONS.quote);
        results.push(result);
      } else {
        console.warn(`No data for stock ${asset.ticker}`);
        results.push({ ...asset, price: 0, change24h: 0, sparkline: [] });
      }

      // Delay between requests
      if (assets.indexOf(asset) < assets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_PER_KEY.minDelayMs));
      }
    } catch (error) {
      console.error(`Failed to fetch stock data for ${asset.ticker}:`, error);
      results.push({ ...asset, price: 0, change24h: 0, sparkline: [] });
    }
  }

  return results;
}

// ============================================================================
// CHART DATA
// ============================================================================

export async function fetchAssetDailyChart(
  asset: WatchlistItem
): Promise<{ time: number; price: number }[]> {
  const cacheKey = getCacheKey('chart', `${asset.type}_${asset.ticker}`);
  const cached = getFromCache<{ time: number; price: number }[]>(cacheKey);
  if (cached) return cached;

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  if (asset.type === 'stock') {
    try {
      const data = await fetchAlphaVantage({
        function: 'TIME_SERIES_DAILY',
        symbol: asset.ticker,
        outputsize: 'compact',
      });

      if (data['Time Series (Daily)']) {
        const timeSeries = data['Time Series (Daily)'];
        const points: { time: number; price: number }[] = [];

        const dates = Object.keys(timeSeries).slice(0, 30).reverse();

        for (const dateStr of dates) {
          const dayData = timeSeries[dateStr];
          const closePrice = parseFloat(dayData['4. close']);
          const timestamp = new Date(dateStr).getTime();

          if (timestamp >= oneMonthAgo.getTime()) {
            points.push({ time: timestamp, price: closePrice });
          }
        }

        setCache(cacheKey, points, CACHE_DURATIONS.chart);
        return points;
      }

      return [];
    } catch (error) {
      console.error(`Failed to fetch daily chart for stock: ${asset.ticker}`, error);
      return [];
    }
  }

  // Crypto chart (FreeCryptoAPI)
  const formatDateForApi = (date: Date) => date.toISOString().split('T')[0];
  const startDate = formatDateForApi(oneMonthAgo);
  const endDate = formatDateForApi(today);
  const symbol = `${asset.ticker}-USDT`;
  const historyUrl = `${FREECRYPTO_BASE_URL}/getTimeframe?symbol=${symbol}&start_date=${startDate}&end_date=${endDate}&token=${FREECRYPTOAPI_KEY}`;

  try {
    const historyData = await fetchData(historyUrl);
    const points: { time: number; price: number }[] = [];
    if (historyData.status === 'success' && historyData.result) {
      historyData.result.forEach((d: { time_close: number; close: string }) => {
        points.push({ time: d.time_close * 1000, price: parseFloat(d.close) });
      });
    }
    setCache(cacheKey, points, CACHE_DURATIONS.chart);
    return points;
  } catch (error) {
    console.error(`Failed to fetch daily chart for crypto: ${asset.ticker}`, error);
    return [];
  }
}

// ============================================================================
// NEWS DATA
// ============================================================================

export async function fetchNewsForTicker(
  ticker: string,
  type: 'stock' | 'crypto'
): Promise<NewsItem[]> {
  const cacheKey = getCacheKey('news', `${type}_${ticker}`);
  const cached = getFromCache<NewsItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string> = {
      function: 'NEWS_SENTIMENT',
      limit: '5',
    };

    if (type === 'stock') {
      params.tickers = ticker;
    } else {
      params.topics = 'blockchain';
    }

    const data = await fetchAlphaVantage(params);

    if (data['feed'] && Array.isArray(data['feed'])) {
      const news = data['feed'].slice(0, 5).map((item: {
        title: string;
        summary: string;
        url: string;
        source: string;
        time_published: string;
      }, index: number) => ({
        id: index,
        headline: item.title || 'ללא כותרת',
        summary: item.summary || '',
        url: item.url || '',
        source: item.source || 'לא ידוע',
        datetime: new Date(
          item.time_published?.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
            '$1-$2-$3T$4:$5:$6'
          ) || Date.now()
        ).getTime() / 1000,
      }));

      setCache(cacheKey, news, CACHE_DURATIONS.news);
      return news;
    }

    return [];
  } catch (error) {
    console.error(`Failed to fetch news for: ${ticker}`, error);
    return [];
  }
}

// ============================================================================
// SYMBOL SEARCH
// ============================================================================

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  matchScore: number;
}

export async function searchSymbol(keywords: string): Promise<SearchResult[]> {
  if (!keywords || keywords.length < 1) return [];

  const cacheKey = getCacheKey('search', keywords.toLowerCase());
  const cached = getFromCache<SearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'SYMBOL_SEARCH',
      keywords,
    });

    if (data['bestMatches'] && Array.isArray(data['bestMatches'])) {
      const results = data['bestMatches'].map((match: {
        '1. symbol': string;
        '2. name': string;
        '3. type': string;
        '4. region': string;
        '9. matchScore': string;
      }) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        matchScore: parseFloat(match['9. matchScore']),
      }));

      setCache(cacheKey, results, CACHE_DURATIONS.quote);
      return results;
    }

    return [];
  } catch (error) {
    console.error('Symbol search failed:', error);
    return [];
  }
}

// ============================================================================
// COMPANY OVERVIEW
// ============================================================================

export async function fetchCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
  const cacheKey = getCacheKey('company', symbol);
  const cached = getFromCache<CompanyOverview>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'OVERVIEW',
      symbol,
    });

    if (data['Symbol']) {
      const overview: CompanyOverview = {
        symbol: data['Symbol'],
        name: data['Name'] || symbol,
        description: data['Description'] || 'אין תיאור זמין',
        sector: data['Sector'] || 'לא ידוע',
        industry: data['Industry'] || 'לא ידוע',
        marketCap: parseFloat(data['MarketCapitalization']) || 0,
        peRatio: parseFloat(data['PERatio']) || 0,
        dividendYield: parseFloat(data['DividendYield']) || 0,
        eps: parseFloat(data['EPS']) || 0,
        high52Week: parseFloat(data['52WeekHigh']) || 0,
        low52Week: parseFloat(data['52WeekLow']) || 0,
      };

      setCache(cacheKey, overview, CACHE_DURATIONS.company);
      return overview;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch company overview for ${symbol}:`, error);
    return null;
  }
}

// ============================================================================
// TOP GAINERS / LOSERS
// ============================================================================

export async function fetchTopMovers(): Promise<TopMoversData | null> {
  const cacheKey = getCacheKey('top_movers', 'daily');
  const cached = getFromCache<TopMoversData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'TOP_GAINERS_LOSERS',
    });

    const parseMovers = (items: Array<{
      ticker: string;
      price: string;
      change_amount: string;
      change_percentage: string;
      volume: string;
    }> | undefined): TopMover[] => {
      if (!items || !Array.isArray(items)) return [];
      return items.slice(0, 10).map(item => ({
        ticker: item.ticker,
        price: parseFloat(item.price) || 0,
        changeAmount: parseFloat(item.change_amount) || 0,
        changePercent: parseFloat(item.change_percentage?.replace('%', '')) || 0,
        volume: parseInt(item.volume) || 0,
      }));
    };

    const result: TopMoversData = {
      gainers: parseMovers(data['top_gainers']),
      losers: parseMovers(data['top_losers']),
      mostActive: parseMovers(data['most_actively_traded']),
    };

    setCache(cacheKey, result, CACHE_DURATIONS.topMovers);
    return result;
  } catch (error) {
    console.error('Failed to fetch top movers:', error);
    return null;
  }
}

// ============================================================================
// MAIN WATCHLIST FUNCTION
// ============================================================================

export async function fetchWatchlistData(watchlist: WatchlistItem[]): Promise<FinancialAsset[]> {
  // Clear expired cache entries periodically
  clearExpiredCache();

  const cryptoAssets = watchlist.filter(a => a.type === 'crypto');
  const stockAssets = watchlist.filter(a => a.type === 'stock');

  const [cryptoData, stockData] = await Promise.all([
    fetchCryptoData(cryptoAssets),
    fetchStockData(stockAssets),
  ]);

  const combined = [...cryptoData, ...stockData];
  const watchlistMap = new Map(combined.map(asset => [asset.ticker, asset]));
  return watchlist.map(item => watchlistMap.get(item.ticker)!);
}

// ============================================================================
// TICKER IDENTIFICATION
// ============================================================================

const COMMON_CRYPTOS: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  ADA: 'Cardano',
  BNB: 'Binance Coin',
  XRP: 'XRP',
  DOT: 'Polkadot',
  DOGE: 'Dogecoin',
  AVAX: 'Avalanche',
  MATIC: 'Polygon',
  LINK: 'Chainlink',
  UNI: 'Uniswap',
  LTC: 'Litecoin',
  ATOM: 'Cosmos',
  ETC: 'Ethereum Classic',
  SHIB: 'Shiba Inu',
  APT: 'Aptos',
  ARB: 'Arbitrum',
  OP: 'Optimism',
  NEAR: 'NEAR Protocol',
};

export async function findTicker(
  ticker: string
): Promise<{ id: string; name: string; type: 'stock' | 'crypto' } | null> {
  const upperTicker = ticker.toUpperCase();

  // Check if it's a known crypto
  if (COMMON_CRYPTOS[upperTicker]) {
    return { id: upperTicker.toLowerCase(), name: COMMON_CRYPTOS[upperTicker], type: 'crypto' };
  }

  // Try to search for the symbol using Alpha Vantage
  try {
    const results = await searchSymbol(upperTicker);
    if (results.length > 0) {
      const bestMatch = results[0];
      return {
        id: bestMatch?.symbol.toLowerCase() || ticker.toLowerCase(),
        name: bestMatch?.name || ticker,
        type: 'stock',
      };
    }
  } catch {
    // Fallback to assuming it's a stock
  }

  // Default: assume it's a stock
  return { id: upperTicker.toLowerCase(), name: upperTicker, type: 'stock' };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { ERROR_MESSAGES };

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

export interface TechnicalIndicator {
  date: string;
  value: number;
}

export interface RSIData {
  values: TechnicalIndicator[];
  currentRSI: number;
  signal: 'overbought' | 'oversold' | 'neutral'; // >70 = overbought, <30 = oversold
}

export interface MACDData {
  macd: TechnicalIndicator[];
  signal: TechnicalIndicator[];
  histogram: TechnicalIndicator[];
  currentSignal: 'bullish' | 'bearish' | 'neutral';
}

export interface BollingerBandsData {
  upper: TechnicalIndicator[];
  middle: TechnicalIndicator[];
  lower: TechnicalIndicator[];
  currentPosition: 'above_upper' | 'below_lower' | 'within'; // Price position relative to bands
}

/**
 * Fetch RSI (Relative Strength Index) for a stock
 */
export async function fetchRSI(
  symbol: string,
  timePeriod = 14
): Promise<RSIData | null> {
  const cacheKey = getCacheKey('rsi', `${symbol}_${timePeriod}`);
  const cached = getFromCache<RSIData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'RSI',
      symbol,
      interval: 'daily',
      time_period: timePeriod.toString(),
      series_type: 'close',
    });

    if (data['Technical Analysis: RSI']) {
      const analysis = data['Technical Analysis: RSI'];
      const dates = Object.keys(analysis).slice(0, 30);

      const values: TechnicalIndicator[] = dates.map(date => ({
        date,
        value: parseFloat(analysis[date]['RSI']),
      })).reverse();

      const currentRSI = values[values.length - 1]?.value || 50;
      const signal: RSIData['signal'] =
        currentRSI > 70 ? 'overbought' :
          currentRSI < 30 ? 'oversold' : 'neutral';

      const result: RSIData = { values, currentRSI, signal };
      setCache(cacheKey, result, CACHE_DURATIONS.chart);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch RSI for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch MACD (Moving Average Convergence Divergence) for a stock
 */
export async function fetchMACD(symbol: string): Promise<MACDData | null> {
  const cacheKey = getCacheKey('macd', symbol);
  const cached = getFromCache<MACDData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'MACD',
      symbol,
      interval: 'daily',
      series_type: 'close',
    });

    if (data['Technical Analysis: MACD']) {
      const analysis = data['Technical Analysis: MACD'];
      const dates = Object.keys(analysis).slice(0, 30);

      const macd: TechnicalIndicator[] = [];
      const signal: TechnicalIndicator[] = [];
      const histogram: TechnicalIndicator[] = [];

      dates.forEach(date => {
        const d = analysis[date];
        macd.push({ date, value: parseFloat(d['MACD']) });
        signal.push({ date, value: parseFloat(d['MACD_Signal']) });
        histogram.push({ date, value: parseFloat(d['MACD_Hist']) });
      });

      macd.reverse();
      signal.reverse();
      histogram.reverse();

      const lastHist = histogram[histogram.length - 1]?.value || 0;
      const currentSignal: MACDData['currentSignal'] =
        lastHist > 0 ? 'bullish' : lastHist < 0 ? 'bearish' : 'neutral';

      const result: MACDData = { macd, signal, histogram, currentSignal };
      setCache(cacheKey, result, CACHE_DURATIONS.chart);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch MACD for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch Bollinger Bands for a stock
 */
export async function fetchBollingerBands(
  symbol: string,
  timePeriod = 20
): Promise<BollingerBandsData | null> {
  const cacheKey = getCacheKey('bbands', `${symbol}_${timePeriod}`);
  const cached = getFromCache<BollingerBandsData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'BBANDS',
      symbol,
      interval: 'daily',
      time_period: timePeriod.toString(),
      series_type: 'close',
    });

    if (data['Technical Analysis: BBANDS']) {
      const analysis = data['Technical Analysis: BBANDS'];
      const dates = Object.keys(analysis).slice(0, 30);

      const upper: TechnicalIndicator[] = [];
      const middle: TechnicalIndicator[] = [];
      const lower: TechnicalIndicator[] = [];

      dates.forEach(date => {
        const d = analysis[date];
        upper.push({ date, value: parseFloat(d['Real Upper Band']) });
        middle.push({ date, value: parseFloat(d['Real Middle Band']) });
        lower.push({ date, value: parseFloat(d['Real Lower Band']) });
      });

      upper.reverse();
      middle.reverse();
      lower.reverse();

      // Default position
      const currentPosition: BollingerBandsData['currentPosition'] = 'within';

      const result: BollingerBandsData = { upper, middle, lower, currentPosition };
      setCache(cacheKey, result, CACHE_DURATIONS.chart);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch Bollinger Bands for ${symbol}:`, error);
    return null;
  }
}

// ============================================================================
// MARKET STATUS
// ============================================================================

export interface MarketInfo {
  market: string;
  region: string;
  primaryExchanges: string;
  localOpen: string;
  localClose: string;
  currentStatus: 'open' | 'closed';
  notes: string;
}

export interface MarketStatusData {
  markets: MarketInfo[];
  usMarketOpen: boolean;
}

/**
 * Fetch current market status worldwide
 */
export async function fetchMarketStatus(): Promise<MarketStatusData | null> {
  const cacheKey = getCacheKey('market_status', 'global');
  const cached = getFromCache<MarketStatusData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'MARKET_STATUS',
    });

    if (data['markets'] && Array.isArray(data['markets'])) {
      const markets: MarketInfo[] = data['markets'].map((m: {
        market_type: string;
        region: string;
        primary_exchanges: string;
        local_open: string;
        local_close: string;
        current_status: string;
        notes: string;
      }) => ({
        market: m.market_type,
        region: m.region,
        primaryExchanges: m.primary_exchanges,
        localOpen: m.local_open,
        localClose: m.local_close,
        currentStatus: m.current_status === 'open' ? 'open' : 'closed',
        notes: m.notes || '',
      }));

      const usMarket = markets.find(m => m.region === 'United States');
      const usMarketOpen = usMarket?.currentStatus === 'open';

      const result: MarketStatusData = { markets, usMarketOpen };
      // Cache for 5 minutes
      setCache(cacheKey, result, 5 * 60 * 1000);
      return result;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch market status:', error);
    return null;
  }
}

// ============================================================================
// COMMODITIES
// ============================================================================

export interface CommodityData {
  name: string;
  symbol: string;
  unit: string;
  data: { date: string; value: number }[];
  currentPrice: number;
  change: number;
}

type CommodityType = 'WTI' | 'BRENT' | 'NATURAL_GAS' | 'COPPER' | 'ALUMINUM' | 'WHEAT' | 'CORN' | 'COTTON' | 'SUGAR' | 'COFFEE';

const COMMODITY_INFO: Record<CommodityType, { name: string; unit: string; hebrewName: string }> = {
  WTI: { name: 'WTI Crude Oil', unit: 'USD/barrel', hebrewName: 'נפט WTI' },
  BRENT: { name: 'Brent Crude Oil', unit: 'USD/barrel', hebrewName: 'נפט ברנט' },
  NATURAL_GAS: { name: 'Natural Gas', unit: 'USD/MMBtu', hebrewName: 'גז טבעי' },
  COPPER: { name: 'Copper', unit: 'USD/lb', hebrewName: 'נחושת' },
  ALUMINUM: { name: 'Aluminum', unit: 'USD/MT', hebrewName: 'אלומיניום' },
  WHEAT: { name: 'Wheat', unit: 'USD/bushel', hebrewName: 'חיטה' },
  CORN: { name: 'Corn', unit: 'USD/bushel', hebrewName: 'תירס' },
  COTTON: { name: 'Cotton', unit: 'USD/lb', hebrewName: 'כותנה' },
  SUGAR: { name: 'Sugar', unit: 'USD/lb', hebrewName: 'סוכר' },
  COFFEE: { name: 'Coffee', unit: 'USD/lb', hebrewName: 'קפה' },
};

/**
 * Fetch commodity prices
 */
export async function fetchCommodity(commodity: CommodityType): Promise<CommodityData | null> {
  const cacheKey = getCacheKey('commodity', commodity);
  const cached = getFromCache<CommodityData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: commodity,
      interval: 'monthly',
    });

    if (data['data'] && Array.isArray(data['data'])) {
      const info = COMMODITY_INFO[commodity];
      const rawData = data['data'].slice(0, 12); // Last 12 data points

      const chartData = rawData.map((d: { date: string; value: string }) => ({
        date: d.date,
        value: parseFloat(d.value) || 0,
      })).reverse();

      const currentPrice = chartData[chartData.length - 1]?.value || 0;
      const previousPrice = chartData[chartData.length - 2]?.value || currentPrice;
      const change = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

      const result: CommodityData = {
        name: info.hebrewName,
        symbol: commodity,
        unit: info.unit,
        data: chartData,
        currentPrice,
        change,
      };

      setCache(cacheKey, result, CACHE_DURATIONS.chart);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch commodity ${commodity}:`, error);
    return null;
  }
}

/**
 * Fetch all major commodities
 */
export async function fetchAllCommodities(): Promise<CommodityData[]> {
  const commodities: CommodityType[] = ['WTI', 'BRENT', 'NATURAL_GAS', 'COPPER'];
  const results: CommodityData[] = [];

  for (const commodity of commodities) {
    const data = await fetchCommodity(commodity);
    if (data) results.push(data);

    // Delay between requests
    if (commodities.indexOf(commodity) < commodities.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_PER_KEY.minDelayMs));
    }
  }

  return results;
}

// ============================================================================
// FOREX RATES
// ============================================================================

export interface ForexRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastRefreshed: string;
  data: { date: string; close: number }[];
}

/**
 * Fetch forex exchange rate
 */
export async function fetchForexRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ForexRate | null> {
  const cacheKey = getCacheKey('forex', `${fromCurrency}_${toCurrency}`);
  const cached = getFromCache<ForexRate>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'FX_DAILY',
      from_symbol: fromCurrency,
      to_symbol: toCurrency,
      outputsize: 'compact',
    });

    if (data['Time Series FX (Daily)']) {
      const timeSeries = data['Time Series FX (Daily)'];
      const dates = Object.keys(timeSeries).slice(0, 30);

      const chartData = dates.map(date => ({
        date,
        close: parseFloat(timeSeries[date]['4. close']),
      })).reverse();

      const result: ForexRate = {
        fromCurrency,
        toCurrency,
        rate: chartData[chartData.length - 1]?.close || 0,
        lastRefreshed: dates[0] || '',
        data: chartData,
      };

      setCache(cacheKey, result, CACHE_DURATIONS.quote);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch forex ${fromCurrency}/${toCurrency}:`, error);
    return null;
  }
}

/**
 * Fetch common forex pairs
 */
export async function fetchCommonForexRates(): Promise<ForexRate[]> {
  const pairs = [
    { from: 'USD', to: 'ILS' }, // דולר-שקל
    { from: 'EUR', to: 'ILS' }, // יורו-שקל
    { from: 'EUR', to: 'USD' }, // יורו-דולר
    { from: 'GBP', to: 'USD' }, // פאונד-דולר
  ];

  const results: ForexRate[] = [];

  for (const pair of pairs) {
    const rate = await fetchForexRate(pair.from, pair.to);
    if (rate) results.push(rate);

    if (pairs.indexOf(pair) < pairs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_PER_KEY.minDelayMs));
    }
  }

  return results;
}

// ============================================================================
// ECONOMIC INDICATORS
// ============================================================================

export interface EconomicIndicator {
  name: string;
  hebrewName: string;
  value: number;
  unit: string;
  date: string;
  data: { date: string; value: number }[];
}

type EconomicIndicatorType = 'CPI' | 'INFLATION' | 'UNEMPLOYMENT' | 'FEDERAL_FUNDS_RATE' | 'REAL_GDP';

const ECONOMIC_INFO: Record<EconomicIndicatorType, { name: string; hebrewName: string; unit: string }> = {
  CPI: { name: 'Consumer Price Index', hebrewName: 'מדד המחירים לצרכן', unit: 'נקודות' },
  INFLATION: { name: 'Inflation', hebrewName: 'אינפלציה', unit: '%' },
  UNEMPLOYMENT: { name: 'Unemployment Rate', hebrewName: 'אחוז אבטלה', unit: '%' },
  FEDERAL_FUNDS_RATE: { name: 'Federal Funds Rate', hebrewName: 'ריבית הפד', unit: '%' },
  REAL_GDP: { name: 'Real GDP', hebrewName: 'תמ"ג ריאלי', unit: 'מיליארד $' },
};

/**
 * Fetch economic indicator data
 */
export async function fetchEconomicIndicator(
  indicator: EconomicIndicatorType
): Promise<EconomicIndicator | null> {
  const cacheKey = getCacheKey('economic', indicator);
  const cached = getFromCache<EconomicIndicator>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: indicator,
    });

    if (data['data'] && Array.isArray(data['data'])) {
      const info = ECONOMIC_INFO[indicator];
      const rawData = data['data'].slice(0, 24); // Last 24 data points

      const chartData = rawData.map((d: { date: string; value: string }) => ({
        date: d.date,
        value: parseFloat(d.value) || 0,
      })).reverse();

      const result: EconomicIndicator = {
        name: info.name,
        hebrewName: info.hebrewName,
        value: chartData[chartData.length - 1]?.value || 0,
        unit: info.unit,
        date: rawData[0]?.date || '',
        data: chartData,
      };

      // Cache for 24 hours - economic data doesn't change often
      setCache(cacheKey, result, 24 * 60 * 60 * 1000);
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch economic indicator ${indicator}:`, error);
    return null;
  }
}

/**
 * Fetch all major economic indicators
 */
export async function fetchAllEconomicIndicators(): Promise<EconomicIndicator[]> {
  const indicators: EconomicIndicatorType[] = ['INFLATION', 'UNEMPLOYMENT', 'FEDERAL_FUNDS_RATE'];
  const results: EconomicIndicator[] = [];

  for (const indicator of indicators) {
    const data = await fetchEconomicIndicator(indicator);
    if (data) results.push(data);

    if (indicators.indexOf(indicator) < indicators.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_PER_KEY.minDelayMs));
    }
  }

  return results;
}

// ============================================================================
// EARNINGS CALENDAR
// ============================================================================

export interface EarningsEvent {
  symbol: string;
  name: string;
  reportDate: string;
  fiscalDateEnding: string;
  estimate: number | null;
  currency: string;
}

/**
 * Fetch upcoming earnings calendar
 */
export async function fetchEarningsCalendar(): Promise<EarningsEvent[]> {
  const cacheKey = getCacheKey('earnings', 'calendar');
  const cached = getFromCache<EarningsEvent[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchAlphaVantage({
      function: 'EARNINGS_CALENDAR',
      horizon: '3month',
    });

    // The API returns CSV, need to parse it
    if (typeof data === 'string' && data.includes('symbol')) {
      const lines = data.split('\n').filter(l => l.trim());
      // const headers = lines[0]?.split(',') || [];

      const events: EarningsEvent[] = lines.slice(1, 51).map(line => {
        const values = line.split(',');
        return {
          symbol: values[0] || '',
          name: values[1] || values[0] || '',
          reportDate: values[2] || '',
          fiscalDateEnding: values[3] || '',
          estimate: values[4] ? parseFloat(values[4]) : null,
          currency: values[5] || 'USD',
        };
      }).filter(e => e.symbol);

      setCache(cacheKey, events, CACHE_DURATIONS.chart);
      return events;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch earnings calendar:', error);
    return [];
  }
}

// ============================================================================
// PRICE ALERTS (Local - No API needed)
// ============================================================================

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
}

const ALERTS_KEY = `${CACHE_PREFIX}price_alerts`;

/**
 * Get all price alerts
 */
export function getPriceAlerts(): PriceAlert[] {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a new price alert
 */
export function addPriceAlert(
  symbol: string,
  targetPrice: number,
  condition: 'above' | 'below'
): PriceAlert {
  const alerts = getPriceAlerts();

  const newAlert: PriceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol: symbol.toUpperCase(),
    targetPrice,
    condition,
    createdAt: Date.now(),
    triggered: false,
  };

  alerts.push(newAlert);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));

  return newAlert;
}

/**
 * Remove a price alert
 */
export function removePriceAlert(id: string): boolean {
  const alerts = getPriceAlerts();
  const filtered = alerts.filter(a => a.id !== id);

  if (filtered.length !== alerts.length) {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(filtered));
    return true;
  }

  return false;
}

/**
 * Check alerts against current prices and trigger if conditions are met
 */
export function checkPriceAlerts(
  currentPrices: Map<string, number>
): PriceAlert[] {
  const alerts = getPriceAlerts();
  const triggeredAlerts: PriceAlert[] = [];

  const updated = alerts.map(alert => {
    if (alert.triggered) return alert;

    const currentPrice = currentPrices.get(alert.symbol);
    if (currentPrice === undefined) return alert;

    const shouldTrigger =
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);

    if (shouldTrigger) {
      alert.triggered = true;
      alert.triggeredAt = Date.now();
      triggeredAlerts.push(alert);
    }

    return alert;
  });

  localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  return triggeredAlerts;
}

// ============================================================================
// PORTFOLIO ANALYTICS (Local - No API needed)
// ============================================================================

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  avgCost: number;
  type: 'stock' | 'crypto';
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: Array<PortfolioHolding & {
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    allocation: number;
  }>;
  diversification: {
    stocks: number;
    crypto: number;
  };
}

const PORTFOLIO_KEY = `${CACHE_PREFIX}portfolio`;

/**
 * Get portfolio holdings
 */
export function getPortfolioHoldings(): PortfolioHolding[] {
  try {
    const stored = localStorage.getItem(PORTFOLIO_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add or update a portfolio holding
 */
export function updatePortfolioHolding(holding: PortfolioHolding): void {
  const holdings = getPortfolioHoldings();
  const existingIndex = holdings.findIndex(h => h.symbol === holding.symbol.toUpperCase());

  if (existingIndex >= 0) {
    holdings[existingIndex] = { ...holding, symbol: holding.symbol.toUpperCase() };
  } else {
    holdings.push({ ...holding, symbol: holding.symbol.toUpperCase() });
  }

  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings));
}

/**
 * Remove a portfolio holding
 */
export function removePortfolioHolding(symbol: string): boolean {
  const holdings = getPortfolioHoldings();
  const filtered = holdings.filter(h => h.symbol !== symbol.toUpperCase());

  if (filtered.length !== holdings.length) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(filtered));
    return true;
  }

  return false;
}

/**
 * Calculate portfolio analytics with current prices
 */
export function calculatePortfolioAnalytics(
  currentPrices: Map<string, number>
): PortfolioAnalytics {
  const holdings = getPortfolioHoldings();

  let totalValue = 0;
  let totalCost = 0;
  let stockValue = 0;
  let cryptoValue = 0;

  const enrichedHoldings = holdings.map(holding => {
    const currentPrice = currentPrices.get(holding.symbol) || 0;
    const currentValue = currentPrice * holding.shares;
    const cost = holding.avgCost * holding.shares;
    const gainLoss = currentValue - cost;
    const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

    totalValue += currentValue;
    totalCost += cost;

    if (holding.type === 'stock') {
      stockValue += currentValue;
    } else {
      cryptoValue += currentValue;
    }

    return {
      ...holding,
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
      allocation: 0, // Will calculate after we have total
    };
  });

  // Calculate allocations
  enrichedHoldings.forEach(h => {
    h.allocation = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    holdings: enrichedHoldings,
    diversification: {
      stocks: totalValue > 0 ? (stockValue / totalValue) * 100 : 0,
      crypto: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0,
    },
  };
}
