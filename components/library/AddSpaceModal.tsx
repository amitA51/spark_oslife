import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Space } from '../../types';
import { XIcon, CheckIcon } from '../icons';

interface AddSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (space: Omit<Space, 'id'>) => Promise<void>;
}

// Premium icon options
const ICON_OPTIONS = [
    { icon: '📁', label: 'תיקייה' },
    { icon: '🎯', label: 'מטרה' },
    { icon: '💡', label: 'רעיונות' },
    { icon: '📚', label: 'למידה' },
    { icon: '💼', label: 'עבודה' },
    { icon: '💰', label: 'כספים' },
    { icon: '❤️', label: 'אישי' },
    { icon: '🏠', label: 'בית' },
    { icon: '✈️', label: 'טיולים' },
    { icon: '🎨', label: 'יצירה' },
    { icon: '🧘', label: 'בריאות' },
    { icon: '🔬', label: 'מחקר' },
    { icon: '📱', label: 'טכנולוגיה' },
    { icon: '📝', label: 'רשימות' },
    { icon: '🎵', label: 'מוזיקה' },
    { icon: '🌟', label: 'חלומות' },
];

// Premium color palette
const COLOR_OPTIONS = [
    { color: '#A78BFA', label: 'סגול' },
    { color: '#38BDF8', label: 'תכלת' },
    { color: '#10B981', label: 'ירוק' },
    { color: '#F59E0B', label: 'כתום' },
    { color: '#EF4444', label: 'אדום' },
    { color: '#EC4899', label: 'ורוד' },
    { color: '#6366F1', label: 'אינדיגו' },
    { color: '#14B8A6', label: 'טורקיז' },
];

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        filter: 'blur(8px)',
        transition: { duration: 0.2 },
    },
};

const AddSpaceModal: React.FC<AddSpaceModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]!.icon);
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]!.color);
    const [selectedCategory, setSelectedCategory] = useState<string>('אישי');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd({
                name: name.trim(),
                icon: selectedIcon,
                color: selectedColor,
                type: 'personal',
                category: selectedCategory,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                order: Date.now(), // Will be sorted properly
            });
            // Reset form
            setName('');
            setSelectedIcon(ICON_OPTIONS[0]!.icon);
            setSelectedColor(COLOR_OPTIONS[0]!.color);
            onClose();
        } catch (error) {
            console.error('Failed to create space:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [name, selectedIcon, selectedColor, isSubmitting, onAdd, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [handleSubmit, onClose, name]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-lg"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md rounded-3xl overflow-hidden"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            background: 'linear-gradient(135deg, rgba(12,12,18,0.98) 0%, rgba(8,8,14,0.98) 100%)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                            <h2 className="text-xl font-bold text-white/90 font-heading">
                                מרחב חדש
                            </h2>
                            <motion.button
                                onClick={onClose}
                                className="p-2 rounded-xl transition-colors text-white/40 hover:text-white"
                                style={{ background: 'rgba(255,255,255,0.03)' }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <XIcon className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-6">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    שם המרחב
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="הזן שם..."
                                    autoFocus
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all"
                                />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    אייקון
                                </label>
                                <div className="grid grid-cols-8 gap-2">
                                    {ICON_OPTIONS.map(({ icon }) => (
                                        <motion.button
                                            key={icon}
                                            onClick={() => setSelectedIcon(icon)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${selectedIcon === icon
                                                ? 'ring-2 ring-white/40'
                                                : 'hover:bg-white/10'
                                                }`}
                                            style={{
                                                background:
                                                    selectedIcon === icon
                                                        ? `${selectedColor}30`
                                                        : 'rgba(255,255,255,0.05)',
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {icon}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    קטגוריה
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['אישי', 'עבודה', 'לימודים', 'פרויקטים', 'אחר'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat
                                                ? 'bg-white text-black'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    תגיות (מופרדות בפסיק)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="דחוף, בבית, רעיונות..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all text-sm"
                                />
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    צבע
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLOR_OPTIONS.map(({ color }) => (
                                        <motion.button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-10 h-10 rounded-xl transition-all ${selectedColor === color
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a24]'
                                                : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <p className="text-xs text-gray-500 mb-2">תצוגה מקדימה</p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: `${selectedColor}25` }}
                                    >
                                        {selectedIcon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">
                                            {name || 'שם המרחב'}
                                        </p>
                                        <p className="text-xs text-gray-500">0 פריטים</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/[0.04] flex gap-3">
                            <motion.button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-medium text-gray-400 transition-colors"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                                whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.98 }}
                            >
                                ביטול
                            </motion.button>
                            <motion.button
                                onClick={handleSubmit}
                                disabled={!name.trim() || isSubmitting}
                                className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
                                    boxShadow: `0 8px 24px ${selectedColor}40`,
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSubmitting ? (
                                    <motion.div
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                ) : (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        צור מרחב
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddSpaceModal;
