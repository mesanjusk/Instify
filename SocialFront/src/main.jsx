import React from 'react';
import ReactDOM from 'react-dom/client';

// Mobile console — shows floating DevTools on the phone screen.
// Activate by adding  ?debug=1  to the URL, e.g. https://app.sanjusk.in/?debug=1
if (new URLSearchParams(window.location.search).get('debug') === '1') {
  import('eruda').then(m => m.default.init());
}
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import App from './App';

import BrandingProvider from './context/BrandingContext';
import { AppProvider } from './context/AppContext';
import MetadataProvider from './context/MetadataContext';
import theme from './theme';
import { utilityStyles } from './styles/utilityStyles';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={utilityStyles} />
      <BrowserRouter>
        <BrandingProvider>
          <AppProvider>
            <MetadataProvider>
              <App />
            </MetadataProvider>
          </AppProvider>
        </BrandingProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        if (Notification && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
  });
}
