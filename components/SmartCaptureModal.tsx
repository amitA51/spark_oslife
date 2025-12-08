import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import * as geminiService from '../services/geminiService';
import {
  CloseIcon,
  SparklesIcon,
  CheckCircleIcon,
  LightbulbIcon,
  ClipboardListIcon,
  FlameIcon,
} from './icons';
import type { NlpResult, PersonalItemType, Screen } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { useHaptics } from '../hooks/useHaptics';
import { StatusMessageType } from './StatusMessage';
import DraggableModalWrapper from './DraggableModalWrapper';
import { useData } from '../src/contexts/DataContext';
import { useUI } from '../src/contexts/UIContext';

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveScreen: (screen: Screen) => void;
  showStatus: (type: StatusMessageType, text: string) => void;
}

const typeMap: Record<string, { icon: React.ReactNode; label: string }> = {
  task: { icon: <CheckCircleIcon className="w-4 h-4 text-[var(--success)]" />, label: 'משימה' },
  note: { icon: <ClipboardListIcon className="w-4 h-4 text-[var(--warning)]" />, label: 'פתק' },
  idea: { icon: <LightbulbIcon className="w-4 h-4 text-blue-400" />, label: 'רעיון' },
  habit: { icon: <FlameIcon className="w-4 h-4 text-pink-400" />, label: 'הרגל' },
};

const SmartCaptureModal: React.FC<SmartCaptureModalProps> = ({
  isOpen,
  onClose,
  setActiveScreen,
  showStatus,
}) => {
  const { personalItems, spaces, addPersonalItem } = useData();
  const { setHasUnsavedChanges } = useUI();
  const { triggerHaptic } = useHaptics();
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 500);
  const [aiSuggestion, setAiSuggestion] = useState<NlpResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (debouncedValue.length < 5) {
      setAiSuggestion(null);
      return;
    }

    const analyze = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await geminiService.smartParseInput(debouncedValue, spaces, personalItems);
        setAiSuggestion(result);
      } catch (e) {
        console.error('Smart parse failed:', e);
        setError('שגיאה בניתוח הטקסט.');
      } finally {
        setIsLoading(false);
      }
    };

    analyze();
  }, [debouncedValue, spaces, personalItems]);

  // Warn about unsaved changes
  useEffect(() => {
    const hasChanges = !!inputValue.trim();
    setHasUnsavedChanges(hasChanges);
    // This component unmounts on close, so its cleanup will run.
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [inputValue, setHasUnsavedChanges]);

  const handleCreate = async () => {
    if (!aiSuggestion) return;
    triggerHaptic('heavy');

    try {
      const newItemData: any = {
        type: aiSuggestion.type as PersonalItemType,
        title: aiSuggestion.title,
        content: '',
        spaceId: aiSuggestion.suggestedSpaceId,
      };
      if (aiSuggestion.type === 'task') {
        newItemData.dueDate = aiSuggestion.dueDate;
        newItemData.priority = aiSuggestion.priority || 'medium';
      }
      if (aiSuggestion.type === 'habit') {
        newItemData.frequency = 'daily';
      }

      const newItem = await addPersonalItem(newItemData as any);

      showStatus('success', 'הפריט נוצר בהצלחה!');
      onClose();
      setActiveScreen(newItem.type === 'task' ? 'today' : 'library');
    } catch (e) {
      console.error('Failed to create item from smart capture:', e);
      showStatus('error', 'שגיאה ביצירת הפריט.');
    }
  };

  const suggestedSpace = aiSuggestion?.suggestedSpaceId
    ? spaces.find(s => s.id === aiSuggestion.suggestedSpaceId)
    : null;

  return (
    <DraggableModalWrapper
      onClose={onClose}
      className="w-[95vw] max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[var(--border-primary)] flex flex-col animate-scale-in"
    >
      <div className="p-4 flex justify-between items-center border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-[var(--dynamic-accent-highlight)]" />
          <h2 className="text-xl font-bold text-white">לכידה חכמה</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-full text-muted hover:bg-white/10">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="כתוב משימה, רעיון, או פתק... גרור את החלון כדי לראות את הרקע."
          className="w-full h-32 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3 text-lg text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)] resize-none"
          autoFocus
        />
      </div>

      <div className="p-4 min-h-[120px] border-t border-[var(--border-primary)]">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted">
            <LoadingSpinner className="w-5 h-5" />
            <p>AI חושב...</p>
          </div>
        )}
        {error && <p className="text-center text-red-400">{error}</p>}

        {!isLoading && aiSuggestion && (
          <div className="space-y-3 animate-item-enter-fi">
            <p className="text-sm font-semibold text-muted">הצעה:</p>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] space-y-2">
              <p className="font-bold text-white text-lg">{aiSuggestion.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {typeMap[aiSuggestion.type] && (
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-full font-medium">
                    {typeMap[aiSuggestion.type]?.icon}
                    {typeMap[aiSuggestion.type]?.label}
                  </span>
                )}
                {aiSuggestion.dueDate && (
                  <span className="px-2 py-1 bg-black/30 rounded-full">
                    🗓️ {new Date(aiSuggestion.dueDate).toLocaleDateString('he-IL')}
                  </span>
                )}
                {suggestedSpace && (
                  <span
                    className="px-2 py-1 bg-black/30 rounded-full"
                    style={{ color: suggestedSpace.color }}
                  >
                    ● {suggestedSpace.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-primary)] flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] text-white font-semibold"
        >
          ביטול
        </button>
        <button
          onClick={handleCreate}
          disabled={!aiSuggestion}
          className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-gradient)] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          צור
        </button>
      </div>
    </DraggableModalWrapper>
  );
};

export default SmartCaptureModal;
