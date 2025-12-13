import React from 'react';

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
