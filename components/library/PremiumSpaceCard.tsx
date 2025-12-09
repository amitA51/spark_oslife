import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '../icons';

interface SpaceItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  description?: string;
  lastUpdated?: string;
}

interface PremiumSpaceCardProps {
  space: SpaceItem;
  onOpen: (id: string) => void;
  index?: number;
  // Drag & drop props
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
}

const PremiumSpaceCard: React.FC<PremiumSpaceCardProps> = ({
  space,
  onOpen,
  index = 0,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const rotateX = isHovered ? (mousePosition.y - 0.5) * -15 : 0;
  const rotateY = isHovered ? (mousePosition.x - 0.5) * 15 : 0;

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      onDragEnd={() => {
        // cleanup handled by parent
      }}
    >
      <motion.div
        className={`relative cursor-pointer ${isDragging ? 'opacity-50 scale-95' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => onOpen(space.id)}
        style={{
          perspective: '1000px',
        }}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 0.95 : 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
          delay: index * 0.05,
        }}
      >
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          whileHover={{ scale: 1.03, z: 50 }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `
              linear-gradient(135deg, 
                ${space.color}15 0%, 
                rgba(255,255,255,0.02) 50%,
                ${space.color}08 100%
              )
            `,
              border: `1px solid ${space.color}20`,
              backdropFilter: 'blur(24px)',
            }}
          />

          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
            style={{
              background: `linear-gradient(90deg, ${space.color}, ${space.color}60)`,
              boxShadow: `0 0 20px ${space.color}50`,
            }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
              radial-gradient(
                circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%,
                ${space.color}25 0%,
                transparent 50%
              )
            `,
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `
              radial-gradient(circle at 30% 20%, ${space.color}40 0%, transparent 40%),
              radial-gradient(circle at 70% 80%, ${space.color}30 0%, transparent 30%)
            `,
            }}
          />

          <div className="relative p-5 sm:p-6" style={{ transform: 'translateZ(20px)' }}>
            <motion.div
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4"
              style={{
                background: `linear-gradient(135deg, ${space.color}30 0%, ${space.color}10 100%)`,
                border: `1px solid ${space.color}40`,
                boxShadow: `
                0 4px 20px ${space.color}20,
                inset 0 1px 0 rgba(255,255,255,0.1)
              `,
              }}
              animate={{
                boxShadow: isHovered
                  ? `0 8px 40px ${space.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                  : `0 4px 20px ${space.color}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {space.icon}

              <motion.div
                className="absolute -inset-2 rounded-3xl"
                style={{
                  background: `radial-gradient(circle, ${space.color}40 0%, transparent 70%)`,
                  filter: 'blur(8px)',
                }}
                animate={{
                  opacity: isHovered ? 0.8 : 0.3,
                  scale: isHovered ? 1.2 : 1,
                }}
              />
            </motion.div>

            <div className="space-y-2">
              <motion.h3
                className="text-xl font-bold text-white font-heading"
                animate={{
                  x: isHovered ? 4 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {space.name}
              </motion.h3>

              {space.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {space.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: `${space.color}15`,
                      color: space.color,
                      border: `1px solid ${space.color}30`,
                    }}
                    animate={{
                      boxShadow: isHovered
                        ? `0 0 15px ${space.color}30`
                        : `0 0 0px ${space.color}00`,
                    }}
                  >
                    <span className="font-mono font-bold">{space.itemCount}</span>
                    <span className="text-xs opacity-70">פריטים</span>
                  </motion.span>
                </div>

                <motion.div
                  className="p-2 rounded-full"
                  style={{
                    background: `${space.color}10`,
                    border: `1px solid ${space.color}20`,
                  }}
                  animate={{
                    x: isHovered ? 0 : 10,
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 0.8,
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ChevronRightIcon
                    className="w-4 h-4 rotate-180"
                    style={{ color: space.color }}
                  />
                </motion.div>
              </div>

              {space.lastUpdated && (
                <motion.p
                  className="text-xs text-gray-500 pt-1"
                  animate={{
                    opacity: isHovered ? 1 : 0.6,
                  }}
                >
                  עודכן {space.lastUpdated}
                </motion.p>
              )}
            </div>
          </div>

          <motion.div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
            }}
            animate={{
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />

          <div
            className="absolute bottom-0 left-4 right-4 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${space.color}40, transparent)`,
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 rounded-3xl -z-10"
          style={{
            background: space.color,
            filter: 'blur(50px)',
          }}
          animate={{
            opacity: isHovered ? 0.2 : 0.08,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.4 }}
        />

        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full -z-20"
          style={{
            background: 'rgba(0,0,0,0.4)',
            filter: 'blur(10px)',
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0.3,
            scaleX: isHovered ? 0.9 : 0.8,
          }}
        />
      </motion.div>
    </div>
  );
};

export default PremiumSpaceCard;