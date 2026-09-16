import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { setCachedServiceWorkerRegistration } from './lib/notifications';
import App from './App.tsx';
import './index.css';

// Register service worker immediately for cross-platform notifications & offline caching
registerSW({
  immediate: true,
  onRegisteredSW(_swScriptUrl, registration) {
    if (registration) {
      setCachedServiceWorkerRegistration(registration);
    }
  },
  onRegisterError(error) {
    console.warn('[PWA] Service worker registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
