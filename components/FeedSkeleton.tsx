import React from 'react';
import Skeleton from './Skeleton';

interface FeedSkeletonProps {
  count?: number;
}

const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass-panel p-6"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Header with avatar and metadata */}
          <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={14} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2 mb-4">
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="75%" height={24} />
          </div>

          {/* Content lines */}
          <div className="space-y-2 mb-6">
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="80%" height={16} />
          </div>

          {/* Image placeholder */}
          <Skeleton variant="rectangular" width="100%" height={200} className="mb-6" />

          {/* Actions bar */}
          <div className="flex gap-3">
            <Skeleton variant="text" width={80} height={32} className="rounded-full" />
            <Skeleton variant="text" width={80} height={32} className="rounded-full" />
            <Skeleton variant="text" width={80} height={32} className="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedSkeleton;
