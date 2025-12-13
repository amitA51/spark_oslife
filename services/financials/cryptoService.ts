/**
 * Financial Services - Crypto Data
 * 
 * Fetches cryptocurrency data from FreeCryptoAPI.
 */

import {
    FREECRYPTOAPI_KEY,
    FREECRYPTO_BASE_URL,
    CACHE_DURATIONS,
} from './config';
import { getCacheKey, getFromCache, setCache } from './cache';
import { fetchData } from './fetchUtils';
import type { WatchlistItem, FinancialAsset, ChartDataPoint } from './types';

/**
 * Fetches current price data for crypto assets.
 */
export async function fetchCryptoData(assets: WatchlistItem[]): Promise<FinancialAsset[]> {
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
                    const data = await fetchData<{
                        status: string;
                        symbols?: Array<{
                            last: string;
                            daily_change_percentage: string;
                            highest: string;
                            lowest: string;
                        }>;
                    }>(url);

                    if (data.status === 'success' && data.symbols && data.symbols.length > 0) {
                        const symbolData = data.symbols[0]!;
                        const price = parseFloat(symbolData.last);
                        const change24h = parseFloat(symbolData.daily_change_percentage);

                        const high = parseFloat(symbolData.highest);
                        const low = parseFloat(symbolData.lowest);
                        const sparkline = Array.from({ length: 24 }, (_, i) => {
                            const t = i / 23;
                            return low + (high - low) * (0.5 + 0.3 * Math.sin(t * Math.PI * 2) + 0.2 * Math.random());
                        });
                        sparkline[23] = price;

                        const result: FinancialAsset = { ...asset, price, change24h, sparkline };
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

/**
 * Fetches historical chart data for a crypto asset.
 */
export async function fetchCryptoChart(
    ticker: string
): Promise<ChartDataPoint[]> {
    const cacheKey = getCacheKey('chart', `crypto_${ticker}`);
    const cached = getFromCache<ChartDataPoint[]>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const formatDateForApi = (date: Date) => date.toISOString().split('T')[0];
    const startDate = formatDateForApi(oneMonthAgo);
    const endDate = formatDateForApi(today);
    const symbol = `${ticker}-USDT`;
    const historyUrl = `${FREECRYPTO_BASE_URL}/getTimeframe?symbol=${symbol}&start_date=${startDate}&end_date=${endDate}&token=${FREECRYPTOAPI_KEY}`;

    try {
        const historyData = await fetchData<{
            status: string;
            result?: Array<{ time_close: number; close: string }>;
        }>(historyUrl);

        const points: ChartDataPoint[] = [];
        if (historyData.status === 'success' && historyData.result) {
            historyData.result.forEach((d) => {
                points.push({ time: d.time_close * 1000, price: parseFloat(d.close) });
            });
        }
        setCache(cacheKey, points, CACHE_DURATIONS.chart);
        return points;
    } catch (error) {
        console.error(`Failed to fetch daily chart for crypto: ${ticker}`, error);
        return [];
    }
}
