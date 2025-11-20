import React from 'react';
import { SPACING, FONT_SIZE } from '../constants/designTokens';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    illustration?: 'tasks' | 'habits' | 'feed' | 'search' | 'generic';
}

const ILLUSTRATIONS = {
    tasks: (
        <svg className="w-32 h-32 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    habits: (
        <svg className="w-32 h-32 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00 2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    feed: (
        <svg className="w-32 h-32 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
    ),
    search: (
        <svg className="w-32 h-32 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    generic: (
        <svg className="w-32 h-32 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    ),
};

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    illustration = 'generic'
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Illustration or Custom Icon */}
            {icon || ILLUSTRATIONS[illustration]}

            {/* Title */}
            <h3
                className="font-bold text-[var(--text-primary)] mb-2"
                style={{ fontSize: FONT_SIZE.xl }}
            >
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p
                    className="text-[var(--text-secondary)] max-w-md mb-6"
                    style={{ fontSize: FONT_SIZE.sm }}
                >
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="
            flex items-center gap-2
            bg-[var(--accent-gradient)] 
            hover:brightness-110 
            text-white font-semibold 
            px-6 py-3 
            rounded-xl 
            transition-all 
            transform active:scale-95
            shadow-lg shadow-[var(--dynamic-accent-glow)]
          "
                >
                    {action.icon}
                    {action.label}
                </button>
            )}

            {/* Decorative Gradient (Optional) */}
            <div
                className="absolute inset-0 -z-10 opacity-5 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, var(--dynamic-accent-start) 0%, transparent 70%)'
                }}
            />
        </div>
    );
};

export default EmptyState;
