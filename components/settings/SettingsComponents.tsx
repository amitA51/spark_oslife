import React, { useState } from 'react';
import { ThemeSettings } from '../../types';
import { ChevronDownIcon, ChevronLeftIcon } from '../icons';

// Premium Settings Section with animated header
export const SettingsSection: React.FC<{ title: string; children: React.ReactNode; id: string }> = ({
  title,
  children,
  id,
}) => (
  <div className="space-y-5 animate-premium-fade-in" id={id}>
    <div className="relative mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">
        {title}
      </h2>
      <div className="absolute -bottom-2 right-0 w-16 h-1 rounded-full bg-gradient-to-l from-[var(--dynamic-accent-start)] to-transparent" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// Premium Glass Card with hover effects
export const SettingsCard: React.FC<{
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}> = ({
  title,
  children,
  danger,
  icon,
  collapsible = false,
  defaultOpen = true,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div
        className={`
        relative overflow-hidden rounded-2xl transition-all duration-300
        ${danger
            ? 'bg-red-950/30 border border-red-500/30 hover:border-red-500/50'
            : 'bg-[var(--bg-card)]/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] hover:bg-[var(--bg-card)]/80'
          }
        hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      `}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

        <button
          onClick={() => collapsible && setIsOpen(!isOpen)}
          className={`
          relative z-10 w-full px-5 py-4 flex items-center justify-between
          ${collapsible ? 'cursor-pointer' : 'cursor-default'}
        `}
          disabled={!collapsible}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`
              p-2 rounded-xl transition-all duration-300
              ${danger
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[var(--dynamic-accent-start)]/10 text-[var(--dynamic-accent-start)]'
                }
            `}>
                {icon}
              </div>
            )}
            <h3
              className={`
              text-sm font-bold uppercase tracking-wider transition-colors
              ${danger ? 'text-red-400' : 'text-[var(--dynamic-accent-highlight)]'}
            `}
            >
              {title}
            </h3>
          </div>
          {collapsible && (
            <ChevronDownIcon
              className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        <div className={`
        relative z-10 transition-all duration-300 ease-out overflow-hidden
        ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
          <div className="px-5 pb-5 space-y-4">
            {children}
          </div>
        </div>
      </div>
    );
  };

// Premium Settings Row with better spacing and touch targets
export const SettingsRow: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({
  title,
  description,
  children,
  icon,
}) => (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-white/[0.06] first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 flex-1">
        {icon && (
          <div className="p-2 rounded-lg bg-white/[0.03] text-[var(--text-secondary)] group-hover:text-[var(--dynamic-accent-start)] transition-colors">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-[15px] leading-tight">{title}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-end sm:mr-0 mr-0">{children}</div>
    </div>
  );

// Premium Segmented Control with sliding indicator
export const SegmentedControl: React.FC<{
  options: { label: string; value: string; icon?: React.ReactNode }[];
  value: string | number;
  onChange: (value: any) => void;
}> = ({ options, value, onChange }) => {
  const selectedIndex = options.findIndex(opt => opt.value === value.toString());

  return (
    <div className="relative flex items-center p-1 bg-[var(--bg-secondary)]/80 rounded-xl border border-white/[0.06] w-full sm:w-auto overflow-hidden">
      {/* Sliding indicator */}
      <div
        className="absolute h-[calc(100%-8px)] bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)] rounded-lg transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: `calc(${(selectedIndex * 100) / options.length}% + 2px)`,
        }}
      />

      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            relative z-10 flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 whitespace-nowrap
            ${value.toString() === opt.value
              ? 'text-white'
              : 'text-[var(--text-secondary)] hover:text-white'
            }
          `}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
};

// Premium Theme Preview Card with 3D tilt
export const ThemePreviewCard: React.FC<{
  theme: ThemeSettings;
  isSelected: boolean;
  onClick: () => void;
}> = ({ theme, isSelected, onClick }) => {
  const cardStyleClass = `card-style-${theme.cardStyle}`;

  return (
    <button onClick={onClick} className="text-center group w-full">
      <div
        className={`
          relative w-full aspect-[4/3] rounded-2xl transition-all duration-300 overflow-hidden
          ${isSelected
            ? 'ring-2 ring-[var(--dynamic-accent-start)] shadow-[0_0_30px_var(--dynamic-accent-glow)]'
            : 'ring-1 ring-white/10 hover:ring-white/20'
          }
          group-hover:scale-[1.02] group-active:scale-[0.98]
        `}
        style={{ backgroundColor: '#0A0A0F' }}
      >
        {/* Theme preview content */}
        <div className={`w-full h-full p-3 flex flex-col justify-end ${cardStyleClass}`}>
          {/* Simulated UI elements */}
          <div className="space-y-2">
            <div className="w-3/4 h-2 rounded-full opacity-20" style={{ background: theme.accentColor }} />
            <div
              className="w-full h-8 rounded-lg p-2 flex items-end"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderLeft: `3px solid ${theme.accentColor}`,
              }}
            >
              <div className="w-1/2 h-1.5 rounded-full" style={{ background: theme.accentColor }} />
            </div>
          </div>
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[var(--dynamic-accent-start)] flex items-center justify-center shadow-lg">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <span
        className={`
          text-sm mt-2 font-semibold block transition-colors
          ${isSelected ? 'text-[var(--dynamic-accent-start)]' : 'text-[var(--text-secondary)] group-hover:text-white'}
        `}
      >
        {theme.name}
      </span>
    </button>
  );
};

// Premium Link Row for navigation items
export const SettingsLinkRow: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  badge?: string;
  badgeColor?: 'accent' | 'success' | 'warning' | 'danger';
}> = ({ title, description, icon, onClick, badge, badgeColor = 'accent' }) => {
  const badgeColors = {
    accent: 'bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)]',
    success: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-red-500/20 text-red-400',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all duration-200 group active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2.5 rounded-xl bg-[var(--dynamic-accent-start)]/10 text-[var(--dynamic-accent-start)] group-hover:bg-[var(--dynamic-accent-start)]/20 transition-colors">
            {icon}
          </div>
        )}
        <div className="text-right">
          <span className="text-white font-medium block">{title}</span>
          {description && (
            <span className="text-xs text-[var(--text-secondary)]">{description}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
        <ChevronLeftIcon className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
      </div>
    </button>
  );
};

// Premium Toggle Row (combined toggle + info)
export const SettingsToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}> = ({ title, description, checked, onChange, icon }) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all duration-200 group active:scale-[0.99]"
  >
    <div className="flex items-center gap-3">
      {icon && (
        <div className={`p-2.5 rounded-xl transition-colors ${checked ? 'bg-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-start)]' : 'bg-white/[0.05] text-[var(--text-secondary)]'}`}>
          {icon}
        </div>
      )}
      <div className="text-right">
        <span className="text-white font-medium block">{title}</span>
        <span className="text-xs text-[var(--text-secondary)]">{description}</span>
      </div>
    </div>
    {/* Inline Toggle */}
    <div className={`
      relative w-12 h-7 rounded-full transition-all duration-300
      ${checked
        ? 'bg-gradient-to-r from-[var(--dynamic-accent-start)] to-[var(--dynamic-accent-end)]'
        : 'bg-white/10'
      }
    `}>
      <div className={`
        absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300
        ${checked ? 'right-1' : 'left-1'}
      `} />
    </div>
  </button>
);

// Info Banner for tips/notes
export const SettingsInfoBanner: React.FC<{
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
}> = ({ children, variant = 'info' }) => {
  const variants = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    tip: 'bg-[var(--dynamic-accent-start)]/10 border-[var(--dynamic-accent-start)]/20 text-[var(--dynamic-accent-highlight)]',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  };

  const icons = {
    info: 'ℹ️',
    tip: '💡',
    warning: '⚠️',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${variants[variant]}`}>
      <span className="text-base">{icons[variant]}</span>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
};
