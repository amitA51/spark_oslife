import React from 'react';
import { motion, Variants } from 'framer-motion';

interface StaggeredListProps {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  className?: string;
  as?: 'div' | 'ul' | 'ol' | 'section';
}



const getItemVariants = (direction: string, distance: number): Variants => {
  const directionMap: Record<string, { x?: number; y?: number }> = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const offset = directionMap[direction] || { y: distance };

  return {
    hidden: {
      opacity: 0,
      ...offset,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  };
};

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 0.08,
  initialDelay = 0,
  direction = 'up',
  distance = 20,
  className = '',
  as = 'div',
}) => {
  const customContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const MotionComponent = motion[as];

  return (
    <MotionComponent
      variants={customContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(child as React.ReactElement<{ direction?: string; distance?: number }>, {
          direction,
          distance,
        });
      })}
    </MotionComponent>
  );
};

export const StaggeredItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: string;
  distance?: number;
}> = ({
  children,
  className = '',
  direction = 'up',
  distance = 20,
}) => {
    const itemVariants = getItemVariants(direction, distance);

    return (
      <motion.div
        variants={itemVariants}
        className={className}
      >
        {children}
      </motion.div>
    );
  };

export const FadeInStagger: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.1 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const ScaleInStagger: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.05 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 400,
                damping: 25,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export const SlideInStagger: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right';
  staggerDelay?: number;
}> = ({ children, className = '', direction = 'left', staggerDelay = 0.08 }) => {
  const xOffset = direction === 'left' ? -30 : 30;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, x: xOffset },
            visible: {
              opacity: 1,
              x: 0,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StaggeredList;