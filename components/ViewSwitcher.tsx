import React from 'react';

export type ViewMode = 'today' | 'tomorrow' | 'week';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
    const views: { id: ViewMode, label: string }[] = [
        { id: 'today', label: 'היום' },
        { id: 'tomorrow', label: 'מחר' },
        { id: 'week', label: 'השבוע' },
    ];
    return (
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-full max-w-sm mx-auto shadow-inner shadow-black/20">
            {views.map(view => (
                <button
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={`flex-1 px-4 py-2 text-sm rounded-full font-bold transition-all ${currentView === view.id
                            ? 'bg-[var(--accent-gradient)] text-white shadow-[0_0_15px_var(--dynamic-accent-glow)]'
                            : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                >
                    {view.label}
                </button>
            ))}
        </div>
    );
};

export default ViewSwitcher;
