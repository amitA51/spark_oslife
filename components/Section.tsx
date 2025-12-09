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

const Section: React.FC<SectionProps> = React.memo(
  ({
    title,
    children,
    count,
    isCollapsible,
    isExpanded,
    onToggle,
    className,
    componentId,
    emptyMessage,
  }) => {
    const sectionContentId = `section-content-${componentId}`;

    return (
      <section className={`transition-all duration-300 ease-spring-soft ${className}`}>
        <button
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={sectionContentId}
          className="w-full flex justify-between items-center mb-4 px-1 disabled:cursor-default group select-none"
          disabled={!isCollapsible}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <h2
                className="text-sm font-bold uppercase tracking-widest flex items-center gap-3 font-heading"
                style={{
                  background: 'linear-gradient(135deg, var(--dynamic-accent-start) 0%, var(--dynamic-accent-end) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                }}
              >
                {title}
              </h2>
              {/* Decorative underline */}
              <div
                className="absolute -bottom-1 right-0 h-0.5 w-8 rounded-full opacity-60"
                style={{
                  background: 'linear-gradient(90deg, var(--dynamic-accent-start), transparent)',
                }}
              />
            </div>
            {count > 0 && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--dynamic-accent-start)/10, var(--dynamic-accent-end)/5)',
                  border: '1px solid var(--dynamic-accent-start)',
                  color: 'var(--dynamic-accent-start)',
                  boxShadow: '0 2px 8px var(--dynamic-accent-glow), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                {count}
              </span>
            )}
          </div>

          {isCollapsible && (
            <div
              className="flex items-center gap-2 text-gray-500 p-1 transition-colors"
              style={{
                ['--hover-color' as any]: 'var(--dynamic-accent-start)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--dynamic-accent-start)'}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-300 ease-spring-soft ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          )}
        </button>

        <div
          id={sectionContentId}
          className={`space-y-3 transition-all duration-500 ease-spring-soft overflow-hidden ${isExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}
        >
          {count === 0 && emptyMessage ? (
            <div className="text-center py-8 rounded-xl bg-cosmos-depth/40 backdrop-blur-sm border border-white/5 border-dashed">
              <p className="text-sm text-gray-500 italic">
                {emptyMessage}
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </section>
    );
  }
);

Section.displayName = 'Section';

export default Section;
