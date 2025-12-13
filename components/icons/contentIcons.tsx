/**
 * Content Type Icons
 * 
 * Icons representing different content types (tasks, notes, books, etc.).
 */

import React from 'react';
import type { IconProps } from './types';

export const LightbulbIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4.5 12.4 3 3 0 0 0 .5 1.6v2h8v-2a3 3 0 0 0 .5-1.6A7 7 0 0 0 12 2z" />
    </svg>
);

export const ClipboardListIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" />
        <line x1="8" y1="18" x2="14" y2="18" />
    </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

export const DumbbellIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M6.5 6.5a2.5 2.5 0 0 0-3.54 0l-.71.71a2.5 2.5 0 0 0 0 3.54l.71.71" />
        <path d="M17.5 17.5a2.5 2.5 0 0 0 3.54 0l.71-.71a2.5 2.5 0 0 0 0-3.54l-.71-.71" />
        <path d="M11.5 6.5L6.5 11.5" />
        <path d="M17.5 12.5l-5 5" />
        <line x1="6.5" y1="17.5" x2="17.5" y2="6.5" />
    </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

export const RoadmapIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

export const BrainCircuitIcon: React.FC<IconProps> = ({ className, style, strokeWidth = 1.5 }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5z" />
        <path d="M16 8V5c0-1.1.9-2 2-2" />
        <path d="M12 13h4" />
        <path d="M12 18h6a2 2 0 0 1 2 2v1" />
        <path d="M12 8h8" />
        <path d="M20.5 8a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
        <path d="M16.5 13a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
        <path d="M20.5 21a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
        <path d="M18.5 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

export const InboxIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className, filled, style, strokeWidth = 1.5 }) => (
    <svg
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className, filled, style, strokeWidth = 1.5 }) => (
    <svg
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
        <path d="M19 18L20 20L22 21L20 22L19 24L18 22L16 21L18 20L19 18Z" opacity="0.6" />
    </svg>
);
