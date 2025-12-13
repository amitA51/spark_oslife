import React from 'react';
import { ThemeSettings } from '../../types';

// Premium Theme Preview Card with Gradient Display
export const ThemePreviewCard: React.FC<{
    theme: ThemeSettings;
    isSelected: boolean;
    onClick: () => void;
}> = ({ theme, isSelected, onClick }) => {
    const gradientStart = theme.gradientStart || theme.accentColor;
    const gradientEnd = theme.gradientEnd || theme.accentColor;
    const glowColor = theme.glowColor || theme.accentColor;

    return (
        <button onClick={onClick} className="text-center group w-full">
            <div
                className={`
          relative w-full aspect-[4/3] rounded-2xl transition-all duration-300 overflow-hidden
          ${isSelected
                        ? 'ring-2 shadow-[0_0_35px_var(--glow-color)]'
                        : 'ring-1 ring-white/10 hover:ring-white/25'
                    }
          group-hover:scale-[1.03] group-active:scale-[0.98]
          group-hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]
        `}
                style={{
                    backgroundColor: '#0A0A0F',
                    '--glow-color': `${glowColor}50`,
                    ringColor: isSelected ? gradientStart : undefined,
                } as React.CSSProperties}
            >
                {/* Gradient Strip at Top */}
                <div
                    className="absolute top-0 left-0 right-0 h-12"
                    style={{
                        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    }}
                />

                {/* Theme preview content */}
                <div className="w-full h-full p-3 pt-14 flex flex-col justify-end">
                    {/* Simulated UI elements */}
                    <div className="space-y-2">
                        {/* Mini card */}
                        <div
                            className="w-full h-10 rounded-lg p-2 flex items-end relative overflow-hidden"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: theme.borderRadius === 'xl' ? '12px' : theme.borderRadius === 'lg' ? '8px' : '6px',
                            }}
                        >
                            {/* Gradient accent bar */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1"
                                style={{ background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})` }}
                            />
                            <div className="w-2/3 h-1.5 rounded-full ml-2" style={{ background: gradientStart }} />
                        </div>
                        {/* Mini progress bar */}
                        <div className="flex gap-2 items-center">
                            <div
                                className="w-4 h-4 rounded-full animate-pulse"
                                style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                            />
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full w-2/3 rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Glow effect on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor}, transparent 70%)` }}
                />

                {/* Selected checkmark with gradient */}
                {isSelected && (
                    <div
                        className="absolute top-14 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                    >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>
            <span
                className={`
          text-sm mt-2 font-semibold block transition-colors
          ${isSelected ? '' : 'text-[var(--text-secondary)] group-hover:text-white'}
        `}
                style={{ color: isSelected ? gradientStart : undefined }}
            >
                {theme.name}
            </span>
        </button>
    );
};
