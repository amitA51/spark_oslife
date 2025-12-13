import React from 'react';
import { SearchIcon, SortAscIcon, FilterIcon } from '../icons';


interface SpaceItemFilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;

    sortBy: 'priority' | 'date' | 'name' | 'status';
    onSortChange: (sort: 'priority' | 'date' | 'name' | 'status') => void;

    groupBy: 'none' | 'status' | 'priority' | 'type';
    onGroupChange: (group: 'none' | 'status' | 'priority' | 'type') => void;

    viewMode: 'list' | 'board' | 'grid';
    onViewChange: (mode: 'list' | 'board' | 'grid') => void;

    activeFilters: number; // Count of active filters
    onToggleFilters: () => void;
}

export const SpaceItemFilterBar: React.FC<SpaceItemFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    groupBy,
    onGroupChange,
    viewMode,
    onViewChange,
    activeFilters,
    onToggleFilters
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
            {/* Search */}
            <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="חפש במרחב..."
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-sm h-10"
                />
            </div>

            <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/5 h-10 items-center overflow-x-auto no-scrollbar">

                {/* View Toggle */}
                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                    <button
                        onClick={() => onViewChange('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-white'}`}
                        title="רשימה"
                    >
                        <div className="w-4 h-4 flex flex-col gap-0.5">
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                        </div>
                    </button>
                    <button
                        onClick={() => onViewChange('board')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-white'}`}
                        title="לוח"
                    >
                        <div className="w-4 h-4 flex gap-0.5">
                            <div className="h-full w-1/3 bg-current rounded-[1px]" />
                            <div className="h-full w-1/3 bg-current rounded-[1px]" />
                            <div className="h-full w-1/3 bg-current rounded-[1px]" />
                        </div>
                    </button>
                    <button
                        onClick={() => onViewChange('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-white'}`}
                        title="גריד"
                    >
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                        </div>
                    </button>
                </div>

                <div className="w-px bg-white/10 mx-1 h-4" />

                {/* Sort */}
                <div className="relative group">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as any)}
                        className="appearance-none bg-transparent pl-2 pr-6 text-xs text-white/80 border-none focus:ring-0 cursor-pointer [&>option]:bg-[#1a1d24]"
                    >
                        <option value="priority">עדיפות</option>
                        <option value="date">תאריך</option>
                        <option value="name">שם</option>
                        <option value="status">סטטוס</option>
                    </select>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <SortAscIcon className="w-3 h-3" />
                    </div>
                </div>

                <div className="w-px bg-white/10 mx-1 h-4" />

                {/* Group By */}
                <select
                    value={groupBy}
                    onChange={(e) => onGroupChange(e.target.value as any)}
                    className="bg-transparent text-xs text-white/80 border-none focus:ring-0 cursor-pointer [&>option]:bg-[#1a1d24]"
                >
                    <option value="none">ללא קבוצות</option>
                    <option value="status">לפי סטטוס</option>
                    <option value="priority">לפי עדיפות</option>
                    <option value="type">לפי סוג</option>
                </select>

                <div className="w-px bg-white/10 mx-1 h-4" />

                {/* Filter Button */}
                <button
                    onClick={onToggleFilters}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${activeFilters > 0 ? 'bg-[var(--dynamic-accent-start)] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FilterIcon className="w-3 h-3" />
                    <span>סינון</span>
                    {activeFilters > 0 && (
                        <span className="bg-white/20 px-1 rounded text-[10px]">{activeFilters}</span>
                    )}
                </button>

            </div>
        </div>
    );
};
