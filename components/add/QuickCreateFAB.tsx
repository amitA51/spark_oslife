import React, { useState } from 'react';
import { AddableType } from '../../types';
import {
  SparklesIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  LinkIcon,
  LightbulbIcon,
  FlameIcon,
  CloseIcon,
} from '../icons';
import { useHaptics } from '../../hooks/useHaptics';

interface QuickCreateFABProps {
  onCreateItem: (type: AddableType) => void;
  suggestedTypes?: AddableType[];
}

interface QuickAction {
  type: AddableType;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const QuickCreateFAB: React.FC<QuickCreateFABProps> = ({
  onCreateItem,
  suggestedTypes = ['task', 'note', 'spark', 'idea', 'link'],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { triggerHaptic } = useHaptics();

  const allActions: Record<AddableType, QuickAction> = {
    spark: {
      type: 'spark',
      icon: <SparklesIcon />,
      label: 'ספארק',
      color: 'from-cyan-500 to-violet-500',
    },
    task: {
      type: 'task',
      icon: <CheckCircleIcon />,
      label: 'משימה',
      color: 'from-emerald-500 to-green-600',
    },
    note: {
      type: 'note',
      icon: <ClipboardListIcon />,
      label: 'פתק',
      color: 'from-amber-500 to-yellow-500',
    },
    link: {
      type: 'link',
      icon: <LinkIcon />,
      label: 'קישור',
      color: 'from-blue-400 to-blue-600',
    },
    idea: {
      type: 'idea',
      icon: <LightbulbIcon />,
      label: 'רעיון',
      color: 'from-yellow-400 to-amber-500',
    },
    habit: {
      type: 'habit',
      icon: <FlameIcon />,
      label: 'הרגל',
      color: 'from-pink-500 to-rose-500',
    },
    book: {
      type: 'book',
      icon: <ClipboardListIcon />,
      label: 'ספר',
      color: 'from-purple-400 to-violet-500',
    },
    workout: {
      type: 'workout',
      icon: <CheckCircleIcon />,
      label: 'אימון',
      color: 'from-pink-500 to-fuchsia-600',
    },
    goal: {
      type: 'goal',
      icon: <CheckCircleIcon />,
      label: 'פרויקט',
      color: 'from-teal-400 to-cyan-500',
    },
    journal: {
      type: 'journal',
      icon: <ClipboardListIcon />,
      label: 'יומן',
      color: 'from-fuchsia-400 to-pink-500',
    },
    learning: {
      type: 'learning',
      icon: <ClipboardListIcon />,
      label: 'למידה',
      color: 'from-sky-400 to-blue-500',
    },
    roadmap: {
      type: 'roadmap',
      icon: <CheckCircleIcon />,
      label: 'מפת דרכים',
      color: 'from-blue-500 to-indigo-600',
    },
    ticker: {
      type: 'ticker',
      icon: <CheckCircleIcon />,
      label: 'מניה',
      color: 'from-gray-400 to-gray-600',
    },
    gratitude: {
      type: 'gratitude',
      icon: <SparklesIcon />,
      label: 'הכרת תודה',
      color: 'from-amber-500 to-orange-500',
    },
    antigoal: {
      type: 'antigoal',
      icon: <CloseIcon />,
      label: 'אנטי-יעד',
      color: 'from-red-500 to-red-700',
    },
  };

  const actions = suggestedTypes.slice(0, 5).map(type => allActions[type]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic('medium');
  };

  const handleActionClick = (type: AddableType) => {
    triggerHaptic('heavy');
    setIsExpanded(false);
    onCreateItem(type);
  };

  return (
    <div className="fixed bottom-24 left-6 z-40">
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className="relative">
        {isExpanded && (
          <div className="absolute bottom-20 left-0 space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {actions.map((action, index) => (
              <div
                key={action.type}
                className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <span className="text-sm font-semibold text-white/80 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                  {action.label}
                </span>

                <button
                  onClick={() => handleActionClick(action.type)}
                  className={`group relative w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                  <div className="relative z-10 w-full h-full flex items-center justify-center text-white">
                    {React.isValidElement(action.icon) &&
                      React.cloneElement(action.icon as React.ReactElement<{ className?: string }>, {
                        className: 'w-6 h-6',
                      })}
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleToggle}
          className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all duration-300 overflow-hidden group ${isExpanded ? 'scale-95 rotate-45' : 'scale-100 rotate-0 hover:scale-105'
            }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'
            }`}>
            <SparklesIcon className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
          </div>

          <div className="absolute inset-0 animate-spin-slow opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {!isExpanded && (
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse-glow">
              {actions.length}
            </div>
          )}
        </button>

        {!isExpanded && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/60 font-medium pointer-events-none">
            יצירה מהירה
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickCreateFAB;