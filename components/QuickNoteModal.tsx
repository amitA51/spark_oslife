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
      className="w-[95vw] max-w-md bg-[var(--bg-card)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-[var(--border-primary)] overflow-hidden animate-scale-in"
    >
      <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
        <h3 className="font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[var(--dynamic-accent-highlight)]" />
          פתק ל-{new Date(date).toLocaleDateString('he-IL')}
        </h3>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white">
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
            className="w-full bg-transparent text-lg font-bold text-white placeholder:text-muted focus:outline-none border-b border-[var(--border-primary)] focus:border-[var(--dynamic-accent-start)] pb-2 transition-colors"
            required
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="תוכן (אופציונלי)..."
            rows={4}
            className="w-full bg-[var(--bg-secondary)]/50 rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-muted focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
          <StopwatchIcon className="w-5 h-5 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">שעת תזכורת:</span>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="bg-transparent text-white font-mono focus:outline-none ml-auto"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="w-full bg-[var(--accent-gradient)] text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_var(--dynamic-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95"
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
