import React from 'react';
import { SPACING, BORDER_RADIUS, ANIMATION_DURATION } from '../constants/designTokens';

// ========================================
// Skeleton Primitive Components
// ========================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: keyof typeof BORDER_RADIUS;
  className?: string;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'md',
  className = ''
}) => (
  <div
    className={`bg-[var(--bg-secondary)] animate-pulse ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: BORDER_RADIUS[borderRadius],
    }}
  />
);

export const SkeletonCircle: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => (
  <div
    className={`bg-[var(--bg-secondary)] rounded-full animate-pulse ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox
        key={i}
        height={16}
        width={i === lines - 1 ? '80%' : '100%'}
      />
    ))}
  </div>
);

// ========================================
// Pre-built Skeleton Templates
// ========================================

export const SkeletonCard: React.FC = () => (
  <div className="themed-card p-4 space-y-3">
    <div className="flex items-start gap-4">
      <SkeletonCircle size={40} />
      <div className="flex-1 space-y-2">
        <SkeletonBox height={24} width="70%" />
        <SkeletonBox height={16} width="40%" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <div className="flex gap-2">
      <SkeletonBox height={24} width={60} borderRadius="full" />
      <SkeletonBox height={24} width={80} borderRadius="full" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number; columns?: number }> = ({
  count = 6,
  columns = 3
}) => (
  <div
    className="grid gap-4"
    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="themed-card p-4 space-y-3">
        <SkeletonCircle size={48} className="mx-auto" />
        <SkeletonBox height={20} />
        <SkeletonBox height={16} width="60%" className="mx-auto" />
      </div>
    ))}
  </div>
);

// ========================================
// Legacy Export (for compatibility)
// ========================================
const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <SkeletonList count={count} />
);

export default SkeletonLoader;
