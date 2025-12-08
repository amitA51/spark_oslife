/**
 * Add Screen Skeleton Loader
 * Premium shimmer loading states for the Add screen
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps & { width?: string; height?: string }> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem' 
}) => (
  <div
    className={`skeleton rounded-lg ${className}`}
    style={{ width, height }}
  />
);

export const SearchBarSkeleton: React.FC = () => (
  <div className="px-4 mb-6">
    <div 
      className="h-14 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center h-full px-4 gap-3">
        <Skeleton width="24px" height="24px" className="rounded-lg flex-shrink-0" />
        <Skeleton width="60%" height="16px" />
        <div className="flex-1" />
        <Skeleton width="32px" height="32px" className="rounded-full flex-shrink-0" />
      </div>
    </div>
  </div>
);

export const TemplateCarouselSkeleton: React.FC = () => (
  <div className="mb-6">
    {/* Header */}
    <div className="flex items-center justify-between px-4 mb-3">
      <Skeleton width="140px" height="20px" />
      <Skeleton width="60px" height="16px" />
    </div>
    
    {/* Carousel items */}
    <div className="flex gap-3 px-4 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className="flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animationDelay: `${i * 100}ms`,
          }}
        >
          <div className="p-3 h-full flex flex-col">
            <Skeleton width="32px" height="32px" className="rounded-lg mb-2" />
            <Skeleton width="80%" height="12px" className="mb-1" />
            <Skeleton width="60%" height="10px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CategoryGridSkeleton: React.FC = () => (
  <div className="px-4 mb-6">
    {/* Section header */}
    <Skeleton width="120px" height="18px" className="mb-4" />
    
    {/* Grid */}
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animationDelay: `${i * 50}ms`,
          }}
        >
          <div className="p-4 h-full flex flex-col items-center justify-center gap-3">
            <Skeleton width="48px" height="48px" className="rounded-xl" />
            <Skeleton width="60%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RecentItemsSkeleton: React.FC = () => (
  <div className="px-4">
    {/* Section header */}
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="100px" height="18px" />
      <Skeleton width="50px" height="14px" />
    </div>
    
    {/* Items */}
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animationDelay: `${i * 80}ms`,
          }}
        >
          <Skeleton width="40px" height="40px" className="rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton width="70%" height="14px" className="mb-2" />
            <Skeleton width="40%" height="10px" />
          </div>
          <Skeleton width="24px" height="24px" className="rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="p-4 space-y-6">
    {/* Title input */}
    <div>
      <Skeleton width="60px" height="14px" className="mb-2" />
      <Skeleton width="100%" height="48px" className="rounded-xl" />
    </div>
    
    {/* Description */}
    <div>
      <Skeleton width="80px" height="14px" className="mb-2" />
      <Skeleton width="100%" height="96px" className="rounded-xl" />
    </div>
    
    {/* Options row */}
    <div className="flex gap-3">
      <div className="flex-1">
        <Skeleton width="50px" height="14px" className="mb-2" />
        <Skeleton width="100%" height="44px" className="rounded-xl" />
      </div>
      <div className="flex-1">
        <Skeleton width="60px" height="14px" className="mb-2" />
        <Skeleton width="100%" height="44px" className="rounded-xl" />
      </div>
    </div>
    
    {/* AI Suggestions */}
    <div className="mt-6">
      <Skeleton width="120px" height="16px" className="mb-3" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <Skeleton 
            key={i} 
            width="100px" 
            height="32px" 
            className="rounded-full"
          />
        ))}
      </div>
    </div>
    
    {/* Submit button */}
    <Skeleton width="100%" height="52px" className="rounded-xl mt-8" />
  </div>
);

export const AddScreenSkeleton: React.FC = () => (
  <div 
    className="min-h-screen pb-24 animate-in fade-in-0 duration-300"
    style={{ background: 'var(--color-cosmos-black)' }}
  >
    {/* Header skeleton */}
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton width="48px" height="14px" />
        <Skeleton width="32px" height="32px" className="rounded-full" />
      </div>
      <Skeleton width="180px" height="28px" className="mb-1" />
      <Skeleton width="220px" height="16px" />
    </div>
    
    <SearchBarSkeleton />
    <TemplateCarouselSkeleton />
    <CategoryGridSkeleton />
    <RecentItemsSkeleton />
  </div>
);

export default AddScreenSkeleton;