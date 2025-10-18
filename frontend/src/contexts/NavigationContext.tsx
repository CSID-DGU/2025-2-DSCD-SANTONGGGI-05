import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export type PageType = 'chat' | 'statistics' | 'purchase-history';

interface NavigationState {
  currentPage: PageType;
  previousPage?: PageType;
}

interface NavigationContextValue extends NavigationState {
  navigateTo: (page: PageType) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPage: 'chat'
    // previousPage is intentionally omitted - optional property
  });

  const navigateTo = useCallback((page: PageType) => {
    setNavigationState(prev => ({
      currentPage: page,
      previousPage: prev.currentPage
    }));
  }, []);

  const goBack = useCallback(() => {
    setNavigationState(prev => {
      if (prev.previousPage) {
        return {
          currentPage: prev.previousPage,
          previousPage: 'chat' // Reset to default
        };
      }
      return prev;
    });
  }, []);

  const canGoBack = Boolean(navigationState.previousPage);

  const contextValue: NavigationContextValue = useMemo(() => ({
    ...navigationState,
    navigateTo,
    goBack,
    canGoBack
  }), [navigationState.currentPage, navigationState.previousPage, navigateTo, goBack, canGoBack]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};