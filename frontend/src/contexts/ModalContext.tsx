import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { ModalState, ModalContextValue, ProductModalData } from '../types/modal';

// Initial state
const initialState: ModalState = {
  isOpen: false,
  product: null,
  isLoading: false,
  error: null,
};

// Action types
type ModalAction =
  | { type: 'OPEN_MODAL'; payload: ProductModalData }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Reducer
const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        isOpen: true,
        product: action.payload,
        error: null,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        isOpen: false,
        product: null,
        isLoading: false,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Context
const ModalContext = createContext<ModalContextValue | undefined>(undefined);

// Provider component
interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  // Open product modal
  const openProductModal = useCallback((product: ProductModalData) => {
    dispatch({ type: 'OPEN_MODAL', payload: product });
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Set error
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const contextValue: ModalContextValue = useMemo(
    () => ({
      isOpen: state.isOpen,
      product: state.product,
      isLoading: state.isLoading,
      error: state.error,
      openProductModal,
      closeModal,
      setLoading,
      setError,
    }),
    [state.isOpen, state.product, state.isLoading, state.error, openProductModal, closeModal, setLoading, setError]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

// Hook to use modal context
export const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
