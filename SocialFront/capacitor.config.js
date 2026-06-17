/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'in.instify.app',
  appName: 'Instify',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    cleartext: false,
  },

  android: {
    backgroundColor: '#f4f9f6',
    captureInput: true,
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

module.exports = config;
