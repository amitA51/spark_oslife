import React from 'react';

interface SectionProps {
    title: string;
    children: React.ReactNode;
    count: number;
    isCollapsible: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    className?: string;
    componentId: string;
    emptyMessage?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, count, isCollapsible, isExpanded, onToggle, className, componentId, emptyMessage }) => {
    const sectionContentId = `section-content-${componentId}`;

    return (
        <section className={className}>
            <button
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={sectionContentId}
                className="w-full flex justify-between items-center mb-3 px-1 disabled:cursor-default group"
                disabled={!isCollapsible}
            >
                <h2 className="text-sm font-bold text-[var(--dynamic-accent-highlight)] uppercase tracking-wider flex items-center gap-2">
                    {title}
                    {isCollapsible && <div className={`h-px flex-1 bg-[var(--border-primary)] group-hover:bg-[var(--dynamic-accent-start)] transition-colors`}></div>}
                </h2>
                {isCollapsible && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] p-1">
                        <span className="text-xs font-mono font-bold">{count > 0 ? count : ''}</span>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--dynamic-accent-start)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                )}
            </button>
            {isExpanded && (
                <div id={sectionContentId} className="space-y-3">
                    {count === 0 && emptyMessage ? (
                        <p className="text-center text-sm text-[var(--text-secondary)] py-4 italic opacity-60">
                            {emptyMessage}
                        </p>
                    ) : (
                        children
                    )}
                </div>
            )}
        </section>
    );
};

export default Section;
