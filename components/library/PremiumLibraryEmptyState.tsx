import React from 'react';
import { motion } from 'framer-motion';
import { AddIcon, SparklesIcon } from '../icons';

// Keep this type in sync with all supported empty state views in the library
interface PremiumLibraryEmptyStateProps {
  type:
  | 'projects'
  | 'spaces'
  | 'inbox'
  | 'timeline'
  | 'files'
  | 'general'
  | 'favorites'
  | 'recent';
  onAction?: () => void;
  actionLabel?: string;
}

// Central config for all library empty states
const emptyStateConfigs: Record<PremiumLibraryEmptyStateProps['type'], {
  title: string;
  description: string;
  illustration: string;
  color: string;
  suggestions: string[];
}> = {
  projects: {
    title: 'המסע מתחיל כאן',
    description: 'מפת דרכים מחלקת מטרות גדולות לשלבים ברורים. צור את הראשונה.',
    illustration: '◇',
    color: 'var(--dynamic-accent-start)',
    suggestions: ['קריירה', 'לימודים', 'פרויקט אישי'],
  },
  spaces: {
    title: 'ארגן לפי נושאים',
    description: 'מרחבים מאפשרים לארגן פריטים לפי נושא או פרויקט.',
    illustration: '○',
    color: '#8B5CF6',
    suggestions: ['עבודה', 'אישי', 'בריאות'],
  },
  inbox: {
    title: 'הכל מסודר',
    description: 'פריטים חדשים יופיעו כאן לפני שתארגן אותם.',
    illustration: '□',
    color: '#10B981',
    suggestions: ['משימה', 'הערה', 'רעיון'],
  },
  timeline: {
    title: 'התמונה הגדולה',
    description: 'הוסף תאריכי יעד כדי לראות את הפריטים שלך לאורך הזמן.',
    illustration: '―',
    color: '#F59E0B',
    suggestions: ['תאריך יעד', 'משימה חדשה'],
  },
  files: {
    title: 'אין קבצים',
    description: 'העלה קבצים או צרף אותם לפריטים קיימים.',
    illustration: '◈',
    color: '#EC4899',
    suggestions: ['העלה קובץ', 'צור מסמך'],
  },
  favorites: {
    title: 'גישה מהירה',
    description: 'סמן פריטים חשובים כמועדפים לגישה מהירה מכל מקום.',
    illustration: '☆',
    color: '#FACC15',
    suggestions: ['משימה חשובה', 'פרויקט מועדף', 'רעיון מרכזי'],
  },
  recent: {
    title: 'פעילות אחרונה',
    description: 'כשתתחיל לעבוד, הפריטים האחרונים יופיעו כאן.',
    illustration: '◷',
    color: '#38BDF8',
    suggestions: ['פרויקט קיים', 'משימה חדשה', 'הערה מהירה'],
  },
  general: {
    title: 'המקום ריק',
    description: 'הזמן ליצור משהו חדש.',
    illustration: '◊',
    color: 'var(--dynamic-accent-start)',
    suggestions: ['פריט חדש'],
  },
};

const PremiumLibraryEmptyState: React.FC<PremiumLibraryEmptyStateProps> = ({
  type,
  onAction,
  actionLabel,
}) => {
  const config = emptyStateConfigs[type];

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 text-center"
      initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="relative mb-6 sm:mb-8"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl"
          style={{
            background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}05 100%)`,
            border: `1px solid ${config.color}30`,
          }}
        >
          {config.illustration}

          <motion.div
            className="absolute -inset-4 rounded-[2rem]"
            style={{
              background: `radial-gradient(circle, ${config.color}20 0%, transparent 70%)`,
              filter: 'blur(24px)',
            }}
            animate={{
              opacity: [0.2, 0.35, 0.2],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.div
            className="absolute top-0 right-0 -translate-y-2 translate-x-2"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <SparklesIcon
              className="w-6 h-6 sm:w-8 sm:h-8"
              style={{ color: config.color }}
            />
          </motion.div>
        </div>

        {/* Quiet Luxury: Reduced particle count (3 instead of 5), subtler animation */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: config.color,
              opacity: 0.5,
              left: `${25 + Math.random() * 50}%`,
              top: `${25 + Math.random() * 50}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              x: [-8, 8, -8],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      <motion.h2
        className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3 font-heading"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {config.title}
      </motion.h2>

      <motion.p
        className="text-gray-400 max-w-[280px] sm:max-w-sm mb-5 sm:mb-8 leading-relaxed text-xs sm:text-sm md:text-base"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {config.description}
      </motion.p>

      <motion.div
        className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-5 sm:mb-8 px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {config.suggestions.map((suggestion, index) => (
          <motion.span
            key={suggestion}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm"
            style={{
              background: `${config.color}10`,
              color: config.color,
              border: `1px solid ${config.color}20`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            {suggestion}
          </motion.span>
        ))}
      </motion.div>

      {onAction && (
        <motion.button
          className="relative px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-white overflow-hidden group touch-manipulation text-sm sm:text-base"
          style={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`,
          }}
          onClick={onAction}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <AddIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            {actionLabel || 'צור חדש'}
          </span>

          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />

          <motion.div
            className="absolute -inset-2 rounded-2xl -z-10"
            style={{
              background: config.color,
              filter: 'blur(24px)',
            }}
            animate={{
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          />
        </motion.button>
      )}

      <motion.div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(ellipse at center, ${config.color}08 0%, transparent 60%)`,
        }}
      />
    </motion.div>
  );
};

export default PremiumLibraryEmptyState;