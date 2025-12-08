import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { Screen } from '../types';

export interface ShortcutDefinition {
  key: string;
  description: string;
  category: 'navigation' | 'actions' | 'quick' | 'views';
  handler: () => void;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

interface KeyboardShortcutsContextType {
  shortcuts: Record<string, ShortcutDefinition>;
  registerShortcut: (id: string, shortcut: ShortcutDefinition) => void;
  unregisterShortcut: (id: string) => void;
  showHelp: boolean;
  toggleHelp: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
};

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  setActiveScreen: (screen: Screen) => void;
  onQuickAdd: () => void;
  onSearch: () => void;
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({
  children,
  setActiveScreen,
  onQuickAdd,
  onSearch,
}) => {
  const [shortcuts, setShortcuts] = useState<Record<string, ShortcutDefinition>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const registerShortcut = useCallback((id: string, shortcut: ShortcutDefinition) => {
    setShortcuts(prev => ({ ...prev, [id]: shortcut }));
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[id];
      return newShortcuts;
    });
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // Register global shortcuts
  useEffect(() => {
    const globalShortcuts: Record<string, ShortcutDefinition> = {
      quick_add: {
        key: 'q',
        description: 'Quick add task',
        category: 'quick',
        handler: onQuickAdd,
      },
      search: {
        key: '/',
        description: 'Focus search',
        category: 'quick',
        handler: onSearch,
      },
      goto_today: {
        key: 'g+t',
        description: 'Go to Today view',
        category: 'navigation',
        handler: () => setActiveScreen('today'),
      },
      goto_views: {
        key: 'g+v',
        description: 'Go to Smart Views',
        category: 'navigation',
        handler: () => setActiveScreen('views'),
      },
      goto_library: {
        key: 'g+l',
        description: 'Go to Library',
        category: 'navigation',
        handler: () => setActiveScreen('library'),
      },
      goto_feed: {
        key: 'g+f',
        description: 'Go to Feed',
        category: 'navigation',
        handler: () => setActiveScreen('feed'),
      },
      goto_dashboard: {
        key: 'g+d',
        description: 'Go to Dashboard',
        category: 'navigation',
        handler: () => setActiveScreen('dashboard'),
      },
      show_help: {
        key: '?',
        description: 'Show keyboard shortcuts',
        category: 'quick',
        handler: toggleHelp,
        modifiers: { shift: true },
      },
    };

    Object.entries(globalShortcuts).forEach(([id, shortcut]) => {
      registerShortcut(id, shortcut);
    });

    return () => {
      Object.keys(globalShortcuts).forEach(id => {
        unregisterShortcut(id);
      });
    };
  }, [registerShortcut, unregisterShortcut, setActiveScreen, onQuickAdd, onSearch, toggleHelp]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow '/' for search even in inputs (like Slack)
        if (e.key !== '/') {
          return;
        }
      }

      // Handle pending 'g' key for navigation shortcuts
      if (pendingKey === 'g') {
        const composedKey = `g+${e.key}`;
        const shortcut = Object.values(shortcuts).find(s => s.key === composedKey);

        if (shortcut) {
          e.preventDefault();
          shortcut.handler();
        }
        setPendingKey(null);
        return;
      }

      // Check for 'g' key to start navigation sequence
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPendingKey('g');
        // Clear pending key after 1 second
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }

      // Handle modifiers for '?' (Shift+/)
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        const shortcut = Object.values(shortcuts).find(s => s.key === '?' && s.modifiers?.shift);
        if (shortcut) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }

      // Handle simple key shortcuts
      const shortcut = Object.values(shortcuts).find(s => {
        if (s.key.includes('+')) return false; // Skip composed keys
        return (
          s.key === e.key &&
          (!s.modifiers?.ctrl || e.ctrlKey || e.metaKey) &&
          (!s.modifiers?.shift || e.shiftKey) &&
          (!s.modifiers?.alt || e.altKey)
        );
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, pendingKey]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        showHelp,
        toggleHelp,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};
