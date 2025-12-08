import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeedItem } from '../types';
import {
  ReadIcon,
  UnreadIcon,
  SummarizeIcon,
  ClipboardIcon,
  TrashIcon,
  BookOpenIcon,
  CheckCheckIcon,
} from './icons';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  isDestructive?: boolean;
  shortcut?: string;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  item: FeedItem;
  onClose: () => void;
  onToggleRead: () => void;
  onSummarize: () => void;
  onDelete?: (id: string) => void;
  onAddToLibrary: (item: FeedItem) => void;
  /** Enable sound effects on actions */
  enableSounds?: boolean;
}

// ============================================================================
// Animation Variants
// ============================================================================

const menuVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: -8,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1],
      staggerChildren: 0.02,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: { opacity: 0, x: -4 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// ============================================================================
// Utility Functions
// ============================================================================


// ============================================================================
// Sub-Components
// ============================================================================

interface MenuItemButtonProps {
  item: MenuItem;
  isActive: boolean;
  onAction: () => void;
  enableSounds: boolean;
  onHaptic: (style: 'light' | 'medium' | 'soft') => void;
  playSound: (type: 'click' | 'delete' | 'success') => void;
}

const MenuItemButton: React.FC<MenuItemButtonProps> = React.memo(
  ({ item, isActive, onAction, enableSounds, onHaptic, playSound }) => {
    const handleClick = useCallback(() => {
      if (item.disabled) return;

      if (enableSounds) {
        playSound(item.isDestructive ? 'delete' : 'click');
      }
      onHaptic(item.isDestructive ? 'medium' : 'light');
      onAction();
    }, [item.disabled, item.isDestructive, enableSounds, onAction, onHaptic, playSound]);

    return (
      <motion.button
        variants={itemVariants as any}
        onClick={handleClick}
        disabled={item.disabled}
        aria-disabled={item.disabled}
        role="menuitem"
        tabIndex={isActive ? 0 : -1}
        className={`
          group relative w-full flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-lg
          transition-all duration-150 outline-none
          ${item.isDestructive
            ? 'text-red-400 hover:bg-red-500/15 focus-visible:bg-red-500/15'
            : 'text-[var(--text-primary)] hover:bg-white/10 focus-visible:bg-white/10'
          }
          ${isActive ? 'bg-white/10 ring-1 ring-inset ring-white/20' : ''}
          ${item.disabled
            ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
            : 'cursor-pointer'
          }
        `}
        whileHover={{ x: item.disabled ? 0 : 2 }}
        whileTap={{ scale: item.disabled ? 1 : 0.98 }}
      >
        {/* Active indicator line */}
        <motion.div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full ${item.isDestructive ? 'bg-red-400' : 'bg-[var(--accent-primary)]'
            }`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />

        {/* Icon with subtle animation */}
        <motion.span
          className={`flex-shrink-0 transition-transform duration-150 ${item.isDestructive
            ? 'text-red-400 group-hover:text-red-300'
            : 'text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]'
            }`}
          whileHover={{ scale: 1.1, rotate: item.isDestructive ? -5 : 0 }}
        >
          {item.icon}
        </motion.span>

        {/* Label */}
        <span className="flex-1 font-medium">{item.label}</span>

        {/* Keyboard shortcut hint */}
        {item.shortcut && (
          <span className="text-xs text-[var(--text-tertiary)] bg-white/5 px-1.5 py-0.5 rounded">
            {item.shortcut}
          </span>
        )}
      </motion.button>
    );
  }
);

MenuItemButton.displayName = 'MenuItemButton';

// ============================================================================
// Main Component
// ============================================================================

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  item,
  onClose,
  onToggleRead,
  onSummarize,
  onDelete,
  onAddToLibrary,
  enableSounds = true,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState(false);

  // Hooks
  const { triggerHaptic } = useHaptics();
  const { playClick, playSuccess, playWarning } = useSound();

  // Adapter functions
  const handleHaptic = useCallback((style: 'light' | 'medium' | 'soft') => {
    // Map 'soft' to 'light' for compatibility
    triggerHaptic(style === 'soft' ? 'light' : style);
  }, [triggerHaptic]);

  const handleSound = useCallback((type: 'click' | 'delete' | 'success') => {
    if (!enableSounds) return;
    if (type === 'click') playClick();
    else if (type === 'delete') playWarning();
    else if (type === 'success') playSuccess();
  }, [enableSounds, playClick, playWarning, playSuccess]);

  // Build menu items dynamically
  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        id: 'toggle-read',
        label: item.is_read ? 'סמן כלא נקרא' : 'סמן כנקרא',
        icon: item.is_read ? <UnreadIcon className="h-5 w-5" /> : <ReadIcon className="h-5 w-5" />,
        action: onToggleRead,
        shortcut: 'R',
      },
      {
        id: 'summarize',
        label: 'סכם עם AI',
        icon: <SummarizeIcon className="h-5 w-5" />,
        action: onSummarize,
        disabled: !!item.summary_ai,
        shortcut: 'S',
      },
    ];

    // Add to library for RSS items
    if (item.type === 'rss') {
      items.push({
        id: 'add-library',
        label: 'הוסף לספרייה',
        icon: <BookOpenIcon className="h-5 w-5" />,
        action: () => onAddToLibrary(item),
        shortcut: 'L',
      });
    }

    // Copy link if available
    if (item.link) {
      items.push({
        id: 'copy-link',
        label: copySuccess ? 'הקישור הועתק!' : 'העתק קישור',
        icon: copySuccess ? (
          <CheckCheckIcon className="h-5 w-5 text-green-400" />
        ) : (
          <ClipboardIcon className="h-5 w-5" />
        ),
        action: () => {
          navigator.clipboard.writeText(item.link!);
          setCopySuccess(true);
          if (enableSounds) playSuccess();
          setTimeout(() => setCopySuccess(false), 2000);
        },
        shortcut: 'C',
      });
    }

    // Delete for spark items
    if (item.type === 'spark' && onDelete) {
      items.push({
        id: 'delete',
        label: 'מחק ספארק',
        icon: <TrashIcon className="h-5 w-5" />,
        action: () => onDelete(item.id),
        isDestructive: true,
        separator: true,
        shortcut: 'D',
      });
    }

    return items.filter(i => !i.disabled || i.id === 'summarize');
  }, [item, onToggleRead, onSummarize, onAddToLibrary, onDelete, copySuccess, enableSounds]);

  // Get non-disabled items for navigation
  const navigableItems = useMemo(
    () => menuItems.filter(i => !i.disabled),
    [menuItems]
  );

  // Handle action and close
  const handleAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose]
  );

  // Position adjustment on mount
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const padding = 12;
      let newX = x;
      let newY = y;

      // Right edge
      if (x + menuRect.width > window.innerWidth - padding) {
        newX = window.innerWidth - menuRect.width - padding;
      }
      // Left edge
      if (newX < padding) {
        newX = padding;
      }
      // Bottom edge
      if (y + menuRect.height > window.innerHeight - padding) {
        newY = window.innerHeight - menuRect.height - padding;
      }
      // Top edge
      if (newY < padding) {
        newY = padding;
      }

      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex(prev =>
            prev < navigableItems.length - 1 ? prev + 1 : 0
          );
          triggerHaptic('light');
          break;

        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex(prev =>
            prev > 0 ? prev - 1 : navigableItems.length - 1
          );
          triggerHaptic('light');
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (navigableItems[activeIndex]) {
            handleAction(navigableItems[activeIndex].action);
          }
          break;

        // Quick shortcuts
        case 'r':
        case 'R':
          event.preventDefault();
          handleAction(onToggleRead);
          break;

        case 's':
        case 'S':
          if (!item.summary_ai) {
            event.preventDefault();
            handleAction(onSummarize);
          }
          break;

        case 'c':
        case 'C':
          if (item.link) {
            event.preventDefault();
            navigator.clipboard.writeText(item.link);
            setCopySuccess(true);
            if (enableSounds) playSuccess();
            setTimeout(() => {
              setCopySuccess(false);
              onClose();
            }, 500);
          }
          break;

        case 'd':
        case 'D':
          if (item.type === 'spark' && onDelete) {
            event.preventDefault();
            handleAction(() => onDelete(item.id));
          }
          break;

        case 'l':
        case 'L':
          if (item.type === 'rss') {
            event.preventDefault();
            handleAction(() => onAddToLibrary(item));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    activeIndex,
    navigableItems,
    handleAction,
    onClose,
    onToggleRead,
    onSummarize,
    onDelete,
    onAddToLibrary,
    item,
    enableSounds,
  ]);

  // Focus menu on mount
  useEffect(() => {
    menuRef.current?.focus();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        key="menu"
        ref={menuRef}
        variants={menuVariants as any}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="menu"
        aria-label="Context menu"
        aria-orientation="vertical"
        tabIndex={-1}
        style={{
          top: position.y,
          left: position.x,
          transformOrigin: 'top left',
        }}
        className={`
          fixed z-50 w-60 outline-none
          bg-[var(--bg-card)]/90 backdrop-blur-2xl
          border border-[var(--border-primary)]/50
          rounded-xl shadow-2xl
          overflow-hidden
        `}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Glass shine effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Menu content */}
        <div className="relative p-1.5 space-y-0.5">
          {menuItems.map((menuItem, index) => (
            <React.Fragment key={menuItem.id}>
              {/* Separator before destructive actions */}
              {menuItem.separator && (
                <div className="my-1.5 mx-2 h-px bg-[var(--border-primary)]/30" />
              )}

              {!menuItem.disabled && (
                <MenuItemButton
                  item={menuItem}
                  isActive={
                    navigableItems.findIndex(i => i.id === menuItem.id) ===
                    activeIndex
                  }
                  onAction={() => handleAction(menuItem.action)}
                  enableSounds={enableSounds}
                  onHaptic={handleHaptic}
                  playSound={handleSound}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom glass reflection */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(ContextMenu);
