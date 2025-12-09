import React, { useState, useCallback } from 'react';
import { useSettings } from '../../src/contexts/SettingsContext';
import { useData } from '../../src/contexts/DataContext';
import { useUI } from '../../src/contexts/UIContext';
import { useFocusSession } from '../../src/contexts/FocusContext';

import { useHabitReminders } from '../../hooks/useHabitReminders';
import { useTaskReminders } from '../../hooks/useTaskReminders';
import { useBeforeUnloadWarning } from '../../hooks/useBeforeUnloadWarning';
import { useDoubleTapExit } from '../../hooks/useDoubleTapExit';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { useThemeEffect } from '../../hooks/useThemeEffect';
import { usePwaUpdate } from '../../hooks/usePwaUpdate';
import { useUrlActions } from '../../hooks/app/useUrlActions';
import { usePrefetch } from '../../hooks/usePrefetch';
import AppLifecycle from './AppLifecycle';
import AppKeyboardShortcuts from './AppKeyboardShortcuts';
import AppMonitoring from './AppMonitoring';
import AppRouter from './AppRouter';
import AppLoading from '../AppLoading';
import { StatusMessageType } from '../StatusMessage';
import type { Screen, PersonalItem } from '../../types';

/**
 * AppCore Component
 *
 * The main orchestrator for the application.
 * Manages top-level state and coordinates all app-level components.
 *
 * This is the refactored version of ThemedApp, broken down into composable pieces.
 */
const AppCore: React.FC = () => {
  // Context hooks
  const { settings, theme: themeSettings, uiDensity, animationIntensity } = useSettings();
  const { feedItems, updatePersonalItem } = useData();
  const { hasUnsavedChanges } = useUI();
  const { activeSession, startSession, cancelSession } = useFocusSession();


  // Local state
  const { fontSizeScale } = settings;
  const [activeScreen, setActiveScreen] = useState<Screen>(settings.defaultScreen);
  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType;
    text: string;
    id: number;
    onUndo?: () => Promise<void> | void;
  } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(!!localStorage.getItem('isGuest'));
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Handle Guest Access
  const handleGuestAccess = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    setActiveScreen('today');
  }, []);

  // Status message handler
  const showStatus = useCallback(
    (type: StatusMessageType, text: string, onUndo?: () => Promise<void> | void) => {
      setStatusMessage({ type, text, id: Date.now(), onUndo });
    },
    []
  );

  // Lifecycle hooks - warn before leaving, schedule reminders
  useBeforeUnloadWarning(hasUnsavedChanges);
  useHabitReminders();
  useTaskReminders();
  useGoogleCalendar(showStatus);
  useThemeEffect({ themeSettings, uiDensity, animationIntensity, fontSizeScale });
  const { updateAvailable, applyUpdate } = usePwaUpdate();

  // Double-tap back button to exit protection
  useDoubleTapExit({
    enabled: true,
    message: 'לחץ שוב ליציאה מהאפליקציה',
    timeout: 2000,
    onFirstTap: (msg) => {
      showStatus('info', msg);
    },
  });

  // Notify user when update is available
  React.useEffect(() => {
    if (updateAvailable) {
      showStatus(
        'info',
        '✨ עדכון חדש זמין! הירשם כדי לרענן',
        async () => { await applyUpdate(); }
      );
    }
  }, [updateAvailable, showStatus, applyUpdate]);

  // URL parameter handling
  useUrlActions(setActiveScreen);

  // Prefetch commonly used screens after initial load
  usePrefetch({
    screens: ['feed', 'settings', 'calendar', 'assistant'],
    delay: 3000,
    enabled: true,
  });

  // Wrapper for updatePersonalItem to match AppRouter's expected signature
  const handleUpdatePersonalItem = useCallback(
    async (id: string, item: PersonalItem) => {
      await updatePersonalItem(id, item);
    },
    [updatePersonalItem]
  );

  return (
    <>
      {/* Lifecycle Management */}
      <AppLifecycle
        isGuest={isGuest}
        setIsGuest={setIsGuest}
        setActiveScreen={setActiveScreen}
        defaultScreen={settings.defaultScreen}
        setIsAuthLoading={setIsAuthLoading}
      />

      {/* Keyboard Shortcuts */}
      <AppKeyboardShortcuts setIsCommandPaletteOpen={setIsCommandPaletteOpen} />

      {/* Performance Monitoring */}
      <AppMonitoring feedItems={feedItems} showStatus={showStatus} />

      {/* Show loading while auth is being determined */}
      {isAuthLoading ? (
        <AppLoading />
      ) : (
        /* Main Router & UI */
        <AppRouter
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          activeSession={activeSession}

          themeSettings={themeSettings}
          statusMessage={statusMessage}
          setStatusMessage={setStatusMessage}
          isCommandPaletteOpen={isCommandPaletteOpen}
          setIsCommandPaletteOpen={setIsCommandPaletteOpen}
          updateAvailable={updateAvailable}
          handleUpdate={applyUpdate}
          handleGuestAccess={handleGuestAccess}
          showStatus={showStatus}
          updatePersonalItem={handleUpdatePersonalItem}
          startSession={startSession}
          cancelSession={cancelSession}
        />
      )}
    </>
  );
};

export default AppCore;
