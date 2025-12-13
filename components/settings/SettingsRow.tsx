import React from 'react';

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
