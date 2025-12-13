/**
 * Financial Services - Type Definitions
 * 
 * Shared types for all financial service modules.
 */

import type { WatchlistItem, FinancialAsset } from '../../types';

// ============================================================================
// API Response Types
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

export interface SearchResult {
    symbol: string;
    name: string;
    type: string;
    region: string;
    matchScore: number;
}

export interface TechnicalIndicator {
    date: string;
    value: number;
}

export interface RSIData {
    values: TechnicalIndicator[];
    currentRSI: number;
    currentValue: number; // Added for consistency
    signal: 'overbought' | 'oversold' | 'neutral';
    currentPosition: 'overbought' | 'oversold' | 'neutral'; // Added alias
}

export interface MACDData {
    macd: TechnicalIndicator[];
    signal: TechnicalIndicator[];
    histogram: TechnicalIndicator[];
    currentSignal: 'bullish' | 'bearish' | 'neutral';
    trend: 'bullish' | 'bearish' | 'neutral'; // Added alias
}

export interface BollingerBandsData {
    upper: TechnicalIndicator[];
    middle: TechnicalIndicator[];
    lower: TechnicalIndicator[];
    currentPosition: 'above_upper' | 'below_lower' | 'within';
}

export interface MarketInfo {
    market: string;
    region: string;
    primaryExchanges: string;
    localOpen: string;
    localClose: string;
    currentStatus: 'open' | 'closed';
    notes: string;
}

export interface ChartDataPoint {
    time: number;
    price: number;
}

// ============================================================================
// Internal Types  
// ============================================================================

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export interface ApiKeyState {
    keyIndex: number;
    keyUsage: Record<string, {
        minuteRequests: number[];
        dayRequests: number[];
    }>;
}

// Re-export external types for convenience
export type { WatchlistItem, FinancialAsset };
