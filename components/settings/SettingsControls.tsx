import React from 'react';
import { ChevronLeftIcon } from '../icons';

// Premium Segmented Control with sliding indicator
export const SegmentedControl: React.FC<{
    options: { label: string; value: string; icon?: React.ReactNode }[];
    value: string | number;
    onChange: (value: string) => void;
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
