/**
 * Premium Empty State Component
 * Beautiful, animated empty state for the Add screen
 */

import React from 'react';

interface PremiumEmptyStateProps {
  type?: 'default' | 'no-templates' | 'no-recent' | 'search-empty';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const getContent = () => {
    switch (type) {
      case 'no-templates':
        return {
          icon: '📋',
          title: title || 'No Templates Yet',
          description: description || 'Create your first template to speed up your workflow',
          illustration: 'template',
        };
      case 'no-recent':
        return {
          icon: '🕐',
          title: title || 'No Recent Items',
          description: description || 'Items you create will appear here for quick access',
          illustration: 'clock',
        };
      case 'search-empty':
        return {
          icon: '🔍',
          title: title || 'No Results Found',
          description: description || 'Try adjusting your search or create something new',
          illustration: 'search',
        };
      default:
        return {
          icon: '✨',
          title: title || 'Ready to Create',
          description: description || 'Start by choosing a category or typing what you want to add',
          illustration: 'spark',
        };
    }
  };

  const content = getContent();

  return (
    <div
      className={`
        flex flex-col items-center justify-center py-12 px-6
        text-center animate-premium-fade-in
        ${className}
      `}
    >
      {/* Animated Illustration */}
      <div className="relative mb-6">
        {/* Glow background */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-violet))',
            transform: 'scale(1.5)',
          }}
        />
        
        {/* Icon container */}
        <div 
          className="
            relative w-24 h-24 rounded-3xl 
            flex items-center justify-center
            animate-float
          "
          style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(123, 97, 255, 0.1))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span className="text-4xl">{content.icon}</span>
          
          {/* Decorative particles */}
          <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-cyan-400/50 animate-glow-pulse" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-violet-400/50 animate-glow-pulse stagger-2" />
          <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 rounded-full bg-cyan-300/50 animate-glow-pulse stagger-3" />
        </div>
      </div>

      {/* Title */}
      <h3 
        className="text-xl font-semibold mb-2"
        style={{ 
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-white)',
        }}
      >
        {content.title}
      </h3>

      {/* Description */}
      <p 
        className="text-sm max-w-xs mb-6"
        style={{ color: 'var(--color-gray-400)' }}
      >
        {content.description}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="
            px-6 py-3 rounded-xl font-medium
            transition-all duration-300
            hover:scale-105 active:scale-95
          "
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-violet))',
            color: 'var(--color-cosmos-black)',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
          }}
        >
          {actionLabel}
        </button>
      )}

      {/* Decorative lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-cyan)" />
              <stop offset="100%" stopColor="var(--color-accent-violet)" />
            </linearGradient>
          </defs>
          <line x1="10%" y1="20%" x2="30%" y2="80%" stroke="url(#emptyGradient)" strokeWidth="0.5" />
          <line x1="70%" y1="10%" x2="90%" y2="70%" stroke="url(#emptyGradient)" strokeWidth="0.5" />
          <line x1="40%" y1="90%" x2="60%" y2="30%" stroke="url(#emptyGradient)" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
};

export default PremiumEmptyState;