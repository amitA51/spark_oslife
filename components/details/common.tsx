import React, { useRef } from 'react';
// FIX: Replaced non-existent `RoadmapStep` with `RoadmapPhase`.
import { Attachment, PersonalItem, Exercise, RoadmapPhase, SubTask } from '../../types';

import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  Heading1Icon,
  Heading2Icon,
  QuoteIcon,
  ListIcon,
  CheckCircleIcon,
  CodeIcon,
  UploadIcon,
  TrashIcon,
  getFileIcon,
} from '../icons';

export const inputStyles =
  'w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent-start)]/50 focus:border-[var(--dynamic-accent-start)] transition-all shadow-inner placeholder-muted backdrop-blur-sm hover:bg-black/30';
export const smallInputStyles =
  'w-full bg-black/20 border border-white/10 text-white rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--dynamic-accent-start)] focus:border-[var(--dynamic-accent-start)] transition-all backdrop-blur-sm';

// --- Edit State Management via Reducer ---

export interface EditState {
  title: string;
  content: string;
  icon: string;
  attachments: Attachment[];
  spaceId: string;
  projectId: string;
  // Type-specific fields
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
  subTasks: SubTask[];
  autoDeleteAfter?: number;
  author: string;
  totalPages: string;
  quotes: string[];
  exercises: Exercise[];
  phases: RoadmapPhase[];
  url: string;
  // Habit-specific fields
  reminderEnabled?: boolean;
  reminderTime?: string;
  habitType?: 'good' | 'bad';
}

export type EditAction =
  | { type: 'SET_FIELD'; payload: { field: keyof EditState; value: any } }
  | { type: 'RESET'; payload: PersonalItem };

export function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'RESET':
      const item = action.payload;
      return createInitialEditState(item);
    default:
      return state;
  }
}

export const createInitialEditState = (item: PersonalItem): EditState => ({
  title: item.title || '',
  content: item.content || '',
  icon: item.icon || '',
  attachments: item.attachments || [],
  spaceId: item.spaceId || '',
  projectId: item.projectId || '',
  // Type-specific fields with defaults
  dueDate: item.dueDate || '',
  dueTime: item.dueTime || '',
  priority: item.priority || 'medium',
  subTasks: item.subTasks ? JSON.parse(JSON.stringify(item.subTasks)) : [],
  autoDeleteAfter: item.autoDeleteAfter || 0,
  author: item.author || '',
  totalPages: item.totalPages?.toString() || '',
  quotes: item.quotes || [],
  exercises: item.exercises ? JSON.parse(JSON.stringify(item.exercises)) : [],
  phases: item.phases ? JSON.parse(JSON.stringify(item.phases)) : [],
  url: item.url || '',
  // Habit-specific
  reminderEnabled: item.reminderEnabled || false,
  reminderTime: item.reminderTime || '09:00',
  habitType: item.habitType || 'good',
});

// --- Common Prop Types ---
export interface ViewProps {
  item: PersonalItem;
  onUpdate: (id: string, updates: Partial<PersonalItem>) => void;
}
export interface EditProps {
  editState: EditState;
  dispatch: React.Dispatch<EditAction>;
}

// --- Common Detail Components ---

export const MarkdownToolbar: React.FC<{
  onInsert: (syntax: string, endSyntax?: string) => void;
}> = ({ onInsert }) => (
  <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-t-xl border-b border-white/10 overflow-x-auto scrollbar-hide">
    <button
      type="button"
      onClick={() => onInsert('**', '**')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <BoldIcon className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onInsert('*', '*')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <ItalicIcon className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onInsert('~~', '~~')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <StrikethroughIcon className="w-4 h-4" />
    </button>
    <div className="w-px h-4 bg-white/10 mx-1"></div>
    <button
      type="button"
      onClick={() => onInsert('\n# ')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <Heading1Icon className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onInsert('\n## ')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <Heading2Icon className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onInsert('\n> ')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <QuoteIcon className="w-4 h-4" />
    </button>
    <div className="w-px h-4 bg-white/10 mx-1"></div>
    <button
      type="button"
      onClick={() => onInsert('\n- ')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <ListIcon className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onInsert('\n[ ] ')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <CheckCircleIcon className="w-4 h-4" />
    </button>
    <button
      type="button"
      onClick={() => onInsert('`', '`')}
      className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      <CodeIcon className="w-4 h-4" />
    </button>
  </div>
);

export const AttachmentManager: React.FC<{
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}> = ({ attachments, onAttachmentsChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // FIX: Add missing 'id' and 'size' properties to conform to the Attachment type.
      onAttachmentsChange([
        ...attachments,
        {
          id: `local-${Date.now()}`,
          name: file.name,
          type: 'local',
          url: reader.result as string,
          mimeType: file.type,
          size: file.size,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
        קבצים ומדיה
      </label>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
      >
        <UploadIcon className="w-5 h-5 text-[var(--dynamic-accent-highlight)] group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium text-secondary">העלאת קובץ</span>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="*"
      />
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-black/30 border border-white/5 p-3 rounded-xl animate-fade-in"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white/5 rounded-lg text-muted shrink-0">
                  {getFileIcon(att.mimeType)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-primary truncate">{att.name}</span>
                  <span className="text-xs text-muted">{Math.round(att.size / 1024)} KB</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-muted hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
