/**
 * Financial Services Index
 * 
 * Re-exports all financial service utilities for convenient single-import access.
 */

// IMPORTANT: Imports MUST be at the top before any exports
import type { WatchlistItem, FinancialAsset, ChartDataPoint } from './types';
import { fetchCryptoData, fetchCryptoChart } from './cryptoService';
import { fetchStockData, fetchStockChart } from './stockService';
import { COMMON_CRYPTOS } from './config';

// Types
export type {
    NewsItem,
    CompanyOverview,
    TopMover,
    TopMoversData,
    SearchResult,
    TechnicalIndicator,
    RSIData,
    MACDData,
    BollingerBandsData,
    MarketInfo,
    ChartDataPoint,
    WatchlistItem,
    FinancialAsset,
} from './types';

// Configuration
export {
    ERROR_MESSAGES,
    COMMON_CRYPTOS,
    CACHE_DURATIONS,
} from './config';

// Cache utilities
export {
    getCacheKey,
    getFromCache,
    setCache,
    clearExpiredCache,
} from './cache';

// API Key management
export {
    getRemainingRequests,
    addApiKey,
    getApiKeyCount,
} from './apiKeyRotation';

// Crypto data
export {
    fetchCryptoData,
    fetchCryptoChart,
} from './cryptoService';

// Stock data
export {
    fetchStockData,
    fetchStockChart,
    searchSymbol,
    fetchCompanyOverview,
    fetchTopMovers,
} from './stockService';

// News
export { fetchNewsForTicker } from './newsService';

// Technical indicators
export {
    fetchRSI,
    fetchMACD,
    fetchBollingerBands,
} from './technicalService';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Fetches data for the entire watchlist (both stocks and crypto).
 */
export async function fetchWatchlistData(watchlist: WatchlistItem[]): Promise<FinancialAsset[]> {
    const cryptoAssets = watchlist.filter(item => item.type === 'crypto');
    const stockAssets = watchlist.filter(item => item.type === 'stock');

    const [cryptoResults, stockResults] = await Promise.all([
        fetchCryptoData(cryptoAssets),
        fetchStockData(stockAssets),
    ]);

    return [...cryptoResults, ...stockResults];
}

/**
 * Fetches daily chart data for any asset type.
 */
export async function fetchAssetDailyChart(asset: WatchlistItem): Promise<ChartDataPoint[]> {
    if (asset.type === 'stock') {
        return fetchStockChart(asset.ticker);
    }
    return fetchCryptoChart(asset.ticker);
}

/**
 * Finds a ticker and determines if it's a stock or crypto.
 */
export async function findTicker(
    ticker: string
): Promise<{ id: string; name: string; type: 'stock' | 'crypto' } | null> {
    const upperTicker = ticker.toUpperCase();

    // Check if it's a known crypto
    if (COMMON_CRYPTOS[upperTicker]) {
        return {
            id: upperTicker.toLowerCase(),
            name: COMMON_CRYPTOS[upperTicker],
            type: 'crypto',
        };
    }

    // Try to search as a stock
    const { searchSymbol } = await import('./stockService');
    const results = await searchSymbol(ticker);
    if (results.length > 0) {
        return {
            id: results[0]?.symbol.toLowerCase() || '',
            name: results[0]?.name || '',
            type: 'stock',
        };
    }

    return null;
}
