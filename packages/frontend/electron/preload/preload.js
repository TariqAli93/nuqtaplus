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

  // تفعيل كود جديد
  activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),

  // إعادة التفعيل
  reactivateLicense: (licenseKey) => ipcRenderer.invoke('reactivate-license', licenseKey),

  // الحصول على معلومات الكود الحالي
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),

  // إلغاء التفعيل
  deactivateLicense: () => ipcRenderer.invoke('deactivate-license'),

  logToMain: (message) => ipcRenderer.invoke('logToMain', message),
});
