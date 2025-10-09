import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    currentPage: 'chat',
    previousPage: undefined
  });

  const navigateTo = (page: PageType) => {
    setNavigationState(prev => ({
      currentPage: page,
      previousPage: prev.currentPage
    }));
  };

  const goBack = () => {
    if (navigationState.previousPage) {
      setNavigationState(prev => ({
        currentPage: prev.previousPage || 'chat',
        previousPage: 'chat' // Reset to default
      }));
    }
  };

  const canGoBack = Boolean(navigationState.previousPage);

  const contextValue: NavigationContextValue = {
    ...navigationState,
    navigateTo,
    goBack,
    canGoBack
  };

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