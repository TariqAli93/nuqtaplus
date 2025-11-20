const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
  saveFile: (filePath, data) => ipcRenderer.invoke('file:saveFile', filePath, data),
  readFile: (filePath) => ipcRenderer.invoke('file:readFile', filePath),
  // Backups

  // server control
  restartBackend: () => ipcRenderer.invoke('backend:restart'),
  stopBackend: () => ipcRenderer.invoke('backend:stop'),
  startBackend: () => ipcRenderer.invoke('backend:start'),

  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  setSize: (width, height) => ipcRenderer.invoke('window:auto-resize', { width, height }),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  onUpdateDownloading: (callback) => {
    ipcRenderer.on('update-downloading', callback);
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, data) => callback(data));
  },
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-downloading');
    ipcRenderer.removeAllListeners('update-progress');
  },

  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  },

  onUpdateReady: (callback) => {
    ipcRenderer.on('update-ready', (_event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (_event, msg) => callback(msg));
  },

  checkUpdatesManually: () => ipcRenderer.invoke('update:checkManually'),
});
