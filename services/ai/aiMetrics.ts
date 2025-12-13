/**
 * AI Metrics Service Module
 * 
 * Enterprise-grade monitoring and analytics for AI services.
 * Provides centralized metrics collection, reporting, and observability.
 * 
 * @module aiMetrics
 * @version 1.0.0
 */

import { rateLimiter, type RateLimiterMetrics, type CircuitState } from './rateLimiter';
import { aiResponseCache, type CacheMetrics } from './responseCache';
import { getAIHealthStatus, type AIHealthStatus } from './geminiClient';

// ============================================================================
// Types
// ============================================================================

export interface AIServiceMetrics {
    timestamp: string;
    health: AIHealthStatus;
    rateLimiter: RateLimiterMetrics & { circuitState: CircuitState };
    cache: CacheMetrics;
    performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
    // Session metrics
    sessionStartTime: string;
    sessionDurationMs: number;

    // Request metrics
    totalRequestsThisSession: number;
    successfulRequestsThisSession: number;
    failedRequestsThisSession: number;
    successRate: number;

    // Performance metrics
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    slowestRequestMs: number;

    // Cost metrics (tokens)
    estimatedTokensUsed: number;
}

export interface MetricsSnapshot {
    id: string;
    timestamp: string;
    metrics: AIServiceMetrics;
}

// ============================================================================
// Metrics Collector
// ============================================================================

/**
 * Centralized AI metrics collector.
 * Aggregates metrics from all AI service components.
 */
class AIMetricsCollector {
    private sessionStartTime = Date.now();
    private requestHistory: Array<{ duration: number; success: boolean; tokens?: number }> = [];
    private snapshots: MetricsSnapshot[] = [];
    private readonly maxSnapshots = 100;

    /**
     * Record a request for metrics tracking.
     */
    recordRequest(duration: number, success: boolean, estimatedTokens?: number): void {
        this.requestHistory.push({
            duration,
            success,
            tokens: estimatedTokens,
        });

        // Keep only last 1000 requests for memory efficiency
        if (this.requestHistory.length > 1000) {
            this.requestHistory = this.requestHistory.slice(-1000);
        }
    }

    /**
     * Get performance metrics calculated from request history.
     */
    private getPerformanceMetrics(): PerformanceMetrics {
        const now = Date.now();
        const sessionDurationMs = now - this.sessionStartTime;

        if (this.requestHistory.length === 0) {
            return {
                sessionStartTime: new Date(this.sessionStartTime).toISOString(),
                sessionDurationMs,
                totalRequestsThisSession: 0,
                successfulRequestsThisSession: 0,
                failedRequestsThisSession: 0,
                successRate: 0,
                avgResponseTimeMs: 0,
                p95ResponseTimeMs: 0,
                slowestRequestMs: 0,
                estimatedTokensUsed: 0,
            };
        }

        const successful = this.requestHistory.filter(r => r.success);
        const durations = this.requestHistory.map(r => r.duration).sort((a, b) => a - b);
        const p95Index = Math.floor(durations.length * 0.95);

        return {
            sessionStartTime: new Date(this.sessionStartTime).toISOString(),
            sessionDurationMs,
            totalRequestsThisSession: this.requestHistory.length,
            successfulRequestsThisSession: successful.length,
            failedRequestsThisSession: this.requestHistory.length - successful.length,
            successRate: this.requestHistory.length > 0
                ? successful.length / this.requestHistory.length
                : 0,
            avgResponseTimeMs: durations.reduce((a, b) => a + b, 0) / durations.length,
            p95ResponseTimeMs: durations[p95Index] || 0,
            slowestRequestMs: durations[durations.length - 1] || 0,
            estimatedTokensUsed: this.requestHistory
                .filter(r => r.tokens !== undefined)
                .reduce((sum, r) => sum + (r.tokens || 0), 0),
        };
    }

    /**
     * Get comprehensive metrics from all AI services.
     */
    getMetrics(): AIServiceMetrics {
        return {
            timestamp: new Date().toISOString(),
            health: getAIHealthStatus(),
            rateLimiter: rateLimiter.getMetrics(),
            cache: aiResponseCache.getMetrics(),
            performance: this.getPerformanceMetrics(),
        };
    }

    /**
     * Take a snapshot of current metrics.
     * Useful for historical analysis and debugging.
     */
    takeSnapshot(): MetricsSnapshot {
        const snapshot: MetricsSnapshot = {
            id: `snapshot-${Date.now()}`,
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
        };

        this.snapshots.push(snapshot);

        // Keep only recent snapshots
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots = this.snapshots.slice(-this.maxSnapshots);
        }

        return snapshot;
    }

    /**
     * Get all stored snapshots.
     */
    getSnapshots(): MetricsSnapshot[] {
        return [...this.snapshots];
    }

    /**
     * Get a summary suitable for logging or display.
     */
    getSummary(): string {
        const metrics = this.getMetrics();
        const health = metrics.health;
        const perf = metrics.performance;
        const cache = metrics.cache;
        const rl = metrics.rateLimiter;

        return `
🤖 AI Service Status: ${health.status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Performance
   • Success Rate: ${(perf.successRate * 100).toFixed(1)}%
   • Avg Response: ${perf.avgResponseTimeMs.toFixed(0)}ms
   • P95 Response: ${perf.p95ResponseTimeMs.toFixed(0)}ms
   • Total Requests: ${perf.totalRequestsThisSession}

💾 Cache
   • Hit Rate: ${(cache.hitRate * 100).toFixed(1)}%
   • Entries: ${cache.size}/${cache.maxSize}
   • Stale Hits: ${cache.staleHitCount}

⚡ Rate Limiter
   • Circuit State: ${rl.circuitState}
   • Rate Limit Hits: ${rl.rateLimitHits}
   • Circuit Breaker Trips: ${rl.circuitBreakerTrips}
`.trim();
    }

    /**
     * Reset session metrics (for new session or testing).
     */
    resetSession(): void {
        this.sessionStartTime = Date.now();
        this.requestHistory = [];
        console.log('[AIMetrics] Session reset');
    }

    /**
     * Export metrics as JSON for external analysis.
     */
    exportMetrics(): string {
        return JSON.stringify({
            currentMetrics: this.getMetrics(),
            snapshots: this.snapshots,
        }, null, 2);
    }
}

// Singleton instance
export const aiMetrics = new AIMetricsCollector();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get current AI service metrics.
 */
export const getAIMetrics = (): AIServiceMetrics => aiMetrics.getMetrics();

/**
 * Get a human-readable summary of AI service status.
 */
export const getAIMetricsSummary = (): string => aiMetrics.getSummary();

/**
 * Record an AI request for metrics tracking.
 */
export const recordAIRequest = (
    duration: number,
    success: boolean,
    estimatedTokens?: number
): void => {
    aiMetrics.recordRequest(duration, success, estimatedTokens);
};

/**
 * Take a metrics snapshot for debugging/analysis.
 */
export const takeMetricsSnapshot = (): MetricsSnapshot => aiMetrics.takeSnapshot();

/**
 * Log current metrics to console (dev mode only).
 */
export const logAIMetrics = (): void => {
    if (import.meta.env.DEV) {
        console.log(aiMetrics.getSummary());
        console.log('\nDetailed Metrics:', aiMetrics.getMetrics());
    }
};
