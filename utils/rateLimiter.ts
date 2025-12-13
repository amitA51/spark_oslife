/**
 * Generic Rate Limiter utility for throttling API calls.
 * Features:
 * - Queue-based processing
 * - Per-minute rate limiting
 * - Minimum interval between calls
 * - Automatic retry with exponential backoff for 429 errors
 */

interface QueuedTask {
    (): Promise<void>;
}

export class RateLimiter {
    private queue: QueuedTask[] = [];
    private processing = false;
    private lastCallTime = 0;
    private windowStart = Date.now();
    private callCount = 0;

    constructor(
        private readonly minIntervalMs: number = 100,
        private readonly maxCallsPerMinute: number = 60
    ) { }

    async throttle<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await this.executeWithDelay(fn);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async executeWithDelay<T>(fn: () => Promise<T>): Promise<T> {
        const now = Date.now();

        // Reset rate limit window if expired
        if (now - this.windowStart > 60000) {
            this.windowStart = now;
            this.callCount = 0;
        }

        // Wait if per-minute limit reached
        if (this.callCount >= this.maxCallsPerMinute) {
            const waitTime = 60000 - (now - this.windowStart);
            if (waitTime > 0) {
                console.warn(`Rate limit reached, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                this.windowStart = Date.now();
                this.callCount = 0;
            }
        }

        // Ensure minimum interval between calls
        const timeSinceLastCall = Date.now() - this.lastCallTime;
        if (timeSinceLastCall < this.minIntervalMs) {
            await new Promise(resolve => setTimeout(resolve, this.minIntervalMs - timeSinceLastCall));
        }

        this.lastCallTime = Date.now();
        this.callCount++;

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
}

/**
 * Wraps an API call with rate limiting and retry logic for 429 errors.
 * @param rateLimiter The rate limiter instance to use
 * @param fn The async function to execute
 * @param maxRetries Maximum number of retries on rate limit errors (default: 3)
 */
export async function withRateLimit<T>(
    rateLimiter: RateLimiter,
    fn: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await rateLimiter.throttle(fn);
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if it's a rate limit error (429)
            const errorMessage = lastError.message || '';
            const isRateLimitError =
                (error as { status?: number })?.status === 429 ||
                errorMessage.includes('429') ||
                errorMessage.toLowerCase().includes('rate');

            if (isRateLimitError) {
                const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff: 2s, 4s, 8s
                console.warn(`Rate limit error, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            // For other errors, don't retry
            throw error;
        }
    }

    throw lastError;
}

// Pre-configured instance for general use
export const defaultRateLimiter = new RateLimiter(100, 60);
