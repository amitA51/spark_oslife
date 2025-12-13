import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheckIcon, WarningIcon, InfoIcon, XIcon } from './icons';
import { useSettings } from '../src/contexts/SettingsContext';
import type { StatusMessageStyle, StatusMessageType } from '../types';

// Re-export for backward compatibility with existing imports
export type { StatusMessageType };

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

// Celebration particles component
const CelebrationParticles: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * -100 - 50,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'][Math.floor(Math.random() * 6)],
    })),
    []);

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: particle.color }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            scale: particle.scale,
            opacity: 0,
            rotate: particle.rotation,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
            delay: Math.random() * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Style configurations for different visual styles
const getStyleConfig = (style: StatusMessageStyle, config: typeof typeConfig.success) => {
  switch (style) {
    case 'minimal':
      return {
        containerClass: 'py-2 px-3 rounded-lg',
        bg: 'rgba(0, 0, 0, 0.6)',
        border: 'transparent',
        shadow: 'none',
        iconSize: 'w-4 h-4',
        textClass: 'text-xs',
      };
    case 'premium':
      return {
        containerClass: 'py-4 px-5 rounded-3xl',
        bg: `linear-gradient(135deg, ${config.bg}, rgba(0, 0, 0, 0.4))`,
        border: config.border,
        shadow: `${config.glow}, 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
        iconSize: 'w-6 h-6',
        textClass: 'text-sm font-semibold',
      };
    default:
      return {
        containerClass: 'py-3 px-4 rounded-2xl',
        bg: config.bg,
        border: config.border,
        shadow: config.glow,
        iconSize: 'w-5 h-5',
        textClass: 'text-sm font-medium',
      };
  }
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
  const messageStyle: StatusMessageStyle = settings.visualSettings?.statusMessageStyle ?? 'default';
  const enableCelebrations = settings.visualSettings?.enableCelebrations ?? true;

  const [isUndoing, setIsUndoing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showCelebration, setShowCelebration] = useState(false);

  const config = typeConfig[type];
  const styleConfig = getStyleConfig(messageStyle, config);
  const Icon = config.icon;

  // Show celebration on success messages
  useEffect(() => {
    if (type === 'success' && enableCelebrations) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [type, enableCelebrations]);

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
        className="pointer-events-auto relative overflow-visible max-w-md w-full"
        role="alert"
        aria-live="polite"
      >
        {/* Celebration particles */}
        <AnimatePresence>
          {showCelebration && <CelebrationParticles />}
        </AnimatePresence>

        {/* Main container */}
        <div
          className={`flex items-center gap-3 backdrop-blur-xl ${styleConfig.containerClass}`}
          style={{
            background: styleConfig.bg,
            border: styleConfig.border !== 'transparent' ? `1px solid ${styleConfig.border}` : 'none',
            boxShadow: styleConfig.shadow,
          }}
        >
          {/* Icon with enhanced animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
            style={{ color: config.text }}
          >
            <Icon className={styleConfig.iconSize} />
          </motion.div>

          {/* Message */}
          <motion.span
            className={`flex-1 text-white tracking-wide ${styleConfig.textClass}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {message}
          </motion.span>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onUndo && (
              <motion.button
                onClick={handleUndo}
                disabled={isUndoing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-3 py-1 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                style={{
                  color: config.text,
                  backgroundColor: `${config.text}20`,
                }}
              >
                {isUndoing ? '...' : 'בטל'}
              </motion.button>
            )}

            {/* Close button - hidden in minimal style */}
            {messageStyle !== 'minimal' && (
              <motion.button
                onClick={handleDismiss}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="סגור"
              >
                <XIcon className="w-4 h-4 text-white/60" />
              </motion.button>
            )}
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

        {/* Premium glow effect */}
        {messageStyle === 'premium' && (
          <motion.div
            className="absolute inset-0 -z-10 rounded-3xl blur-xl opacity-30"
            style={{ backgroundColor: config.text }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default React.memo(StatusMessage);
