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
import { useNavigation } from '../src/contexts/NavigationContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActionItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigate, navigateToAdd } = useNavigation();

  const actions: ActionItem[] = [
    // Navigation
    {
      id: 'nav-today',
      label: 'עבור להיום',
      group: 'ניווט',
      icon: <TargetIcon className="w-4 h-4" />,
      action: () => navigate('today'),
    },
    {
      id: 'nav-feed',
      label: 'עבור לפיד',
      group: 'ניווט',
      icon: <FeedIcon className="w-4 h-4" />,
      action: () => navigate('feed'),
    },
    {
      id: 'nav-library',
      label: 'עבור לספרייה',
      group: 'ניווט',
      icon: <LayoutDashboardIcon className="w-4 h-4" />,
      action: () => navigate('library'),
    },
    {
      id: 'nav-investments',
      label: 'עבור להשקעות',
      group: 'ניווט',
      icon: <ChartBarIcon className="w-4 h-4" />,
      action: () => navigate('investments'),
    },
    {
      id: 'nav-assistant',
      label: 'שאל את היועץ',
      group: 'ניווט',
      icon: <BrainCircuitIcon className="w-4 h-4" />,
      action: () => navigate('assistant'),
    },
    {
      id: 'nav-settings',
      label: 'הגדרות',
      group: 'ניווט',
      icon: <SettingsIcon className="w-4 h-4" />,
      action: () => navigate('settings'),
    },

    // Actions
    {
      id: 'act-add-task',
      label: 'משימה חדשה',
      group: 'פעולות',
      icon: <AddIcon className="w-4 h-4" />,
      action: () => navigateToAdd('task'),
    },
    {
      id: 'act-add-spark',
      label: 'ספארק חדש',
      group: 'פעולות',
      icon: <AddIcon className="w-4 h-4" />,
      action: () => navigateToAdd('spark'),
    },

    // System
    {
      id: 'sys-theme',
      label: 'החלף ערכת נושא (מחזורי)',
      group: 'מערכת',
      icon: <SunIcon className="w-4 h-4" />,
      action: () => {
        /* Cycle theme logic could go here */ navigate('settings');
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
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[rgba(12,12,18,0.95)] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up-small backdrop-blur-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/[0.04]">
          <SearchIcon className="w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="הקלד פקודה..."
            className="flex-1 bg-transparent text-lg text-white px-3 focus:outline-none placeholder:text-white/30"
          />
          <span className="text-xs text-white/40 bg-white/[0.04] px-2 py-1 rounded">
            ESC
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-white/40">לא נמצאו פקודות</div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${index === selectedIndex
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <span className="font-medium">{action.label}</span>
                </div>
                {index === selectedIndex && <span className="text-xs text-white/40">Enter ↵</span>}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.04] flex justify-between items-center text-[10px] text-white/30">
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
