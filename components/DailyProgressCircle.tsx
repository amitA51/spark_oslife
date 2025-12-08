import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface DailyProgressCircleProps {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Circle size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Label text (default: "היום") */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Animate on mount */
  animate?: boolean;
  /** Custom center content */
  centerContent?: React.ReactNode;
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return { start: '#22c55e', end: '#10b981' }; // Complete - Green
  if (percentage >= 75) return { start: '#3b82f6', end: '#6366f1' };  // Great - Blue
  if (percentage >= 50) return { start: '#f59e0b', end: '#f97316' };  // Good - Amber
  if (percentage >= 25) return { start: '#ef4444', end: '#f97316' };  // Needs work - Orange
  return { start: '#ef4444', end: '#dc2626' };                        // Low - Red
};

const DailyProgressCircle: React.FC<DailyProgressCircleProps> = ({
  percentage,
  size = 56,
  strokeWidth = 4,
  label = 'היום',
  showPercentage = true,
  animate = true,
  centerContent,
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(animate ? 0 : percentage);

  const radius = size / 2 - strokeWidth;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayPercentage / 100) * circumference;

  const colors = useMemo(() => getProgressColor(percentage), [percentage]);
  const gradientId = useMemo(() => `progress-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  // Animate counter on mount or percentage change
  useEffect(() => {
    if (!animate) {
      setDisplayPercentage(percentage);
      return;
    }

    const duration = 800;
    const startTime = performance.now();
    const startValue = displayPercentage;
    const endValue = percentage;

    const animateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const currentValue = startValue + (endValue - startValue) * eased;

      setDisplayPercentage(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);
  }, [percentage, animate]);

  const isComplete = percentage >= 100;

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${colors.start}40, transparent 70%)`,
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Circle */}
      <svg className="relative w-full h-full z-10" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress circle */}
        <motion.circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          filter={`url(#${gradientId}-glow)`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {centerContent || (
          <>
            {showPercentage && (
              <motion.span
                className="font-black tracking-tight text-white"
                style={{ fontSize: size * 0.27 }}
                initial={animate ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
              >
                {Math.round(displayPercentage)}%
              </motion.span>
            )}
            {label && (
              <span
                className="uppercase tracking-[0.16em] text-white/50 font-semibold"
                style={{ fontSize: size * 0.16 }}
              >
                {label}
              </span>
            )}
          </>
        )}
      </div>

      {/* Completion celebration */}
      {isComplete && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none z-30"
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: [0, 1, 0], scale: [1.5, 1, 1.5] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          style={{
            border: `2px solid ${colors.start}`,
          }}
        />
      )}
    </motion.div>
  );
};

export default React.memo(DailyProgressCircle);
