import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { PanelState, PanelContextValue, PanelData } from '../types/panel';

// Initial state
const initialState: PanelState = {
  currentPanel: null,
  panelHistory: [],
  isExpanded: false,
  isAnimating: false,
  height: 0,
  error: null,
};

// Action types
type PanelAction =
  | { type: 'SHOW_PANEL'; payload: PanelData }
  | { type: 'HIDE_PANEL' }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'UPDATE_PANEL_DATA'; payload: Partial<PanelData> }
  | { type: 'SET_PANEL_HEIGHT'; payload: number }
  | { type: 'SET_EXPANDED'; payload: boolean }
  | { type: 'SET_ANIMATING'; payload: boolean }
  | { type: 'GO_BACK' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_ERROR'; payload: string | null };

// Reducer
const panelReducer = (state: PanelState, action: PanelAction): PanelState => {
  switch (action.type) {
    case 'SHOW_PANEL':
      const newHistory = state.currentPanel
        ? [...state.panelHistory, state.currentPanel]
        : state.panelHistory;

      return {
        ...state,
        currentPanel: action.payload,
        panelHistory: newHistory,
        isExpanded: true,
        height: action.payload.height || 300,
        error: null,
      };

    case 'HIDE_PANEL':
      return {
        ...state,
        currentPanel: null,
        isExpanded: false,
        height: 0,
        isAnimating: false,
      };

    case 'TOGGLE_PANEL':
      return {
        ...state,
        isExpanded: !state.isExpanded,
        height: state.isExpanded ? 0 : (state.currentPanel?.height || 300),
      };

    case 'UPDATE_PANEL_DATA':
      if (!state.currentPanel) return state;

      return {
        ...state,
        currentPanel: {
          ...state.currentPanel,
          ...action.payload,
        },
      };

    case 'SET_PANEL_HEIGHT':
      return {
        ...state,
        height: action.payload,
      };

    case 'SET_EXPANDED':
      return {
        ...state,
        isExpanded: action.payload,
        height: action.payload ? (state.currentPanel?.height || 300) : 0,
      };

    case 'SET_ANIMATING':
      return {
        ...state,
        isAnimating: action.payload,
      };

    case 'GO_BACK':
      const previousPanel = state.panelHistory[state.panelHistory.length - 1];
      const newHistoryAfterBack = state.panelHistory.slice(0, -1);

      return {
        ...state,
        currentPanel: previousPanel || null,
        panelHistory: newHistoryAfterBack,
        isExpanded: !!previousPanel,
        height: previousPanel?.height || 0,
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        panelHistory: [],
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Context
const PanelContext = createContext<PanelContextValue | undefined>(undefined);

// Provider component
interface PanelProviderProps {
  children: ReactNode;
}

export const PanelProvider: React.FC<PanelProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(panelReducer, initialState);

  // Show panel with data
  const showPanel = useCallback((panelData: PanelData) => {
    dispatch({ type: 'SET_ANIMATING', payload: true });
    dispatch({ type: 'SHOW_PANEL', payload: panelData });

    // Handle animation completion
    const animationDuration = panelData.animationConfig?.duration === 'fast' ? 200 :
                             panelData.animationConfig?.duration === 'slow' ? 600 : 400;

    setTimeout(() => {
      dispatch({ type: 'SET_ANIMATING', payload: false });
    }, animationDuration);
  }, []);

  // Hide panel
  const hidePanel = useCallback(() => {
    dispatch({ type: 'SET_ANIMATING', payload: true });
    dispatch({ type: 'SET_EXPANDED', payload: false });

    // Delay hiding to allow collapse animation
    setTimeout(() => {
      dispatch({ type: 'HIDE_PANEL' });
      dispatch({ type: 'SET_ANIMATING', payload: false });
    }, 300);
  }, []);

  // Toggle panel expanded state
  const togglePanel = useCallback(() => {
    if (!state.currentPanel) return;

    dispatch({ type: 'SET_ANIMATING', payload: true });
    dispatch({ type: 'TOGGLE_PANEL' });

    setTimeout(() => {
      dispatch({ type: 'SET_ANIMATING', payload: false });
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dispatch is stable, state.currentPanel check happens inside function

  // Update panel data
  const updatePanelData = useCallback((data: Partial<PanelData>) => {
    dispatch({ type: 'UPDATE_PANEL_DATA', payload: data });
  }, []);

  // Set panel height
  const setPanelHeight = useCallback((height: number) => {
    dispatch({ type: 'SET_PANEL_HEIGHT', payload: height });

    // Update current panel data with new height
    if (state.currentPanel) {
      dispatch({
        type: 'UPDATE_PANEL_DATA',
        payload: { height }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dispatch is stable, state.currentPanel check happens inside function

  // Go back to previous panel
  const goBack = useCallback(() => {
    if (state.panelHistory.length === 0) {
      hidePanel();
      return;
    }

    dispatch({ type: 'SET_ANIMATING', payload: true });
    dispatch({ type: 'GO_BACK' });

    setTimeout(() => {
      dispatch({ type: 'SET_ANIMATING', payload: false });
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidePanel]); // Only depend on hidePanel, state check happens inside function

  // Close panel (alias for hidePanel for compatibility)
  const closePanel = useCallback(() => {
    hidePanel();
  }, [hidePanel]);

  // Clear panel history
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const contextValue: PanelContextValue = {
    ...state,
    showPanel,
    hidePanel,
    closePanel,
    togglePanel,
    updatePanelData,
    setPanelHeight,
    goBack,
    clearHistory,
  };

  return (
    <PanelContext.Provider value={contextValue}>
      {children}
    </PanelContext.Provider>
  );
};

// Hook to use panel context
export const usePanel = (): PanelContextValue => {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
};