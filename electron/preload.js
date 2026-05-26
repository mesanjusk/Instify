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

  // Config (first-run setup)
  setConfig: (key, value) => ipcRenderer.invoke('config:set', { key, value }),
  getConfig: (key) => ipcRenderer.invoke('config:get', key),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
});
