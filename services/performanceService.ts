
/**
 * Service for tracking and logging performance metrics.
 */

export interface PerformanceMetric {
    name: string;
    value: number;
    unit?: string;
    timestamp: number;
}

export interface PerformanceIssue {
    severity: 'low' | 'medium' | 'high';
    message: string;
    metric: string;
    value: number;
    threshold: number;
}

export interface OptimizationSuggestion {
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
}

export interface PerformanceReport {
    timestamp: string;
    metrics: PerformanceMetric[];
    issues: PerformanceIssue[];
    suggestions: OptimizationSuggestion[];
    score: number; // 0-100
}

class PerformanceService {
    private metrics: PerformanceMetric[] = [];
    private isSupported: boolean;

    constructor() {
        this.isSupported = typeof window !== 'undefined' && !!window.performance;
    }

    /**
     * Logs a custom performance metric.
     * @param name Name of the metric
     * @param value Value of the metric
     * @param unit Optional unit (e.g., 'ms', 'MB')
     */
    logMetric(name: string, value: number, unit: string = 'ms') {
        const metric: PerformanceMetric = {
            name,
            value,
            unit,
            timestamp: Date.now()
        };
        this.metrics.push(metric);

        // In a real app, you might send this to an analytics endpoint
        // For now, we'll just log significant events to console in dev mode
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${name}: ${value.toFixed(2)}${unit}`);
        }
    }

    /**
     * Captures standard web vitals if supported.
     * Note: Full Web Vitals support often requires a library like 'web-vitals'.
     * Here we implement basic measurements using the Performance API.
     */
    measureBasicVitals() {
        if (!this.isSupported) return;

        // Measure Navigation Timing (Page Load)
        window.addEventListener('load', () => {
            const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigationEntry) {
                this.logMetric('Load Time', navigationEntry.loadEventEnd - navigationEntry.startTime);
                this.logMetric('DOM Content Loaded', navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime);
                this.logMetric('First Byte (TTFB)', navigationEntry.responseStart - navigationEntry.startTime);
            }
        });

        // Measure First Paint & First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            this.logMetric(entry.name, entry.startTime);
        });

        // Observe for future paint entries (if this runs before they happen)
        if (typeof PerformanceObserver !== 'undefined') {
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    this.logMetric(entry.name, entry.startTime);
                }
            }).observe({ type: 'paint', buffered: true });

            // Measure Largest Contentful Paint (LCP) - approximation
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    this.logMetric('LCP (Candidate)', lastEntry.startTime);
                }
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        }
    }

    /**
     * Logs memory usage if supported (Chrome only).
     */
    logMemoryUsage() {
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            const usedJSHeapSize = memory.usedJSHeapSize / 1048576; // Convert to MB
            this.logMetric('Memory Usage', usedJSHeapSize, 'MB');
        }
    }

    /**
     * Detects performance issues based on collected metrics.
     * @returns Array of detected issues with severity levels
     */
    detectIssues(): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];

        // Check Load Time
        const loadTime = this.metrics.find(m => m.name === 'Load Time');
        if (loadTime && loadTime.value > 3000) {
            issues.push({
                severity: loadTime.value > 5000 ? 'high' : 'medium',
                message: 'זמן טעינה איטי מדי',
                metric: 'Load Time',
                value: loadTime.value,
                threshold: 3000
            });
        }

        // Check LCP
        const lcp = this.metrics.find(m => m.name === 'LCP (Candidate)');
        if (lcp && lcp.value > 2500) {
            issues.push({
                severity: lcp.value > 4000 ? 'high' : 'medium',
                message: 'Largest Contentful Paint איטי',
                metric: 'LCP',
                value: lcp.value,
                threshold: 2500
            });
        }

        // Check Memory Usage
        const memory = this.metrics.find(m => m.name === 'Memory Usage');
        if (memory && memory.value > 100) {
            issues.push({
                severity: memory.value > 200 ? 'high' : 'medium',
                message: 'שימוש גבוה בזיכרון',
                metric: 'Memory Usage',
                value: memory.value,
                threshold: 100
            });
        }

        // Check TTFB
        const ttfb = this.metrics.find(m => m.name === 'First Byte (TTFB)');
        if (ttfb && ttfb.value > 600) {
            issues.push({
                severity: ttfb.value > 1000 ? 'high' : 'low',
                message: 'זמן תגובה איטי מהשרת',
                metric: 'TTFB',
                value: ttfb.value,
                threshold: 600
            });
        }

        return issues;
    }

    /**
     * Generates optimization suggestions based on detected issues.
     * @returns Array of actionable optimization suggestions
     */
    getOptimizationSuggestions(): OptimizationSuggestion[] {
        const issues = this.detectIssues();
        const suggestions: OptimizationSuggestion[] = [];

        issues.forEach(issue => {
            switch (issue.metric) {
                case 'Load Time':
                    suggestions.push({
                        title: 'שפר זמני טעינה',
                        description: 'שקול להשתמש ב-code splitting, lazy loading, או compression לקבצי JavaScript ו-CSS',
                        impact: issue.severity === 'high' ? 'high' : 'medium'
                    });
                    break;
                case 'LCP':
                    suggestions.push({
                        title: 'אופטימיזציה של תמונות',
                        description: 'השתמש בפורמטים מודרניים (WebP, AVIF), lazy loading, ו-responsive images',
                        impact: 'high'
                    });
                    break;
                case 'Memory Usage':
                    suggestions.push({
                        title: 'הפחת שימוש בזיכרון',
                        description: 'בדוק memory leaks, נקה event listeners, והשתמש ב-React.memo לקומפוננטות גדולות',
                        impact: issue.severity === 'high' ? 'high' : 'medium'
                    });
                    break;
                case 'TTFB':
                    suggestions.push({
                        title: 'שפר תגובת שרת',
                        description: 'שקול CDN, server-side caching, או database optimization',
                        impact: 'medium'
                    });
                    break;
            }
        });

        // Add general suggestions if no issues
        if (suggestions.length === 0) {
            suggestions.push({
                title: 'הביצועים טובים!',
                description: 'המשך לעקוב אחר המדדים ושמור על best practices',
                impact: 'low'
            });
        }

        return suggestions;
    }

    /**
     * Calculates a performance score (0-100) based on metrics.
     * @returns Performance score
     */
    calculateScore(): number {
        let score = 100;
        const issues = this.detectIssues();

        issues.forEach(issue => {
            switch (issue.severity) {
                case 'high':
                    score -= 20;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        });

        return Math.max(0, score);
    }

    /**
     * Generates a comprehensive performance report.
     * @returns Performance report object
     */
    generateReport(): PerformanceReport {
        return {
            timestamp: new Date().toISOString(),
            metrics: [...this.metrics],
            issues: this.detectIssues(),
            suggestions: this.getOptimizationSuggestions(),
            score: this.calculateScore()
        };
    }

    /**
     * Clears all collected metrics (useful for testing).
     */
    clearMetrics() {
        this.metrics = [];
    }

    getMetrics() {
        return this.metrics;
    }
}

export const performanceService = new PerformanceService();

