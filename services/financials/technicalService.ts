/**
 * Financial Services - Technical Indicators
 * 
 * Fetches technical analysis indicators from Alpha Vantage.
 */

import { fetchAlphaVantage } from './fetchUtils';
import type { RSIData, MACDData, BollingerBandsData, TechnicalIndicator } from './types';

/**
 * Fetches RSI (Relative Strength Index) for a stock.
 */
export async function fetchRSI(
    symbol: string,
    timePeriod = 14
): Promise<RSIData | null> {
    try {
        const data = await fetchAlphaVantage<{
            'Technical Analysis: RSI'?: Record<string, { RSI: string }>;
        }>({
            function: 'RSI',
            symbol,
            interval: 'daily',
            time_period: String(timePeriod),
            series_type: 'close',
        });

        const rsiData = data['Technical Analysis: RSI'];
        if (!rsiData) return null;

        const dates = Object.keys(rsiData).slice(0, 30);
        const values: TechnicalIndicator[] = dates.map(date => ({
            date,
            value: parseFloat(rsiData[date]!.RSI),
        })).reverse();

        // Get latest value
        const latestDate = dates[0];
        if (!latestDate) return null;
        const latestEntry = rsiData[latestDate];
        if (!latestEntry) return null;

        const latestValue = parseFloat(latestEntry.RSI);

        // Determine position
        let currentPosition: RSIData['currentPosition'] = 'neutral';
        if (latestValue > 70) currentPosition = 'overbought';
        else if (latestValue < 30) currentPosition = 'oversold';

        return {
            values,
            currentValue: latestValue,
            currentPosition,
            currentRSI: latestValue, // Mapping to interface expectation
            signal: currentPosition // Mapping to interface expectation
        };
    } catch (error) {
        console.error(`Failed to fetch RSI for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetches MACD (Moving Average Convergence Divergence) for a stock.
 */
export async function fetchMACD(
    symbol: string
): Promise<MACDData | null> {
    try {
        const data = await fetchAlphaVantage<{
            'Technical Analysis: MACD'?: Record<string, {
                'MACD': string;
                'MACD_Signal': string;
                'MACD_Hist': string;
            }>;
        }>({
            function: 'MACD',
            symbol,
            interval: 'daily',
            series_type: 'close',
        });

        const macdData = data['Technical Analysis: MACD'];
        if (!macdData) return null;

        const dates = Object.keys(macdData).slice(0, 30);
        const macd: TechnicalIndicator[] = [];
        const signal: TechnicalIndicator[] = [];
        const histogram: TechnicalIndicator[] = [];

        dates.forEach(date => {
            const entry = (macdData as Record<string, any>)[date];
            if (entry) {
                macd.push({ date, value: parseFloat(entry.MACD) });
                signal.push({ date, value: parseFloat(entry.MACD_Signal) });
                histogram.push({ date, value: parseFloat(entry.MACD_Hist) });
            }
        });

        // Reverse to chronological order
        macd.reverse();
        signal.reverse();
        histogram.reverse();

        // Determine trend
        const latestHist = histogram[histogram.length - 1]?.value || 0;
        const prevHist = histogram[histogram.length - 2]?.value || 0;

        let trend: MACDData['trend'] = 'neutral';
        if (latestHist > 0 && prevHist <= 0) trend = 'bullish';
        else if (latestHist < 0 && prevHist >= 0) trend = 'bearish';

        return { macd, signal, histogram, trend, currentSignal: trend };
    } catch (error) {
        console.error(`Failed to fetch MACD for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetches Bollinger Bands for a stock.
 */
export async function fetchBollingerBands(
    symbol: string,
    timePeriod = 20,
    nbDev = 2
): Promise<BollingerBandsData | null> {
    try {
        const data = await fetchAlphaVantage<{
            'Technical Analysis: BBANDS'?: Record<string, {
                'Real Upper Band': string;
                'Real Middle Band': string;
                'Real Lower Band': string;
            }>;
        }>({
            function: 'BBANDS',
            symbol,
            interval: 'daily',
            time_period: String(timePeriod),
            series_type: 'close',
            nbdevup: String(nbDev),
            nbdevdn: String(nbDev),
        });

        const bbandsData = data['Technical Analysis: BBANDS'];
        if (!bbandsData) return null;

        const dates = Object.keys(bbandsData).slice(0, 30);
        const upper: TechnicalIndicator[] = [];
        const middle: TechnicalIndicator[] = [];
        const lower: TechnicalIndicator[] = [];

        dates.forEach(date => {
            const entry = bbandsData[date];
            if (entry) {
                upper.push({ date, value: parseFloat(entry['Real Upper Band']) });
                middle.push({ date, value: parseFloat(entry['Real Middle Band']) });
                lower.push({ date, value: parseFloat(entry['Real Lower Band']) });
            }
        });

        // Reverse to chronological order
        upper.reverse();
        middle.reverse();
        lower.reverse();

        // Determine current position
        const currentPosition: BollingerBandsData['currentPosition'] = 'within';
        // Logic would require current price comparison, defaulting to 'within' for now

        return { upper, middle, lower, currentPosition };
    } catch (error) {
        console.error(`Failed to fetch Bollinger Bands for ${symbol}:`, error);
        return null;
    }
}
