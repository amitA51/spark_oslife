/**
 * Logger Utility
 * 
 * Production-safe logging utility that:
 * - Only logs in development mode
 * - Provides structured log levels
 * - Can be easily extended for remote logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix?: string;
    enabled?: boolean;
}



class Logger {
    private prefix: string;
    private enabled: boolean;
    private isDev: boolean;

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || '';
        this.enabled = options.enabled ?? true;
        this.isDev = import.meta.env.DEV;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString().substring(11, 23);
        const levelEmoji = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
        };

        const prefix = this.prefix ? `[${this.prefix}]` : '';
        return `${levelEmoji[level]} ${timestamp} ${prefix} ${message}`;
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.enabled) return false;

        // Always log errors
        if (level === 'error') return true;

        // In production, only log warnings and errors
        if (!this.isDev && level === 'debug') return false;
        if (!this.isDev && level === 'info') return false;

        return true;
    }

    debug(message: string, data?: unknown): void {
        if (!this.shouldLog('debug')) return;
        console.debug(this.formatMessage('debug', message), data ?? '');
    }

    info(message: string, data?: unknown): void {
        if (!this.shouldLog('info')) return;
        console.info(this.formatMessage('info', message), data ?? '');
    }

    warn(message: string, data?: unknown): void {
        if (!this.shouldLog('warn')) return;
        console.warn(this.formatMessage('warn', message), data ?? '');
    }

    error(message: string, error?: unknown): void {
        if (!this.shouldLog('error')) return;
        console.error(this.formatMessage('error', message), error ?? '');

        // Here you could add remote error reporting
        // e.g., Sentry.captureException(error);
    }

    /**
     * Create a child logger with a specific prefix
     */
    child(prefix: string): Logger {
        return new Logger({
            prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
            enabled: this.enabled,
        });
    }

    /**
     * Time a function execution
     */
    async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
        if (!this.isDev) return fn();

        const start = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - start;
            this.debug(`${label} completed in ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            this.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
            throw error;
        }
    }
}

// Pre-configured loggers for different services
export const logger = new Logger();
export const dbLogger = new Logger({ prefix: 'DB' });
export const syncLogger = new Logger({ prefix: 'Sync' });
export const aiLogger = new Logger({ prefix: 'AI' });
export const authLogger = new Logger({ prefix: 'Auth' });

export default Logger;
