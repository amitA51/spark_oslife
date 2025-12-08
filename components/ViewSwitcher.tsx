import React, { useCallback, useId } from 'react';
import { motion } from 'framer-motion';

export type ViewMode = 'today' | 'tomorrow' | 'week';

interface ViewOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface ViewSwitcherProps<T extends string = ViewMode> {
  /** Currently selected view */
  currentView: T;
  /** Callback when view changes */
  onViewChange: (view: T) => void;
  /** Available view options */
  options?: ViewOption<T>[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show full width */
  fullWidth?: boolean;
  /** Additional class name */
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'p-0.5 gap-0.5',
    button: 'px-3 py-1.5 text-xs',
  },
  md: {
    container: 'p-1 gap-1',
    button: 'px-4 py-2 text-sm',
  },
  lg: {
    container: 'p-1.5 gap-1.5',
    button: 'px-5 py-2.5 text-base',
  },
};

const defaultViews: ViewOption<ViewMode>[] = [
  { id: 'today', label: 'היום' },
  { id: 'tomorrow', label: 'מחר' },
  { id: 'week', label: 'השבוע' },
];

function ViewSwitcher<T extends string = ViewMode>({
  currentView,
  onViewChange,
  options,
  size = 'md',
  fullWidth = false,
  className = '',
}: ViewSwitcherProps<T>) {
  const switcherId = useId();
  const views = (options || defaultViews) as ViewOption<T>[];
  const config = sizeConfig[size];

  const handleViewChange = useCallback((viewId: T) => {
    if (viewId !== currentView) {
      onViewChange(viewId);
    }
  }, [currentView, onViewChange]);

  return (
    <div
      role="tablist"
      aria-label="בחירת תצוגה"
      className={`
        relative flex items-center ${config.container}
        bg-white/[0.03] rounded-full 
        border border-white/[0.06]
        backdrop-blur-xl
        ${fullWidth ? 'w-full' : 'max-w-sm mx-auto'}
        ${className}
      `}
    >
      {views.map((view, index) => {
        const isActive = currentView === view.id;
        const buttonId = `${switcherId}-${view.id}`;

        return (
          <motion.button
            key={view.id}
            id={buttonId}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${buttonId}-panel`}
            onClick={() => handleViewChange(view.id)}
            className={`
              relative flex-1 flex items-center justify-center gap-2
              ${config.button} rounded-full font-semibold
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-[var(--dynamic-accent-start)]/50 
              focus-visible:ring-offset-1 focus-visible:ring-offset-transparent
              ${isActive
                ? 'text-white'
                : 'text-[var(--text-secondary)] hover:text-white/80'
              }
            `}
            whileTap={{ scale: 0.97 }}
          >
            {/* Active background indicator */}
            {isActive && (
              <motion.div
                layoutId={`${switcherId}-indicator`}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--dynamic-accent-start), var(--dynamic-accent-end))',
                  boxShadow: '0 2px 12px var(--dynamic-accent-glow)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
              {view.icon && (
                <span className={isActive ? 'drop-shadow-lg' : ''}>
                  {view.icon}
                </span>
              )}
              <span>{view.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default React.memo(ViewSwitcher) as typeof ViewSwitcher;
