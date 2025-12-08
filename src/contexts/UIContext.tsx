import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

export type UIViewMode = 'list' | 'grid' | 'board';

export interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  searchQuery: string;
  viewMode: UIViewMode;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export interface UIContextValue extends UIState {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveModal: (modal: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: UIViewMode) => void;
  setLoading: (loading: boolean) => void;
  setHasUnsavedChanges: (hasUnsaved: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(false);
  const [activeModal, setActiveModalState] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [viewMode, setViewModeState] = useState<UIViewMode>('list');
  const [isLoading, setIsLoadingState] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChangesState] = useState<boolean>(false);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpenState(prev => !prev);
  }, []);

  const setActiveModal = useCallback((modal: string | null) => {
    setActiveModalState(modal);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setViewMode = useCallback((mode: UIViewMode) => {
    setViewModeState(mode);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  const setHasUnsavedChanges = useCallback((hasUnsaved: boolean) => {
    setHasUnsavedChangesState(hasUnsaved);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      sidebarOpen,
      activeModal,
      searchQuery,
      viewMode,
      isLoading,
      hasUnsavedChanges,
      setSidebarOpen,
      toggleSidebar,
      setActiveModal,
      setSearchQuery,
      setViewMode,
      setLoading,
      setHasUnsavedChanges,
    }),
    [
      sidebarOpen,
      activeModal,
      searchQuery,
      viewMode,
      isLoading,
      hasUnsavedChanges,
      setSidebarOpen,
      toggleSidebar,
      setActiveModal,
      setSearchQuery,
      setViewMode,
      setLoading,
      setHasUnsavedChanges,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextValue => {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return ctx;
};
