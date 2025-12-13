import React from 'react';
import { motion } from 'framer-motion';

interface PremiumToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

const PremiumToggle: React.FC<PremiumToggleProps> = ({
    checked,
    onChange,
    label,
    disabled = false
}) => {
    return (
        <div className={`flex items-center gap-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {label && <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>}
            <button
                onClick={() => onChange(!checked)}
                className="relative w-12 h-7 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dynamic-accent-start)] transition-colors duration-300"
                style={{
                    backgroundColor: checked ? 'var(--dynamic-accent-start)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: checked ? '0 0 10px var(--dynamic-accent-glow)' : 'inset 0 1px 3px rgba(0,0,0,0.2)'
                }}
                aria-pressed={checked}
                type="button"
            >
                <motion.div
                    className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{
                        x: checked ? 20 : 0,
                        scale: checked ? 1.1 : 1
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                {/* Glow Element */}
                {checked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.5, scale: 1.2 }}
                        className="absolute inset-0 rounded-full blur-sm"
                        style={{ backgroundColor: 'var(--dynamic-accent-start)' }}
                    />
                )}
            </button>
        </div>
    );
};

export default PremiumToggle;
