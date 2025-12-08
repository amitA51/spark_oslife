import React, { useEffect } from 'react';

interface AppKeyboardShortcutsProps {
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * AppKeyboardShortcuts Component
 *
 * Manages global keyboard shortcuts for the application:
 * - Cmd+K / Ctrl+K: Toggle Command Palette
 */
const AppKeyboardShortcuts: React.FC<AppKeyboardShortcutsProps> = ({ setIsCommandPaletteOpen }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette Toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  // This component doesn't render anything - it's purely for side effects
  return null;
};

export default AppKeyboardShortcuts;
