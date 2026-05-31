const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: () => true,

  // Sync controls
  syncNow: () => ipcRenderer.invoke('sync:now'),
  onSyncStatus: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('sync:status', handler);
    return () => ipcRenderer.removeListener('sync:status', handler);
  },

  // Config (first-run setup and storage mode)
  setConfig: (key, value) => ipcRenderer.invoke('config:set', { key, value }),
  getConfig: (key) => ipcRenderer.invoke('config:get', key),

  // Storage mode helpers
  setStorageMode: (mode) => ipcRenderer.invoke('config:set', { key: 'storageMode', value: mode }),
  getStorageMode: () => ipcRenderer.invoke('config:get', 'storageMode'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),

  // Auto-updater
  onUpdateAvailable: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('app:update-available', handler);
    return () => ipcRenderer.removeListener('app:update-available', handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('app:update-downloaded', handler);
    return () => ipcRenderer.removeListener('app:update-downloaded', handler);
  },
  installUpdate: () => ipcRenderer.invoke('app:install-update'),

  // License
  getLicense: () => ipcRenderer.invoke('license:get'),
  connectCloud: (creds) => ipcRenderer.invoke('license:connect-cloud', creds),
  refreshLicense: () => ipcRenderer.invoke('license:refresh'),
  onLicenseUpdate: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('license:updated', handler);
    return () => ipcRenderer.removeListener('license:updated', handler);
  },
});
