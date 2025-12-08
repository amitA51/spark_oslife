import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { FeedItem, PersonalItem, Space } from '../../types';
import * as dataService from '../../services/dataService';
import { syncService } from '../../services/syncService';

export interface DataContextValue {
  feedItems: FeedItem[];
  personalItems: PersonalItem[];
  spaces: Space[];
  isLoading: boolean;
  error: string | null;

  // Lazy loading
  loadDataType: (type: string) => Promise<void>;
  isDataTypeLoaded: (type: string) => boolean;

  refreshAll: () => Promise<void>;

  updateFeedItem: (id: string, updates: Partial<FeedItem>) => Promise<FeedItem>;
  removeFeedItem: (id: string) => Promise<void>;

  addPersonalItem: (
    item: Omit<PersonalItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<PersonalItem>;
  updatePersonalItem: (id: string, updates: Partial<PersonalItem>) => Promise<PersonalItem>;
  removePersonalItem: (id: string) => Promise<void>;

  addSpace: (space: Omit<Space, 'id'>) => Promise<Space>;
  updateSpace: (id: string, updates: Partial<Space>) => Promise<Space>;
  removeSpace: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export interface DataProviderProps {
  children: ReactNode;
}

const triggerAutoSave = () => {
  try {
    syncService.triggerAutoSave();
  } catch (error) {
    console.error('Failed to trigger auto-save:', error);
  }
};

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [personalItems, setPersonalItems] = useState<PersonalItem[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Changed to false - no initial load
  const [error, setError] = useState<string | null>(null);

  // Track which data types have been loaded
  const loadedTypesRef = useRef<Set<string>>(new Set());
  const loadingTypesRef = useRef<Set<string>>(new Set());

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if a data type is loaded
  const isDataTypeLoaded = useCallback((type: string): boolean => {
    return loadedTypesRef.current.has(type);
  }, []);

  // Load a specific data type on demand
  const loadDataType = useCallback(async (type: string): Promise<void> => {
    // Skip if already loaded or currently loading
    if (loadedTypesRef.current.has(type) || loadingTypesRef.current.has(type)) {
      return;
    }

    loadingTypesRef.current.add(type);
    setIsLoading(true);

    try {
      switch (type) {
        case 'feedItems':
          const feed = await dataService.getFeedItems();
          if (mountedRef.current) {
            setFeedItems(feed);
          }
          break;

        case 'personalItems':
          const personal = await dataService.getPersonalItems();
          if (mountedRef.current) {
            setPersonalItems(personal);
          }
          break;

        case 'spaces':
          const spaceList = await dataService.getSpaces();
          if (mountedRef.current) {
            setSpaces(spaceList);
          }
          break;
      }

      loadedTypesRef.current.add(type);

      // Initialize sync service after first data load
      if (loadedTypesRef.current.size === 1) {
        syncService.init();
      }
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
      if (mountedRef.current) {
        setError(`Failed to load ${type}`);
      }
    } finally {
      loadingTypesRef.current.delete(type);
      if (mountedRef.current && loadingTypesRef.current.size === 0) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load essential data for initial screen (personalItems for Today view)
  useEffect(() => {
    // Load personal items immediately for the default Today screen
    void loadDataType('personalItems');
  }, [loadDataType]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [feed, personal, spaceList] = await Promise.all([
        dataService.getFeedItems(),
        dataService.getPersonalItems(),
        dataService.getSpaces(),
      ]);

      if (!mountedRef.current) return;

      setFeedItems(feed);
      setPersonalItems(personal);
      setSpaces(spaceList);

      loadedTypesRef.current.add('feedItems');
      loadedTypesRef.current.add('personalItems');
      loadedTypesRef.current.add('spaces');

      syncService.init();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      if (mountedRef.current) {
        setError('Failed to load data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    // Clear loaded types to force reload
    loadedTypesRef.current.clear();
    await loadAll();
  }, [loadAll]);

  const updateFeedItem = useCallback(
    async (id: string, updates: Partial<FeedItem>): Promise<FeedItem> => {
      const updated = await dataService.updateFeedItem(id, updates);
      setFeedItems(prev => prev.map(item => (item.id === id ? { ...item, ...updated } : item)));
      triggerAutoSave();
      return updated;
    },
    []
  );

  const removeFeedItem = useCallback(async (id: string): Promise<void> => {
    await dataService.removeFeedItem(id);
    setFeedItems(prev => prev.filter(item => item.id !== id));
    triggerAutoSave();
  }, []);

  const addPersonalItem = useCallback(
    async (
      itemData: Omit<PersonalItem, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<PersonalItem> => {
      const newItem = await dataService.addPersonalItem(itemData);
      setPersonalItems(prev => [newItem, ...prev]);
      triggerAutoSave();
      return newItem;
    },
    []
  );

  const updatePersonalItem = useCallback(
    async (id: string, updates: Partial<PersonalItem>): Promise<PersonalItem> => {
      const updated = await dataService.updatePersonalItem(id, updates);
      setPersonalItems(prev => prev.map(item => (item.id === id ? updated : item)));
      triggerAutoSave();
      return updated;
    },
    []
  );

  const removePersonalItem = useCallback(async (id: string): Promise<void> => {
    await dataService.removePersonalItem(id);
    setPersonalItems(prev => prev.filter(item => item.id !== id));
    triggerAutoSave();
  }, []);

  const addSpace = useCallback(async (spaceData: Omit<Space, 'id'>): Promise<Space> => {
    const newSpace = await dataService.addSpace(spaceData);
    setSpaces(prev => [...prev, newSpace].sort((a, b) => a.order - b.order));
    triggerAutoSave();
    return newSpace;
  }, []);

  const updateSpace = useCallback(async (id: string, updates: Partial<Space>): Promise<Space> => {
    const updated = await dataService.updateSpace(id, updates);
    setSpaces(prev =>
      prev.map(space => (space.id === id ? updated : space)).sort((a, b) => a.order - b.order)
    );
    triggerAutoSave();
    return updated;
  }, []);

  const removeSpace = useCallback(async (id: string): Promise<void> => {
    await dataService.removeSpace(id);
    setSpaces(prev => prev.filter(space => space.id !== id));
    triggerAutoSave();
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      feedItems,
      personalItems,
      spaces,
      isLoading,
      error,
      loadDataType,
      isDataTypeLoaded,
      refreshAll,
      updateFeedItem,
      removeFeedItem,
      addPersonalItem,
      updatePersonalItem,
      removePersonalItem,
      addSpace,
      updateSpace,
      removeSpace,
    }),
    [
      feedItems,
      personalItems,
      spaces,
      isLoading,
      error,
      loadDataType,
      isDataTypeLoaded,
      refreshAll,
      updateFeedItem,
      removeFeedItem,
      addPersonalItem,
      updatePersonalItem,
      removePersonalItem,
      addSpace,
      updateSpace,
      removeSpace,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
};
