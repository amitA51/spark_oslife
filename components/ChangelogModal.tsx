import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon, CalendarIcon } from './icons';
import { changelogData } from '../src/data/changelog';


interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg max-h-[80vh] bg-[#1a1b26] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[var(--dynamic-accent-start)]/10 to-[var(--dynamic-accent-end)]/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)]">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">מה חדש?</h2>
                                <p className="text-sm text-[var(--text-secondary)]">היסטוריית עדכונים ושיפורים</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-white"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {changelogData.map((version, index) => (
                            <div key={version.version} className="relative pl-4">
                                {/* Timeline line */}
                                {index !== changelogData.length - 1 && (
                                    <div className="absolute top-8 bottom-[-32px] right-[5px] w-0.5 bg-white/10" />
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-lg font-bold text-[var(--dynamic-accent-start)]">v{version.version}</span>
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-[var(--text-secondary)]">
                                        <CalendarIcon className="w-3 h-3" />
                                        {version.date}
                                    </div>
                                </div>

                                <div className="space-y-4 pr-4 border-r-2 border-[var(--dynamic-accent-start)]/30 mr-[4px]">
                                    {version.features.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                פיצ'רים חדשים
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {version.features.map((feature, i) => (
                                                    <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {version.improvements.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                שיפורים
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {version.improvements.map((imp, i) => (
                                                    <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        {imp}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {version.fixes.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                תיקונים
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {version.fixes.map((fix, i) => (
                                                    <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        {fix}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-black/20 text-center">
                        <p className="text-xs text-[var(--text-tertiary)]">
                            אנחנו משתפרים כל הזמן עבורך.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ChangelogModal;
