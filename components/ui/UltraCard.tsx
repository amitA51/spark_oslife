import React, { useRef, useState, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type GlowColor = 'cyan' | 'violet' | 'magenta' | 'gold' | 'neutral';
type CardVariant = 'elevated' | 'sunken' | 'floating' | 'glass';

interface UltraCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: CardVariant;
  glowColor?: GlowColor;
  hoverEffect?: boolean;
  pressEffect?: boolean;
  cursorGlow?: boolean;
  noPadding?: boolean;
  className?: string;
}

const glowStyles: Record<GlowColor, string> = {
  cyan: 'hover:shadow-[0_0_60px_-15px_rgba(0,240,255,0.3)]',
  violet: 'hover:shadow-[0_0_60px_-15px_rgba(123,97,255,0.3)]',
  magenta: 'hover:shadow-[0_0_60px_-15px_rgba(255,0,110,0.3)]',
  gold: 'hover:shadow-[0_0_60px_-15px_rgba(255,184,0,0.3)]',
  neutral: 'hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]',
};

const cursorGlowColors: Record<GlowColor, string> = {
  cyan: 'rgba(0, 240, 255, 0.15)',
  violet: 'rgba(123, 97, 255, 0.15)',
  magenta: 'rgba(255, 0, 110, 0.15)',
  gold: 'rgba(255, 184, 0, 0.15)',
  neutral: 'rgba(255, 255, 255, 0.08)',
};

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
  sunken: 'bg-gradient-to-br from-black/20 to-transparent border border-white/[0.05] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
  floating: 'bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]',
  glass: 'bg-cosmos-depth/60 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
};

export const UltraCard: React.FC<UltraCardProps> = ({
  children,
  variant = 'elevated',
  glowColor = 'neutral',
  hoverEffect = true,
  pressEffect = true,
  cursorGlow = true,
  noPadding = false,
  className = '',
  ...motionProps
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !cursorGlow) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [cursorGlow]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : undefined}
      whileTap={pressEffect ? { scale: 0.99 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-[1.5rem] backdrop-blur-2xl ${variantStyles[variant]} ${hoverEffect ? glowStyles[glowColor] : ''} transition-shadow duration-500 ${className}`}
      {...motionProps}
    >
      {cursorGlow && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${cursorGlowColors[glowColor]}, transparent 60%)`,
          }}
        />
      )}

      <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className={`relative z-10 ${noPadding ? '' : 'p-6'}`}>
        {children}
      </div>
    </motion.div>
  );
};

interface UltraCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const UltraCardHeader: React.FC<UltraCardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between mb-4 ${className}`}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-white/10 flex items-center justify-center text-accent-cyan">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-bold text-white tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface UltraCardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const UltraCardBody: React.FC<UltraCardBodyProps> = ({
  children,
  className = '',
}) => (
  <div className={className}>
    {children}
  </div>
);

interface UltraCardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export const UltraCardFooter: React.FC<UltraCardFooterProps> = ({
  children,
  className = '',
  bordered = true,
}) => (
  <div className={`mt-4 pt-4 ${bordered ? 'border-t border-white/5' : ''} ${className}`}>
    {children}
  </div>
);

export default UltraCard;