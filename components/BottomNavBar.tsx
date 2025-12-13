import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import {
  FeedIcon,
  TargetIcon,
  LayoutDashboardIcon,
  ChartBarIcon,
  SearchIcon,
  SettingsIcon,
  BrainCircuitIcon,
  AddIcon,
} from './icons';
import type { Screen } from '../types';
import { useSettings } from '../src/contexts/SettingsContext';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import { useModal } from '../state/ModalContext';

const allNavItems: Record<Screen, {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
}> = {
  feed: {
    label: 'פיד',
    icon: <FeedIcon />,
    gradient: 'from-orange-500 to-amber-500',
    glowColor: 'rgba(251, 146, 60, 0.5)',
  },
  today: {
    label: 'היום',
    icon: <TargetIcon />,
    gradient: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(34, 211, 238, 0.5)',
  },
  add: {
    label: 'הוספה',
    icon: <AddIcon />,
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.5)',
  },
  library: {
    label: 'ספרייה',
    icon: <LayoutDashboardIcon />,
    gradient: 'from-emerald-400 to-green-500',
    glowColor: 'rgba(52, 211, 153, 0.5)',
  },
  search: {
    label: 'חיפוש',
    icon: <SearchIcon />,
    gradient: 'from-blue-400 to-indigo-500',
    glowColor: 'rgba(96, 165, 250, 0.5)',
  },
  investments: {
    label: 'השקעות',
    icon: <ChartBarIcon />,
    gradient: 'from-yellow-400 to-orange-500',
    glowColor: 'rgba(250, 204, 21, 0.5)',
  },
  settings: {
    label: 'הגדרות',
    icon: <SettingsIcon />,
    gradient: 'from-gray-400 to-slate-500',
    glowColor: 'rgba(156, 163, 175, 0.5)',
  },
  assistant: {
    label: 'יועץ',
    icon: <BrainCircuitIcon />,
    gradient: 'from-purple-400 to-pink-500',
    glowColor: 'rgba(192, 132, 252, 0.5)',
  },
  calendar: {
    label: 'לוח שנה',
    icon: <TargetIcon />,
    gradient: 'from-rose-400 to-red-500',
    glowColor: 'rgba(251, 113, 133, 0.5)',
  },
  passwords: {
    label: 'סיסמאות',
    icon: <SettingsIcon />,
    gradient: 'from-teal-400 to-cyan-500',
    glowColor: 'rgba(45, 212, 191, 0.5)',
  },
  views: {
    label: 'תצוגות',
    icon: <LayoutDashboardIcon />,
    gradient: 'from-indigo-400 to-violet-500',
    glowColor: 'rgba(129, 140, 248, 0.5)',
  },
  login: {
    label: 'התחברות',
    icon: <SettingsIcon />,
    gradient: 'from-gray-400 to-slate-500',
    glowColor: 'rgba(156, 163, 175, 0.5)',
  },
  signup: {
    label: 'הרשמה',
    icon: <SettingsIcon />,
    gradient: 'from-gray-400 to-slate-500',
    glowColor: 'rgba(156, 163, 175, 0.5)',
  },
  dashboard: {
    label: 'דשבורד',
    icon: <LayoutDashboardIcon />,
    gradient: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(34, 211, 238, 0.5)',
  },
};

const PremiumNavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  gradient: string;
  glowColor: string;
  index: number;
}> = ({ label, icon, isActive, onClick, gradient, glowColor, index }) => {
  const scale = useSpring(1, { stiffness: 400, damping: 30 });

  const iconClasses = `h-6 w-6 transition-all duration-300`;

  const iconStyle: React.CSSProperties = isActive
    ? {
      color: 'var(--dynamic-accent-start)',
      filter: 'drop-shadow(0 0 8px var(--dynamic-accent-glow))',
      transform: 'scale(1.1)'
    }
    : {
      color: '#9CA3AF'
    };

  const finalIcon = React.isValidElement<{ className?: string; filled?: boolean; style?: React.CSSProperties }>(icon)
    ? React.cloneElement(icon, { className: iconClasses, filled: isActive, style: iconStyle })
    : icon;

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => scale.set(1.05)}
      onHoverEnd={() => scale.set(1)}
      onTapStart={() => scale.set(0.95)}
      onTap={() => scale.set(1)}
      style={{ scale }}
      className="relative z-10 flex flex-col items-center justify-center h-full w-full transition-all duration-300 group focus:outline-none rounded-xl"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >


      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-2xl pointer-events-none"
          style={{ backgroundColor: 'var(--dynamic-accent-glow)' }}
        />
      )}

      <motion.div
        animate={{
          y: isActive ? -2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative flex flex-col items-center justify-center z-10"
      >
        <motion.div
          animate={{
            scale: isActive ? 1.1 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {finalIcon}
        </motion.div>

        <motion.span
          initial={false}
          animate={{
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : -4,
            scale: isActive ? 1 : 0.8,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            delay: isActive ? 0.05 : 0,
          }}
          className="text-[9px] mt-1 font-bold tracking-wider uppercase"
          style={{
            color: isActive ? 'var(--dynamic-accent-start)' : 'rgba(255,255,255,0.6)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {label}
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.08), transparent 70%)',
        }}
      />
    </motion.button>
  );
};

const PremiumCenterButton: React.FC<{
  onClick: () => void;
  onLongPress: () => void;
}> = ({ onClick, onLongPress }) => {
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSpring(1, { stiffness: 400, damping: 25 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePressStart = () => {
    setIsPressed(true);
    scale.set(0.92);
    didLongPress.current = false;

    // Start long press timer (500ms)
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress();
      scale.set(1);
      setIsPressed(false);
    }, 500);
  };

  const handlePressEnd = () => {
    // Clear the timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If it wasn't a long press, trigger regular click
    if (!didLongPress.current && isPressed) {
      onClick();
    }

    setIsPressed(false);
    scale.set(1.05);
    setTimeout(() => scale.set(1), 150);
  };

  const handlePressCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressed(false);
    scale.set(1);
  };

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      {/* Subtle glow effect - Quiet Luxury: reduced opacity */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-25"
        style={{
          background: 'var(--dynamic-accent-glow)',
          transform: 'scale(1.2)',
        }}
      />

      <motion.button
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        onContextMenu={(e) => e.preventDefault()}
        onHoverStart={() => scale.set(1.08)}
        onHoverEnd={() => scale.set(1)}
        style={{
          scale,
          background: 'var(--accent-gradient)',
          boxShadow: `0 4px 16px var(--dynamic-accent-glow)`,
        }}
        className="relative w-[56px] h-[56px] rounded-full flex items-center justify-center overflow-hidden touch-none"
        aria-label="הוספה - לחיצה ארוכה לפתק מהיר"
      >
        {/* Subtle overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />

        <motion.div
          animate={{
            rotate: isPressed ? 45 : 0,
            scale: isPressed ? 0.9 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <AddIcon className="w-7 h-7 text-white drop-shadow-lg" />
        </motion.div>
      </motion.button>
    </div>
  );
};

const BottomNavBar: React.FC<{
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}> = ({ activeScreen, setActiveScreen }) => {
  const { settings } = useSettings();
  const { screenLabels, navBarLayout } = settings;
  const { triggerHaptic } = useHaptics();
  const { playClick, playPop } = useSound();
  const { openModal } = useModal();
  const navRef = useRef<HTMLDivElement>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const floatY = useSpring(0, { stiffness: 100, damping: 20 });

  // Quiet Luxury: Subtle float animation
  useEffect(() => {
    let frame: number;
    let time = 0;
    const animate = () => {
      time += 0.015;  // Slower animation
      floatY.set(Math.sin(time) * 1.5);  // Reduced amplitude
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [floatY]);

  // Long press handler - opens quick note modal
  const handleLongPressAdd = useCallback(() => {
    triggerHaptic('medium');
    playPop();
    openModal('quickNote');
  }, [triggerHaptic, playPop, openModal]);

  const handleAddItemClick = useCallback(() => {
    playPop();
    triggerHaptic('light');
    if (activeScreen === 'investments') {
      sessionStorage.setItem('preselect_add', 'ticker');
    }
    // Note: Removed auto-selection of 'spark' from feed screen
    setActiveScreen('add');
  }, [activeScreen, setActiveScreen, playPop, triggerHaptic]);

  const handleNavClick = useCallback(
    (screenId: Screen) => {
      if (screenId !== activeScreen) {
        playClick();
        triggerHaptic('light');
        setActiveScreen(screenId);
      }
    },
    [activeScreen, playClick, setActiveScreen, triggerHaptic]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const navItems = useMemo(() => {
    const layout = navBarLayout.filter(id => id !== 'add').slice(0, 4);
    return layout.map(screenId => {
      const item = allNavItems[screenId] || allNavItems.today;
      // Force 'ספרייה' label for library screen (migration from old 'המתכנן' label)
      const label = screenId === 'library' && screenLabels[screenId] === 'המתכנן'
        ? 'ספרייה'
        : (screenLabels[screenId] || item.label);
      return {
        id: screenId,
        label,
        icon: item.icon,
        gradient: item.gradient,
        glowColor: item.glowColor,
        onClick: () => handleNavClick(screenId),
      };
    });
  }, [navBarLayout, screenLabels, handleNavClick]);

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-30 pointer-events-none flex justify-center pb-safe">
      <motion.div
        ref={navRef}
        style={{ y: floatY }}
        className="relative w-full max-w-md h-[88px] pointer-events-auto rounded-[2.5rem] overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Subtle border with theme color */}
        <div
          className="absolute inset-0 rounded-[2.5rem]"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `0 0 0 1px var(--dynamic-accent-start) opacity-20`,
          }}
        />

        {/* Glass background - Quiet Luxury */}
        <div
          className="absolute inset-[1px] rounded-[calc(2.5rem-1px)]"
          style={{
            background: 'rgba(10, 10, 15, 0.7)',
            backdropFilter: 'blur(var(--blur-2xl))',
            WebkitBackdropFilter: 'blur(var(--blur-2xl))',
            boxShadow: `
              var(--shadow-2xl),
              0 0 0 1px rgba(255, 255, 255, 0.03) inset,
              0 1px 0 rgba(255, 255, 255, 0.05) inset
            `,
          }}
        />

        {/* Hover effect - Quiet Luxury: subtler spotlight */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[2.5rem]"
          animate={{
            opacity: isHovering ? 0.6 : 0,
          }}
          transition={{ duration: 0.4 }}
          style={{
            background: `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--ql-surface-overlay), transparent 60%)`,
          }}
        />

        <div
          className="absolute inset-[1px] rounded-[calc(2.5rem-1px)] opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex items-center h-full px-6 gap-4">
          <div className="flex-1 flex justify-around h-full items-center">
            {navItems.slice(0, 2).map((item, index) => (
              <PremiumNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isActive={activeScreen === item.id}
                onClick={item.onClick}
                gradient={item.gradient}
                glowColor={item.glowColor}
                index={index}
              />
            ))}
          </div>

          <div className="w-20" />

          <div className="flex-1 flex justify-around h-full items-center">
            {navItems.slice(2, 4).map((item, index) => (
              <PremiumNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isActive={activeScreen === item.id}
                onClick={item.onClick}
                gradient={item.gradient}
                glowColor={item.glowColor}
                index={index + 2}
              />
            ))}
          </div>

          <PremiumCenterButton onClick={handleAddItemClick} onLongPress={handleLongPressAdd} />
        </div>

        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px]"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />
      </motion.div>
    </nav>
  );
};

export default React.memo(BottomNavBar);
