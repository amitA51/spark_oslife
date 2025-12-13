import { Variants, TargetAndTransition } from 'framer-motion';

// Quiet Luxury Animation Constants
// Explicitly typed as a tuple for framer-motion compatibility
const QL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]; // Custom exponential out

export const viewTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.98
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.4,
      ease: QL_EASE
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: 'easeIn'
    },
  },
};

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  visible: (delay: number = 0): TargetAndTransition => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: QL_EASE,
      delay: Math.min(delay, 0.2),
    },
  }),
};

// Quiet Luxury Item Entrance - Staggered with Blur
export const quietLuxuryItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: 'blur(4px)'
  },
  visible: (index: number = 0): TargetAndTransition => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: QL_EASE,
      delay: Math.min(index * 0.04, 0.4), // Cap delay
    },
  }),
};

// Legacy compatibility - mapped to new QL variant
export const listItemVariants = quietLuxuryItemVariants;

export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: '0 0 0 rgba(0,0,0,0)'
  },
  hover: {
    scale: 1.01,
    y: -3,
    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
    transition: { duration: 0.3, ease: QL_EASE },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};

export const subtleFadeInUp: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(2px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: QL_EASE },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};