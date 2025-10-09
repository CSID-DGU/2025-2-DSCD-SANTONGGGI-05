import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './contexts/AppProvider';
import App from './App';
import './index.css';

// Ensure we have a root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Create React 18 root
const root = createRoot(container);

// Render the application with providers
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
