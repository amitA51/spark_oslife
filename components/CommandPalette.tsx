import React, { useState, useEffect, useRef } from 'react';
import {
  SearchIcon,
  TargetIcon,
  FeedIcon,
  AddIcon,
  LayoutDashboardIcon,
  ChartBarIcon,
  SettingsIcon,
  BrainCircuitIcon,
  SunIcon,
} from './icons';
import type { Screen } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveScreen: (screen: Screen) => void;
}

type ActionItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, setActiveScreen }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: ActionItem[] = [
    // Navigation
    {
      id: 'nav-today',
      label: 'עבור להיום',
      group: 'ניווט',
      icon: <TargetIcon className="w-4 h-4" />,
      action: () => setActiveScreen('today'),
    },
    {
      id: 'nav-feed',
      label: 'עבור לפיד',
      group: 'ניווט',
      icon: <FeedIcon className="w-4 h-4" />,
      action: () => setActiveScreen('feed'),
    },
    {
      id: 'nav-library',
      label: 'עבור למתכנן',
      group: 'ניווט',
      icon: <LayoutDashboardIcon className="w-4 h-4" />,
      action: () => setActiveScreen('library'),
    },
    {
      id: 'nav-investments',
      label: 'עבור להשקעות',
      group: 'ניווט',
      icon: <ChartBarIcon className="w-4 h-4" />,
      action: () => setActiveScreen('investments'),
    },
    {
      id: 'nav-assistant',
      label: 'שאל את היועץ',
      group: 'ניווט',
      icon: <BrainCircuitIcon className="w-4 h-4" />,
      action: () => setActiveScreen('assistant'),
    },
    {
      id: 'nav-settings',
      label: 'הגדרות',
      group: 'ניווט',
      icon: <SettingsIcon className="w-4 h-4" />,
      action: () => setActiveScreen('settings'),
    },

    // Actions
    {
      id: 'act-add-task',
      label: 'משימה חדשה',
      group: 'פעולות',
      icon: <AddIcon className="w-4 h-4" />,
      action: () => {
        sessionStorage.setItem('preselect_add', 'task');
        setActiveScreen('add');
      },
    },
    {
      id: 'act-add-spark',
      label: 'ספארק חדש',
      group: 'פעולות',
      icon: <AddIcon className="w-4 h-4" />,
      action: () => {
        sessionStorage.setItem('preselect_add', 'spark');
        setActiveScreen('add');
      },
    },

    // System
    {
      id: 'sys-theme',
      label: 'החלף ערכת נושא (מחזורי)',
      group: 'מערכת',
      icon: <SunIcon className="w-4 h-4" />,
      action: () => {
        /* Cycle theme logic could go here */ setActiveScreen('settings');
      },
    },
  ];

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-slide-up-small"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-primary)]">
          <SearchIcon className="w-5 h-5 text-[var(--text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="הקלד פקודה..."
            className="flex-1 bg-transparent text-lg text-white px-3 focus:outline-none placeholder:text-muted"
          />
          <span className="text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-1 rounded">
            ESC
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-secondary)]">לא נמצאו פקודות</div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  index === selectedIndex
                    ? 'bg-[var(--dynamic-accent-start)] text-white shadow-lg shadow-[var(--dynamic-accent-start)]/20'
                    : 'text-[var(--text-secondary)] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <span className="font-medium">{action.label}</span>
                </div>
                {index === selectedIndex && <span className="text-xs opacity-70">Enter ↵</span>}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
          <span>Spark OS Command</span>
          <div className="flex gap-2">
            <span>↑↓ לניווט</span>
            <span>↵ לבחירה</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
