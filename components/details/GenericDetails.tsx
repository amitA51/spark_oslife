import React, { useRef } from 'react';
import { ViewProps, EditProps, MarkdownToolbar, inputStyles } from './common';
import MarkdownRenderer from '../MarkdownRenderer';
import { CalendarIcon } from '../icons';

export const GenericView: React.FC<ViewProps> = ({ item }) => {
  const hasReminder = !!item.dueDate;
  const formattedDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL') : '';

  return (
    <div className="space-y-4">
      {item.content && <MarkdownRenderer content={item.content} />}

      {hasReminder && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-primary)]">
          <CalendarIcon className="w-5 h-5 text-[var(--dynamic-accent-highlight)]" />
          <span>
            תזכורת: <strong className="text-[var(--text-primary)]">{formattedDate}</strong>
            {item.dueTime ? ` בשעה ${item.dueTime}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export const GenericEdit: React.FC<EditProps> = ({ editState, dispatch }) => {
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertMarkdown = (startSyntax: string, endSyntax = '') => {
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

    dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: newText } });

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = selectionStart;
      textarea.selectionEnd = selectionEnd;
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--dynamic-accent-start)]/50 focus-within:border-[var(--dynamic-accent-start)]">
        <MarkdownToolbar onInsert={handleInsertMarkdown} />
        <textarea
          ref={contentRef}
          dir="auto"
          value={editState.content}
          onChange={e =>
            dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: e.target.value } })
          }
          rows={10}
          className="w-full bg-[var(--bg-card)] text-[var(--text-primary)] p-3 focus:outline-none resize-none"
        />
      </div>

      <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
        <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" /> תזכורת
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              תאריך
            </label>
            <input
              type="date"
              value={editState.dueDate || ''}
              onChange={e =>
                dispatch({
                  type: 'SET_FIELD',
                  payload: { field: 'dueDate', value: e.target.value },
                })
              }
              className={inputStyles}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              שעה
            </label>
            <input
              type="time"
              value={editState.dueTime || ''}
              onChange={e =>
                dispatch({
                  type: 'SET_FIELD',
                  payload: { field: 'dueTime', value: e.target.value },
                })
              }
              className={inputStyles}
              style={{ colorScheme: 'dark' }}
              disabled={!editState.dueDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
