import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs font-semibold text-[var(--color-gray-400)] uppercase tracking-wider ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    id={inputId}
                    className={`
            w-full bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] rounded-xl px-4 py-3
            text-[var(--color-white)] placeholder-[var(--color-gray-400)]
            focus:outline-none focus:border-[var(--dynamic-accent-start)] focus:bg-[var(--color-gray-100)]
            focus:shadow-[0_0_0_4px_var(--dynamic-accent-glow),_0_0_20px_var(--dynamic-accent-glow)]
            focus:shadow-[var(--dynamic-accent-glow)]/10
            transition-all duration-300 ease-out
            font-body
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:shadow-red-500/20' : ''}
          `}
                    {...props}
                />
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] group-focus-within:text-[var(--dynamic-accent-start)] transition-colors duration-300">
                        {icon}
                    </div>
                )}

                {/* Subtle inner noise/texture */}
                <div className="absolute inset-0 rounded-xl pointer-events-none opacity-[0.02] mix-blend-overlay bg-noise" />
            </div>
            {error && (
                <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 ml-1 font-medium"
                >
                    {error}
                </motion.span>
            )}
        </div>
    );
};
