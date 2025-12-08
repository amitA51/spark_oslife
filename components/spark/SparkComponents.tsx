/**
 * ═══════════════════════════════════════════════════════════════
 * SPARK DESIGN SYSTEM - Premium UI Components
 * Marcelo Design X Inspired - $100M App Aesthetic
 * ═══════════════════════════════════════════════════════════════
 * 
 * Core principles:
 * - Quiet & Calm aesthetics
 * - Theme-aware accent colors
 * - Consistent glass morphism
 * - Smooth, subtle animations
 */

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// SPARK CARD - Premium Glass Card Component
// ═══════════════════════════════════════════════════════════════

interface SparkCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'outlined' | 'subtle';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverEffect?: boolean;
    glowOnHover?: boolean;
    onClick?: () => void;
    as?: 'div' | 'article' | 'section' | 'button';
}

const paddingMap = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
    xl: 'p-6 sm:p-8',
};

const variantStyles = {
    default: `
    bg-[rgba(26,26,38,0.6)]
    backdrop-blur-2xl
    border border-white/[0.06]
    shadow-[0_8px_32px_rgba(0,0,0,0.4)]
  `,
    elevated: `
    bg-[rgba(31,31,46,0.7)]
    backdrop-blur-2xl
    border border-white/[0.08]
    shadow-[0_12px_40px_rgba(0,0,0,0.5)]
  `,
    outlined: `
    bg-transparent
    backdrop-blur-xl
    border border-white/[0.1]
  `,
    subtle: `
    bg-white/[0.02]
    backdrop-blur-lg
    border border-white/[0.04]
  `,
};

export const SparkCard = forwardRef<HTMLDivElement, SparkCardProps>(
    (
        {
            children,
            className = '',
            variant = 'default',
            padding = 'md',
            hoverEffect = false,
            glowOnHover = false,
            onClick,
            as = 'div',
        },
        ref
    ) => {
        const Component = as === 'button' ? 'button' : as;

        const hoverStyles = hoverEffect
            ? `
        transition-all duration-300 ease-out cursor-pointer
        hover:border-white/[0.12]
        hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]
        hover:-translate-y-0.5
        active:scale-[0.99] active:translate-y-0
      `
            : '';

        const glowStyles = glowOnHover
            ? `
        hover:shadow-[0_0_40px_-10px_var(--dynamic-accent-glow)]
        hover:border-[rgba(var(--accent-rgb,0,240,255),0.15)]
      `
            : '';

        return (
            <Component
                ref={ref as any}
                onClick={onClick}
                className={`
          relative rounded-[1.5rem] overflow-hidden
          ${variantStyles[variant]}
          ${paddingMap[padding]}
          ${hoverStyles}
          ${glowStyles}
          ${className}
        `}
            >
                {/* Glass shine effect at top */}
                <div
                    className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                    }}
                />

                {/* Subtle noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay rounded-[1.5rem]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                <div className="relative z-10">{children}</div>
            </Component>
        );
    }
);

SparkCard.displayName = 'SparkCard';

// ═══════════════════════════════════════════════════════════════
// SPARK HEADER - Screen Header Component
// ═══════════════════════════════════════════════════════════════

interface SparkHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    showGlow?: boolean;
    sticky?: boolean;
}

export const SparkHeader: React.FC<SparkHeaderProps> = ({
    title,
    subtitle,
    actions,
    children,
    showGlow = true,
    sticky = true,
}) => {
    return (
        <header
            className={`
        ${sticky ? 'sticky top-0 z-20' : ''}
        -mx-4 px-4 pt-5 pb-4
        backdrop-blur-xl
        bg-gradient-to-b from-[rgba(10,10,15,0.95)] via-[rgba(10,10,15,0.8)] to-transparent
        transition-all duration-300
      `}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Title Section */}
                <div className="flex-1 min-w-0">
                    <div className="relative">
                        {/* Glow effect behind title */}
                        {showGlow && (
                            <div
                                className="absolute -inset-4 blur-2xl rounded-full opacity-30 -z-10"
                                style={{ backgroundColor: 'var(--dynamic-accent-glow)' }}
                            />
                        )}
                        <h1
                            className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
                            style={{ color: 'var(--dynamic-accent-start)' }}
                        >
                            {title}
                        </h1>
                    </div>
                    {subtitle && (
                        <p className="text-sm text-gray-400 mt-1 truncate">{subtitle}</p>
                    )}

                    {/* Optional children for stats/badges */}
                    {children && <div className="mt-3">{children}</div>}
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
                )}
            </div>
        </header>
    );
};

// ═══════════════════════════════════════════════════════════════
// SPARK BUTTON - Premium Button Component
// ═══════════════════════════════════════════════════════════════

interface SparkButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
}

const buttonVariants = {
    primary: `
    bg-gradient-to-br from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)]
    text-[#0A0A0F] font-bold
    border border-white/20
    shadow-[0_4px_20px_var(--dynamic-accent-glow)]
    hover:shadow-[0_8px_30px_var(--dynamic-accent-glow)]
  `,
    secondary: `
    bg-white/[0.06]
    text-white
    border border-white/[0.08]
    backdrop-blur-md
    hover:bg-white/[0.1]
    hover:border-white/[0.15]
  `,
    ghost: `
    bg-transparent
    text-gray-400
    border border-transparent
    hover:text-white
    hover:bg-white/[0.05]
  `,
    danger: `
    bg-red-500/10
    text-red-400
    border border-red-500/20
    hover:bg-red-500/20
    hover:border-red-500/30
  `,
};

const buttonSizes = {
    xs: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
    sm: 'px-3.5 py-2 text-sm rounded-xl gap-2',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
};

export const SparkButton: React.FC<SparkButtonProps> = ({
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    iconPosition = 'left',
    isLoading = false,
    fullWidth = false,
    disabled,
    className = '',
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            disabled={disabled || isLoading}
            className={`
        relative overflow-hidden
        inline-flex items-center justify-center
        font-semibold
        transition-all duration-200
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
                    <span>{children}</span>
                    {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
                </>
            )}
        </motion.button>
    );
};

// ═══════════════════════════════════════════════════════════════
// SPARK ICON BUTTON - Circular Icon Button
// ═══════════════════════════════════════════════════════════════

interface SparkIconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    icon: React.ReactNode;
    variant?: 'ghost' | 'filled' | 'outlined';
    size?: 'sm' | 'md' | 'lg';
    label: string; // For accessibility
}

const iconButtonSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
};

const iconButtonVariants = {
    ghost: `
    bg-transparent
    text-gray-400
    hover:text-white
    hover:bg-white/[0.08]
  `,
    filled: `
    bg-white/[0.06]
    text-white
    border border-white/[0.08]
    hover:bg-white/[0.1]
  `,
    outlined: `
    bg-transparent
    text-gray-400
    border border-white/[0.1]
    hover:text-white
    hover:border-white/[0.2]
  `,
};

export const SparkIconButton: React.FC<SparkIconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'md',
    label,
    disabled,
    className = '',
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            disabled={disabled}
            aria-label={label}
            className={`
        rounded-xl
        flex items-center justify-center
        transition-all duration-200
        ${iconButtonVariants[variant]}
        ${iconButtonSizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
            {...props}
        >
            {icon}
        </motion.button>
    );
};

// ═══════════════════════════════════════════════════════════════
// SPARK BADGE - Status/Label Badge
// ═══════════════════════════════════════════════════════════════

interface SparkBadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    dot?: boolean;
    className?: string;
}

const badgeVariants = {
    default: 'bg-white/[0.08] text-gray-300 border-white/[0.1]',
    accent: 'bg-[var(--dynamic-accent-color)] text-[var(--dynamic-accent-start)] border-[var(--dynamic-accent-start)]/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

const badgeSizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
};

export const SparkBadge: React.FC<SparkBadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    dot = false,
    className = '',
}) => {
    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        font-semibold uppercase tracking-wider
        rounded-full border
        ${badgeVariants[variant]}
        ${badgeSizes[size]}
        ${className}
      `}
        >
            {dot && (
                <span
                    className={`w-1.5 h-1.5 rounded-full ${variant === 'accent'
                        ? 'bg-[var(--dynamic-accent-start)]'
                        : variant === 'success'
                            ? 'bg-emerald-400'
                            : variant === 'warning'
                                ? 'bg-amber-400'
                                : variant === 'danger'
                                    ? 'bg-red-400'
                                    : variant === 'info'
                                        ? 'bg-sky-400'
                                        : 'bg-gray-400'
                        }`}
                />
            )}
            {children}
        </span>
    );
};

// ═══════════════════════════════════════════════════════════════
// SPARK SECTION - Content Section with Title
// ═══════════════════════════════════════════════════════════════

interface SparkSectionProps {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const SparkSection: React.FC<SparkSectionProps> = ({
    title,
    children,
    action,
    className = '',
}) => {
    return (
        <section className={className}>
            <div className="flex items-center justify-between mb-4">
                <h2
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: 'var(--dynamic-accent-start)' }}
                >
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
};

// ═══════════════════════════════════════════════════════════════
// SPARK DIVIDER - Horizontal Separator
// ═══════════════════════════════════════════════════════════════

interface SparkDividerProps {
    className?: string;
    gradient?: boolean;
}

export const SparkDivider: React.FC<SparkDividerProps> = ({
    className = '',
    gradient = false,
}) => {
    return (
        <div
            className={`h-px ${className}`}
            style={{
                background: gradient
                    ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
                    : 'rgba(255,255,255,0.06)',
            }}
        />
    );
};

// ═══════════════════════════════════════════════════════════════
// SPARK SKELETON - Loading Placeholder
// ═══════════════════════════════════════════════════════════════

interface SparkSkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const SparkSkeleton: React.FC<SparkSkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
}) => {
    const variantStyles = {
        text: 'h-4 rounded-md',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
    };

    return (
        <div
            className={`
        animate-pulse
        bg-gradient-to-r from-white/[0.06] via-white/[0.1] to-white/[0.06]
        bg-[length:200%_100%]
        ${variantStyles[variant]}
        ${className}
      `}
            style={{
                width: width,
                height: height,
                animation: 'shimmer 1.5s ease-in-out infinite',
            }}
        />
    );
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
    SparkCard,
    SparkHeader,
    SparkButton,
    SparkIconButton,
    SparkBadge,
    SparkSection,
    SparkDivider,
    SparkSkeleton,
};
