import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, CheckCircleIcon, ClockIcon, StarIcon } from '../icons';

interface ProjectItem {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  dueDate?: string;
  color?: string;
  icon?: string;
  isPinned?: boolean;
  description?: string;
}

interface PremiumProjectCardProps {
  project: ProjectItem;
  onOpen: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

const PremiumProjectCard: React.FC<PremiumProjectCardProps> = ({
  project,
  onOpen,
  onTogglePin,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const dueStatus = useMemo(() => {
    if (!project.dueDate) return null;
    
    const today = new Date();
    const due = new Date(project.dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'איחור', color: '#EF4444', urgent: true };
    if (diffDays === 0) return { text: 'היום', color: '#F59E0B', urgent: true };
    if (diffDays <= 3) return { text: `${diffDays} ימים`, color: '#F59E0B', urgent: false };
    return { text: due.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }), color: '#6B7280', urgent: false };
  }, [project.dueDate]);

  const statusConfig = {
    active: { 
      label: 'פעיל', 
      color: '#10B981', 
      bgColor: 'rgba(16, 185, 129, 0.1)',
      ringColor: 'var(--dynamic-accent-start)',
    },
    paused: { 
      label: 'מושהה', 
      color: '#F59E0B', 
      bgColor: 'rgba(245, 158, 11, 0.1)',
      ringColor: '#F59E0B',
    },
    completed: { 
      label: 'הושלם', 
      color: '#8B5CF6', 
      bgColor: 'rgba(139, 92, 246, 0.1)',
      ringColor: '#8B5CF6',
    },
  };

  const status = statusConfig[project.status];
  const projectColor = project.color || 'var(--dynamic-accent-start)';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const rotateX = isHovered ? (mousePosition.y - 0.5) * -10 : 0;
  const rotateY = isHovered ? (mousePosition.x - 0.5) * 10 : 0;

  const ringSize = 56;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (project.progress / 100) * circumference;

  return (
    <motion.div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => onOpen(project.id)}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255,255,255,0.03) 0%, 
                rgba(255,255,255,0.01) 100%
              )
            `,
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        />

        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${projectColor}, ${projectColor}80)`,
          }}
        />

        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(
              600px circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%,
              ${projectColor}15,
              transparent 40%
            )`,
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-lg sm:text-xl"
                  style={{
                    background: `${projectColor}20`,
                    border: `1px solid ${projectColor}30`,
                  }}
                  animate={{
                    boxShadow: isHovered 
                      ? `0 0 20px ${projectColor}40` 
                      : `0 0 0px ${projectColor}00`,
                  }}
                >
                  {project.icon || '📁'}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white truncate font-heading">
                      {project.name}
                    </h3>
                    
                    {project.isPinned && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin?.(project.id);
                        }}
                        className="p-0.5"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <StarIcon className="w-4 h-4 text-yellow-400" filled />
                      </motion.button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: status.bgColor,
                        color: status.color,
                      }}
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </span>
                    
                    {dueStatus && (
                      <span
                        className={`
                          inline-flex items-center gap-1 text-xs font-medium
                          ${dueStatus.urgent ? 'animate-pulse' : ''}
                        `}
                        style={{ color: dueStatus.color }}
                      >
                        <ClockIcon className="w-3 h-3" />
                        {dueStatus.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-gray-400 line-clamp-1 mt-2 mb-3">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${status.ringColor}, ${status.ringColor}80)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                  {project.completedTasks}/{project.totalTasks}
                </span>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <svg 
                width={ringSize} 
                height={ringSize} 
                className="transform -rotate-90"
              >
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={strokeWidth}
                />
                
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke={status.ringColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  style={{
                    filter: `drop-shadow(0 0 6px ${status.ringColor}60)`,
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-sm font-bold font-mono"
                  style={{ color: status.ringColor }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {Math.round(project.progress)}%
                </motion.span>
              </div>

              {project.status === 'completed' && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.6 }}
                >
                  <CheckCircleIcon className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
          </div>

          <motion.div
            className="absolute bottom-4 left-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              x: isHovered ? 0 : -10,
            }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="p-2 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <ChevronRightIcon className="w-4 h-4 text-gray-400 rotate-180" />
            </div>
          </motion.div>
        </div>

        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${projectColor}30 50%, transparent 100%)`,
          }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 rounded-2xl -z-10"
        style={{
          background: projectColor,
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: isHovered ? 0.15 : 0.05,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default PremiumProjectCard;