import React from 'react';
import { CloseIcon, FilterIcon, CalendarDaysIcon, ListIcon } from './icons';
import type { SearchFilters } from '../types';

interface SearchFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({
  label,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${isActive ? 'bg-[var(--accent-start)] text-black font-semibold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
  >
    {label}
  </button>
);

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}) => {
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 ease-[var(--fi-cubic-bezier)] md:relative md:z-0 md:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="absolute inset-0 bg-black/50 md:hidden" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FilterIcon className="w-5 h-5" /> סינון
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-white/10 md:hidden"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto">
          {/* Filter by Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">סוג פריט</h3>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="הכל"
                isActive={filters.type === 'all'}
                onClick={() => updateFilter('type', 'all')}
              />
              <FilterButton
                label="משימות"
                isActive={filters.type === 'task'}
                onClick={() => updateFilter('type', 'task')}
              />
              <FilterButton
                label="פתקים"
                isActive={filters.type === 'note'}
                onClick={() => updateFilter('type', 'note')}
              />
              <FilterButton
                label="פיד"
                isActive={filters.type === 'rss' || filters.type === 'spark'}
                onClick={() => updateFilter('type', 'rss')}
              />
              <FilterButton
                label="לוח שנה"
                isActive={filters.type === 'calendar'}
                onClick={() => updateFilter('type', 'calendar')}
              />
            </div>
          </div>

          {/* Filter by Date Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase flex items-center gap-1.5">
              <CalendarDaysIcon className="w-4 h-4" /> תאריך
            </h3>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="כל הזמן"
                isActive={filters.dateRange === 'all'}
                onClick={() => updateFilter('dateRange', 'all')}
              />
              <FilterButton
                label="היום"
                isActive={filters.dateRange === 'today'}
                onClick={() => updateFilter('dateRange', 'today')}
              />
              <FilterButton
                label="השבוע"
                isActive={filters.dateRange === 'week'}
                onClick={() => updateFilter('dateRange', 'week')}
              />
              <FilterButton
                label="החודש"
                isActive={filters.dateRange === 'month'}
                onClick={() => updateFilter('dateRange', 'month')}
              />
            </div>
          </div>

          {/* Filter by Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase flex items-center gap-1.5">
              <ListIcon className="w-4 h-4" /> סטטוס
            </h3>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="הכל"
                isActive={filters.status === 'all'}
                onClick={() => updateFilter('status', 'all')}
              />
              <FilterButton
                label="פתוח"
                isActive={filters.status === 'open'}
                onClick={() => updateFilter('status', 'open')}
              />
              <FilterButton
                label="הושלם"
                isActive={filters.status === 'completed'}
                onClick={() => updateFilter('status', 'completed')}
              />
              <FilterButton
                label="חשוב"
                isActive={filters.status === 'important'}
                onClick={() => updateFilter('status', 'important')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterPanel;
