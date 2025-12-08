import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onUndo,
  onDismiss,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <span className="text-sm font-medium text-white/90">{message}</span>
          {onUndo && (
            <button
              onClick={onUndo}
              className="text-sm font-bold text-[var(--dynamic-accent-start)] hover:text-[var(--dynamic-accent-end)] transition-colors"
            >
              UNDO
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
