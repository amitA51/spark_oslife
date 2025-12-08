import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCheckIcon, WarningIcon, InfoIcon, XIcon } from './icons';
import { useSettings } from '../src/contexts/SettingsContext';

export type StatusMessageType = 'success' | 'error' | 'info' | 'warning';

interface StatusMessageProps {
  /** Message type determines styling */
  type: StatusMessageType;
  /** Message content */
  message: string;
  /** Called when message is dismissed */
  onDismiss: () => void;
  /** Optional undo action */
  onUndo?: () => Promise<void> | void;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Show progress bar for auto-dismiss */
  showProgress?: boolean;
  /** Position on screen */
  position?: 'top' | 'bottom';
}

const typeConfig = {
  success: {
    icon: CheckCheckIcon,
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.3)',
    text: '#22c55e',
    glow: '0 0 20px rgba(34, 197, 94, 0.3)',
  },
  error: {
    icon: WarningIcon,
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#ef4444',
    glow: '0 0 20px rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: WarningIcon,
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: '#f59e0b',
    glow: '0 0 20px rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: InfoIcon,
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#3b82f6',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },
};

const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  onDismiss,
  onUndo,
  duration = 3000,
  showProgress,
  position = 'bottom',
}) => {
  const { settings } = useSettings();
  const shouldShowProgress = showProgress ?? settings.visualSettings?.showProgressBars ?? true;

  const [isUndoing, setIsUndoing] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = typeConfig[type];
  const Icon = config.icon;

  // Auto-dismiss timer with progress
  useEffect(() => {
    if (duration === 0) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;

      if (newProgress <= 0) {
        onDismiss();
      } else {
        setProgress(newProgress);
        requestAnimationFrame(updateProgress);
      }
    };

    const frame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frame);
  }, [duration, onDismiss]);

  const handleUndo = useCallback(async () => {
    if (!onUndo || isUndoing) return;

    setIsUndoing(true);
    try {
      await onUndo();
    } finally {
      onDismiss();
    }
  }, [onUndo, onDismiss, isUndoing]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const positionClass = position === 'top'
    ? 'top-6'
    : 'bottom-24';

  return (
    <div className={`fixed ${positionClass} right-0 left-0 z-50 flex justify-center pointer-events-none px-4`}>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -30 : 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="pointer-events-auto relative overflow-hidden max-w-md w-full"
        role="alert"
        aria-live="polite"
      >
        {/* Main container */}
        <div
          className="flex items-center gap-3 py-3 px-4 rounded-2xl backdrop-blur-xl"
          style={{
            backgroundColor: config.bg,
            border: `1px solid ${config.border}`,
            boxShadow: config.glow,
          }}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
            style={{ color: config.text }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>

          {/* Message */}
          <span className="flex-1 text-sm font-medium text-white tracking-wide">
            {message}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onUndo && (
              <motion.button
                onClick={handleUndo}
                disabled={isUndoing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                style={{
                  color: config.text,
                  backgroundColor: `${config.text}20`,
                }}
              >
                {isUndoing ? '...' : 'בטל'}
              </motion.button>
            )}

            {/* Close button */}
            <motion.button
              onClick={handleDismiss}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="סגור"
            >
              <XIcon className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        {shouldShowProgress && duration > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 rounded-full"
            style={{
              backgroundColor: config.text,
              width: `${progress}%`,
            }}
            initial={{ width: '100%' }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default React.memo(StatusMessage);
