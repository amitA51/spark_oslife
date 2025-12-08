import { useCallback, useState, type FC, type PropsWithChildren } from 'react';
import { AppProviders } from './src/contexts/AppProviders';
import { ModalProvider } from './state/ModalContext';
import ModalRoot from './components/ModalRoot';
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider';
import { useModal } from './state/ModalContext';
import { useSettings } from './src/contexts/SettingsContext';
import type { Screen } from './types';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import AppCore from './components/app/AppCore';
import { OfflineBanner } from './components/OfflineBanner';

/**
 * App Component
 *
 * Root component that sets up all providers and wraps the application.
 * Note: StrictMode is applied in index.tsx - not duplicated here.
 */
const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppProviders>
          <ModalProvider>
            <KeyboardShortcutsProviderWrapper>
              {/* Offline connectivity banner */}
              <OfflineBanner position="top" />
              <AppCore />
              <ModalRoot />
            </KeyboardShortcutsProviderWrapper>
          </ModalProvider>
        </AppProviders>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

/**
 * KeyboardShortcutsProviderWrapper Component
 *
 * Wrapper component to access modal context for keyboard shortcuts.
 */
const KeyboardShortcutsProviderWrapper: FC<PropsWithChildren> = ({
  children,
}) => {
  const { settings } = useSettings();
  const [, setActiveScreen] = useState<Screen>(settings.defaultScreen);
  const { openModal } = useModal();

  const handleQuickAdd = useCallback(() => {
    openModal('smart-capture');
  }, [openModal]);

  const handleSearch = useCallback(() => {
    setActiveScreen('search');
  }, []);

  return (
    <KeyboardShortcutsProvider
      setActiveScreen={setActiveScreen}
      onQuickAdd={handleQuickAdd}
      onSearch={handleSearch}
    >
      {children}
    </KeyboardShortcutsProvider>
  );
};

export default App;
