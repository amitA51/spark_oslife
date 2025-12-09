/**
 * FeatureBadge - Animated badge showing app features
 * Used in LoginScreen and SignupScreen header area
 */
import React from 'react';
import { motion } from 'framer-motion';

interface FeatureBadgeProps {
    icon: React.ReactNode;
    label: string;
    delay: number;
}

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ icon, label, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
    >
        <span className="text-[var(--dynamic-accent-start)]">{icon}</span>
        <span className="text-xs font-medium text-gray-300">{label}</span>
    </motion.div>
);

export default FeatureBadge;
