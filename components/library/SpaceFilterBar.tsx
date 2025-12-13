import React from 'react';
import { SearchIcon } from '../icons';

interface SpaceFilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: 'order' | 'name' | 'itemCount' | 'updated';
    onSortChange: (sort: 'order' | 'name' | 'itemCount' | 'updated') => void;
    selectedTag: string | null;
    onTagSelect: (tag: string | null) => void;
    availableTags: string[];
    viewMode?: 'grid' | 'list';
    onViewChange?: (mode: 'grid' | 'list') => void;
}

export const SpaceFilterBar: React.FC<SpaceFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    selectedTag,
    onTagSelect,
    availableTags,
    viewMode,
    onViewChange
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="חפש מרחבים..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
                />
            </div>

            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as any)}
                    className="bg-transparent text-xs text-white/80 border-none focus:ring-0 cursor-pointer [&>option]:bg-[#1a1d24]"
                >
                    <option value="order">סדר מותאם</option>
                    <option value="name">שם (א-ת)</option>
                    <option value="itemCount">כמות פריטים</option>
                </select>

                <div className="w-px bg-white/10 mx-1 h-4 self-center" />

                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                        onClick={() => onViewChange?.('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        title="תצוגת גריד"
                    >
                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                            <div className="bg-current rounded-[1px]" />
                        </div>
                    </button>
                    <button
                        onClick={() => onViewChange?.('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        title="תצוגת רשימה"
                    >
                        <div className="w-4 h-4 flex flex-col gap-0.5">
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                            <div className="h-0.5 w-full bg-current rounded-[1px]" />
                        </div>
                    </button>
                </div>

                <div className="w-px bg-white/10 mx-1 h-4 self-center" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onTagSelect(null)}
                        className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${!selectedTag ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        הכל
                    </button>
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => onTagSelect(tag === selectedTag ? null : tag)}
                            className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${selectedTag === tag ? 'bg-[var(--dynamic-accent-start)] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
