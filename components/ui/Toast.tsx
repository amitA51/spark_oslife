import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, AlertIcon, InfoIcon, CloseIcon } from '../icons';

export type StatusMessageType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type?: StatusMessageType;
  message: string;
  description?: string;
  isVisible?: boolean; // For backward compatibility if needed, though we usually manage this with conditional rendering
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}

const toastConfig: Record<StatusMessageType, { icon: React.ReactNode; gradient: string; borderColor: string }> = {
  success: {
    icon: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  error: {
    icon: <AlertIcon className="w-5 h-5 text-red-400" />,
    gradient: 'from-red-500/10 to-red-500/5',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  info: {
    icon: <InfoIcon className="w-5 h-5 text-blue-400" />,
    gradient: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  warning: {
    icon: <AlertIcon className="w-5 h-5 text-amber-400" />,
    gradient: 'from-amber-500/10 to-amber-500/5',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
};

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  description,
  isVisible = true,
  onUndo,
  onDismiss,
  duration = 4000,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, duration, onDismiss]);

  const config = toastConfig[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[90vw] sm:max-w-md px-4"
        >
          <div
            className="relative overflow-hidden rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/50"
            style={{
              background: '#0F0F1A', // Deep dark background
              border: `1px solid ${config.borderColor}`,
            }}
          >
            {/* Ambient Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-50`} />

            {/* Progress Bar */}
            <motion.div
              className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ width: '100%', x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />

            <div className="relative z-10 flex items-start p-4 gap-3.5">
              <div className="shrink-0 pt-0.5">
                {config.icon}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-white/95 leading-tight">{message}</p>
                {description && (
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">{description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 pl-1">
                {onUndo && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onUndo}
                    className="text-xs font-bold text-accent-cyan hover:text-accent-violet transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                  >
                    ביטול
                  </motion.button>
                )}
                <button
                  onClick={onDismiss}
                  className="text-white/30 hover:text-white/80 transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
