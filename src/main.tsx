import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientConfig } from './config/query.config';
import './index.scss';
import App from './App.tsx';
import posthog from 'posthog-js';

if (import.meta.env.VITE_POSTHOG_KEY) {
     posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
          person_profiles: 'identified_only',
     });
}

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
               .then((reg) => console.log('SW registered successfully:', reg.scope))
               .catch((err) => console.error('SW registration failed:', err));
     });
}

createRoot(document.getElementById('root')!).render(
     <StrictMode>
          <QueryClientProvider client={queryClientConfig}>
               <App />
          </QueryClientProvider>
     </StrictMode>
);
