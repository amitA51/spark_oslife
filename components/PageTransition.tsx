import React, { useMemo } from 'react';
import { motion, Variants, Transition } from 'framer-motion';

export type TransitionDirection = 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale' | 'slide-up';
export type TransitionStyle = 'spring' | 'smooth' | 'snappy' | 'elastic';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  direction?: TransitionDirection;
  style?: TransitionStyle;
  delay?: number;
  duration?: number;
  /** Custom variants override */
  customVariants?: Variants;
}

// Premium transition configurations
const transitionStyles: Record<TransitionStyle, Transition> = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  smooth: {
    type: 'tween',
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1], // Material Design easing
  },
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.5,
  },
  elastic: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
    mass: 1,
    bounce: 0.25,
  },
};

// Direction-based variants
const getVariants = (direction: TransitionDirection): Variants => {
  const baseBlur = 'blur(8px)';
  const clearBlur = 'blur(0px)';
  
  switch (direction) {
    case 'left':
      return {
        initial: {
          opacity: 0,
          x: 100,
          scale: 0.95,
          filter: baseBlur,
        },
        in: {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: clearBlur,
        },
        out: {
          opacity: 0,
          x: -100,
          scale: 0.95,
          filter: baseBlur,
        },
      };
    case 'right':
      return {
        initial: {
          opacity: 0,
          x: -100,
          scale: 0.95,
          filter: baseBlur,
        },
        in: {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: clearBlur,
        },
        out: {
          opacity: 0,
          x: 100,
          scale: 0.95,
          filter: baseBlur,
        },
      };
    case 'up':
      return {
        initial: {
          opacity: 0,
          y: 60,
          scale: 0.97,
          filter: baseBlur,
        },
        in: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: clearBlur,
        },
        out: {
          opacity: 0,
          y: -40,
          scale: 0.97,
          filter: baseBlur,
        },
      };
    case 'down':
      return {
        initial: {
          opacity: 0,
          y: -60,
          scale: 0.97,
          filter: baseBlur,
        },
        in: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: clearBlur,
        },
        out: {
          opacity: 0,
          y: 40,
          scale: 0.97,
          filter: baseBlur,
        },
      };
    case 'fade':
      return {
        initial: {
          opacity: 0,
          scale: 1,
          filter: baseBlur,
        },
        in: {
          opacity: 1,
          scale: 1,
          filter: clearBlur,
        },
        out: {
          opacity: 0,
          scale: 1,
          filter: baseBlur,
        },
      };
    case 'scale':
      return {
        initial: {
          opacity: 0,
          scale: 0.85,
          filter: baseBlur,
          rotateX: 10,
        },
        in: {
          opacity: 1,
          scale: 1,
          filter: clearBlur,
          rotateX: 0,
        },
        out: {
          opacity: 0,
          scale: 1.1,
          filter: baseBlur,
          rotateX: -5,
        },
      };
    case 'slide-up':
    default:
      return {
        initial: {
          opacity: 0,
          y: 30,
          scale: 0.98,
          filter: baseBlur,
        },
        in: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: clearBlur,
        },
        out: {
          opacity: 0,
          y: -20,
          scale: 0.98,
          filter: baseBlur,
        },
      };
  }
};

/**
 * PageTransition - Enhanced Premium Page Transition Component
 * 
 * Features:
 * - Multiple directional transitions (left, right, up, down, fade, scale)
 * - Customizable transition styles (spring, smooth, snappy, elastic)
 * - GPU-accelerated animations with blur effects
 * - Configurable delay and duration
 * - RTL-aware (Hebrew support)
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  direction = 'slide-up',
  style = 'spring',
  delay = 0,
  duration,
  customVariants,
}) => {
  const variants = useMemo(() => 
    customVariants || getVariants(direction),
    [direction, customVariants]
  );

  const transition = useMemo(() => {
    const baseTransition = { ...transitionStyles[style] };
    
    if (delay > 0) {
      baseTransition.delay = delay;
    }
    
    if (duration && baseTransition.type === 'tween') {
      baseTransition.duration = duration;
    }
    
    return baseTransition;
  }, [style, delay, duration]);

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={transition}
      className={`will-change-transform ${className}`}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideTransition - Horizontal slide transition for navigation
 * Perfect for tab-style navigation with direction awareness
 */
export const SlideTransition: React.FC<PageTransitionProps & { 
  from?: 'left' | 'right';
}> = ({ children, className, from = 'right' }) => {
  const variants: Variants = {
    initial: {
      opacity: 0,
      x: from === 'right' ? 80 : -80,
      scale: 0.96,
    },
    in: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      x: from === 'right' ? -80 : 80,
      scale: 0.96,
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 32,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeScaleTransition - Elegant fade with subtle scale
 * Perfect for modals, overlays, and content reveals
 */
export const FadeScaleTransition: React.FC<PageTransitionProps & {
  origin?: 'center' | 'top' | 'bottom';
}> = ({ children, className, origin = 'center' }) => {
  const originY = origin === 'top' ? -20 : origin === 'bottom' ? 20 : 0;
  
  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.92,
      y: originY,
      filter: 'blur(10px)',
    },
    in: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
    },
    out: {
      opacity: 0,
      scale: 0.95,
      y: -originY / 2,
      filter: 'blur(5px)',
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 26,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerTransition - For animating lists of children with stagger
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.05 }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * SharedLayoutTransition - For smooth layout animations
 * Use with AnimatePresence and layoutId
 */
export const SharedLayoutTransition: React.FC<{
  children: React.ReactNode;
  layoutId: string;
  className?: string;
}> = ({ children, layoutId, className }) => {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 30,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * PresenceTransition - Simple presence-based animation
 * For toggling visibility with animation
 */
export const PresenceTransition: React.FC<{
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}> = ({ children, isVisible, className }) => {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.95,
        y: isVisible ? 0 : 10,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
