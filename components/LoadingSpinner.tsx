import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../src/contexts/SettingsContext';

type SpinnerVariant = 'default' | 'dots' | 'pulse' | 'orbit';
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Visual variant - if not provided, reads from settings */
  variant?: SpinnerVariant;
  /** Custom class name */
  className?: string;
  /** Optional loading text */
  text?: string;
  /** Whether to show the text */
  showText?: boolean;
  /** Ignore settings and use prop directly */
  ignoreSettings?: boolean;
}

const sizeMap: Record<SpinnerSize, { container: string; text: string }> = {
  xs: { container: 'w-4 h-4', text: 'text-xs' },
  sm: { container: 'w-5 h-5', text: 'text-xs' },
  md: { container: 'w-8 h-8', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-base' },
  xl: { container: 'w-16 h-16', text: 'text-lg' },
};

// Default circular spinner
const DefaultSpinner: React.FC<{ size: SpinnerSize }> = ({ size }) => (
  <motion.div
    className={`${sizeMap[size].container} rounded-full border-2 border-white/20`}
    style={{
      borderTopColor: 'var(--dynamic-accent-start)',
      borderRightColor: 'var(--dynamic-accent-end)',
    }}
    animate={{ rotate: 360 }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);

// Three bouncing dots
const DotsSpinner: React.FC<{ size: SpinnerSize }> = ({ size }) => {
  const dotSize = size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${dotSize} rounded-full`}
          style={{ backgroundColor: 'var(--dynamic-accent-start)' }}
          animate={{
            y: [-2, 2, -2],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Pulsing circle
const PulseSpinner: React.FC<{ size: SpinnerSize }> = ({ size }) => (
  <div className="relative">
    <motion.div
      className={`${sizeMap[size].container} rounded-full`}
      style={{ backgroundColor: 'var(--dynamic-accent-start)' }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 0.3, 0.7],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <motion.div
      className={`absolute inset-0 ${sizeMap[size].container} rounded-full`}
      style={{ backgroundColor: 'var(--dynamic-accent-end)' }}
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  </div>
);

// Orbiting dots
const OrbitSpinner: React.FC<{ size: SpinnerSize }> = ({ size }) => {
  const containerSize = sizeMap[size].container;
  const dotSize = size === 'xs' || size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';

  return (
    <motion.div
      className={`${containerSize} relative`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`absolute ${dotSize} rounded-full`}
          style={{
            backgroundColor: 'var(--dynamic-accent-start)',
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 90}deg) translateY(-150%)`,
            transformOrigin: 'center center',
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </motion.div>
  );
};

const variantMap: Record<SpinnerVariant, React.FC<{ size: SpinnerSize }>> = {
  default: DefaultSpinner,
  dots: DotsSpinner,
  pulse: PulseSpinner,
  orbit: OrbitSpinner,
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  text = 'טוען...',
  showText = false,
  ignoreSettings = false,
}) => {
  const { settings } = useSettings();

  // Determine effective variant:
  // 1. If ignoreSettings is true, use the prop (or default)
  // 2. If variant prop was explicitly passed (not default), use it
  // 3. Otherwise, use the setting
  const effectiveVariant = ignoreSettings
    ? variant
    : (variant !== 'default' ? variant : (settings?.visualSettings?.spinnerVariant || 'default'));

  const SpinnerComponent = variantMap[effectiveVariant];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <SpinnerComponent size={size} />

      {showText && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${sizeMap[size].text} text-[var(--text-secondary)] font-medium`}
        >
          {text}
        </motion.span>
      )}

      <span className="sr-only">{text}</span>
    </div>
  );
};

export default React.memo(LoadingSpinner);
