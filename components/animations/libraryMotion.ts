import { Variants } from 'framer-motion';

export const viewTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 15 }, // Reduced movement for mobile
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' }, // Slightly faster
  },
  exit: {
    opacity: 0,
    y: -15, // Reduced movement
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 15 }, // Reduced movement
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
      delay: Math.min(delay, 0.2), // Cap delay on mobile to prevent long waits
    },
  }),
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 }, // Reduced movement
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
      delay: Math.min(index * 0.03, 0.3), // Cap stagger delay
    },
  }),
};

export const cardHoverVariants: Variants = {
  initial: { scale: 1, y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 18px 45px rgba(15,23,42,0.55)',
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
};

export const subtleFadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};