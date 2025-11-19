import React, { useMemo, useContext, useCallback } from 'react';
import { FeedIcon, TargetIcon, LayoutDashboardIcon, ChartBarIcon, SearchIcon, SettingsIcon, BrainCircuitIcon, AddIcon } from './icons';
import type { Screen } from '../types';
import { AppContext } from '../state/AppContext';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import NavItem from './NavItem';
import CenterButton from './CenterButton';

const allNavItems: Record<Screen, { label: string; icon: React.ReactNode }> = {
  feed: { label: 'פיד', icon: <FeedIcon /> },
  today: { label: 'היום', icon: <TargetIcon /> },
  add: { label: 'הוספה', icon: <AddIcon /> },
  library: { label: 'המתכנן', icon: <LayoutDashboardIcon /> },
  search: { label: 'חיפוש', icon: <SearchIcon /> },
  investments: { label: 'השקעות', icon: <ChartBarIcon /> },
  settings: { label: 'הגדרות', icon: <SettingsIcon /> },
  assistant: { label: 'יועץ', icon: <BrainCircuitIcon /> },
  dashboard: { label: 'דשבורד', icon: <LayoutDashboardIcon /> },
};

const BottomNavBar: React.FC<{ activeScreen: Screen; setActiveScreen: (screen: Screen) => void }> = ({ activeScreen, setActiveScreen }) => {
  const { state } = useContext(AppContext);
  const { settings } = state;
  const { screenLabels, navBarLayout } = settings;
  const { triggerHaptic } = useHaptics();
  const { playClick, playPop } = useSound();

  const handleLongPressAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const lastType = settings.lastAddedType;
    if (lastType) {
      sessionStorage.setItem('preselect_add', lastType);
      setActiveScreen('add');
      triggerHaptic('medium');
      playPop();
    }
  }, [settings.lastAddedType, setActiveScreen, triggerHaptic, playPop]);

  const handleAddItemClick = useCallback(() => {
    playPop();
    if (activeScreen === 'investments') {
      sessionStorage.setItem('preselect_add', 'ticker');
    } else if (activeScreen === 'feed') {
      sessionStorage.setItem('preselect_add', 'spark');
    }
    setActiveScreen('add');
  }, [activeScreen, setActiveScreen, playPop]);

  const handleNavClick = (screenId: Screen) => {
    if (screenId !== activeScreen) {
      playClick();
      setActiveScreen(screenId);
    }
  };

  const navItems = useMemo(() => {
    const layout = navBarLayout.filter(id => id !== 'add').slice(0, 4);
    return layout.map((screenId) => {
      const item = allNavItems[screenId];
      return {
        id: screenId,
        label: screenLabels[screenId] || item.label,
        icon: item.icon,
        onClick: () => handleNavClick(screenId),
      }
    });
  }, [navBarLayout, screenLabels, setActiveScreen, activeScreen, playClick]);

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-30 pointer-events-none flex justify-center pb-safe">
      <div className="relative w-full max-w-md h-20 glass-nav pointer-events-auto rounded-[2rem] shadow-2xl bg-[var(--bg-secondary)]/80 backdrop-blur-2xl border border-white/10 flex items-center px-2">

        <div className="flex-1 flex justify-around h-full items-center">
          {navItems.slice(0, 2).map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeScreen === item.id}
              onClick={item.onClick}
            />
          ))}
        </div>

        <div className="w-20" /> {/* Spacer for Center Button */}

        <div className="flex-1 flex justify-around h-full items-center">
          {navItems.slice(2, 4).map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeScreen === item.id}
              onClick={item.onClick}
            />
          ))}
        </div>

        <CenterButton onClick={handleAddItemClick} onContextMenu={handleLongPressAdd} />
      </div>
    </nav>
  );
};

export default BottomNavBar;
