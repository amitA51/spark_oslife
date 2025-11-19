import React, { useState } from 'react';
import type { QuoteCategory } from '../types';

interface AddQuoteModalProps {
    onClose: () => void;
    onSave: (quoteData: { text: string; author: string; category: QuoteCategory; backgroundImage?: string }) => void;
}

const QUOTE_CATEGORIES: { value: QuoteCategory; label: string }[] = [
    { value: 'motivation', label: 'מוטיבציה' },
    { value: 'stoicism', label: 'סטואיות' },
    { value: 'tech', label: 'טכנולוגיה' },
    { value: 'success', label: 'הצלחה' },
    { value: 'action', label: 'פעולה' },
    { value: 'dreams', label: 'חלומות' },
    { value: 'perseverance', label: 'התמדה' },
    { value: 'beginning', label: 'התחלה' },
    { value: 'sacrifice', label: 'הקרבה' },
    { value: 'productivity', label: 'פרודוקטיביות' },
    { value: 'possibility', label: 'אפשרות' },
    { value: 'opportunity', label: 'הזדמנות' },
    { value: 'belief', label: 'אמונה' },
    { value: 'change', label: 'שינוי' },
    { value: 'passion', label: 'תשוקה' },
    { value: 'custom', label: 'מותאם אישית' },
];

const AddQuoteModal: React.FC<AddQuoteModalProps> = ({ onClose, onSave }) => {
    const [text, setText] = useState('');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState<QuoteCategory>('motivation');
    const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
    const [imageError, setImageError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            setImageError('התמונה גדולה מדי. גודל מקסימלי: 500KB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setImageError('יש להעלות קובץ תמונה בלבד');
            return;
        }

        setImageError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            setBackgroundImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !author.trim()) return;

        onSave({
            text: text.trim(),
            author: author.trim(),
            category,
            backgroundImage,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-screen-enter">
            <div className="themed-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">הוספת ציטוט חדש</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                        aria-label="סגור"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Quote Text */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            טקסט הציטוט *
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)] resize-none"
                            rows={4}
                            placeholder="הכנס את הציטוט כאן..."
                            required
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            מחבר *
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]"
                            placeholder="שם המחבר"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            קטגוריה
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as QuoteCategory)}
                            className="w-full px-4 py-3 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]"
                        >
                            {QUOTE_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Background Image */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            תמונת רקע (אופציונלי)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full px-4 py-3 bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--dynamic-accent-start)] file:text-black hover:file:brightness-110"
                        />
                        {imageError && (
                            <p className="mt-2 text-sm text-red-500">{imageError}</p>
                        )}
                        {backgroundImage && (
                            <div className="mt-3 relative rounded-lg overflow-hidden">
                                <img
                                    src={backgroundImage}
                                    alt="תצוגה מקדימה"
                                    className="w-full h-32 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setBackgroundImage(undefined)}
                                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                            גודל מקסימלי: 500KB. פורמטים נתמכים: JPG, PNG, WebP
                        </p>
                    </div>

                    {/* Preview */}
                    {text && (
                        <div className="p-4 bg-[var(--surface-tertiary)] rounded-lg border border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-tertiary)] mb-2">תצוגה מקדימה:</p>
                            <div className="relative rounded-lg overflow-hidden p-6" style={backgroundImage ? {
                                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            } : {}}>
                                <p className="text-base font-medium text-white mb-2">"{text}"</p>
                                <p className="text-sm text-white/80">— {author}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors font-medium"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={!text.trim() || !author.trim()}
                            className="flex-1 px-6 py-3 bg-[var(--accent-gradient)] text-black rounded-lg hover:brightness-110 transition-all font-bold shadow-[0_4px_15px_var(--dynamic-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            שמור ציטוט
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddQuoteModal;
