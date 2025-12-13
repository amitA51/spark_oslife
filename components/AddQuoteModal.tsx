import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { QuoteCategory } from '../types';
import { CloseIcon, UploadIcon, AlertIcon, WifiOffIcon } from './icons';
import { PremiumButton, PremiumInput, PremiumTextarea } from './premium/PremiumComponents';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// Character limits matching backend validation
const MAX_QUOTE_TEXT_LENGTH = 500;
const MAX_QUOTE_AUTHOR_LENGTH = 100;

interface AddQuoteModalProps {
  onClose: () => void;
  onSave: (quoteData: {
    text: string;
    author: string;
    category: QuoteCategory;
    backgroundImage?: string;
  }) => void;
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
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Network status for offline warning
  const { isOnline } = useNetworkStatus();

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 400); // Match exit animation duration
  }, [onClose]);

  // Ref for focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, {
    isOpen: isVisible,
    onClose: handleClose,
    closeOnEscape: true,
    closeOnClickOutside: true, // This allows the hook to handle backdrop clicks
    restoreFocus: true,
  });

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB - increased from 500KB for better quality)
    if (file.size > 2 * 1024 * 1024) {
      setImageError('התמונה גדולה מדי. גודל מקסימלי: 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('יש להעלות קובץ תמונה בלבד');
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = event => {
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
    handleClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-slow ease-out-expo
        ${isVisible ? 'bg-cosmos-black/60 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-quote-title"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl transition-all duration-slow ease-spring-soft
          ${isVisible && !isClosing
            ? 'opacity-100 translate-y-0 scale-100 blur-0'
            : 'opacity-0 translate-y-8 scale-95 blur-sm'}`}
      >
        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-cosmos-depth/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl" />

        {/* Content Layer */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="add-quote-title" className="text-3xl font-heading font-bold text-white tracking-tight">
                הוספת ציטוט
              </h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">צור השראה חדשה למסע שלך</p>
            </div>
            <PremiumButton
              onClick={handleClose}
              variant="ghost"
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white group"
              aria-label="סגור"
            >
              <CloseIcon className="w-6 h-6 transition-transform duration-base ease-spring-soft group-hover:rotate-90" />
            </PremiumButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Offline Warning */}
            {!isOnline && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <WifiOffIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">אתה במצב אופליין. הציטוט יישמר מקומית ויסונכרן כשהחיבור יחזור.</span>
              </div>
            )}

            {/* Quote Text */}
            <div className="space-y-1">
              <PremiumTextarea
                label="טקסט הציטוט"
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_QUOTE_TEXT_LENGTH))}
                required
                className="h-32"
                maxLength={MAX_QUOTE_TEXT_LENGTH}
              />
              <div className={`text-xs text-left ${text.length > MAX_QUOTE_TEXT_LENGTH * 0.9 ? 'text-amber-400' : 'text-gray-500'}`}>
                {text.length}/{MAX_QUOTE_TEXT_LENGTH}
              </div>
            </div>

            {/* Author */}
            <div className="space-y-1">
              <PremiumInput
                label="מחבר"
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value.slice(0, MAX_QUOTE_AUTHOR_LENGTH))}
                required
                maxLength={MAX_QUOTE_AUTHOR_LENGTH}
              />
              <div className={`text-xs text-left ${author.length > MAX_QUOTE_AUTHOR_LENGTH * 0.9 ? 'text-amber-400' : 'text-gray-500'}`}>
                {author.length}/{MAX_QUOTE_AUTHOR_LENGTH}
              </div>
            </div>

            {/* Category */}
            <div className="relative space-y-2">
              <label className="block text-xs font-bold text-accent-cyan uppercase tracking-wider ml-1">
                קטגוריה
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as QuoteCategory)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-cyan/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors font-medium"
                >
                  {QUOTE_CATEGORIES.map(cat => (
                    <option
                      key={cat.value}
                      value={cat.value}
                      className="bg-cosmos-depth text-white"
                    >
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Background Image */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-accent-cyan uppercase tracking-wider ml-1">
                תמונת רקע
              </label>
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center transition-all duration-base ease-spring-soft group-hover:border-accent-cyan/50 group-hover:bg-white/5 overflow-hidden ${backgroundImage ? 'border-none p-0' : ''}`}
                >
                  {backgroundImage ? (
                    <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-slow">
                      <img
                        src={backgroundImage}
                        alt="תצוגה מקדימה"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-base backdrop-blur-sm">
                        <span className="text-white text-sm font-medium flex items-center gap-2">
                          <UploadIcon className="w-4 h-4" />
                          לחץ להחלפה
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-base ease-spring-soft text-gray-400 group-hover:text-accent-cyan">
                        <UploadIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors font-medium">
                        העלה תמונה
                      </span>
                    </>
                  )}
                </div>
              </div>
              {imageError && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1 font-medium animate-shake">
                  <AlertIcon className="w-3 h-3" />
                  {imageError}
                </p>
              )}
            </div>

            {/* Live Preview */}
            {text && (
              <div className="space-y-2 animate-fade-in">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  תצוגה מקדימה
                </label>
                <div
                  className="relative rounded-2xl overflow-hidden p-8 transition-all duration-slow transform hover:scale-[1.02] shadow-lg"
                  style={
                    backgroundImage
                      ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                      : {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }
                  }
                >
                  {!backgroundImage && <div className="absolute inset-0 bg-noise-pattern opacity-[0.03] mix-blend-overlay" />}

                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <span className="text-lg leading-none mt-1">❝</span>
                    </div>
                  </div>

                  <p className="text-xl font-heading font-medium text-white mb-4 leading-relaxed relative z-10 drop-shadow-md">
                    "{text}"
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-accent-cyan rounded-full"></div>
                    <p className="text-sm text-white/90 font-bold tracking-wide uppercase drop-shadow-sm">
                      {author}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <PremiumButton
                type="button"
                onClick={handleClose}
                variant="ghost"
                className="flex-1 border border-white/10"
              >
                ביטול
              </PremiumButton>
              <PremiumButton
                type="submit"
                disabled={!text.trim() || !author.trim()}
                variant="primary"
                className="flex-1 shadow-glow-cyan hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]"
              >
                שמור השראה
              </PremiumButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddQuoteModal;
