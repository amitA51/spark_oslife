import React, { useRef, useState, useEffect } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    threshold?: number; // Distance to pull before refresh triggers (default: 120)
    maxPull?: number; // Maximum distance user can pull (default: 180)
}

/**
 * Premium Pull-to-Refresh Component
 * 
 * Provides a native-feeling pull-to-refresh gesture with a premium "Deep Cosmos" aesthetic.
 * Uses Framer Motion for smooth, spring-based animations.
 * 
 * Features:
 * - Glowing cyberpunk spinner
 * - Haptic feedback (if available)
 * - Smooth resistance when pulling
 * - Spring snap-back animation
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    threshold = 120,
    maxPull = 200,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0); // 0 to 1

    // Motion values for gesture handling
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, threshold], [0, 360]);
    const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
    const scale = useTransform(y, [0, threshold], [0.5, 1.1]);

    // Spring physics for smooth snap-back
    const ySpring = useSpring(y, {
        stiffness: 300,
        damping: 30,
        mass: 0.5,
    });

    // Handle touch gestures manually to coexist with native scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let startY = 0;
        let isDragging = false;


        const handleTouchStart = (e: TouchEvent) => {
            // Only enable pull if we are at the top of the scroll container
            if (window.scrollY === 0 && e.touches.length > 0) {
                startY = e.touches[0]!.clientY;
                isDragging = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || e.touches.length === 0) return;

            const currentY = e.touches[0]!.clientY;
            const diff = currentY - startY;

            // Only handle downward pull when at top
            if (diff > 0 && window.scrollY === 0) {
                // Add resistance/friction as user pulls further
                const resistance = 0.4;
                const limitedDiff = Math.min(diff * resistance, maxPull);

                y.set(limitedDiff);
                setPullProgress(Math.min(limitedDiff / threshold, 1));

                // Prevent native scroll/refresh behavior
                if (e.cancelable) {
                    e.preventDefault();
                }
            } else {
                // User scrolled back up or wasn't at top
                y.set(0);
                setPullProgress(0);
                isDragging = false;
            }
        };

        const handleTouchEnd = async () => {
            if (!isDragging) return;
            isDragging = false;

            const currentPull = y.get();

            if (currentPull >= threshold) {
                // Trigger Refresh
                setIsRefreshing(true);
                y.set(threshold); // Snap to threshold position while refreshing

                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(10);

                try {
                    await onRefresh();
                } finally {
                    setIsRefreshing(false);
                    y.set(0); // Snap back to top
                    setPullProgress(0);
                }
            } else {
                // Snap back without refreshing
                y.set(0);
                setPullProgress(0);
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [maxPull, onRefresh, threshold, y]);

    return (
        <div ref={containerRef} className="relative min-h-screen">
            {/* Refresh Indicator */}
            <motion.div
                className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
                style={{ y: ySpring, opacity } as any}
            >
                <div className="relative flex items-center justify-center w-12 h-12 rounded-full glass-panel border border-[var(--dynamic-accent-start)] shadow-[0_0_20px_rgba(var(--dynamic-accent-start),0.3)]">
                    {/* Spinner / Icon */}
                    <motion.div style={{ rotate, scale }} className="text-[var(--dynamic-accent-start)]">
                        {isRefreshing ? (
                            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    color: pullProgress >= 1 ? 'var(--color-primary)' : 'var(--dynamic-accent-start)'
                                }}
                            >
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                            </svg>
                        )}
                    </motion.div>

                    {/* Progress Ring Background */}
                    {!isRefreshing && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                                cx="24"
                                cy="24"
                                r="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="113"
                                strokeDashoffset={113 - (113 * pullProgress)}
                                className="text-[var(--dynamic-accent-start)] opacity-30 transition-all duration-75"
                            />
                        </svg>
                    )}
                </div>
            </motion.div>

            {/* Content */}
            <motion.div
                style={{ y: isRefreshing ? threshold + 20 : ySpring }}
                className="will-change-transform"
            >
                {children}
            </motion.div>
        </div>
    );
};
