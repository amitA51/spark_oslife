import React from 'react';
import { motion } from 'framer-motion';
import { FONT_SIZE } from '../constants/designTokens';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'tasks' | 'habits' | 'feed' | 'search' | 'generic' | 'calendar' | 'notes' | 'workout' | 'success' | 'error';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

const TasksIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="tasksGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <filter id="tasksShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#06B6D4" floodOpacity="0.3" />
      </filter>
    </defs>
    <motion.rect
      x="40" y="30" width="120" height="140" rx="16"
      fill="rgba(255,255,255,0.05)"
      stroke="url(#tasksGradient)"
      strokeWidth="2"
      filter="url(#tasksShadow)"
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
    />
    <motion.rect
      x="55" y="55" width="90" height="12" rx="6"
      fill="rgba(255,255,255,0.1)"
      initial={animated ? { opacity: 0, x: -20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    <motion.rect
      x="55" y="80" width="70" height="12" rx="6"
      fill="rgba(255,255,255,0.08)"
      initial={animated ? { opacity: 0, x: -20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.4 }}
    />
    <motion.rect
      x="55" y="105" width="80" height="12" rx="6"
      fill="rgba(255,255,255,0.06)"
      initial={animated ? { opacity: 0, x: -20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
    <motion.circle
      cx="100" cy="145"
      r="20"
      fill="url(#tasksGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.6 }}
    />
    <motion.path
      d="M92 145l6 6 12-12"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.8 }}
    />
  </svg>
);

const HabitsIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="habitsGradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.rect
        key={i}
        x={35 + i * 28}
        y={160 - (i === 2 ? 100 : i === 1 || i === 3 ? 70 : i === 0 || i === 4 ? 40 : 30)}
        width="20"
        height={i === 2 ? 100 : i === 1 || i === 3 ? 70 : i === 0 || i === 4 ? 40 : 30}
        rx="6"
        fill={i === 2 ? 'url(#habitsGradient)' : 'rgba(255,255,255,0.1)'}
        initial={animated ? { scaleY: 0, originY: 1 } : {}}
        animate={animated ? { scaleY: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.1 * i, ease: 'easeOut' }}
      />
    ))}
    <motion.circle
      cx="100" cy="45"
      r="25"
      fill="url(#habitsGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
    />
    <motion.path
      d="M100 30v15M100 55l10-10M100 55l-10-10"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.7 }}
    />
  </svg>
);

const FeedIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="feedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <motion.rect
      x="25" y="25" width="70" height="70" rx="16"
      fill="rgba(255,255,255,0.05)"
      stroke="url(#feedGradient)"
      strokeWidth="2"
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.1 }}
    />
    <motion.rect
      x="105" y="25" width="70" height="32" rx="10"
      fill="rgba(255,255,255,0.08)"
      initial={animated ? { opacity: 0, x: 20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.rect
      x="105" y="63" width="50" height="32" rx="10"
      fill="rgba(255,255,255,0.06)"
      initial={animated ? { opacity: 0, x: 20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    <motion.rect
      x="25" y="105" width="150" height="70" rx="16"
      fill="rgba(255,255,255,0.04)"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="1"
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.4 }}
    />
    <motion.circle
      cx="60" cy="60"
      r="18"
      fill="url(#feedGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
    />
    <motion.path
      d="M55 60l3 3 7-7"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.7 }}
    />
  </svg>
);

const SearchIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <motion.circle
      cx="85" cy="85"
      r="45"
      fill="rgba(255,255,255,0.05)"
      stroke="url(#searchGradient)"
      strokeWidth="3"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
    />
    <motion.circle
      cx="85" cy="85"
      r="25"
      fill="rgba(139, 92, 246, 0.2)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
    />
    <motion.line
      x1="120" y1="120"
      x2="160" y2="160"
      stroke="url(#searchGradient)"
      strokeWidth="8"
      strokeLinecap="round"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.4 }}
    />
    <motion.circle
      cx="160" cy="160"
      r="12"
      fill="url(#searchGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.6 }}
    />
  </svg>
);

const CalendarIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <motion.rect
      x="30" y="40" width="140" height="130" rx="16"
      fill="rgba(255,255,255,0.05)"
      stroke="url(#calendarGradient)"
      strokeWidth="2"
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 }}
    />
    <motion.rect
      x="30" y="40" width="140" height="35" rx="16"
      fill="url(#calendarGradient)"
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.line
      x1="60" y1="25" x2="60" y2="55"
      stroke="url(#calendarGradient)"
      strokeWidth="6"
      strokeLinecap="round"
      initial={animated ? { scaleY: 0 } : {}}
      animate={animated ? { scaleY: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.3 }}
    />
    <motion.line
      x1="140" y1="25" x2="140" y2="55"
      stroke="url(#calendarGradient)"
      strokeWidth="6"
      strokeLinecap="round"
      initial={animated ? { scaleY: 0 } : {}}
      animate={animated ? { scaleY: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.35 }}
    />
    {[0, 1, 2].map((row) =>
      [0, 1, 2, 3].map((col) => (
        <motion.rect
          key={`${row}-${col}`}
          x={50 + col * 30}
          y={95 + row * 25}
          width="20"
          height="18"
          rx="4"
          fill={row === 1 && col === 2 ? 'url(#calendarGradient)' : 'rgba(255,255,255,0.08)'}
          initial={animated ? { scale: 0 } : {}}
          animate={animated ? { scale: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.4 + (row * 4 + col) * 0.05 }}
        />
      ))
    )}
  </svg>
);

const NotesIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="notesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <motion.rect
      x="40" y="25" width="120" height="150" rx="12"
      fill="rgba(255,255,255,0.05)"
      stroke="url(#notesGradient)"
      strokeWidth="2"
      initial={animated ? { opacity: 0, rotateY: -20 } : {}}
      animate={animated ? { opacity: 1, rotateY: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
    />
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.rect
        key={i}
        x="55"
        y={50 + i * 25}
        width={i === 0 ? 90 : i === 1 ? 70 : i === 2 ? 80 : i === 3 ? 50 : 60}
        height="10"
        rx="5"
        fill={i === 0 ? 'url(#notesGradient)' : 'rgba(255,255,255,0.08)'}
        initial={animated ? { opacity: 0, x: -20 } : {}}
        animate={animated ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
      />
    ))}
    <motion.circle
      cx="145" cy="160"
      r="18"
      fill="url(#notesGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.7 }}
    />
    <motion.path
      d="M140 160l-10-10M150 160l10-10"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.9 }}
    />
  </svg>
);

const WorkoutIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="workoutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <motion.rect
      x="25" y="90" width="30" height="20" rx="4"
      fill="url(#workoutGradient)"
      initial={animated ? { scaleX: 0 } : {}}
      animate={animated ? { scaleX: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.1 }}
    />
    <motion.rect
      x="145" y="90" width="30" height="20" rx="4"
      fill="url(#workoutGradient)"
      initial={animated ? { scaleX: 0 } : {}}
      animate={animated ? { scaleX: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.1 }}
    />
    <motion.rect
      x="55" y="80" width="90" height="40" rx="6"
      fill="rgba(255,255,255,0.1)"
      stroke="url(#workoutGradient)"
      strokeWidth="2"
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.rect
      x="35" y="75" width="20" height="50" rx="4"
      fill="rgba(255,255,255,0.15)"
      initial={animated ? { scaleY: 0 } : {}}
      animate={animated ? { scaleY: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.3 }}
    />
    <motion.rect
      x="145" y="75" width="20" height="50" rx="4"
      fill="rgba(255,255,255,0.15)"
      initial={animated ? { scaleY: 0 } : {}}
      animate={animated ? { scaleY: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.3 }}
    />
    <motion.circle
      cx="100" cy="155"
      r="25"
      fill="url(#workoutGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
    />
    <motion.path
      d="M90 155h20M100 145v20"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.7 }}
    />
  </svg>
);

const SuccessIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
    </defs>
    <motion.circle
      cx="100" cy="100"
      r="60"
      fill="rgba(16, 185, 129, 0.1)"
      stroke="url(#successGradient)"
      strokeWidth="3"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
    />
    <motion.circle
      cx="100" cy="100"
      r="40"
      fill="url(#successGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
    />
    <motion.path
      d="M80 100l15 15 30-30"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.circle
        key={i}
        cx={100 + Math.cos((i * 60 * Math.PI) / 180) * 85}
        cy={100 + Math.sin((i * 60 * Math.PI) / 180) * 85}
        r="6"
        fill="url(#successGradient)"
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 0.6 } : {}}
        transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
      />
    ))}
  </svg>
);

const ErrorIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#F87171" />
      </linearGradient>
    </defs>
    <motion.circle
      cx="100" cy="100"
      r="60"
      fill="rgba(239, 68, 68, 0.1)"
      stroke="url(#errorGradient)"
      strokeWidth="3"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
    />
    <motion.circle
      cx="100" cy="100"
      r="40"
      fill="url(#errorGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
    />
    <motion.path
      d="M85 85l30 30M115 85l-30 30"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.5 }}
    />
  </svg>
);

const GenericIllustration: React.FC<{ animated?: boolean }> = ({ animated = true }) => (
  <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
    <defs>
      <linearGradient id="genericGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <motion.rect
      x="30" y="50" width="140" height="100" rx="16"
      fill="rgba(255,255,255,0.05)"
      stroke="url(#genericGradient)"
      strokeWidth="2"
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 }}
    />
    <motion.path
      d="M30 80h140"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="1"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    <motion.rect
      x="45" y="95" width="60" height="8" rx="4"
      fill="rgba(255,255,255,0.1)"
      initial={animated ? { opacity: 0, x: -10 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.4 }}
    />
    <motion.rect
      x="45" y="115" width="40" height="8" rx="4"
      fill="rgba(255,255,255,0.08)"
      initial={animated ? { opacity: 0, x: -10 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.5 }}
    />
    <motion.circle
      cx="140" cy="110"
      r="22"
      fill="url(#genericGradient)"
      initial={animated ? { scale: 0 } : {}}
      animate={animated ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 300, delay: 0.6 }}
    />
    <motion.path
      d="M135 110h10M140 105v10"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      initial={animated ? { pathLength: 0 } : {}}
      animate={animated ? { pathLength: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.8 }}
    />
  </svg>
);

const ILLUSTRATIONS: Record<EmptyStateProps['illustration'] & string, React.FC<{ animated?: boolean }>> = {
  tasks: TasksIllustration,
  habits: HabitsIllustration,
  feed: FeedIllustration,
  search: SearchIllustration,
  calendar: CalendarIllustration,
  notes: NotesIllustration,
  workout: WorkoutIllustration,
  success: SuccessIllustration,
  error: ErrorIllustration,
  generic: GenericIllustration,
};

const SIZE_CLASSES = {
  small: 'w-24 h-24',
  medium: 'w-32 h-32',
  large: 'w-40 h-40',
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'generic',
  size = 'medium',
  animated = true,
}) => {
  const IllustrationComponent = ILLUSTRATIONS[illustration];

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div 
        className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, var(--color-accent-violet) 0%, transparent 50%)',
          filter: 'blur(60px)',
        }}
      />

      <motion.div
        initial={animated ? { scale: 0.8, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`${SIZE_CLASSES[size]} mb-6`}
      >
        {icon || <IllustrationComponent animated={animated} />}
      </motion.div>

      <motion.h3
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={animated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="font-bold text-white mb-2"
        style={{ fontSize: FONT_SIZE.xl }}
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={animated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-gray-400 max-w-sm mb-6 leading-relaxed"
          style={{ fontSize: FONT_SIZE.sm }}
        >
          {description}
        </motion.p>
      )}

      <motion.div
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={animated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        {action && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="
              flex items-center gap-2
              text-white font-semibold
              transition-all duration-300
            `}
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 4px 12px var(--dynamic-accent-glow)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = '';
              e.currentTarget.style.transform = '';
            }}
          >
            <span className={`
              px-6 py-3 
              rounded-xl 
              transition-all 
              shadow-lg shadow-violet-500/25
            "
          >
            {action.icon}
            {action.label}
          </motion.button>
        )}

        {secondaryAction && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={secondaryAction.onClick}
            className="
              text-gray-400 hover:text-white
              font-medium 
              px-4 py-2 
              rounded-lg 
              transition-all
              hover:bg-white/5
            "
          >
            {secondaryAction.label}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
