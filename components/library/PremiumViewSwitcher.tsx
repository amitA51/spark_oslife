import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  ListIcon,
  CalendarIcon,
  ChartBarIcon,
  FileIcon,
  ShieldCheckIcon,
} from '../icons';

export type HubView = 'dashboard' | 'timeline' | 'board' | 'calendar' | 'vault' | 'investments' | 'files';

interface ViewConfig {
  id: HubView;
  icon: React.FC<{ className?: string }>;
  label: string;
  gradient?: string;
}

const views: ViewConfig[] = [
  { id: 'dashboard', icon: LayoutDashboardIcon, label: 'דשבורד', gradient: 'from-cyan-500 to-blue-500' },
  { id: 'timeline', icon: ListIcon, label: 'ציר זמן', gradient: 'from-violet-500 to-purple-500' },
  { id: 'board', icon: LayoutDashboardIcon, label: 'לוח', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'calendar', icon: CalendarIcon, label: 'לוח שנה', gradient: 'from-pink-500 to-rose-500' },
  { id: 'files', icon: FileIcon, label: 'קבצים', gradient: 'from-amber-500 to-orange-500' },
  { id: 'investments', icon: ChartBarIcon, label: 'השקעות', gradient: 'from-green-500 to-emerald-500' },
  { id: 'vault', icon: ShieldCheckIcon, label: 'כספת', gradient: 'from-slate-500 to-gray-500' },
];

interface PremiumViewSwitcherProps {
  currentView: HubView;
  onViewChange: (view: HubView) => void;
}

const PremiumViewSwitcher: React.FC<PremiumViewSwitcherProps> = ({
  currentView,
  onViewChange,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, viewId: HubView) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewChange(viewId);
      return;
    }

    // Arrow key navigation between tabs
    const currentIndex = views.findIndex(v => v.id === currentView);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + views.length) % views.length;
      const nextView = views[nextIndex];
      if (nextView) {
        onViewChange(nextView.id);
      }
    }
  };

  return (
    <div className="relative">
      {/* Outer container with premium glass effect */}
      <div
        className="relative flex items-center gap-1 p-1 sm:p-1.5 md:p-2 rounded-2xl overflow-hidden max-w-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        role="tablist"
        aria-label="תצוגות המתכנן"
      >
        {/* Background blur layer */}
        <div className="absolute inset-0 backdrop-blur-xl -z-10" />

        {/* Scrollable container for tabs */}
        <div
          className="flex items-stretch gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar w-full px-0.5"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {views.map(view => {
            const isActive = currentView === view.id;
            const Icon = view.icon;

            return (
              <motion.button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                onKeyDown={e => handleKeyDown(e, view.id)}
                className={`
                  relative inline-flex items-center justify-center gap-1.5 sm:gap-2
                  px-3 sm:px-3.5 md:px-4 py-2.5 sm:py-2.5 rounded-xl
                  font-medium text-[13px] xs:text-sm leading-tight
                  transition-colors duration-200
                  shrink-0 whitespace-nowrap
                  min-w-[auto] sm:min-w-[88px]
                  touch-manipulation select-none
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dynamic-accent-start)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]
                  ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
                `}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: 0.96 }}
                role="tab"
                aria-selected={isActive}
                aria-label={view.label}
                tabIndex={isActive ? 0 : -1}
              >
                {/* Active indicator background with glass shine */}
                {isActive && (
                  <motion.div
                    layoutId="view-indicator"
                    className="absolute inset-0 rounded-xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, var(--dynamic-accent-color) 0%, rgba(var(--dynamic-accent-color), 0.8) 100%)',
                      boxShadow:
                        '0 0 30px var(--dynamic-accent-glow), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 28,
                    }}
                  >
                    {/* Glass shine sweep effect */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                        transform: 'skewX(-20deg)',
                      }}
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                )}

                {/* Glow effect for active tab */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background:
                        'radial-gradient(circle at center, var(--dynamic-accent-glow) 0%, transparent 70%)',
                      filter: 'blur(12px)',
                    }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    rotate: isActive ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{
                    scale: { duration: 0.2 },
                    rotate: { duration: 0.4, ease: 'easeInOut' },
                  }}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_var(--dynamic-accent-start)]' : ''
                      }`}
                  />
                </motion.div>

                {/* Label - always visible now for better UX, but smaller on mobile */}
                <span className="relative z-10">
                  {view.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Subtle gradient edge indicators for scroll - enhanced for mobile */}
      <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-[var(--bg-primary)] to-transparent pointer-events-none opacity-80 sm:hidden rounded-l-2xl" />
      <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-[var(--bg-primary)] to-transparent pointer-events-none opacity-80 sm:hidden rounded-r-2xl" />
    </div>
  );
};

export default PremiumViewSwitcher;