/**
 * Financial Services - News
 * 
 * Fetches financial news from Alpha Vantage.
 */

import { CACHE_DURATIONS } from './config';
import { getCacheKey, getFromCache, setCache } from './cache';
import { fetchAlphaVantage } from './fetchUtils';
import type { NewsItem } from './types';

/**
 * Fetches news for a specific ticker.
 */
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

        const data = await fetchAlphaVantage<{
            feed?: Array<{
                title: string;
                summary: string;
                url: string;
                source: string;
                time_published: string;
            }>;
        }>(params);

        if (data['feed'] && Array.isArray(data['feed'])) {
            const news = data['feed'].slice(0, 5).map((item, index) => ({
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
