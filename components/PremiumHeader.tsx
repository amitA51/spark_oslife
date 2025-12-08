import React from 'react';
import { motion } from 'framer-motion';

interface PremiumHeaderProps {
    title: string;
    subtitle?: string | React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode; // For stats or extra content below title
    className?: string;
    icon?: React.ReactNode; // Optional icon next to title
}

const PremiumHeader: React.FC<PremiumHeaderProps> = ({
    title,
    subtitle,
    actions,
    children,
    className = '',
    icon,
}) => {
    return (
        <header className={`sticky top-0 z-30 pt-[max(env(safe-area-inset-top,20px),1.5rem)] pb-5 px-4 bg-[var(--bg-primary)]/85 backdrop-blur-2xl border-b border-white/[0.06] ${className}`}>
            {/* Ambient gradient overlay */}
            <div
                className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--dynamic-accent-glow), transparent)',
                }}
            />

            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-start">
                    {/* Title & Subtitle - Right Aligned (RTL) */}
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-3">
                            {icon && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-2.5 rounded-2xl"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--dynamic-accent-start) 0%, var(--dynamic-accent-end) 100%)',
                                        boxShadow: '0 8px 24px var(--dynamic-accent-glow)',
                                    }}
                                >
                                    {icon}
                                </motion.div>
                            )}
                            <motion.h1
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="relative text-4xl sm:text-5xl font-black tracking-tight font-heading"
                                style={{
                                    background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.85) 50%, var(--dynamic-accent-start) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                {title}
                                {/* Animated glow behind text */}
                                <motion.div
                                    className="absolute -inset-6 blur-3xl rounded-full -z-10"
                                    style={{ backgroundColor: 'var(--dynamic-accent-glow)' }}
                                    animate={{
                                        opacity: [0.3, 0.5, 0.3],
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />
                                {/* Shimmer overlay */}
                                <motion.div
                                    className="absolute inset-0 -z-5 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    style={{
                                        maskImage: 'linear-gradient(to right, transparent, black, transparent)',
                                        WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)',
                                    }}
                                    animate={{
                                        x: ['-100%', '100%'],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatDelay: 5,
                                        ease: 'easeInOut',
                                    }}
                                />
                            </motion.h1>
                        </div>
                        {subtitle && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="text-sm font-semibold tracking-wide mt-1.5 flex items-center gap-2"
                                style={{ color: 'var(--dynamic-accent-start)' }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: 'var(--dynamic-accent-start)' }}
                                />
                                {subtitle}
                            </motion.div>
                        )}
                    </div>

                    {/* Actions - Left Aligned */}
                    {actions && (
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            {actions}
                        </motion.div>
                    )}
                </div>

                {/* Stats / Extra Content */}
                {children && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="flex items-center gap-4"
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </header>
    );
};

export default PremiumHeader;
