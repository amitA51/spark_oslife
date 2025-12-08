import React from 'react';
import { useKeyboardShortcuts } from './KeyboardShortcutsProvider';
import { CloseIcon, SparklesIcon } from './icons';

const ShortcutsHelpModal: React.FC = () => {
  const { shortcuts, showHelp, toggleHelp } = useKeyboardShortcuts();

  if (!showHelp) return null;

  const categorizedShortcuts = {
    navigation: [] as (typeof shortcuts)[string][],
    quick: [] as (typeof shortcuts)[string][],
    actions: [] as (typeof shortcuts)[string][],
    views: [] as (typeof shortcuts)[string][],
  };

  Object.values(shortcuts).forEach(shortcut => {
    categorizedShortcuts[shortcut.category].push(shortcut);
  });

  const KeyBadge = ({ keys }: { keys: string }) => {
    const keyParts = keys.split('+');

    return (
      <div className="flex gap-1">
        {keyParts.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-white/10 border border-white/20 rounded text-white min-w-[28px] text-center">
              {key.toUpperCase()}
            </kbd>
            {index < keyParts.length - 1 && (
              <span className="text-muted text-xs flex items-center">then</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const ShortcutCategory = ({
    title,
    shortcuts,
  }: {
    title: string;
    shortcuts: (typeof categorizedShortcuts)[keyof typeof categorizedShortcuts];
  }) => {
    if (shortcuts.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wide mb-3">{title}</h3>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-sm text-white">{shortcut.description}</span>
              <KeyBadge keys={shortcut.key} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto themed-card p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[var(--bg-card)] pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent-gradient)]">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-heading">Keyboard Shortcuts</h2>
              <p className="text-sm text-muted">Navigate faster with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={toggleHelp}
            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <ShortcutCategory title="Quick Actions" shortcuts={categorizedShortcuts.quick} />
          <ShortcutCategory title="Navigation" shortcuts={categorizedShortcuts.navigation} />
          <ShortcutCategory title="Task Actions" shortcuts={categorizedShortcuts.actions} />
          <ShortcutCategory title="View Controls" shortcuts={categorizedShortcuts.views} />
        </div>

        {/* Footer Tip */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-muted text-center">
            💡 Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-white/10 border border-white/20 rounded">
              ESC
            </kbd>{' '}
            anywhere to close dialogs
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelpModal;
