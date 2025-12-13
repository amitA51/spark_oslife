import React, { useState, useEffect, useRef } from 'react';

import { CloseIcon, CheckCircleIcon, CalendarIcon, StopwatchIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { useHaptics } from '../hooks/useHaptics';
import DraggableModalWrapper from './DraggableModalWrapper';
import { useUI } from '../src/contexts/UIContext';
import { useData } from '../src/contexts/DataContext';

interface QuickNoteModalProps {
  date: string; // YYYY-MM-DD
  onClose: () => void;
}

const QuickNoteModal: React.FC<QuickNoteModalProps> = ({ date, onClose }) => {
  const { triggerHaptic } = useHaptics();
  const { setHasUnsavedChanges } = useUI();
  const { addPersonalItem } = useData();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [time, setTime] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Warn about unsaved changes
  useEffect(() => {
    const hasChanges = !!(title.trim() || content.trim());
    setHasUnsavedChanges(hasChanges);
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [title, content, setHasUnsavedChanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await addPersonalItem({
        type: 'note',
        title: title.trim(),
        content: content.trim(),
        dueDate: date,
        dueTime: time,
      } as any);

      onClose();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('שגיאה בשמירת הפתק');
      setIsSubmitting(false);
    }
  };

  return (
    <DraggableModalWrapper
      onClose={onClose}
      className="w-[95vw] max-w-md bg-[rgba(12,12,18,0.95)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/[0.06] overflow-hidden animate-scale-in backdrop-blur-xl"
    >
      <div className="p-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.02]">
        <h3 className="font-bold text-white/90 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[var(--dynamic-accent-highlight)]" />
          פתק ל-{new Date(date).toLocaleDateString('he-IL')}
        </h3>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors duration-300">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="כותרת הפתק..."
            className="w-full bg-transparent text-lg font-bold text-white placeholder:text-white/30 focus:outline-none border-b border-white/[0.06] focus:border-white/[0.15] pb-2 transition-all duration-300"
            required
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="תוכן (אופציונלי)..."
            rows={4}
            className="w-full bg-white/[0.02] rounded-xl p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/[0.08] resize-none border border-white/[0.04] transition-all duration-300"
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
          <StopwatchIcon className="w-5 h-5 text-white/40" />
          <span className="text-sm text-white/50">שעת תזכורת:</span>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="bg-transparent text-white/90 font-mono focus:outline-none ml-auto"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="w-full bg-gradient-to-br from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] text-white font-bold py-3 rounded-xl shadow-lg shadow-[var(--dynamic-accent-glow)]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              שמור פתק
            </>
          )}
        </button>
      </form>
    </DraggableModalWrapper>
  );
};

export default QuickNoteModal;
