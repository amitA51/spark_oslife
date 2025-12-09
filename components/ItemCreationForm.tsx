import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import type {
  PersonalItem,
  Template,
  AddableType,
  Screen,
} from '../types';
import * as dataService from '../services/dataService';
import * as geminiService from '../services/geminiService';
import {
  FlameIcon,
  LinkIcon,
  ClipboardListIcon,
  BookOpenIcon,
  DumbbellIcon,
  TargetIcon,
  ChartBarIcon,
  CloseIcon,
  SparklesIcon,
  RoadmapIcon,
  CloudIcon,
  CheckCircleIcon,
} from './icons';
import { useDebounce } from '../hooks/useDebounce';
import LoadingSpinner from './LoadingSpinner';
import { useHaptics } from '../hooks/useHaptics';
import { MarkdownToolbar, AttachmentManager, inputStyles } from './details/common';
import DraggableModalWrapper from './DraggableModalWrapper';
import { HabitEdit as HabitEditComponent } from './details/HabitDetails';
import { useData } from '../src/contexts/DataContext';
import { useUI } from '../src/contexts/UIContext';
import { Toast } from './ui/Toast';

// Import extracted reducer and types
import {
  formReducer,
  createInitialState,
  type FormState as State,
} from './itemCreationFormReducer';

// Use createInitialState for the reducer
const initialState = createInitialState();

// formReducer is imported from ./itemCreationFormReducer

// --- Premium UI Enhancements ---

const AutoSaveIndicator: React.FC<{ status: 'idle' | 'saving' | 'saved' | 'error' }> = ({ status }) => {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 text-xs font-medium animate-in fade-in-0 slide-in-from-right-2 duration-300">
      {status === 'saving' && (
        <>
          <div className="w-3 h-3 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <span className="text-white/50">שומר...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CloudIcon className="w-4 h-4 text-green-400" />
          <span className="text-green-400/80">נשמר</span>
        </>
      )}
      {status === 'error' && (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400/80">שגיאה בשמירה</span>
        </>
      )}
    </div>
  );
};

const AISuggestionsPanel: React.FC<{
  itemType: AddableType;
  title: string;
  content: string;
  onSuggestionSelect: (suggestion: string, field: 'title' | 'content') => void;
  isVisible: boolean;
}> = ({ itemType, title, content, onSuggestionSelect, isVisible }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedTitle = useDebounce(title, 1000);

  useEffect(() => {
    if (debouncedTitle && debouncedTitle.length > 3 && isVisible) {
      setIsLoading(true);
      setSuggestions([
        `הוסף פרטים נוספים על "${debouncedTitle}"`,
        `הגדר תאריך יעד למשימה`,
        `חלק את זה לתתי-משימות`,
      ]);
      setIsLoading(false);
    }
  }, [debouncedTitle, itemType, isVisible]);

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-cyan-400">הצעות AI</span>
        {isLoading && <div className="w-3 h-3 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSuggestionSelect(suggestion, 'content')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 border border-white/5 hover:border-white/20"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

const KeyboardShortcutsHint: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'Enter'], action: 'שמור ושלח' },
    { keys: ['Cmd/Ctrl', 'S'], action: 'שמור טיוטה' },
    { keys: ['Escape'], action: 'סגור' },
    { keys: ['Tab'], action: 'שדה הבא' },
    { keys: ['Cmd/Ctrl', 'B'], action: 'הדגשה' },
    { keys: ['Cmd/Ctrl', 'I'], action: 'נטוי' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200" onClick={onClose}>
      <div
        className="bg-[#1a1d24]/95 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400">⌨️</span>
            קיצורי מקלדת
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map(({ keys, action }, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{action}</span>
              <div className="flex gap-1">
                {keys.map((key, i) => (
                  <kbd key={i} className="px-2 py-1 text-xs font-mono bg-white/10 rounded-md text-white/80 border border-white/20">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- Premium Input Styles ---
const premiumInputStyles = `
  w-full bg-black/30 text-white p-4 rounded-xl
  border border-white/10
  focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)]
  placeholder-white/30
  transition-all duration-300
  hover:border-white/20 hover:bg-black/40
  backdrop-blur-sm
`;

// --- Sub-components for form fields ---

const SimpleFormFields: React.FC<{
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  titlePlaceholder?: string;
  contentPlaceholder?: string;
  titleRequired?: boolean;
  contentRequired?: boolean;
  isSpark?: boolean;
}> = ({
  title,
  setTitle,
  content,
  setContent,
  titlePlaceholder = 'כותרת',
  contentPlaceholder = 'תוכן...',
  titleRequired = false,
  contentRequired = false,
  isSpark = false,
}) => {
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const handleInsert = (startSyntax: string, endSyntax: string = '') => {
      const textarea = contentRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      let newText;
      let selectionStart;
      let selectionEnd;

      if (selectedText) {
        newText = `${text.substring(0, start)}${startSyntax}${selectedText}${endSyntax}${text.substring(end)}`;
        selectionStart = start + startSyntax.length;
        selectionEnd = end + startSyntax.length;
      } else {
        newText = `${text.substring(0, start)}${startSyntax}${endSyntax}${text.substring(start)}`;
        selectionStart = start + startSyntax.length;
        selectionEnd = selectionStart;
      }

      setContent(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = selectionStart;
        textarea.selectionEnd = selectionEnd;
      }, 0);
    };

    return (
      <div className="space-y-6">
        <div className="group relative">
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-cyan-400">
            {titlePlaceholder}
          </label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              className={`${premiumInputStyles} text-lg font-bold pr-4`}
              required={titleRequired}
              autoFocus
            />
            {/* Character count indicator */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono">
              {title.length > 0 && `${title.length}/100`}
            </div>
          </div>
          {/* Title validation hint */}
          {title.length > 80 && (
            <p className="text-[10px] text-yellow-400/70 mt-1.5 animate-in fade-in-0 duration-200">
              הכותרת ארוכה - שקול לקצר לקריאות טובה יותר
            </p>
          )}
        </div>

        <div className="group relative">
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-cyan-400">
            {contentPlaceholder}
          </label>
          <div className="border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all duration-300 bg-black/20 hover:border-white/20 backdrop-blur-sm">
            <MarkdownToolbar onInsert={handleInsert} />
            <textarea
              ref={contentRef}
              dir="auto"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={contentPlaceholder}
              className="w-full bg-transparent text-white p-4 focus:outline-none resize-y min-h-[150px] placeholder-white/30 transition-all"
              required={contentRequired}
            />
            {/* Word count footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-t border-white/5">
              <span className="text-[10px] text-white/30 font-mono">
                {content.split(/\s+/).filter(Boolean).length} מילים
              </span>
              <span className="text-[10px] text-white/30">
                Markdown נתמך
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

const LinkFields: React.FC<{ url: string; setUrl: (v: string) => void; isFetching: boolean }> = ({
  url,
  setUrl,
  isFetching,
}) => (
  <div className="group">
    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-accent">
      כתובת URL
    </label>
    <div className="relative">
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com"
        className={`${inputStyles} pl-10`}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
        {isFetching ? (
          <LoadingSpinner className="w-5 h-5 text-[var(--dynamic-accent-start)]" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
      </div>
    </div>
    <p className="text-[10px] text-secondary mt-1.5 opacity-70 px-1">
      הכותרת והתוכן יתמלאו אוטומטית מתוך הקישור
    </p>
  </div>
);

const TaskFields: React.FC<{
  dueDate: string;
  setDueDate: (v: string) => void;
  dueTime?: string;
  setDueTime?: (v: string) => void;
  priority?: string;
  setPriority?: (v: any) => void;
}> = ({ dueDate, setDueDate, dueTime, setDueTime, priority, setPriority }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/5 p-4 rounded-xl border border-white/5">
    <div>
      <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
        תאריך יעד
      </label>
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className={inputStyles}
        style={{ colorScheme: 'dark' }}
      />
    </div>
    {setDueTime && (
      <div>
        <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
          שעה
        </label>
        <input
          type="time"
          value={dueTime || ''}
          onChange={e => setDueTime(e.target.value)}
          className={inputStyles}
          style={{ colorScheme: 'dark' }}
        />
      </div>
    )}
    {priority && setPriority && (
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
          עדיפות
        </label>
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
          {['low', 'medium', 'high'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${priority === p ? 'bg-white/10 text-white shadow-sm' : 'text-muted hover:text-secondary'}`}
            >
              {p === 'low' ? 'נמוכה' : p === 'medium' ? 'בינונית' : 'גבוהה'}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const BookFields: React.FC<{
  author: string;
  setAuthor: (v: string) => void;
  totalPages: string;
  setTotalPages: (v: string) => void;
}> = ({ author, setAuthor, totalPages, setTotalPages }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
      <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
        מחבר
      </label>
      <input
        type="text"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        className={inputStyles}
        placeholder="שם המחבר"
      />
    </div>
    <div>
      <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
        מספר עמודים
      </label>
      <input
        type="number"
        value={totalPages}
        onChange={e => setTotalPages(e.target.value)}
        className={inputStyles}
        placeholder="0"
      />
    </div>
  </div>
);

// --- Main Form Component ---

export const ItemCreationForm: React.FC<{
  itemType: AddableType;
  onClose: () => void;
  setActiveScreen: (screen: Screen) => void;
}> = ({ itemType, onClose, setActiveScreen }) => {
  const { spaces, addPersonalItem } = useData();
  const { setHasUnsavedChanges } = useUI();
  const [formState, dispatch] = useReducer(formReducer, initialState);
  const { triggerHaptic } = useHaptics();
  const [_templates, setTemplates] = useState<Template[]>([]);
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  // Debounced URL for metadata fetching
  const debouncedUrl = useDebounce(formState.url, 800);

  // Icon for the header
  const TypeIcon =
    {
      spark: SparklesIcon,
      task: CheckCircleIcon,
      note: ClipboardListIcon,
      link: LinkIcon,
      idea: SparklesIcon,
      habit: FlameIcon,
      book: BookOpenIcon,
      workout: DumbbellIcon,
      goal: TargetIcon,
      journal: ClipboardListIcon,
      learning: ClipboardListIcon,
      roadmap: RoadmapIcon,
      ticker: ChartBarIcon,
      gratitude: SparklesIcon,
    }[itemType] || SparklesIcon;

  const accentColor =
    {
      spark: 'var(--accent-start)',
      task: 'var(--success)',
      note: 'var(--warning)',
      link: '#60A5FA',
      idea: '#FBBF24',
      habit: '#F472B6',
      book: '#A78BFA',
      workout: '#F472B6',
      goal: '#2DD4BF',
      journal: '#F0ABFC',
      learning: '#38BDF8',
      roadmap: '#3B82F6',
      ticker: 'gray',
      gratitude: '#F59E0B',
    }[itemType] || 'var(--accent-start)';

  useEffect(() => {
    const fetchTemplates = async () => {
      const allTemplates = await dataService.getTemplates();
      setTemplates(allTemplates.filter(t => t.type === itemType));
    };
    fetchTemplates();

    // Check for pre-filled data (e.g., from calendar quick add)
    const defaults = sessionStorage.getItem('preselect_add_defaults');
    const sharedData = sessionStorage.getItem('sharedData');

    if (defaults) {
      try {
        const parsedDefaults = JSON.parse(defaults);
        Object.keys(parsedDefaults).forEach(key => {
          dispatch({
            type: 'SET_FIELD',
            payload: { field: key as keyof State, value: parsedDefaults[key] },
          });
        });
      } catch (e) {
        console.error('Error parsing defaults', e);
      }
      sessionStorage.removeItem('preselect_add_defaults');
    } else if (sharedData) {
      try {
        const { url, text, title } = JSON.parse(sharedData);
        if (url) dispatch({ type: 'SET_FIELD', payload: { field: 'url', value: url } });
        if (title) dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: title } });
        if (text) dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: text } });
      } catch (e) {
        console.error('Error parsing shared data', e);
      }
      sessionStorage.removeItem('sharedData');
    } else {
      dispatch({ type: 'RESET_FORM' }); // Reset if no defaults
    }
  }, [itemType]);

  // PERFORMANCE: Warn user about unsaved changes - use targeted key check instead of JSON.stringify
  const isDirty = useMemo(() => {
    // Only check key fields that indicate changes
    return formState.title !== '' ||
      formState.content !== '' ||
      formState.url !== '' ||
      formState.attachments.length > 0 ||
      formState.phases.some(p => p.title !== '') ||
      formState.exercises.some(e => e.name !== '');
  }, [formState.title, formState.content, formState.url, formState.attachments.length, formState.phases, formState.exercises]);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    if (debouncedUrl && itemType === 'link' && !formState.title) {
      const fetchMeta = async () => {
        dispatch({ type: 'SET_FIELD', payload: { field: 'isFetchingMetadata', value: true } });
        const meta = await geminiService.getUrlMetadata(debouncedUrl);
        dispatch({ type: 'SET_METADATA_RESULT', payload: meta });
      };
      fetchMeta();
    }
  }, [debouncedUrl, itemType, formState.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.submissionStatus === 'submitting') return;

    triggerHaptic('medium');
    dispatch({ type: 'SUBMIT_START' });

    try {
      if (itemType === 'ticker') {
        if (!tickerSymbol) return;
        await dataService.addToWatchlist(tickerSymbol);
        setActiveScreen('investments');
        onClose();
        return;
      }


      const newItemData: Omit<PersonalItem, 'id' | 'createdAt' | 'updatedAt'> = {
        type: itemType as PersonalItem['type'],
        title: formState.title,
        content: formState.content,
        spaceId: formState.spaceId || undefined,
        projectId: formState.projectId || undefined,
        icon: formState.icon || undefined,
        attachments: formState.attachments,
      };

      if (itemType === 'task') {
        newItemData.dueDate = formState.dueDate;
        newItemData.dueTime = formState.dueTime;
        newItemData.priority = formState.priority;
      } else if (itemType === 'note') {
        // Allow notes to have dates for reminders
        newItemData.dueDate = formState.dueDate;
        newItemData.dueTime = formState.dueTime;
      } else if (itemType === 'link') {
        newItemData.url = formState.url;
      } else if (itemType === 'book') {
        newItemData.author = formState.author;
        newItemData.totalPages = parseInt(formState.totalPages) || 0;
      } else if (itemType === 'workout') {
        newItemData.exercises = formState.exercises;
        newItemData.isActiveWorkout = true;
        newItemData.workoutStartTime = new Date().toISOString();
      } else if (itemType === 'roadmap') {
        newItemData.phases = formState.phases;
      } else if (itemType === 'habit') {
        newItemData.habitType = formState.habitType;
        newItemData.reminderEnabled = formState.reminderEnabled;
        newItemData.reminderTime = formState.reminderTime;
        // If bad habit, we initialize the counter with current time as the "start/clean" time
        if (formState.habitType === 'bad') {
          newItemData.lastCompleted = new Date().toISOString();
        }
      }

      await addPersonalItem(newItemData);


      // Navigate based on type
      if (itemType === 'workout') {
        // Stay on current screen, overlay will appear
      } else if (itemType === 'task' || itemType === 'habit') {
        setActiveScreen('today');
      } else {
        setActiveScreen('library');
      }
      onClose();
    } catch (error) {
      console.error('Error creating item:', error);
      showToast('שגיאה ביצירת הפריט');
    } finally {
      dispatch({ type: 'SUBMIT_DONE' });
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!formState.title) return;
    dispatch({ type: 'SET_FIELD', payload: { field: 'isGeneratingRoadmap', value: true } });
    try {
      const phases = await geminiService.generateRoadmap(formState.title);
      dispatch({ type: 'SET_GENERATED_PHASES', payload: phases });
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      showToast('שגיאה ביצירת מפת הדרכים');
      dispatch({ type: 'SET_FIELD', payload: { field: 'isGeneratingRoadmap', value: false } });
    }
  };

  const renderFormFields = () => {
    switch (itemType) {
      case 'ticker':
        return (
          <div>
            <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">
              סימול מניה / מטבע
            </label>
            <input
              type="text"
              value={tickerSymbol}
              onChange={e => setTickerSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL, BTC, ETH..."
              className={inputStyles + ' font-mono text-xl tracking-widest uppercase'}
              autoFocus
            />
          </div>
        );
      case 'link':
        return (
          <>
            <LinkFields
              url={formState.url}
              setUrl={v => dispatch({ type: 'SET_FIELD', payload: { field: 'url', value: v } })}
              isFetching={formState.isFetchingMetadata}
            />
            <SimpleFormFields
              title={formState.title}
              setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
              content={formState.content}
              setContent={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
              }
              titlePlaceholder="כותרת הקישור"
              contentPlaceholder="תיאור או הערות..."
              contentRequired={false}
            />
          </>
        );
      case 'task':
        return (
          <>
            <SimpleFormFields
              title={formState.title}
              setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
              content={formState.content}
              setContent={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
              }
              titlePlaceholder="מה צריך לעשות?"
              contentPlaceholder="פרטים נוספים..."
              contentRequired={false}
            />
            <TaskFields
              dueDate={formState.dueDate}
              setDueDate={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'dueDate', value: v } })
              }
              dueTime={formState.dueTime}
              setDueTime={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'dueTime', value: v } })
              }
              priority={formState.priority}
              setPriority={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'priority', value: v } })
              }
            />
          </>
        );
      case 'note':
        return (
          <>
            <SimpleFormFields
              title={formState.title}
              setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
              content={formState.content}
              setContent={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
              }
              titlePlaceholder="כותרת הפתק"
              contentPlaceholder="כתוב משהו..."
            />
            <div className="pt-6 border-t border-white/10 mt-6">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                תזכורת (אופציונלי)
              </p>
              <TaskFields
                dueDate={formState.dueDate}
                setDueDate={v =>
                  dispatch({ type: 'SET_FIELD', payload: { field: 'dueDate', value: v } })
                }
                dueTime={formState.dueTime}
                setDueTime={v =>
                  dispatch({ type: 'SET_FIELD', payload: { field: 'dueTime', value: v } })
                }
              // No priority for notes
              />
            </div>
          </>
        );
      case 'book':
        return (
          <>
            <SimpleFormFields
              title={formState.title}
              setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
              content={formState.content}
              setContent={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
              }
              titlePlaceholder="שם הספר"
              contentPlaceholder="תקציר או הערות..."
              contentRequired={false}
            />
            <BookFields
              author={formState.author}
              setAuthor={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'author', value: v } })
              }
              totalPages={formState.totalPages}
              setTotalPages={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'totalPages', value: v } })
              }
            />
          </>
        );
      case 'workout':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 text-center space-y-8 animate-fade-in">
            {/* Premium Hero Section */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-br from-pink-500/40 to-purple-600/40 blur-2xl" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 ring-2 ring-white/10">
                <DumbbellIcon className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white">אימון חדש</h3>
              <p className="text-white/50 max-w-xs mx-auto text-sm leading-relaxed">
                התחל אימון לייב מיד. תוכל להוסיף תרגילים תוך כדי תנועה.
              </p>
            </div>

            <div className="w-full max-w-sm text-right px-2">
              <SimpleFormFields
                title={formState.title}
                setTitle={v =>
                  dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })
                }
                content={formState.content}
                setContent={v =>
                  dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
                }
                titlePlaceholder="שם האימון (אופציונלי)"
                contentPlaceholder="הערות..."
                contentRequired={false}
              />
            </div>

            <button
              type="submit"
              className="w-full max-w-sm py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl font-bold text-white text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 ring-1 ring-white/20"
            >
              <span>התחל אימון עכשיו</span>
              <span className="text-xl">⚡</span>
            </button>
          </div>
        );
      case 'roadmap':
        // Simplified visual for roadmap creation - just title and optional generation
        return (
          <div className="space-y-6">
            <SimpleFormFields
              title={formState.title}
              setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
              content={formState.content}
              setContent={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
              }
              titlePlaceholder="שם היעד / הפרויקט"
              contentPlaceholder="תיאור כללי של המטרה..."
              contentRequired={false}
            />
            <div className="flex items-center justify-between bg-gradient-to-r from-[var(--dynamic-accent-start)]/20 to-[var(--dynamic-accent-end)]/20 p-5 rounded-xl border border-[var(--dynamic-accent-start)]/30 shadow-lg shadow-[var(--dynamic-accent-start)]/10">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2 text-lg">
                  <SparklesIcon className="w-5 h-5 text-accent" /> צור מפת דרכים עם AI
                </h4>
                <p className="text-xs text-secondary mt-1">
                  AI יפרק את המטרה לשלבים מעשיים באופן אוטומטי
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={formState.isGeneratingRoadmap || !formState.title}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border border-white/10 disabled:opacity-50 shadow-sm"
              >
                {formState.isGeneratingRoadmap ? 'מייצר...' : 'צור עכשיו'}
              </button>
            </div>
            {formState.phases.length > 1 && (
              <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-sm font-bold text-secondary mb-3">
                  שלבים שנוצרו ({formState.phases.length}):
                </p>
                {formState.phases.map((phase, i) => (
                  <div
                    key={phase.id}
                    className="text-sm bg-white/5 p-3 rounded-lg flex justify-between items-center border border-white/5"
                  >
                    <span className="font-medium">
                      {i + 1}. {phase.title}
                    </span>
                    <span className="text-xs text-muted bg-black/30 px-2 py-1 rounded">
                      {phase.duration}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'habit':
        return (
          <>
            <SimpleFormFields
              title={formState.title}
              setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
              content={formState.content}
              setContent={v =>
                dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
              }
              titlePlaceholder="שם ההרגל"
              contentPlaceholder="תיאור ההרגל..."
              contentRequired={false}
            />
            <HabitEditComponent editState={formState as any} dispatch={dispatch as any} />
          </>
        );
      default:
        return (
          <SimpleFormFields
            title={formState.title}
            setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
            content={formState.content}
            setContent={v =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })
            }
            isSpark={itemType === 'spark'}
            titlePlaceholder={itemType === 'spark' ? 'נושא הספארק' : 'כותרת'}
          />
        );
    }
  };

  const typeLabel =
    {
      spark: 'ספארק',
      task: 'משימה',
      note: 'פתק',
      link: 'קישור',
      idea: 'רעיון',
      habit: 'הרגל',
      book: 'ספר',
      workout: 'אימון',
      goal: 'פרויקט',
      journal: 'יומן',
      learning: 'למידה',
      roadmap: 'מפת דרכים',
      ticker: 'מניה/מטבע',
      gratitude: 'הכרת תודה',
    }[itemType] || itemType;

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAISuggestions] = useState(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Auto-save functionality
  const debouncedFormState = useDebounce(formState, 2000);

  useEffect(() => {
    if (debouncedFormState.title || debouncedFormState.content) {
      setAutoSaveStatus('saving');
      const draftKey = `draft_${itemType}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify(debouncedFormState));
        setTimeout(() => setAutoSaveStatus('saved'), 500);
        setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } catch (error) {
        setAutoSaveStatus('error');
      }
    }
  }, [debouncedFormState, itemType]);

  // Load draft on mount
  useEffect(() => {
    const draftKey = `draft_${itemType}`;
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title || parsed.content) {
          Object.keys(parsed).forEach(key => {
            if (parsed[key]) {
              dispatch({ type: 'SET_FIELD', payload: { field: key as keyof State, value: parsed[key] } });
            }
          });
        }
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, [itemType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clear draft on successful submit
  const clearDraft = useCallback(() => {
    const draftKey = `draft_${itemType}`;
    localStorage.removeItem(draftKey);
  }, [itemType]);

  return (
    <>
      <KeyboardShortcutsHint isVisible={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />

      <DraggableModalWrapper
        onClose={onClose}
        className={`
          bg-gradient-to-br from-[#1a1d24]/98 via-[#12141a]/98 to-[#0a0c10]/98
          w-full 
          ${itemType === 'workout' ? 'h-auto max-h-[90dvh] rounded-t-[32px] sm:rounded-2xl' : 'h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl'}
          md:w-[90vw] md:max-w-2xl
          shadow-2xl shadow-black/50
          flex flex-col 
          border-0 sm:border border-white/10 
          will-change-[transform,opacity]
          overflow-hidden
        `}
      >
        {/* Premium Header with Glow - Simplified for workout */}
        {itemType === 'workout' ? (
          <header className="relative px-4 pt-safe-top py-3 shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="p-2.5 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-90"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </header>
        ) : (
          <header className="relative px-4 pt-safe-top py-3 sm:px-6 sm:py-4 shrink-0 overflow-hidden">
            {/* Subtle gradient background - reduced for performance */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-violet-500/3 pointer-events-none" />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl pointer-events-none opacity-20 hidden sm:block"
              style={{ backgroundColor: accentColor }}
            />

            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-4">
                {/* Premium Icon Container - Smaller on mobile */}
                <div
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/20 overflow-hidden"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <TypeIcon className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" style={{ color: accentColor }} />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    הוספת {typeLabel}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/50 font-medium mt-0.5 hidden sm:block">הזן את הפרטים למטה</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Auto-save indicator */}
                <AutoSaveIndicator status={autoSaveStatus} />

                {/* Keyboard shortcuts button */}
                <button
                  type="button"
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="p-2 bg-white/5 rounded-xl text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
                  title="קיצורי מקלדת (Cmd+/)"
                >
                  <span className="text-sm">⌨️</span>
                </button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2.5 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-90"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>
        )}

        <form onSubmit={(e) => { handleSubmit(e); clearDraft(); }} className="flex flex-col flex-1 overflow-hidden relative">
          <div className={`flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-5 sm:space-y-6 custom-scrollbar overscroll-contain ${itemType === 'workout' ? 'pb-6' : 'pb-28 sm:pb-24'}`}>
            {renderFormFields()}

            {/* AI Suggestions Panel */}
            {['task', 'note', 'idea', 'spark'].includes(itemType) && (
              <AISuggestionsPanel
                itemType={itemType}
                title={formState.title}
                content={formState.content}
                onSuggestionSelect={(suggestion, field) => {
                  dispatch({ type: 'SET_FIELD', payload: { field, value: field === 'content' ? formState.content + '\n' + suggestion : suggestion } });
                  triggerHaptic('light');
                }}
                isVisible={showAISuggestions && formState.title.length > 3}
              />
            )}

            {itemType !== 'ticker' && itemType !== 'workout' && (
              <>
                <div className="group">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-cyan-400">
                    שיוך למרחב
                  </label>
                  <select
                    value={formState.spaceId}
                    onChange={e =>
                      dispatch({
                        type: 'SET_FIELD',
                        payload: { field: 'spaceId', value: e.target.value },
                      })
                    }
                    className={premiumInputStyles}
                  >
                    <option value="">ללא מרחב</option>
                    {spaces
                      .filter(s => s.type === 'personal')
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <AttachmentManager
                  attachments={formState.attachments}
                  onAttachmentsChange={atts =>
                    dispatch({ type: 'SET_FIELD', payload: { field: 'attachments', value: atts } })
                  }
                />
              </>
            )}
          </div>

          {/* Premium Sticky Footer */}
          {itemType !== 'workout' && (
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#1a1d24]/95 backdrop-blur-md fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-0 w-full z-20 md:relative md:rounded-b-2xl safe-area-bottom">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Secondary action - Save as draft (hidden on mobile to save space) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAutoSaveStatus('saving');
                    const draftKey = `draft_${itemType}`;
                    localStorage.setItem(draftKey, JSON.stringify(formState));
                    setTimeout(() => setAutoSaveStatus('saved'), 300);
                  }}
                  className="hidden sm:flex px-4 h-12 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold rounded-xl transition-all border border-white/10 hover:border-white/20 items-center justify-center"
                >
                  שמור טיוטה
                </button>

                {/* Primary submit button */}
                <button
                  type="submit"
                  disabled={formState.submissionStatus === 'submitting'}
                  className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-base sm:text-lg rounded-xl transition-colors transform active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formState.submissionStatus === 'submitting' ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <span>שמור פריט</span>
                      <span className="text-white/50 text-xs hidden sm:inline">⌘+Enter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

      </DraggableModalWrapper >
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onDismiss={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
};

export default ItemCreationForm;
