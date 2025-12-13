/**
 * Rate Limiter Module
 * 
 * Provides request throttling, queuing, and circuit breaker pattern for API calls
 * to ensure stability and prevent cascading failures.
 * 
 * @module rateLimiter
 * @version 2.0.0 - Enhanced with Circuit Breaker and Metrics
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RateLimiterMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitHits: number;
    circuitBreakerTrips: number;
    avgResponseTimeMs: number;
    lastRequestTime: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

/**
 * Circuit Breaker for AI API calls.
 * Prevents cascading failures by fast-failing when API is unhealthy.
 */
class CircuitBreaker {
    private state: CircuitState = 'CLOSED';
    private failureCount = 0;
    private lastFailureTime = 0;
    private successCount = 0;

    constructor(
        private readonly failureThreshold: number = 5,
        private readonly recoveryTimeMs: number = 30000, // 30 seconds
        private readonly halfOpenSuccessThreshold: number = 2
    ) { }

    /**
     * Check if request should be allowed through.
     */
    canExecute(): boolean {
        if (this.state === 'CLOSED') return true;

        if (this.state === 'OPEN') {
            // Check if recovery period has passed
            if (Date.now() - this.lastFailureTime >= this.recoveryTimeMs) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
                console.log('[CircuitBreaker] Transitioning to HALF_OPEN');
                return true;
            }
            return false;
        }

        // HALF_OPEN state - allow limited requests to test recovery
        return true;
    }

    /**
     * Record a successful request.
     */
    onSuccess(): void {
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.halfOpenSuccessThreshold) {
                this.state = 'CLOSED';
                this.failureCount = 0;
                console.log('[CircuitBreaker] Circuit CLOSED - API recovered');
            }
        } else if (this.state === 'CLOSED') {
            // Reset failure count on success
            this.failureCount = Math.max(0, this.failureCount - 1);
        }
    }

    /**
     * Record a failed request.
     */
    onFailure(): void {
        this.lastFailureTime = Date.now();

        if (this.state === 'HALF_OPEN') {
            // Immediate transition back to OPEN on any failure
            this.state = 'OPEN';
            console.warn('[CircuitBreaker] Circuit OPEN - failure during recovery');
            return;
        }

        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.warn(`[CircuitBreaker] Circuit OPEN after ${this.failureCount} failures`);
        }
    }

    /**
     * Get current circuit state for monitoring.
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Manually reset the circuit (for admin/testing purposes).
     */
    reset(): void {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        console.log('[CircuitBreaker] Circuit manually reset');
    }
}

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

/**
 * Rate limiter with per-minute limits, minimum interval between calls,
 * circuit breaker, and comprehensive metrics.
 */
export class RateLimiter {
    private queue: Array<() => Promise<void>> = [];
    private processing = false;
    private lastCallTime = 0;
    private callCount = 0;
    private windowStart = Date.now();
    private circuitBreaker: CircuitBreaker;

    // Metrics
    private metrics: RateLimiterMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        circuitBreakerTrips: 0,
        avgResponseTimeMs: 0,
        lastRequestTime: 0,
    };
    private responseTimes: number[] = [];

    constructor(
        private minIntervalMs: number = 500, // Minimum 500ms between calls
        private maxCallsPerMinute: number = 30 // Max 30 calls per minute
    ) {
        this.circuitBreaker = new CircuitBreaker();
    }

    /**
     * Throttle a function call through the rate limiter queue.
     */
    async throttle<T>(fn: () => Promise<T>): Promise<T> {
        // Check circuit breaker first
        if (!this.circuitBreaker.canExecute()) {
            this.metrics.circuitBreakerTrips++;
            throw new Error('CIRCUIT_OPEN: AI service temporarily unavailable. Please try again in a moment.');
        }

        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                const startTime = Date.now();
                try {
                    const result = await this.executeWithDelay(fn);
                    this.recordSuccess(startTime);
                    resolve(result);
                } catch (error) {
                    this.recordFailure(error);
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async executeWithDelay<T>(fn: () => Promise<T>): Promise<T> {
        // Check rate limit window
        const now = Date.now();
        if (now - this.windowStart > 60000) {
            // Reset window
            this.windowStart = now;
            this.callCount = 0;
        }

        // If we've hit the per-minute limit, wait until window resets
        if (this.callCount >= this.maxCallsPerMinute) {
            const waitTime = 60000 - (now - this.windowStart);
            if (waitTime > 0) {
                this.metrics.rateLimitHits++;
                console.warn(`[RateLimiter] Rate limit reached, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                this.windowStart = Date.now();
                this.callCount = 0;
            }
        }

        // Ensure minimum interval between calls
        const timeSinceLastCall = now - this.lastCallTime;
        if (timeSinceLastCall < this.minIntervalMs) {
            await new Promise(resolve => setTimeout(resolve, this.minIntervalMs - timeSinceLastCall));
        }

        this.lastCallTime = Date.now();
        this.callCount++;
        this.metrics.totalRequests++;

        return fn();
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                await task();
            }
        }
        this.processing = false;
    }

    private recordSuccess(startTime: number): void {
        const duration = Date.now() - startTime;
        this.metrics.successfulRequests++;
        this.metrics.lastRequestTime = Date.now();

        // Update average response time (keep last 100 samples)
        this.responseTimes.push(duration);
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift();
        }
        this.metrics.avgResponseTimeMs =
            this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

        this.circuitBreaker.onSuccess();
    }

    private recordFailure(error: unknown): void {
        this.metrics.failedRequests++;
        this.circuitBreaker.onFailure();
    }

    /**
     * Get current metrics for monitoring.
     */
    getMetrics(): RateLimiterMetrics & { circuitState: CircuitState } {
        return {
            ...this.metrics,
            circuitState: this.circuitBreaker.getState(),
        };
    }

    /**
     * Reset circuit breaker (for recovery scenarios).
     */
    resetCircuit(): void {
        this.circuitBreaker.reset();
    }
}

// Shared rate limiter instance for AI API calls
export const rateLimiter = new RateLimiter();

/**
 * Wraps an API call with rate limiting and retry logic for transient errors.
 * Enhanced with better error classification and telemetry.
 */
export const withRateLimit = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await rateLimiter.throttle(fn);
        } catch (error: unknown) {
            lastError = error as Error;
            const errorMessage = lastError?.message || '';

            // Circuit breaker open - don't retry, fail fast
            if (errorMessage.includes('CIRCUIT_OPEN')) {
                throw error;
            }

            // Check if it's a rate limit error (429) - retry with backoff
            const errorObj = error as { status?: number; message?: string };
            const isRateLimitError =
                errorObj?.status === 429 ||
                errorMessage.includes('429') ||
                errorMessage.toLowerCase().includes('rate') ||
                errorMessage.toLowerCase().includes('quota');

            if (isRateLimitError) {
                const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff: 2s, 4s, 8s
                console.warn(
                    `[withRateLimit] Rate limit error, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`
                );
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            // Check for server errors (5xx) - retry with backoff
            const isServerError =
                errorObj?.status && errorObj.status >= 500 && errorObj.status < 600;

            if (isServerError && attempt < maxRetries - 1) {
                const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                console.warn(
                    `[withRateLimit] Server error, retrying in ${waitTime}ms (${attempt + 1}/${maxRetries})`
                );
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            // For client errors (4xx except 429) or unknown errors - don't retry
            throw error;
        }
    }

    throw lastError;
};
