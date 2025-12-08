import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  LayoutIcon,
  CloseIcon,
  InboxIcon,
  RoadmapIcon,
  LayoutDashboardIcon,
  FileIcon
} from '../icons';

interface LibraryStats {
  inbox: number;
  projects: number;
  spaces: number;
  total: number;
}

interface PremiumLibraryHeaderProps {
  title: string;
  stats: LibraryStats;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onOpenAssistant: () => void;
  onOpenSplitView: () => void;
}

const PremiumLibraryHeader: React.FC<PremiumLibraryHeaderProps> = ({
  title,
  stats,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onOpenAssistant,
  onOpenSplitView,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="relative z-20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title & Stats */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 font-heading tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--dynamic-accent-start)] animate-pulse" />
              <span className="text-xs font-medium text-white/70 font-mono">
                {stats.total}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 text-xs text-gray-400 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <InboxIcon className="w-3.5 h-3.5" />
              <span>{stats.inbox} בתיבה</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <RoadmapIcon className="w-3.5 h-3.5" />
              <span>{stats.projects} פרוייקטים</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <LayoutDashboardIcon className="w-3.5 h-3.5" />
              <span>{stats.spaces} מרחבים</span>
            </div>
          </motion.div>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Search Bar */}
          <motion.div
            className={`relative flex-1 sm:w-64 transition-all duration-300 ${isSearchFocused ? 'sm:w-80' : 'sm:w-64'}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className={`relative flex items-center bg-white/5 border transition-all duration-300 rounded-2xl overflow-hidden
                ${isSearchFocused
                  ? 'border-[var(--dynamic-accent-start)] shadow-[0_0_20px_var(--dynamic-accent-start-alpha)] bg-black/40'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
            >
              <SearchIcon className={`w-4 h-4 absolute left-3 transition-colors duration-300 ${isSearchFocused ? 'text-[var(--dynamic-accent-start)]' : 'text-gray-400'
                }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="חיפוש..."
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 py-2.5 pl-10 pr-4 outline-none font-sans"
              />

              <AnimatePresence>
                {!searchQuery && !isSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none"
                  >
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-white/5 rounded border border-white/10">
                      CMD+K
                    </kbd>
                  </motion.div>
                )}
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl -z-10 pointer-events-none"
              animate={{
                opacity: isSearchFocused ? 0.5 : 0,
                scale: isSearchFocused ? 1.02 : 1,
              }}
              style={{
                background: 'radial-gradient(circle at center, var(--dynamic-accent-start) 0%, transparent 70%)',
                filter: 'blur(15px)',
              }}
            />
          </motion.div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAssistant}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-[var(--dynamic-accent-start)] hover:bg-white/10 hover:border-[var(--dynamic-accent-start)]/50 transition-all group relative overflow-hidden"
              title="Assistant"
            >
              <SparklesIcon className="w-5 h-5" />
              <div className="absolute inset-0 bg-[var(--dynamic-accent-start)]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSplitView}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hidden sm:block"
              title="Split View"
            >
              <LayoutIcon className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all sm:block"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PremiumLibraryHeader;