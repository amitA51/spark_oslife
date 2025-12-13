import React from 'react';
import { ViewProps, EditProps } from './common';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div>
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">
          Habit Type
        </label>
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'habitType', value: 'good' } })
            }
            className={`flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${editState.habitType === 'good' || !editState.habitType ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <FlameIcon className="w-5 h-5" />
            Build Habit
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'habitType', value: 'bad' } })
            }
            className={`flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${editState.habitType === 'bad' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            Quit Habit
          </button>
        </div>
        <p className="text-xs text-white/30 mt-3 px-1 text-center">
          {editState.habitType === 'bad'
            ? 'For quit habits, we track time since your last relapse.'
            : 'For build habits, we track your daily consistency streak.'}
        </p>
      </div>

      <div className="group">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block group-focus-within:text-white/80 transition-colors">Notes</label>
        <textarea
          dir="auto"
          value={editState.content}
          onChange={e =>
            dispatch({ type: 'SET_FIELD', payload: { field: 'content', value: e.target.value } })
          }
          rows={3}
          className="w-full bg-white/5 text-lg text-white p-4 rounded-xl border border-white/10 focus:outline-none focus:bg-black/40 focus:border-white/20 transition-all resize-none placeholder-white/20"
          placeholder="Details about this habit..."
        />
      </div>

      <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label htmlFor="reminderEnabled" className="font-bold text-white text-lg block">
              Daily Reminder
            </label>
            <p className="text-xs text-white/40 mt-0.5">Get notified every day to check in.</p>
          </div>
          <ToggleSwitch
            id="reminderEnabled"
            checked={editState.reminderEnabled || false}
            onChange={val =>
              dispatch({ type: 'SET_FIELD', payload: { field: 'reminderEnabled', value: val } })
            }
          />
        </div>
        {editState.reminderEnabled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label
              htmlFor="reminderTime"
              className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block"
            >
              Time
            </label>
            <div className="relative overflow-hidden rounded-xl bg-black/20 border border-white/10 hover:border-white/20 transition-all focus-within:ring-2 ring-white/10">
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
                className="w-full bg-transparent p-4 text-white text-xl font-bold text-center outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
