import React, { useState, useCallback, useRef } from 'react';
import { motion, HTMLMotionProps, useSpring } from 'framer-motion';

// --- Premium Button ---

interface PremiumButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  glowOnHover?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: {
    base: "bg-gradient-to-br from-accent-cyan via-accent-cyan to-accent-violet text-cosmos-black border border-white/20",
    hover: "shadow-[0_0_30px_-5px_rgba(0,240,255,0.5),0_0_60px_-10px_rgba(123,97,255,0.3)]",
    glow: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-accent-cyan/20 before:to-accent-violet/20 before:blur-xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
  },
  secondary: {
    base: "bg-white/[0.08] text-white border border-white/10 backdrop-blur-md",
    hover: "hover:bg-white/[0.12] hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
    glow: "before:absolute before:inset-0 before:rounded-xl before:bg-white/5 before:blur-xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
  },
  ghost: {
    base: "bg-transparent text-gray-400 border border-transparent",
    hover: "hover:text-white hover:bg-white/5 hover:border-white/5",
    glow: "",
  },
  danger: {
    base: "bg-red-500/10 text-red-400 border border-red-500/20",
    hover: "hover:bg-red-500/20 hover:border-red-500/40",
    glow: "before:absolute before:inset-0 before:rounded-xl before:bg-red-500/10 before:blur-xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
  },
  success: {
    base: "bg-green-500/10 text-green-400 border border-green-500/20",
    hover: "hover:bg-green-500/20 hover:border-green-500/40",
    glow: "before:absolute before:inset-0 before:rounded-xl before:bg-green-500/10 before:blur-xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
  },
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-8 py-4 text-base rounded-xl gap-2.5",
  xl: "px-10 py-5 text-lg rounded-2xl gap-3",
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glowOnHover = true,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { stiffness: 400, damping: 25 };
  const scale = useSpring(1, springConfig);
  const y = useSpring(0, springConfig);

  const handleHoverStart = useCallback(() => {
    if (!disabled && !isLoading) {
      setIsHovered(true);
      scale.set(1.03);
      y.set(-3);
    }
  }, [disabled, isLoading, scale, y]);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
    scale.set(1);
    y.set(0);
  }, [scale, y]);

  const handleTapStart = useCallback(() => {
    if (!disabled && !isLoading) {
      scale.set(0.97);
      y.set(0);
    }
  }, [disabled, isLoading, scale, y]);

  const handleTapEnd = useCallback(() => {
    if (isHovered) {
      scale.set(1.03);
      y.set(-3);
    } else {
      scale.set(1);
      y.set(0);
    }
  }, [isHovered, scale, y]);

  const variantStyles = buttonVariants[variant];

  return (
    <motion.button
      ref={buttonRef}
      style={{ scale, y }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onTapStart={handleTapStart}
      onTap={handleTapEnd}
      onTapCancel={handleTapEnd}
      className={`
        relative overflow-visible font-bold
        transition-all duration-300
        flex items-center justify-center select-none
        ${variantStyles.base}
        ${variantStyles.hover}
        ${glowOnHover ? variantStyles.glow : ''}
        ${buttonSizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shine effect on hover */}
      <div
        className={`
          absolute inset-0 rounded-inherit overflow-hidden pointer-events-none
          ${isHovered ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-300
        `}
      >
        <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-inherit">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="text-[1.1em] flex-shrink-0">{icon}</span>}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <span className="text-[1.1em] flex-shrink-0">{icon}</span>}
          </>
        )}
      </span>
    </motion.button>
  );
};

// --- Premium Input ---

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const hasValue = value !== undefined && value !== '' && value !== null;

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`
          absolute inset-0 bg-white/5 rounded-xl border transition-all duration-300 pointer-events-none
          ${error
            ? 'border-red-500/50 shadow-glow-red'
            : isFocused
              ? 'border-accent-cyan/50 shadow-glow-cyan bg-white/10'
              : 'border-white/10 group-hover:border-white/20'
          }
        `}
      />

      <div className="relative flex items-center px-4 py-3">
        {icon && (
          <span className={`mr-3 transition-colors ${isFocused ? 'text-accent-cyan' : 'text-gray-500'}`}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className="w-full bg-transparent border-none outline-none text-white placeholder-transparent peer pt-2 focus:ring-0"
          placeholder={label}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute right-4 transition-all duration-300 pointer-events-none origin-top-right
            ${isFocused || hasValue
              ? 'text-xs -translate-y-3 text-accent-cyan font-bold'
              : 'text-sm text-gray-400 translate-y-0'
            }
          `}
        >
          {label}
        </label>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 mt-1 mr-1 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// --- Premium Textarea ---

interface PremiumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const PremiumTextarea: React.FC<PremiumTextareaProps> = ({
  label,
  error,
  className = '',
  id,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const hasValue = value !== undefined && value !== '' && value !== null;

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`
          absolute inset-0 bg-white/5 rounded-xl border transition-all duration-300 pointer-events-none
          ${error
            ? 'border-red-500/50 shadow-glow-red'
            : isFocused
              ? 'border-accent-cyan/50 shadow-glow-cyan bg-white/10'
              : 'border-white/10 group-hover:border-white/20'
          }
        `}
      />

      <div className="relative px-4 py-3">
        <textarea
          id={inputId}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className="w-full bg-transparent border-none outline-none text-white placeholder-transparent peer pt-2 focus:ring-0 resize-none"
          placeholder={label}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute right-4 transition-all duration-300 pointer-events-none origin-top-right
            ${isFocused || hasValue
              ? 'text-xs top-2 text-accent-cyan font-bold'
              : 'text-sm top-4 text-gray-400'
            }
          `}
        >
          {label}
        </label>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 mt-1 mr-1 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// --- Premium Card ---

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glass = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden
        ${glass ? 'bg-cosmos-depth/60 backdrop-blur-xl border border-white/5' : 'bg-cosmos-depth border border-white/5'}
        ${hoverEffect ? 'transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-noise mix-blend-overlay" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
