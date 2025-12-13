import React from 'react';
import { motion } from 'framer-motion';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

interface SkeletonProps {
  /** Custom class name */
  className?: string;
  /** Width (number for px, string for any unit) */
  width?: string | number;
  /** Height (number for px, string for any unit) */
  height?: string | number;
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Enable shimmer animation */
  animate?: boolean;
  /** Number of lines for text variant */
  lines?: number;
  /** Gap between lines */
  lineGap?: number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded-md',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-xl',
};

const SkeletonBase: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}> = ({ className = '', style, animate = true }) => (
  <div
    className={`relative overflow-hidden bg-white/[0.03] ${className}`}
    style={style}
    role="status"
    aria-busy="true"
    aria-label="טוען..."
  >
    {animate && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 0.5,
        }}
      />
    )}
    {/* Subtle inner glow - Quiet Luxury: reduced opacity */}
    <div
      className="absolute inset-0 opacity-15"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, var(--dynamic-accent-glow), transparent 70%)',
      }}
    />
  </div>
);

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rounded',
  animate = true,
  lines = 1,
  lineGap = 8,
}) => {
  const variantClass = variantClasses[variant];

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  // Multi-line text skeleton
  if (variant === 'text' && lines > 1) {
    return (
      <div
        className="flex flex-col"
        style={{ gap: `${lineGap}px`, width: style.width }}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBase
            key={i}
            className={`${variantClass} ${className}`}
            style={{
              height: style.height || '1em',
              // Last line is shorter for realistic text appearance
              width: i === lines - 1 ? '75%' : '100%',
            }}
            animate={animate}
          />
        ))}
      </div>
    );
  }

  return (
    <SkeletonBase
      className={`${variantClass} ${className}`}
      style={style}
      animate={animate}
    />
  );
};

// Preset skeleton components for common use cases
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => (
  <Skeleton variant="circular" width={size} height={size} className={className} />
);

export const SkeletonText: React.FC<{
  lines?: number;
  width?: string | number;
  className?: string;
}> = ({
  lines = 3,
  width = '100%',
  className = ''
}) => (
    <Skeleton variant="text" lines={lines} width={width} height={14} className={className} />
  );

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <SkeletonAvatar size={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2 mt-4">
      <Skeleton variant="rounded" width={80} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  </div>
);

export const SkeletonButton: React.FC<{
  width?: string | number;
  height?: number;
  className?: string;
}> = ({
  width = 100,
  height = 40,
  className = ''
}) => (
    <Skeleton variant="rounded" width={width} height={height} className={className} />
  );

export default React.memo(Skeleton);
