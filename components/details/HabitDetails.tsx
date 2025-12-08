import React from 'react';
import { ViewProps, EditProps, inputStyles } from './common';
import MarkdownRenderer from '../MarkdownRenderer';
import ToggleSwitch from '../ToggleSwitch';
import { FlameIcon, ShieldCheckIcon } from '../icons';

export const HabitView: React.FC<ViewProps> = ({ item }) => {
  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-xl border ${item.habitType === 'bad' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} flex items-center gap-3`}
      >
        {item.habitType === 'bad' ? (
          <>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h4 className="font-bold text-red-100">גמילה מהרגל</h4>
              <p className="text-xs text-red-300">מטרה: להימנע מביצוע הפעולה</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FlameIcon className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h4 className="font-bold text-green-100">בניית הרגל</h4>
              <p className="text-xs text-green-300">מטרה: לבצע את הפעולה באופן קבוע</p>
            </div>
          </>
        )}
      </div>

      {item.content && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--accent-highlight)] mb-2 uppercase tracking-wider">
            הערות
          </h4>
          <MarkdownRenderer content={item.content} />
        </div>
      )}
      <div>
        <h4 className="text-sm font-semibold text-[var(--accent-highlight)] mb-2 uppercase tracking-wider">
          תזכורת
        </h4>
        <p className="text-sm text-secondary">
          {item.reminderEnabled
            ? `תזכורת יומית מופעלת לשעה ${item.reminderTime}.`
            : 'אין תזכורות מופעלות להרגל זה.'}
        </p>
      </div>
    </div>
  );
};

export const HabitEdit: React.FC<EditProps> = ({ editState, dispatch }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          סוג הרגל
        </label>
        <div className="flex p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'habitType', value: 'good' } })
            }
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${editState.habitType === 'good' || !editState.habitType ? 'bg-[var(--dynamic-accent-start)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
          >
            <FlameIcon className="w-4 h-4" />
            בניית הרגל
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'habitType', value: 'bad' } })
            }
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${editState.habitType === 'bad' ? 'bg-red-500 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
          >
            <ShieldCheckIcon className="w-4 h-4" />
            גמילה
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 px-1">
          {editState.habitType === 'bad'
            ? 'עבור הרגלי גמילה (כמו הפסקת עישון), המערכת תספור את הזמן שעבר מאז המעידה האחרונה.'
            : 'עבור הרגלים חיוביים (כמו כושר), המערכת תעקוב אחרי רצף הביצועים היומיומי שלך.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">הערות</label>
        <textarea
          dir="auto"
          value={editState.content}
          onChange={e =>
            dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: e.target.value } })
          }
          rows={3}
          className={inputStyles}
        />
      </div>

      <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
        <div className="flex justify-between items-center">
          <label htmlFor="reminderEnabled" className="font-medium text-white">
            תזכורת יומית
          </label>
          <ToggleSwitch
            id="reminderEnabled"
            checked={editState.reminderEnabled || false}
            onChange={val =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'reminderEnabled', value: val } })
            }
          />
        </div>
        {editState.reminderEnabled && (
          <div className="mt-3">
            <label
              htmlFor="reminderTime"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              שעת התזכורת
            </label>
            <input
              type="time"
              id="reminderTime"
              value={editState.reminderTime || '09:00'}
              onChange={e =>
                dispatch({
                  type: 'SET_FIELD',
                  payload: { field: 'reminderTime', value: e.target.value },
                })
              }
              className={inputStyles + ' text-center'}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
