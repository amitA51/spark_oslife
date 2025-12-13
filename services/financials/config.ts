/**
 * Financial Services - Configuration
 * 
 * API keys, endpoints, and cache configuration.
 */

// Alpha Vantage API Keys (for stocks - free plan)
// Add multiple API keys here for automatic rotation when one is exhausted
// Total: 7 keys × 25 requests/day = 175 requests/day
export const ALPHA_VANTAGE_API_KEYS: string[] = [
    '31VX3R7A8LRNYPBE',
    'Y6PQGDEJ60OLOY2Q',
    'Z5JTE89CH18DPMHU',
    'Z2DCW7NWFHY503D2',
    '6EFZ8I7NI9ARTFL6',
    '5GVWU96S6S88AHB7',
    'QJ886GMV1QCMDQ1G',
];

export const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// FreeCryptoAPI (for crypto data)
export const FREECRYPTOAPI_KEY = 'l6hhtilmoel0d5ypd172';
export const FREECRYPTO_BASE_URL = 'https://api.freecryptoapi.com/v1';

// Cache configuration
export const CACHE_PREFIX = 'spark_finance_';

export const CACHE_DURATIONS = {
    quote: 5 * 60 * 1000,        // 5 minutes for quotes
    chart: 30 * 60 * 1000,       // 30 minutes for charts
    news: 15 * 60 * 1000,        // 15 minutes for news
    company: 24 * 60 * 60 * 1000, // 24 hours for company info
    topMovers: 10 * 60 * 1000,   // 10 minutes for top gainers/losers
};

// Rate limiting per API key (Alpha Vantage free: 25/day, 5/minute)
export const RATE_LIMIT_PER_KEY = {
    requestsPerMinute: 5,
    requestsPerDay: 25,
    minDelayMs: 12000, // 12 seconds between requests
};

// Hebrew error messages
export const ERROR_MESSAGES = {
    RATE_LIMIT: 'חרגת ממגבלת הבקשות היומית. נסה שוב מחר.',
    RATE_LIMIT_MINUTE: 'יותר מדי בקשות. נסה שוב בעוד דקה.',
    NETWORK_ERROR: 'שגיאת רשת. בדוק את החיבור לאינטרנט.',
    NO_DATA: 'לא נמצאו נתונים עבור הסימול הזה.',
    API_ERROR: 'שגיאה בשרת. נסה שוב מאוחר יותר.',
    INVALID_SYMBOL: 'סימול לא תקין.',
};

// Common crypto tickers for identification
export const COMMON_CRYPTOS: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    XRP: 'XRP',
    DOGE: 'Dogecoin',
    ADA: 'Cardano',
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
