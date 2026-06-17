import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.instify.app',
  appName: 'Instify',
  webDir: 'dist',

  server: {
    // Use HTTPS scheme so cookies / localStorage behave identically to the browser
    androidScheme: 'https',
    // No `url` override — the bundled dist/ assets are served from the WebView.
    // API calls go to the production backend via VITE_BASE_URL baked into the build.
    cleartext: false,
  },

  android: {
    backgroundColor: '#f4f9f6',
    // Allow the web content to capture keyboard input on Android
    captureInput: true,
    // Prevent mixed HTTP content (backend must be on HTTPS)
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1a7a4a',
      showSpinner: false,
    },
  },
};

export default config;
