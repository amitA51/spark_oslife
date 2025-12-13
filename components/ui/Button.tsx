import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children?: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ReactNode;
    isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white shadow-lg shadow-[var(--dynamic-accent-glow)]/20 border-none hover:shadow-xl hover:shadow-[var(--dynamic-accent-glow)]/40',
    secondary: 'bg-[var(--color-gray-100)] text-[var(--color-white)] border border-[var(--color-gray-200)] hover:bg-[var(--color-gray-150)] hover:border-[var(--color-gray-300)]',
    ghost: 'bg-transparent text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-white',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-sm',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
    icon: 'p-2 rounded-xl h-10 w-10 justify-center',
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    isLoading,
    className = '',
    disabled,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            disabled={disabled || isLoading}
            className={`
        relative inline-flex items-center font-medium transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : icon ? (
                <span className={`${children ? 'mr-0' : ''}`}>{icon}</span>
            ) : null}
            {children}

            {/* Glossy overlay for primary/glass */}
            {(variant === 'primary' || variant === 'glass') && (
                <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            )}
        </motion.button>
    );
};
