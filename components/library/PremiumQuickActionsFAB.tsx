import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AddIcon, 
  ClipboardListIcon, 
  BookOpenIcon, 
  LightbulbIcon,
  DumbbellIcon,
  LinkIcon,
  CloseIcon,
} from '../icons';

interface QuickAction {
  id: string;
  label: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  onClick: () => void;
}

interface PremiumQuickActionsFABProps {
  onAddTask: () => void;
  onAddNote: () => void;
  onAddIdea: () => void;
  onAddBook: () => void;
  onAddWorkout: () => void;
  onAddLink: () => void;
}

const PremiumQuickActionsFAB: React.FC<PremiumQuickActionsFABProps> = ({
  onAddTask,
  onAddNote,
  onAddIdea,
  onAddBook,
  onAddWorkout,
  onAddLink,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions: QuickAction[] = [
    { id: 'task', label: 'משימה', icon: ClipboardListIcon, color: '#00F0FF', onClick: onAddTask },
    { id: 'note', label: 'הערה', icon: BookOpenIcon, color: '#10B981', onClick: onAddNote },
    { id: 'idea', label: 'רעיון', icon: LightbulbIcon, color: '#F59E0B', onClick: onAddIdea },
    { id: 'book', label: 'ספר', icon: BookOpenIcon, color: '#8B5CF6', onClick: onAddBook },
    { id: 'workout', label: 'אימון', icon: DumbbellIcon, color: '#EF4444', onClick: onAddWorkout },
    { id: 'link', label: 'קישור', icon: LinkIcon, color: '#EC4899', onClick: onAddLink },
  ];

  const handleActionClick = (action: QuickAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-4 sm:left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute bottom-16 sm:bottom-20 left-0 flex flex-col gap-2 sm:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  className="relative flex items-center gap-3 group"
                  initial={{ opacity: 0, x: -30, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: -20, 
                    scale: 0.8,
                    transition: { delay: (actions.length - index) * 0.03 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action)}
                >
                  <motion.div
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white whitespace-nowrap"
                    style={{
                      background: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                  >
                    {action.label}
                  </motion.div>

                  <motion.div
                    className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${action.color}30 0%, ${action.color}10 100%)`,
                      border: `1px solid ${action.color}40`,
                      boxShadow: `0 4px 20px ${action.color}30`,
                    }}
                    whileHover={{
                      boxShadow: `0 8px 30px ${action.color}50`,
                    }}
                  >
                    <action.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: action.color }} />
                    
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl"
                      style={{
                        background: `radial-gradient(circle, ${action.color}30 0%, transparent 70%)`,
                      }}
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    />
                  </motion.div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--dynamic-accent-start) 0%, var(--dynamic-accent-end) 100%)',
            boxShadow: '0 8px 32px var(--dynamic-accent-glow)',
          }}
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            rotate: isOpen ? 45 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isOpen ? (
            <CloseIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          ) : (
            <AddIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          )}
          
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--dynamic-accent-start) 0%, var(--dynamic-accent-end) 100%)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <motion.div
            className="absolute -inset-2 rounded-full -z-10"
            style={{
              background: 'var(--dynamic-accent-glow)',
              filter: 'blur(20px)',
            }}
            animate={{
              opacity: isOpen ? 0.4 : 0.2,
              scale: isOpen ? 1.2 : 1,
            }}
          />
        </motion.button>

        <motion.div
          className="absolute -inset-4 rounded-full -z-20"
          style={{
            background: 'var(--dynamic-accent-start)',
            filter: 'blur(40px)',
          }}
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
};

export default PremiumQuickActionsFAB;