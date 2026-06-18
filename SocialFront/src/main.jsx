import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

if (new URLSearchParams(window.location.search).get('debug') === '1') {
  import('eruda').then(m => m.default.init());
}
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import App from './App';

import BrandingProvider from './context/BrandingContext';
import { AppProvider } from './context/AppContext';
import MetadataProvider from './context/MetadataContext';
import ErrorBoundary from './components/ErrorBoundary';
import theme from './theme';
import { utilityStyles } from './styles/utilityStyles';

// Electron loads via file:// so BrowserRouter can't resolve routes — use HashRouter instead
const isDesktop = import.meta.env.VITE_IS_DESKTOP === 'true';
const Router = isDesktop ? HashRouter : BrowserRouter;
// Allow a custom basename for GitHub Pages (/Instify) without affecting other deploys
const routerProps = !isDesktop && import.meta.env.VITE_ROUTER_BASENAME
  ? { basename: import.meta.env.VITE_ROUTER_BASENAME }
  : {};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={utilityStyles} />
      <ErrorBoundary>
        <Router {...routerProps}>
          <BrandingProvider>
            <AppProvider>
              <MetadataProvider>
                <App />
              </MetadataProvider>
            </AppProvider>
          </BrandingProvider>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);

// vite-plugin-pwa (autoUpdate) registers the Workbox service worker automatically.
// We only need to request notification permission here.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.ready.then(() => {
      if (Notification && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    });
  });
}
