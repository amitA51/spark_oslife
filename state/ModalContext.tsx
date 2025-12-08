import React, {
  createContext,
  useReducer,
  useContext,
  useCallback,
  ReactNode,
  useRef,
} from 'react';

/**
 * Modal payload types for type-safe modal data passing.
 * Extend this union type when adding new modal types.
 */
export type ModalPayload =
  | { itemId: string; itemType?: string }
  | { date: string }
  | { message: string }
  | Record<string, unknown>
  | undefined;

type ModalState = {
  [key: string]: {
    isOpen: boolean;
    payload?: ModalPayload;
  };
};

type ModalAction =
  | { type: 'OPEN_MODAL'; payload: { key: string; payload?: ModalPayload } }
  | { type: 'CLOSE_MODAL'; payload: { key: string } };

interface ModalContextType {
  modals: ModalState;
  openModal: (key: string, payload?: ModalPayload) => void;
  closeModal: (key: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        [action.payload.key]: { isOpen: true, payload: action.payload.payload },
      };
    case 'CLOSE_MODAL':
      // To allow for closing animations, we don't remove the key, just set isOpen to false
      const newState = { ...state };
      if (newState[action.payload.key]) {
        newState[action.payload.key] = { ...newState[action.payload.key], isOpen: false };
      }
      return newState;
    default:
      return state;
  }
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modals, dispatch] = useReducer(modalReducer, {});
  const openModalsRef = useRef(new Set<string>());

  const openModal = useCallback((key: string, payload?: ModalPayload) => {
    if (openModalsRef.current.has(key)) return;
    openModalsRef.current.add(key);
    dispatch({ type: 'OPEN_MODAL', payload: { key, payload } });
  }, []);

  const closeModal = useCallback((key: string) => {
    openModalsRef.current.delete(key);
    dispatch({ type: 'CLOSE_MODAL', payload: { key } });
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
