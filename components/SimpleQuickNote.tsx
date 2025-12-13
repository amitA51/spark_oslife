import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, CheckCircleIcon } from './icons';
import { useHaptics } from '../hooks/useHaptics';
import { useData } from '../src/contexts/DataContext';
import { useModal } from '../state/ModalContext';
import { todayKey } from '../utils/dateUtils';

const SimpleQuickNote: React.FC = () => {
    const { modals, closeModal } = useModal();
    const { triggerHaptic } = useHaptics();
    const { addPersonalItem } = useData();

    const modal = modals['quickNote'];
    const isOpen = modal?.isOpen ?? false;

    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setText('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleClose = () => {
        closeModal('quickNote');
    };

    const handleSubmit = async () => {
        if (!text.trim() || isSubmitting) return;

        setIsSubmitting(true);
        triggerHaptic('medium');

        try {
            const lines = text.trim().split('\n');
            const title = (lines[0] ?? '').slice(0, 100);
            const content = lines.slice(1).join('\n');

            if (addPersonalItem) {
                await addPersonalItem({
                    type: 'note',
                    title: title,
                    content: content,
                    dueDate: todayKey(),
                } as any);
            }

            triggerHaptic('heavy');
            handleClose();
        } catch {
            triggerHaptic('light');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            handleClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center pb-28"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                        animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ y: 100, opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-[90vw] max-w-md rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(12, 12, 18, 0.95)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-white/[0.04]">
                            <span className="text-white/50 text-sm font-medium">📝 פתק מהיר</span>
                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors duration-300"
                            >
                                <CloseIcon className="w-5 h-5 text-white/40" />
                            </button>
                        </div>

                        {/* Input */}
                        <div className="p-3">
                            <textarea
                                ref={inputRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="כתוב משהו מהיר..."
                                rows={3}
                                className="w-full bg-transparent text-white placeholder:text-white/30 text-base resize-none focus:outline-none"
                                style={{ direction: 'rtl' }}
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-3 pt-0">
                            <span className="text-[10px] text-white/25">Ctrl+Enter לשמירה</span>
                            <motion.button
                                onClick={handleSubmit}
                                disabled={!text.trim() || isSubmitting}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-40 transition-all duration-300"
                                style={{
                                    background: text.trim() ? 'linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))' : 'rgba(255,255,255,0.04)',
                                    color: 'white',
                                    boxShadow: text.trim() ? '0 4px 12px rgba(var(--dynamic-accent-glow), 0.2)' : 'none',
                                }}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                שמור
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SimpleQuickNote;
