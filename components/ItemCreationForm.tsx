


import React, { useState, useEffect, useReducer, useContext, useRef } from 'react';
import type { Tag, PersonalItem, Exercise, Template, ItemType, PersonalItemType, WorkoutSet, Space, AddableType, Screen, RoadmapPhase, Attachment, FeedItem } from '../types';
import * as dataService from '../services/dataService';
import * as geminiService from '../services/geminiService';
import {
    FlameIcon, CheckCircleIcon, LinkIcon, ClipboardListIcon, BookOpenIcon,
    DumbbellIcon, TemplateIcon, TrashIcon, AddIcon, TargetIcon, ChartBarIcon, CloseIcon, SparklesIcon, RoadmapIcon
} from './icons';
import { AppContext } from '../state/AppContext';
import StatusMessage, { StatusMessageType } from './StatusMessage';
import { useDebounce } from '../hooks/useDebounce';
import { getIconForName } from './IconMap';
import { AVAILABLE_ICONS } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { useHaptics } from '../hooks/useHaptics';
import { MarkdownToolbar, AttachmentManager, inputStyles, smallInputStyles } from './details/common';
import DraggableModalWrapper from './DraggableModalWrapper';
// Import HabitEdit from HabitDetails because it contains custom logic now
import { HabitEdit as HabitEditComponent } from './details/HabitDetails';

// --- Reducer for Complex State Management ---
type SubmissionStatus = 'idle' | 'submitting';

interface State {
    title: string;
    content: string;
    url: string;
    dueDate: string;
    dueTime: string; // Added dueTime to state
    priority: 'low' | 'medium' | 'high';
    author: string;
    totalPages: string;
    exercises: Exercise[];
    phases: RoadmapPhase[];
    attachments: Attachment[];
    icon: string;
    projectId: string;
    spaceId: string;
    isFetchingMetadata: boolean;
    submissionStatus: SubmissionStatus;
    status?: 'todo' | 'doing' | 'done';
    isGeneratingRoadmap: boolean;
    // Habit specific
    habitType: 'good' | 'bad';
    reminderEnabled: boolean;
    reminderTime: string;
    // Compatibility fields for HabitEdit
    subTasks: any[]; // Using any[] to avoid complex type issues for now, or SubTask[] if imported
    quotes: string[];
    autoDeleteAfter: number;
}

type Action =
    | { type: 'SET_FIELD'; payload: { field: keyof State; value: any } }
    | { type: 'ADD_EXERCISE' }
    | { type: 'UPDATE_EXERCISE'; payload: { index: number; name: string } }
    | { type: 'REMOVE_EXERCISE'; payload: { index: number } }
    | { type: 'ADD_SET'; payload: { exerciseIndex: number } }
    | { type: 'UPDATE_SET'; payload: { exerciseIndex: number; setIndex: number; field: keyof WorkoutSet; value: any } }
    | { type: 'REMOVE_SET'; payload: { exerciseIndex: number; setIndex: number } }
    | { type: 'ADD_PHASE' }
    | { type: 'UPDATE_PHASE'; payload: { index: number; field: keyof Omit<RoadmapPhase, 'isCompleted' | 'id' | 'notes' | 'tasks' | 'order'>; value: string } }
    | { type: 'REMOVE_PHASE'; payload: { index: number } }
    | { type: 'APPLY_TEMPLATE'; payload: Template }
    | { type: 'SET_METADATA_RESULT'; payload: Partial<PersonalItem> }
    | { type: 'RESET_FORM' }
    | { type: 'SUBMIT_START' }
    | { type: 'SUBMIT_DONE' }
    | { type: 'SET_GENERATED_PHASES'; payload: Omit<RoadmapPhase, 'id' | 'order' | 'notes'>[] };

const initialState: State = {
    title: '',
    content: '',
    url: '',
    dueDate: '',
    dueTime: '', // Initial state
    priority: 'medium',
    author: '',
    totalPages: '',
    exercises: [{ id: `ex-${Date.now()}`, name: '', sets: [{ reps: 0, weight: 0, notes: '' }] }],
    phases: [{ id: `phase-${Date.now()}`, title: '', description: '', duration: '', tasks: [], order: 0, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], attachments: [], status: 'pending', dependencies: [], estimatedHours: 0 }],
    attachments: [],
    icon: '',
    projectId: '',
    spaceId: '',
    isFetchingMetadata: false,
    submissionStatus: 'idle',
    status: 'todo',
    isGeneratingRoadmap: false,
    habitType: 'good',
    reminderEnabled: false,
    reminderTime: '09:00',
    subTasks: [],
    quotes: [],
    autoDeleteAfter: 0,
};

const formReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.payload.field]: action.payload.value };
        case 'ADD_EXERCISE':
            return { ...state, exercises: [...state.exercises, { id: `ex-${Date.now()}`, name: '', sets: [{ reps: 0, weight: 0, notes: '' }] }] };
        case 'UPDATE_EXERCISE':
            return { ...state, exercises: state.exercises.map((ex, i) => i === action.payload.index ? { ...ex, name: action.payload.name } : ex) };
        case 'REMOVE_EXERCISE':
            return { ...state, exercises: state.exercises.filter((_, i) => i !== action.payload.index) };
        case 'ADD_SET':
            return { ...state, exercises: state.exercises.map((ex, i) => i === action.payload.exerciseIndex ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0, notes: '' }] } : ex) };
        case 'UPDATE_SET':
            return { ...state, exercises: state.exercises.map((ex, i) => i === action.payload.exerciseIndex ? { ...ex, sets: ex.sets.map((set, si) => si === action.payload.setIndex ? { ...set, [action.payload.field]: action.payload.value } : set) } : ex) };
        case 'REMOVE_SET':
            return { ...state, exercises: state.exercises.map((ex, i) => i === action.payload.exerciseIndex ? { ...ex, sets: ex.sets.filter((_, si) => si !== action.payload.setIndex) } : ex) };
        case 'ADD_PHASE':
            return { ...state, phases: [...state.phases, { id: `phase-${Date.now()}`, title: '', description: '', duration: '', tasks: [], order: state.phases.length, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], attachments: [], status: 'pending', dependencies: [], estimatedHours: 0 }] };
        case 'UPDATE_PHASE':
            return { ...state, phases: state.phases.map((phase, i) => i === action.payload.index ? { ...phase, [action.payload.field]: action.payload.value } : phase) };
        case 'REMOVE_PHASE':
            return { ...state, phases: state.phases.filter((_, i) => i !== action.payload.index) };
        case 'APPLY_TEMPLATE':
            const { title, content, exercises, icon } = action.payload.content;
            return {
                ...state,
                title: title ? title.replace('{DATE}', new Date().toLocaleDateString('he-IL')) : '',
                content: content || '',
                exercises: exercises ? JSON.parse(JSON.stringify(exercises)) : state.exercises,
                icon: icon || '',
            };
        case 'SET_METADATA_RESULT':
            return {
                ...state,
                title: action.payload.title || '',
                content: action.payload.content || '',
                isFetchingMetadata: false,
            };
        case 'SET_GENERATED_PHASES':
            return { ...state, phases: action.payload.map((p, i) => ({ ...p, id: `phase-${Date.now()}-${i}`, order: i, notes: '' })), isGeneratingRoadmap: false };
        case 'RESET_FORM': return initialState;
        case 'SUBMIT_START': return { ...state, submissionStatus: 'submitting' };
        case 'SUBMIT_DONE': return { ...initialState, submissionStatus: 'idle' };
        default: return state;
    }
};


// --- Sub-components for form fields ---

const SimpleFormFields: React.FC<{ title: string; setTitle: (v: string) => void; content: string; setContent: (v: string) => void; titlePlaceholder?: string; contentPlaceholder?: string; titleRequired?: boolean; contentRequired?: boolean; isSpark?: boolean; }> =
    ({ title, setTitle, content, setContent, titlePlaceholder = "כותרת", contentPlaceholder = "תוכן...", titleRequired = true, contentRequired = true, isSpark = false }) => {
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
                <div className="group">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[var(--dynamic-accent-highlight)]">{titlePlaceholder}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={titlePlaceholder}
                        className={`${inputStyles} text-lg font-bold`}
                        required={titleRequired}
                        autoFocus
                    />
                </div>
                <div className="group">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[var(--dynamic-accent-highlight)]">{contentPlaceholder}</label>
                    <div className="border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--dynamic-accent-start)]/50 focus-within:border-[var(--dynamic-accent-start)] transition-all bg-black/20">
                        <MarkdownToolbar onInsert={handleInsert} />
                        <textarea
                            ref={contentRef}
                            dir="auto"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder={contentPlaceholder}
                            className="w-full bg-transparent text-[var(--text-primary)] p-4 focus:outline-none resize-y min-h-[150px] placeholder-gray-600"
                            required={contentRequired}
                        />
                    </div>
                </div>
            </div>
        );
    };

const LinkFields: React.FC<{ url: string; setUrl: (v: string) => void; isFetching: boolean }> = ({ url, setUrl, isFetching }) => (
    <div className="group">
        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[var(--dynamic-accent-highlight)]">כתובת URL</label>
        <div className="relative">
            <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`${inputStyles} pl-10`}
                required
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                {isFetching ? <LoadingSpinner className="w-5 h-5 text-[var(--dynamic-accent-start)]" /> : <LinkIcon className="w-5 h-5" />}
            </div>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 opacity-70 px-1">הכותרת והתוכן יתמלאו אוטומטית מתוך הקישור</p>
    </div>
);

const TaskFields: React.FC<{ dueDate: string; setDueDate: (v: string) => void; dueTime?: string; setDueTime?: (v: string) => void; priority?: string; setPriority?: (v: any) => void; }> = ({ dueDate, setDueDate, dueTime, setDueTime, priority, setPriority }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/5 p-4 rounded-xl border border-white/5">
        <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">תאריך יעד</label>
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
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">שעה</label>
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
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">עדיפות</label>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
                    {['low', 'medium', 'high'].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${priority === p ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {p === 'low' ? 'נמוכה' : p === 'medium' ? 'בינונית' : 'גבוהה'}
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const BookFields: React.FC<{ author: string; setAuthor: (v: string) => void; totalPages: string; setTotalPages: (v: string) => void }> = ({ author, setAuthor, totalPages, setTotalPages }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">מחבר</label>
            <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className={inputStyles}
                placeholder="שם המחבר"
            />
        </div>
        <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">מספר עמודים</label>
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

const WorkoutFields: React.FC<{
    exercises: Exercise[];
    onAddExercise: () => void;
    onUpdateExercise: (idx: number, name: string) => void;
    onRemoveExercise: (idx: number) => void;
    onAddSet: (exIdx: number) => void;
    onUpdateSet: (exIdx: number, sIdx: number, field: keyof WorkoutSet, val: any) => void;
    onRemoveSet: (exIdx: number, sIdx: number) => void;
}> = ({ exercises, onAddExercise, onUpdateExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet }) => (
    <div className="space-y-6">
        {exercises.map((ex, i) => (
            <div key={ex.id} className="p-4 bg-black/30 rounded-2xl border border-white/10 space-y-4 animate-fade-in">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">שם התרגיל</label>
                        <input
                            type="text"
                            value={ex.name}
                            onChange={e => onUpdateExercise(i, e.target.value)}
                            placeholder="לדוגמה: סקוואט"
                            className={smallInputStyles + " font-bold"}
                        />
                    </div>
                    <button type="button" onClick={() => onRemoveExercise(i)} className="self-end text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2.5 rounded-lg transition-colors"><TrashIcon className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2">
                    {ex.sets.map((set, j) => (
                        <div key={j} className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center bg-white/5 p-2 rounded-lg">
                            <span className="text-xs font-mono text-gray-500 w-6 text-center">{j + 1}</span>
                            <input type="number" value={set.reps || ''} onChange={e => onUpdateSet(i, j, 'reps', parseInt(e.target.value))} placeholder="חזרות" className="bg-transparent text-center text-white border-b border-white/20 focus:border-[var(--dynamic-accent-start)] focus:outline-none py-1" />
                            <input type="number" value={set.weight || ''} onChange={e => onUpdateSet(i, j, 'weight', parseInt(e.target.value))} placeholder="ק''ג" className="bg-transparent text-center text-white border-b border-white/20 focus:border-[var(--dynamic-accent-start)] focus:outline-none py-1" />
                            <button type="button" onClick={() => onRemoveSet(i, j)} className="text-gray-600 hover:text-red-400 px-2"><TrashIcon className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => onAddSet(i)} className="text-xs font-bold text-[var(--dynamic-accent-highlight)] w-full py-2 hover:bg-white/5 rounded-lg dashed-border transition-colors">+ הוסף סט</button>
            </div>
        ))}
        <button type="button" onClick={onAddExercise} className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-sm font-bold text-gray-300 hover:border-[var(--dynamic-accent-start)] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
            <AddIcon className="w-5 h-5" /> הוסף תרגיל חדש
        </button>
    </div>
);


// --- Main Form Component ---

export const ItemCreationForm: React.FC<{
    itemType: AddableType;
    onClose: () => void;
    setActiveScreen: (screen: Screen) => void;
}> = ({ itemType, onClose, setActiveScreen }) => {
    const { state, dispatch: appDispatch } = useContext(AppContext);
    const [formState, dispatch] = useReducer(formReducer, initialState);
    const { triggerHaptic } = useHaptics();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [tickerSymbol, setTickerSymbol] = useState('');

    // Debounced URL for metadata fetching
    const debouncedUrl = useDebounce(formState.url, 800);

    // Icon for the header
    const TypeIcon = {
        spark: SparklesIcon, task: CheckCircleIcon, note: ClipboardListIcon, link: LinkIcon, idea: SparklesIcon,
        habit: FlameIcon, book: BookOpenIcon, workout: DumbbellIcon, goal: TargetIcon,
        journal: ClipboardListIcon, learning: ClipboardListIcon, roadmap: RoadmapIcon, ticker: ChartBarIcon
    }[itemType] || SparklesIcon;

    const accentColor = {
        spark: 'var(--accent-start)', task: 'var(--success)', note: 'var(--warning)', link: '#60A5FA',
        idea: '#FBBF24', habit: '#F472B6', book: '#A78BFA', workout: '#F472B6', goal: '#2DD4BF',
        journal: '#F0ABFC', learning: '#38BDF8', roadmap: '#3B82F6', ticker: 'gray'
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
                    dispatch({ type: 'SET_FIELD', payload: { field: key as keyof State, value: parsedDefaults[key] } });
                });
            } catch (e) {
                console.error("Error parsing defaults", e);
            }
            sessionStorage.removeItem('preselect_add_defaults');
        } else if (sharedData) {
            try {
                const { url, text, title } = JSON.parse(sharedData);
                if (url) dispatch({ type: 'SET_FIELD', payload: { field: 'url', value: url } });
                if (title) dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: title } });
                if (text) dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: text } });
            } catch (e) {
                console.error("Error parsing shared data", e);
            }
            sessionStorage.removeItem('sharedData');
        } else {
            dispatch({ type: 'RESET_FORM' }); // Reset if no defaults
        }

    }, [itemType]);

    // Warn user about unsaved changes
    useEffect(() => {
        const isDirty = JSON.stringify(formState) !== JSON.stringify(initialState);
        if (isDirty) {
            appDispatch({ type: 'SET_UNSAVED_CHANGES' });
        }
        // Cleanup will run on unmount, clearing the flag
        return () => {
            appDispatch({ type: 'CLEAR_UNSAVED_CHANGES' });
        };
    }, [formState, appDispatch]);

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

            const newItemData: any = {
                type: itemType,
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

            const newItem = await dataService.addPersonalItem(newItemData);
            appDispatch({ type: 'ADD_PERSONAL_ITEM', payload: newItem });

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
            console.error("Error creating item:", error);
            alert("שגיאה ביצירת הפריט");
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
            console.error("Failed to generate roadmap:", error);
            alert("שגיאה ביצירת מפת הדרכים");
            dispatch({ type: 'SET_FIELD', payload: { field: 'isGeneratingRoadmap', value: false } });
        }
    };

    const renderFormFields = () => {
        switch (itemType) {
            case 'ticker':
                return (
                    <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">סימול מניה / מטבע</label>
                        <input
                            type="text"
                            value={tickerSymbol}
                            onChange={e => setTickerSymbol(e.target.value.toUpperCase())}
                            placeholder="AAPL, BTC, ETH..."
                            className={inputStyles + " font-mono text-xl tracking-widest uppercase"}
                            autoFocus
                            required
                        />
                    </div>
                );
            case 'link':
                return (
                    <>
                        <LinkFields url={formState.url} setUrl={v => dispatch({ type: 'SET_FIELD', payload: { field: 'url', value: v } })} isFetching={formState.isFetchingMetadata} />
                        <SimpleFormFields
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
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
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
                            titlePlaceholder="מה צריך לעשות?"
                            contentPlaceholder="פרטים נוספים..."
                            contentRequired={false}
                        />
                        <TaskFields
                            dueDate={formState.dueDate} setDueDate={v => dispatch({ type: 'SET_FIELD', payload: { field: 'dueDate', value: v } })}
                            dueTime={formState.dueTime} setDueTime={v => dispatch({ type: 'SET_FIELD', payload: { field: 'dueTime', value: v } })}
                            priority={formState.priority} setPriority={v => dispatch({ type: 'SET_FIELD', payload: { field: 'priority', value: v } })}
                        />
                    </>
                );
            case 'note':
                return (
                    <>
                        <SimpleFormFields
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
                            titlePlaceholder="כותרת הפתק"
                            contentPlaceholder="כתוב משהו..."
                        />
                        <div className="pt-6 border-t border-white/10 mt-6">
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">תזכורת (אופציונלי)</p>
                            <TaskFields
                                dueDate={formState.dueDate} setDueDate={v => dispatch({ type: 'SET_FIELD', payload: { field: 'dueDate', value: v } })}
                                dueTime={formState.dueTime} setDueTime={v => dispatch({ type: 'SET_FIELD', payload: { field: 'dueTime', value: v } })}
                            // No priority for notes
                            />
                        </div>
                    </>
                );
            case 'book':
                return (
                    <>
                        <SimpleFormFields
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
                            titlePlaceholder="שם הספר"
                            contentPlaceholder="תקציר או הערות..."
                            contentRequired={false}
                        />
                        <BookFields
                            author={formState.author} setAuthor={v => dispatch({ type: 'SET_FIELD', payload: { field: 'author', value: v } })}
                            totalPages={formState.totalPages} setTotalPages={v => dispatch({ type: 'SET_FIELD', payload: { field: 'totalPages', value: v } })}
                        />
                    </>
                );
            case 'workout':
                return (
                    <>
                        <SimpleFormFields
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
                            titlePlaceholder="שם האימון"
                            contentPlaceholder="הערות כלליות..."
                            contentRequired={false}
                        />
                        <WorkoutFields
                            exercises={formState.exercises}
                            onAddExercise={() => dispatch({ type: 'ADD_EXERCISE' })}
                            onUpdateExercise={(idx, name) => dispatch({ type: 'UPDATE_EXERCISE', payload: { index: idx, name } })}
                            onRemoveExercise={(idx) => dispatch({ type: 'REMOVE_EXERCISE', payload: { index: idx } })}
                            onAddSet={(exIdx) => dispatch({ type: 'ADD_SET', payload: { exerciseIndex: exIdx } })}
                            onUpdateSet={(exIdx, sIdx, field, val) => dispatch({ type: 'UPDATE_SET', payload: { exerciseIndex: exIdx, setIndex: sIdx, field, value: val } })}
                            onRemoveSet={(exIdx, sIdx) => dispatch({ type: 'REMOVE_SET', payload: { exerciseIndex: exIdx, setIndex: sIdx } })}
                        />
                    </>
                );
            case 'roadmap':
                // Simplified visual for roadmap creation - just title and optional generation
                return (
                    <div className="space-y-6">
                        <SimpleFormFields
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
                            titlePlaceholder="שם היעד / הפרויקט"
                            contentPlaceholder="תיאור כללי של המטרה..."
                            contentRequired={false}
                        />
                        <div className="flex items-center justify-between bg-gradient-to-r from-[var(--dynamic-accent-start)]/20 to-[var(--dynamic-accent-end)]/20 p-5 rounded-xl border border-[var(--dynamic-accent-start)]/30 shadow-lg shadow-[var(--dynamic-accent-start)]/10">
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2 text-lg"><SparklesIcon className="w-5 h-5 text-[var(--dynamic-accent-highlight)]" /> צור מפת דרכים עם AI</h4>
                                <p className="text-xs text-gray-300 mt-1">AI יפרק את המטרה לשלבים מעשיים באופן אוטומטי</p>
                            </div>
                            <button type="button" onClick={handleGenerateRoadmap} disabled={formState.isGeneratingRoadmap || !formState.title} className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border border-white/10 disabled:opacity-50 shadow-sm">
                                {formState.isGeneratingRoadmap ? 'מייצר...' : 'צור עכשיו'}
                            </button>
                        </div>
                        {formState.phases.length > 1 && (
                            <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-sm font-bold text-[var(--text-secondary)] mb-3">שלבים שנוצרו ({formState.phases.length}):</p>
                                {formState.phases.map((phase, i) => (
                                    <div key={phase.id} className="text-sm bg-white/5 p-3 rounded-lg flex justify-between items-center border border-white/5">
                                        <span className="font-medium">{i + 1}. {phase.title}</span>
                                        <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">{phase.duration}</span>
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
                            title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                            content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
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
                        title={formState.title} setTitle={v => dispatch({ type: 'SET_FIELD', payload: { field: 'title', value: v } })}
                        content={formState.content} setContent={v => dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: v } })}
                        isSpark={itemType === 'spark'}
                        titlePlaceholder={itemType === 'spark' ? 'נושא הספארק' : 'כותרת'}
                    />
                );
        }
    };

    const typeLabel = {
        spark: 'ספארק', task: 'משימה', note: 'פתק', link: 'קישור', idea: 'רעיון',
        habit: 'הרגל', book: 'ספר', workout: 'אימון', goal: 'פרויקט',
        journal: 'יומן', learning: 'למידה', roadmap: 'מפת דרכים', ticker: 'מניה/מטבע'
    }[itemType] || itemType;

    return (
        <DraggableModalWrapper onClose={onClose} className="bg-[#1a1d24]/95 w-full h-full md:w-[90vw] md:max-w-3xl md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col md:border border-white/10 backdrop-blur-xl animate-scale-in overflow-hidden">
            {/* Header with large glow icon */}
            <header className="relative p-6 shrink-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[var(--bg-secondary)]/50 to-transparent opacity-50 pointer-events-none" />
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10 backdrop-blur-md"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                            <TypeIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">הוספת {typeLabel}</h2>
                            <p className="text-sm text-gray-400 font-medium mt-0.5">הזן את הפרטים למטה</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-90"><CloseIcon className="w-6 h-6" /></button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 custom-scrollbar">
                    {renderFormFields()}

                    {itemType !== 'ticker' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-white/10">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">שיוך למרחב</label>
                                    <select
                                        value={formState.spaceId}
                                        onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'spaceId', value: e.target.value } })}
                                        className={inputStyles}
                                    >
                                        <option value="">ללא מרחב</option>
                                        {state.spaces.filter(s => s.type === 'personal').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">שיוך לפרויקט</label>
                                    <select
                                        value={formState.projectId}
                                        onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'projectId', value: e.target.value } })}
                                        className={inputStyles}
                                    >
                                        <option value="">ללא פרויקט</option>
                                        {state.personalItems.filter(i => i.type === 'goal').map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <AttachmentManager
                                attachments={formState.attachments}
                                onAttachmentsChange={(atts) => dispatch({ type: 'SET_FIELD', payload: { field: 'attachments', value: atts } })}
                            />
                        </>
                    )}
                </div>

                {/* Sticky Footer */}
                <div className="p-4 border-t border-white/10 bg-[#1a1d24]/80 backdrop-blur-lg absolute bottom-0 w-full z-20 md:relative md:rounded-b-3xl">
                    <button
                        type="submit"
                        disabled={formState.submissionStatus === 'submitting'}
                        className="w-full h-14 bg-[var(--accent-gradient)] hover:brightness-110 text-white font-bold text-lg rounded-2xl transition-all transform active:scale-[0.98] shadow-[0_8px_30px_var(--dynamic-accent-glow)] disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {formState.submissionStatus === 'submitting' ? <LoadingSpinner /> : 'שמור פריט'}
                    </button>
                </div>
            </form>
        </DraggableModalWrapper>
    );
};

export default ItemCreationForm;