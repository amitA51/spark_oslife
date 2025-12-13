import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SettingsCardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    noPadding?: boolean;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
    children,
    className = '',
    glowColor = 'var(--dynamic-accent-start)',
    noPadding = false,
    ...props
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
        relative group overflow-hidden
        backdrop-blur-xl bg-[#0F0F1A]/60 
        border border-white/5 hover:border-white/10
        rounded-2xl transition-all duration-300
        ${noPadding ? 'p-0' : 'p-5'}
        ${className}
      `}
            {...props}
        >
            {/* Inner Glow Effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)`
                }}
            />

            {/* Accent Border Bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default SettingsCard;
