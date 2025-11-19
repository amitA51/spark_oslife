import React, { useState, Suspense, lazy, useContext, useEffect, useCallback } from 'react';
import BottomNavBar from './components/BottomNavBar';
import { AppProvider, AppContext } from './state/AppContext';
import SessionTimer from './components/SessionTimer';
import DynamicBackground from './components/DynamicBackground';
import type { Screen } from './types';
import { updateAppBadge } from './services/notificationsService';
import { RefreshIcon } from './components/icons';
import * as dataService from './services/dataService';
import StatusMessage, { StatusMessageType } from './components/StatusMessage';
import { useHabitReminders } from './hooks/useHabitReminders';
import { useTaskReminders } from './hooks/useTaskReminders';
import { ModalProvider } from './state/ModalContext';
import ModalRoot from './components/ModalRoot';
import CommandPalette from './components/CommandPalette';
import AppLoading from './components/AppLoading';
import { useBeforeUnloadWarning } from './hooks/useBeforeUnloadWarning';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { useThemeEffect } from './hooks/useThemeEffect';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import SmartCaptureFAB from './components/SmartCaptureFAB';
import { performanceService } from './services/performanceService';
import DebugAuth from './components/DebugAuth';
import SyncIndicator from './components/SyncIndicator';

// ... (existing imports)

// --- Code Splitting with React.lazy ---
const FeedScreen = lazy(() => import('./screens/FeedScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const AddScreen = lazy(() => import('./screens/AddScreen'));
const SearchScreen = lazy(() => import('./screens/SearchScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const LibraryScreen = lazy(() => import('./screens/LibraryScreen'));
const InvestmentsScreen = lazy(() => import('./screens/InvestmentsScreen'));
const AssistantScreen = lazy(() => import('./screens/AssistantScreen'));
const DashboardScreen = React.lazy(() => import('./screens/DashboardScreen'));
const CalendarScreen = React.lazy(() => import('./screens/CalendarScreen'));
const PasswordManagerScreen = React.lazy(() => import('./screens/PasswordManagerScreen'));
const SplitView = lazy(() => import('./components/SplitView'));

const ThemedApp: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { settings, splitViewConfig } = state;
    const { themeSettings, uiDensity, animationIntensity, fontSizeScale } = settings;
    const [activeScreen, setActiveScreen] = useState<Screen>(state.settings.defaultScreen);
    const [statusMessage, setStatusMessage] = useState<{ type: StatusMessageType, text: string, id: number, onUndo?: () => Promise<void> | void } | null>(null);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Warn user before leaving page if there are unsaved changes
    useBeforeUnloadWarning(state.hasUnsavedChanges);

    // Schedule habit and task reminders
    useHabitReminders();
    useTaskReminders();

    const showStatus = useCallback((type: StatusMessageType, text: string, onUndo?: () => Promise<void> | void) => {
        setStatusMessage({ type, text, id: Date.now(), onUndo });
    }, []);

    // Custom Hooks for Logic
    useGoogleCalendar(showStatus);
    useThemeEffect({ themeSettings, uiDensity, animationIntensity, fontSizeScale });
    const { updateAvailable, handleUpdate } = usePwaUpdate();

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-cleanup hook
    useEffect(() => {
        const cleanup = async () => {
            const deletedIds = await dataService.cleanupCompletedTasks();
            if (deletedIds.length > 0) {
                console.log(`Auto-cleaned ${deletedIds.length} tasks.`);
                deletedIds.forEach(id => dispatch({ type: 'REMOVE_PERSONAL_ITEM', payload: id }));
            }
        };
        cleanup();
    }, [dispatch]);

    // Performance Monitoring
    useEffect(() => {
        performanceService.measureBasicVitals();
        performanceService.logMetric('App Mount', performance.now());

        // Log memory usage periodically (every minute)
        const memoryInterval = setInterval(() => {
            performanceService.logMemoryUsage();
        }, 60000);

        // Check for performance issues every 5 minutes
        const issueCheckInterval = setInterval(() => {
            const issues = performanceService.detectIssues();
            const criticalIssues = issues.filter(i => i.severity === 'high');

            if (criticalIssues.length > 0) {
                showStatus('info', `זוהו ${criticalIssues.length} בעיות ביצועים קריטיות`);
            }
        }, 300000); // 5 minutes

        return () => {
            clearInterval(memoryInterval);
            clearInterval(issueCheckInterval);
        };
    }, [showStatus]);

    // Global Mouse Tracker for Spotlight Effect
    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            // Update CSS variables on body for the spotlight effect
            document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
        };

        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, []);

    // Update app badge whenever unread feed items change
    useEffect(() => {
        const unreadCount = state.feedItems.filter(item => !item.is_read).length;
        updateAppBadge(unreadCount);
    }, [state.feedItems]);


    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (action) {
            if (action === 'share') {
                const url = params.get('url');
                const text = params.get('text');
                const title = params.get('title');
                sessionStorage.setItem('sharedData', JSON.stringify({ url, text, title }));
                setActiveScreen('add');
            } else if (action === 'add_task') {
                sessionStorage.setItem('preselect_add', 'task');
                setActiveScreen('add');
            } else if (action === 'add_spark') {
                sessionStorage.setItem('preselect_add', 'spark');
                setActiveScreen('add');
            } else if (action === 'go_today') {
                setActiveScreen('today');
            } else if (action === 'go_feed') {
                setActiveScreen('feed');
            } else if (action === 'import') {
                setActiveScreen('settings');
            }
            // Clean up URL to prevent re-triggering on reload
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleEndSession = async (loggedDuration?: number, isCancel: boolean = false) => {
        const sessionToRestore = state.focusSession; // Capture session state before clearing
        if (loggedDuration && sessionToRestore) {
            const updatedItem = await dataService.logFocusSession(sessionToRestore.item.id, loggedDuration);
            dispatch({ type: 'UPDATE_PERSONAL_ITEM', payload: { id: updatedItem.id, updates: updatedItem } });
        }
        dispatch({ type: 'CLEAR_FOCUS_SESSION' });

        if (isCancel && sessionToRestore) {
            showStatus('success', 'הסשן הופסק.', () => {
                // UNDO action
                dispatch({ type: 'START_FOCUS_SESSION', payload: sessionToRestore.item });
            });
        }
    };

    // By creating a map of components, we ensure they are all mounted at once.
    // Toggling `display` instead of using a `key` prop preserves their internal state.
    const screenMap: Record<Screen, React.ReactNode> = {
        feed: <FeedScreen setActiveScreen={setActiveScreen} />,
        today: <HomeScreen setActiveScreen={setActiveScreen} />,
        add: <AddScreen setActiveScreen={setActiveScreen} />,
        library: <LibraryScreen setActiveScreen={setActiveScreen} />,
        investments: <InvestmentsScreen setActiveScreen={setActiveScreen} />,
        search: <SearchScreen setActiveScreen={setActiveScreen} />,
        settings: <SettingsScreen setActiveScreen={setActiveScreen} />,
        assistant: <AssistantScreen setActiveScreen={setActiveScreen} />,
        dashboard: <DashboardScreen setActiveScreen={setActiveScreen} />,
        calendar: <CalendarScreen setActiveScreen={setActiveScreen} />,
        passwords: <PasswordManagerScreen setActiveScreen={setActiveScreen} />,
    };

    if (state.focusSession) {
        return <SessionTimer item={state.focusSession.item} onEndSession={handleEndSession} />;
    }

    if (splitViewConfig.isActive) {
        return (
            <Suspense fallback={<AppLoading />}>
                <SplitView />
            </Suspense>
        );
    }

    return (
        <div className="max-w-2xl mx-auto app-container pb-24 overflow-x-hidden min-h-screen flex flex-col">
            {themeSettings.backgroundEffect && <DynamicBackground />}
            <DebugAuth />
            <SyncIndicator />
            <main className="flex-grow">
                <Suspense fallback={<AppLoading />}>
                    {Object.entries(screenMap).map(([screenKey, screenComponent]) => (
                        <div
                            key={screenKey}
                            style={{ display: activeScreen === screenKey as Screen ? 'block' : 'none' }}
                        >
                            <div className={activeScreen === screenKey ? 'animate-screen-enter' : ''}>
                                {screenComponent}
                            </div>
                        </div>
                    ))}
                </Suspense>
            </main>
            {!splitViewConfig.isActive && <BottomNavBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />}
            {updateAvailable && (
                <div className="fixed bottom-24 right-4 z-50 animate-screen-enter">
                    <div className="themed-card p-3 flex items-center gap-4">
                        <p className="text-sm text-white font-medium">עדכון חדש זמין!</p>
                        <button onClick={handleUpdate} className="flex items-center gap-2 bg-[var(--accent-gradient)] text-black text-sm font-bold px-4 py-2 rounded-full hover:brightness-110 transition-all shadow-[0_4px_15px_var(--dynamic-accent-glow)]">
                            <RefreshIcon className="w-4 h-4" />
                            רענן
                        </button>
                    </div>
                </div>
            )}
            {statusMessage && <StatusMessage key={statusMessage.id} type={statusMessage.type} message={statusMessage.text} onDismiss={() => setStatusMessage(null)} onUndo={statusMessage.onUndo} />}

            {/* New Smart Capture FAB */}
            {!splitViewConfig.isActive && activeScreen !== 'add' && (
                <Suspense fallback={null}>
                    <SmartCaptureFAB setActiveScreen={setActiveScreen} showStatus={showStatus} />
                </Suspense>
            )}

            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} setActiveScreen={setActiveScreen} />
        </div>
    );
}


const App: React.FC = () => {
    return (
        <AppProvider>
            <ModalProvider>
                <ThemedApp />
                <ModalRoot />
            </ModalProvider>
        </AppProvider>
    );
};

export default App;