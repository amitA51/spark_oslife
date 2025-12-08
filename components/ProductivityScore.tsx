import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from './icons';

interface ProductivityScoreProps {
  /** Current score (0-100) */
  score: number;
  /** Description text */
  text: string;
  /** Loading state */
  isLoading: boolean;
  /** Previous score for comparison */
  previousScore?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show trend indicator */
  showTrend?: boolean;
}

const sizeConfig = {
  sm: { size: 80, stroke: 6, fontSize: 'text-2xl', textSize: 'text-xs' },
  md: { size: 120, stroke: 10, fontSize: 'text-4xl', textSize: 'text-sm' },
  lg: { size: 160, stroke: 12, fontSize: 'text-5xl', textSize: 'text-base' },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' }; // Green
  if (score >= 60) return { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' }; // Blue
  if (score >= 40) return { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }; // Amber
  return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }; // Red
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'מצוין! 🔥';
  if (score >= 80) return 'מעולה! ⭐';
  if (score >= 70) return 'טוב מאוד 💪';
  if (score >= 60) return 'טוב 👍';
  if (score >= 50) return 'סביר';
  if (score >= 40) return 'יש מקום לשיפור';
  return 'צריך לעבוד על זה';
};

const ProductivityScore: React.FC<ProductivityScoreProps> = ({
  score,
  text,
  isLoading,
  previousScore,
  size = 'md',
  showTrend = true,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const config = sizeConfig[size];
  const colors = useMemo(() => getScoreColor(score), [score]);

  // Animate score counter
  useEffect(() => {
    if (isLoading) {
      setDisplayScore(0);
      return;
    }

    let start = 0;
    const end = score;
    if (start === end) return;

    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(eased * end);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, isLoading]);

  const { size: circleSize, stroke: strokeWidth } = config;
  const radius = circleSize / 2 - strokeWidth * 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayScore / 100) * circumference;

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : null;
  const TrendIcon = trend !== null
    ? trend > 0 ? TrendingUpIcon : trend < 0 ? TrendingDownIcon : MinusIcon
    : null;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center"
      >
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity },
          }}
        >
          <SparklesIcon className="w-10 h-10 text-[var(--dynamic-accent-start)]" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm text-[var(--text-secondary)] font-medium"
        >
          AI מנתח את היום שלך...
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center"
    >
      {/* Circle Progress */}
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40"
          style={{ backgroundColor: colors.glow }}
        />

        <svg className="w-full h-full relative z-10" viewBox={`0 0 ${circleSize} ${circleSize}`}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--dynamic-accent-start)" />
              <stop offset="100%" stopColor="var(--dynamic-accent-end)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            stroke="rgba(255,255,255,0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={circleSize / 2}
            cy={circleSize / 2}
          />

          {/* Progress circle */}
          <motion.circle
            stroke="url(#score-gradient)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={radius}
            cx={circleSize / 2}
            cy={circleSize / 2}
            filter="url(#glow)"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Score display */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className={`${config.fontSize} font-bold text-white`}>
            {displayScore}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">
            מתוך 100
          </span>
        </motion.div>
      </div>

      {/* Score label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={getScoreLabel(displayScore)}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-base font-bold"
          style={{ color: colors.main }}
        >
          {getScoreLabel(displayScore)}
        </motion.div>
      </AnimatePresence>

      {/* Trend indicator */}
      {showTrend && trend !== null && TrendIcon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
            ${trend > 0 ? 'bg-green-500/20 text-green-400' : ''}
            ${trend < 0 ? 'bg-red-500/20 text-red-400' : ''}
            ${trend === 0 ? 'bg-white/10 text-[var(--text-secondary)]' : ''}
          `}
        >
          <TrendIcon className="w-3 h-3" />
          <span>
            {trend > 0 ? `+${trend}` : trend === 0 ? 'ללא שינוי' : trend}
          </span>
        </motion.div>
      )}

      {/* Description text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`${config.textSize} text-[var(--text-secondary)] mt-1 max-w-xs leading-relaxed`}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

export default React.memo(ProductivityScore);
