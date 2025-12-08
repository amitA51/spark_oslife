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
    title: 'אין מפות דרכים עדיין',
    description: 'צור מפת דרכים חדשה כדי לתכנן את היעדים שלך בשלבים ברורים',
    illustration: '🗺️',
    color: 'var(--dynamic-accent-start)',
    suggestions: ['מפת קריירה', 'לימודים', 'פרויקט אישי'],
  },
  spaces: {
    title: 'אין מרחבים',
    description: 'מרחבים עוזרים לך לארגן את הפריטים שלך לפי נושא או קטגוריה',
    illustration: '🌌',
    color: '#8B5CF6',
    suggestions: ['עבודה', 'אישי', 'בריאות'],
  },
  inbox: {
    title: 'האינבוקס ריק',
    description: 'כל הפריטים שלך מאורגנים! הוסף פריטים חדשים והם יופיעו כאן',
    illustration: '📥',
    color: '#10B981',
    suggestions: ['משימה מהירה', 'הערה', 'רעיון'],
  },
  timeline: {
    title: 'אין פריטים בציר הזמן',
    description: 'הוסף תאריכי יעד לפריטים שלך כדי לראות אותם בציר הזמן',
    illustration: '📅',
    color: '#F59E0B',
    suggestions: ['הוסף תאריך יעד', 'צור משימה'],
  },
  files: {
    title: 'אין קבצים',
    description: 'העלה קבצים או צרף אותם לפריטים קיימים',
    illustration: '📎',
    color: '#EC4899',
    suggestions: ['העלה קובץ', 'צור מסמך'],
  },
  favorites: {
    title: 'אין מועדפים עדיין',
    description: 'סמן פריטים חשובים כמועדפים כדי לגשת אליהם במהירות מכל מקום באפליקציה',
    illustration: '⭐',
    color: '#FACC15',
    suggestions: ['סמן משימה חשובה', 'הוסף פרויקט מועדף', 'שמור רעיון זהב'],
  },
  recent: {
    title: 'אין פעילות אחרונה',
    description: 'כשתתחיל לעבוד עם הפריטים שלך, נראה כאן את מה שעבדת עליו לאחרונה',
    illustration: '🕒',
    color: '#38BDF8',
    suggestions: ['פתח פרויקט קיים', 'צור משימה חדשה', 'הוסף הערה מהירה'],
  },
  general: {
    title: 'אין פריטים להצגה',
    description: 'התחל ליצור תוכן כדי לראות אותו כאן',
    illustration: '✨',
    color: 'var(--dynamic-accent-start)',
    suggestions: ['צור פריט חדש'],
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative mb-6 sm:mb-8"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
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
              background: `radial-gradient(circle, ${config.color}30 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3,
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

        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
            style={{
              background: config.color,
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
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
              filter: 'blur(20px)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
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