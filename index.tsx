import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';
import ErrorBoundary from './components/ErrorBoundary';

// Extend window interface for service worker registration
// Extend window interface for service worker registration
// Note: This is already declared in global.d.ts with strict ServiceWorkerRegistrationWithSync type

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );

  // --- PWA Service Worker Registration ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          // Store the registration for later use (e.g., periodic sync)
          window.swRegistration = registration;
        })
        .catch(() => {
          // Service worker registration failed silently
        });
    });

    // --- PWA Update Logic ---
    // This listens for the 'controllerchange' event, which fires when the service
    // worker controlling the page changes, indicating a successful update.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  }
}

