import { useCallback, type FC, type PropsWithChildren } from 'react';
import { AppProviders } from './src/contexts/AppProviders';
import { ModalProvider } from './state/ModalContext';
import ModalRoot from './components/ModalRoot';
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider';
import { useModal } from './state/ModalContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import AppCore from './components/app/AppCore';
import { OfflineBanner } from './components/OfflineBanner';
import OnboardingTour from './components/onboarding/OnboardingTour';

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
              <OnboardingTour />
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
  const { openModal } = useModal();

  const handleQuickAdd = useCallback(() => {
    openModal('smart-capture');
  }, [openModal]);

  const handleSearch = useCallback(() => {
    // Search can be handled via navigation context
    // This is a no-op for now until search modal is implemented
  }, []);

  return (
    <KeyboardShortcutsProvider
      onQuickAdd={handleQuickAdd}
      onSearch={handleSearch}
    >
      {children}
    </KeyboardShortcutsProvider>
  );
};

export default App;
