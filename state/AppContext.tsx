import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { appReducer, initialState, AppState, AppAction } from './appReducer';
import * as dataService from '../services/dataService';
import { syncService } from '../services/syncService';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, originalDispatch] = useReducer(appReducer, initialState);

  const dispatch = (action: AppAction) => {
    originalDispatch(action);

    // Trigger auto-save for data-modifying actions
    if (action.type.startsWith('ADD_') ||
      action.type.startsWith('UPDATE_') ||
      action.type.startsWith('DELETE_') ||
      action.type.startsWith('TOGGLE_') ||
      action.type.startsWith('BATCH_')) {
      syncService.triggerAutoSave();
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        const [feedItems, personalItems, spaces] = await Promise.all([
          dataService.getFeedItems(),
          dataService.getPersonalItems(),
          dataService.getSpaces()
        ]);

        dispatch({ type: 'FETCH_SUCCESS', payload: { feedItems, personalItems, spaces } });

        // Initialize sync service after data is loaded
        syncService.init();

      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch({ type: 'FETCH_ERROR', payload: 'Failed to load data' });
      }
    };

    loadInitialData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};