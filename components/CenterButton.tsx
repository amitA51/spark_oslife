import React, { useState, useCallback, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { AddIcon } from './icons';

interface CenterButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Context menu handler (right click / long press) */
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Long press handler (for mobile) */
  onLongPress?: () => void;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom icon */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Aria label */
  label?: string;
}

const sizeConfig = {
  sm: { button: 'w-12 h-12', icon: 'w-6 h-6', ring: 'ring-2' },
  md: { button: 'w-16 h-16', icon: 'w-8 h-8', ring: 'ring-4' },
  lg: { button: 'w-20 h-20', icon: 'w-10 h-10', ring: 'ring-4' },
};

const CenterButton: React.FC<CenterButtonProps> = ({
  onClick,
  onContextMenu,
  onLongPress,
  size = 'md',
  icon,
  disabled = false,
  label = 'הוספה',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSpring(1, { stiffness: 400, damping: 25 });
  const rotate = useSpring(0, { stiffness: 400, damping: 20 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const config = sizeConfig[size];

  const handlePressStart = useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    scale.set(0.92);
    didLongPress.current = false;

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        didLongPress.current = true;
        rotate.set(45);
        onLongPress();
        setTimeout(() => {
          scale.set(1);
          rotate.set(0);
          setIsPressed(false);
        }, 150);
      }, 500);
    }
  }, [disabled, onLongPress, scale, rotate]);

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!didLongPress.current && isPressed && !disabled) {
      onClick();
    }

    setIsPressed(false);
    scale.set(1.05);
    setTimeout(() => scale.set(1), 150);
  }, [isPressed, disabled, onClick, scale]);

  const handlePressCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressed(false);
    scale.set(1);
    rotate.set(0);
  }, [scale, rotate]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu && !disabled) {
      onContextMenu(e);
    }
  }, [onContextMenu, disabled]);

  return (
    <div className="absolute left-1/2 -top-6 -translate-x-1/2 z-20">
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-[22px] blur-xl"
        style={{
          background: 'var(--dynamic-accent-glow)',
          transform: 'scale(1.2)',
        }}
        animate={{
          opacity: isPressed ? 0.8 : 0.5,
          scale: isPressed ? 1.3 : 1.2,
        }}
        transition={{ duration: 0.2 }}
      />

      <motion.button
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        onContextMenu={handleContextMenu}
        style={{ scale, rotate }}
        disabled={disabled}
        className={`
          relative ${config.button} rounded-[22px] 
          flex items-center justify-center
          text-white shadow-2xl
          ${config.ring} ring-[var(--bg-primary)]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          touch-none overflow-hidden
        `}
        aria-label={label}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{ background: 'var(--accent-gradient)' }}
        />

        {/* Shine overlay */}
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />

        {/* Ripple effect on press */}
        {isPressed && (
          <motion.div
            className="absolute inset-0 rounded-[22px] bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Icon */}
        <motion.div
          className="relative z-10"
          style={{ rotate }}
        >
          {icon || <AddIcon className={`${config.icon} drop-shadow-lg`} />}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default React.memo(CenterButton);
