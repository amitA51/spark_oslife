import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MessageCircleIcon, BugIcon, LightbulbIcon, SendIcon } from './icons';
import { createPortal } from 'react-dom';
import { PremiumButton } from './premium/PremiumComponents';


interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const [type, setType] = useState<FeedbackType>('general');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        // Simulate network request
        setTimeout(() => {
            setIsSending(false);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setMessage('');
                onClose();
            }, 2000);
        }, 1500);
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
                    className="relative w-full max-w-md bg-[rgba(12,12,18,0.95)] rounded-2xl shadow-2xl border border-white/[0.06] overflow-hidden backdrop-blur-xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.02] relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2 bg-[var(--dynamic-accent-start)]/15 rounded-xl text-[var(--dynamic-accent-start)]">
                                <MessageCircleIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-white/90">שלח משוב</h3>
                        </div>
                        <button onClick={onClose} className="relative z-10 p-2 hover:bg-white/[0.06] rounded-full text-white/40 hover:text-white transition-all duration-300">
                            <XIcon className="w-5 h-5" />
                        </button>

                        {/* Background Gradient */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[var(--dynamic-accent-start)]/5 to-transparent pointer-events-none" />
                    </div>

                    <div className="p-6">
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4"
                                >
                                    <SendIcon className="w-8 h-8" />
                                </motion.div>
                                <h4 className="text-lg font-bold text-white mb-2">תודה על המשוב!</h4>
                                <p className="text-gray-400 text-sm">ההודעה נשלחה בהצלחה.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Type Selection */}
                                <div className="grid grid-cols-3 gap-2">
                                    <TypeButton
                                        isActive={type === 'general'}
                                        onClick={() => setType('general')}
                                        icon={<MessageCircleIcon className="w-4 h-4" />}
                                        label="כללי"
                                    />
                                    <TypeButton
                                        isActive={type === 'feature'}
                                        onClick={() => setType('feature')}
                                        icon={<LightbulbIcon className="w-4 h-4" />}
                                        label="הצעה"
                                    />
                                    <TypeButton
                                        isActive={type === 'bug'}
                                        onClick={() => setType('bug')}
                                        icon={<BugIcon className="w-4 h-4" />}
                                        label="באג"
                                    />
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 font-medium mr-1 block">תוכן ההודעה</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        className="w-full h-32 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-sm text-white/90 focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.08] outline-none resize-none transition-all duration-300 placeholder:text-white/30"
                                        placeholder="מה תרצה לספר לנו?..."
                                    />
                                </div>

                                {/* Email (Optional) */}
                                <div className="space-y-2">
                                    <label className="text-xs text-white/40 font-medium mr-1 block">אימייל לחזרה (אופציונלי)</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-sm text-white/90 focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.08] outline-none transition-all duration-300 placeholder:text-white/30"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <PremiumButton
                                    type="submit"
                                    isLoading={isSending}
                                    variant="primary"
                                    className="w-full mt-2"
                                >
                                    שלח משוב
                                </PremiumButton>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

const TypeButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ isActive, onClick, icon, label }) => (
    <button
        type="button"
        onClick={onClick}
        className={`
            flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300
            ${isActive
                ? 'bg-white/[0.08] text-white'
                : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white/80'}
        `}
    >
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);

export default FeedbackModal;
