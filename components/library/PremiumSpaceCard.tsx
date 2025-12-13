import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, PinIcon } from '../icons';


interface SpaceItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  description?: string;
  lastUpdated?: string;
  tags?: string[];
  category?: string;
  isPinned?: boolean;
}

interface PremiumSpaceCardProps {
  space: SpaceItem;
  // Use onOpen instead of onClick for consistency with existing usage if needed, or stick to onClick. 
  // Looking at LibraryScreen, it uses onOpen in the current code, but I'll make it flexible or update LibraryScreen.
  // LibraryScreen currently passes onOpen. I will support onOpen.
  onOpen: (id: string, space: SpaceItem) => void;
  index?: number;
  // Drag & drop props
  draggable?: boolean; // Added for flexibility
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;

  // New props
  viewMode?: 'grid' | 'list';
  onTogglePin?: (e: React.MouseEvent) => void;
}

const PremiumSpaceCard: React.FC<PremiumSpaceCardProps> = ({
  space,
  onOpen,
  index = 0,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  viewMode = 'grid',
  onTogglePin,
  draggable,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // --- LIST VIEW ---
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        onClick={() => onOpen(space.id, space)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative group cursor-pointer ${isDragging ? 'opacity-30' : ''}`}
        draggable={draggable}
        onDragStart={(e) => onDragStart && onDragStart(e as any)}
        onDragOver={(e) => onDragOver && onDragOver(e as any)}
        onDrop={(e) => onDrop && onDrop(e as any)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
        whileTap={{ scale: 0.99 }}
      >
        <div
          className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-[#141419]"
          style={{
            borderColor: isHovered ? `${space.color}40` : 'rgba(255,255,255,0.05)',
          }}
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            style={{
              background: `${space.color}15`,
              color: space.color,
            }}
          >
            <span className="text-xl">{space.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white truncate">{space.name}</h3>
              {space.description && (
                <p className="text-xs text-gray-400 truncate max-w-[200px]">{space.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Tags */}
              {space.tags && space.tags.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {space.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
                {space.itemCount}
              </span>

              {/* Pin Button */}
              {onTogglePin && (space.isPinned || isHovered) && (
                <button
                  onClick={onTogglePin}
                  className={`p-1.5 rounded-full transition-all ${space.isPinned ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                >
                  <PinIcon className="w-4 h-4" filled={space.isPinned} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- GRID VIEW (Default) ---
  return (
    <motion.div
      layout
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(space.id, space)}
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e as any)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e as any);
      }}
      onDrop={(e) => onDrop && onDrop(e as any)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.3 : 1,
        scale: isDragging ? 0.95 : 1,
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-[#141419] border border-white/5 h-full"
        animate={{
          borderColor: isHovered ? `${space.color}40` : 'rgba(255,255,255,0.05)',
          boxShadow: isHovered
            ? `0 20px 40px -10px ${space.color}15`
            : '0 0 0 0 transparent',
        }}
        // Remove fixed height to allow content to dictate or CSS grid to handle it
        style={{ minHeight: '220px' } as any}
      >
        {/* Header Image / Gradient Area */}
        <div
          className="h-28 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${space.color}15 0%, ${space.color}05 100%)`,
          }}
        >
          {/* Big background icon */}
          <div
            className="absolute -right-4 -bottom-6 text-9xl opacity-[0.07] rotate-12 select-none pointer-events-none"
            style={{ color: space.color }}
          >
            {space.icon}
          </div>

          {/* Pin Button (Absolute Top Left) */}
          {onTogglePin && (
            <div className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${space.isPinned || isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(e);
                }}
                className={`p-2 rounded-xl backdrop-blur-md transition-all ${space.isPinned
                  ? `bg-[var(--dynamic-accent-start)] text-white shadow-lg`
                  : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white'}`}
              >
                <PinIcon className="w-4 h-4" filled={space.isPinned} />
              </button>
            </div>
          )}

        </div>

        {/* Content Body */}
        <div className="p-5 relative">
          {/* Floating Icon */}
          <div className="absolute -top-8 right-5">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/10 text-3xl"
              style={{
                background: isHovered ? `${space.color}30` : 'rgba(30,30,35,0.8)',
                boxShadow: `0 8px 30px -5px ${space.color}20`,
              } as any}
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? [0, -5, 5, 0] : 0
              }}
            >
              {space.icon}
            </motion.div>
          </div>

          <motion.h3
            className="text-xl font-bold text-white font-heading mt-6 mb-1"
            animate={{
              x: isHovered ? 2 : 0,
            }}
          >
            {space.name}
          </motion.h3>

          {space.description && (
            <p className="text-sm text-gray-400 line-clamp-2 h-10 mb-3 leading-relaxed">
              {space.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
            <div className="flex flex-col gap-1">
              {/* Item Count Pill */}
              <div className="flex items-center gap-2">
                <motion.span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5"
                  style={{ color: space.color } as any}
                >
                  <span className="font-bold">{space.itemCount}</span>
                  <span className="opacity-70">פריטים</span>
                </motion.span>
              </div>

              {/* Tags (limited) */}
              {space.tags && space.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {space.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] text-gray-500">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <motion.div
              className="p-2 rounded-full"
              style={{
                background: `${space.color}10`,
                border: `1px solid ${space.color}20`,
              } as any}
              animate={{
                x: isHovered ? 0 : 5,
                opacity: isHovered ? 1 : 0.5,
              }}
            >
              <ChevronRightIcon
                className="w-4 h-4 rotate-180"
                style={{ color: space.color }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PremiumSpaceCard;