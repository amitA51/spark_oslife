/**
 * Financial Services - Stock Data
 * 
 * Fetches stock data from Alpha Vantage API.
 */

import {
    CACHE_DURATIONS,
    RATE_LIMIT_PER_KEY,
} from './config';
import { getCacheKey, getFromCache, setCache } from './cache';
import { fetchAlphaVantage } from './fetchUtils';
import type {
    WatchlistItem,
    FinancialAsset,
    ChartDataPoint,
    CompanyOverview,
    SearchResult,
    TopMoversData,
    TopMover,
} from './types';

/**
 * Fetches current price data for stock assets.
 */
export async function fetchStockData(assets: WatchlistItem[]): Promise<FinancialAsset[]> {
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
            const data = await fetchAlphaVantage<{
                'Global Quote'?: {
                    '05. price'?: string;
                    '10. change percent'?: string;
                    '02. open'?: string;
                    '03. high'?: string;
                    '04. low'?: string;
                };
            }>({
                function: 'GLOBAL_QUOTE',
                symbol: asset.ticker,
            });

            if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
                const quote = data['Global Quote'];
                const price = parseFloat(quote['05. price'] || '0') || 0;
                const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0') || 0;

                const open = parseFloat(quote['02. open'] || String(price)) || price;
                const high = parseFloat(quote['03. high'] || String(price)) || price;
                const low = parseFloat(quote['04. low'] || String(price)) || price;

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

/**
 * Fetches historical chart data for a stock.
 */
export async function fetchStockChart(ticker: string): Promise<ChartDataPoint[]> {
    const cacheKey = getCacheKey('chart', `stock_${ticker}`);
    const cached = getFromCache<ChartDataPoint[]>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    try {
        const data = await fetchAlphaVantage<{
            'Time Series (Daily)'?: Record<string, { '4. close': string }>;
        }>({
            function: 'TIME_SERIES_DAILY',
            symbol: ticker,
            outputsize: 'compact',
        });

        if (data['Time Series (Daily)']) {
            const timeSeries = data['Time Series (Daily)'];
            const points: ChartDataPoint[] = [];

            const dates = Object.keys(timeSeries).slice(0, 30).reverse();

            for (const dateStr of dates) {
                const dayData = timeSeries[dateStr];
                if (!dayData) continue;
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
        console.error(`Failed to fetch daily chart for stock: ${ticker}`, error);
        return [];
    }
}

/**
 * Searches for stock symbols.
 */
export async function searchSymbol(keywords: string): Promise<SearchResult[]> {
    if (!keywords || keywords.length < 1) return [];

    const cacheKey = getCacheKey('search', keywords.toLowerCase());
    const cached = getFromCache<SearchResult[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await fetchAlphaVantage<{
            bestMatches?: Array<{
                '1. symbol': string;
                '2. name': string;
                '3. type': string;
                '4. region': string;
                '9. matchScore': string;
            }>;
        }>({
            function: 'SYMBOL_SEARCH',
            keywords,
        });

        if (data['bestMatches'] && Array.isArray(data['bestMatches'])) {
            const results = data['bestMatches'].map((match) => ({
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

/**
 * Fetches company overview data.
 */
export async function fetchCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
    const cacheKey = getCacheKey('company', symbol);
    const cached = getFromCache<CompanyOverview>(cacheKey);
    if (cached) return cached;

    try {
        const data = await fetchAlphaVantage<{
            Symbol?: string;
            Name?: string;
            Description?: string;
            Sector?: string;
            Industry?: string;
            MarketCapitalization?: string;
            PERatio?: string;
            DividendYield?: string;
            EPS?: string;
            '52WeekHigh'?: string;
            '52WeekLow'?: string;
        }>({
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
                marketCap: parseFloat(data['MarketCapitalization'] || '0') || 0,
                peRatio: parseFloat(data['PERatio'] || '0') || 0,
                dividendYield: parseFloat(data['DividendYield'] || '0') || 0,
                eps: parseFloat(data['EPS'] || '0') || 0,
                high52Week: parseFloat(data['52WeekHigh'] || '0') || 0,
                low52Week: parseFloat(data['52WeekLow'] || '0') || 0,
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

/**
 * Fetches top gainers, losers, and most active stocks.
 */
export async function fetchTopMovers(): Promise<TopMoversData | null> {
    const cacheKey = getCacheKey('top_movers', 'daily');
    const cached = getFromCache<TopMoversData>(cacheKey);
    if (cached) return cached;

    try {
        const data = await fetchAlphaVantage<{
            top_gainers?: Array<{
                ticker: string;
                price: string;
                change_amount: string;
                change_percentage: string;
                volume: string;
            }>;
            top_losers?: Array<{
                ticker: string;
                price: string;
                change_amount: string;
                change_percentage: string;
                volume: string;
            }>;
            most_actively_traded?: Array<{
                ticker: string;
                price: string;
                change_amount: string;
                change_percentage: string;
                volume: string;
            }>;
        }>({
            function: 'TOP_GAINERS_LOSERS',
        });

        const parseMovers = (items: typeof data.top_gainers): TopMover[] => {
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
