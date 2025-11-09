import React, { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout/MainLayout';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { useAuth } from './contexts/AppProvider';
import { LoadingSpinner } from './components/ui/LoadingSpinner/LoadingSpinner';
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary';
import './App.css';

const App: React.FC = () => {
  const { isAuthenticated, isInitializing, error, initialize } = useAuth();

  // Initialize the app on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" message="Initializing Shopping Assistant..." />
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="app-error">
        <div className="error-container">
          <h1>Failed to Initialize</h1>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {isAuthenticated ? <MainLayout /> : <LoginPage />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
