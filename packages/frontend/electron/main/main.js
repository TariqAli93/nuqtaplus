import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { promises as fs } from 'fs-extra';
import logger from '../scripts/logger.js';
import BackendManager from '../scripts/backendManager.js';
import { getMachineId, saveLicenseString, verifyLicense } from '../scripts/licenseManager.js';
import { setupAutoUpdater, checkForUpdatesManually } from '../scripts/autoUpdater.js';

// --- المتغيرات العامة ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow = null;
let activationWindow = null;
let isQuitting = false;

const backendManager = new BackendManager();

// --- منع تشغيل أكثر من نسخة ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// --- نافذة البرنامج الرئيسية ---
function createWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 600,
    minHeight: 700,
    autoHideMenuBar: true,
    show: false,
    icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: isDev,
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    setupAutoUpdater(mainWindow);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', async () => {
    logger.info('Main window closed');
    mainWindow = null;
    await backendManager.CleanupBackendProcess();
  });
}

// --- نافذة التفعيل ---
function createActivationWindow() {
  if (activationWindow) return;

  activationWindow = new BrowserWindow({
    width: 550,
    height: 700,
    autoHideMenuBar: true,
    frame: true,
    resizable: false,
    fullscreen: false,
    fullscreenable: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: false, // ← أهم شيء
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  activationWindow.loadFile(
    isDev
      ? path.join(__dirname, '../../activation.html')
      : path.join(__dirname, '../dist/activation.html')
  );

  activationWindow.on('closed', () => {
    logger.info('Activation window closed');
    activationWindow = null;
  });

  activationWindow.webContents.on('before-input-event', (event, input) => {
    if (
      (input.control && input.shift && input.key.toLowerCase() === 'i') || // Ctrl+Shift+I
      input.key === 'F12' // F12
    ) {
      event.preventDefault();
    }
  });

  activationWindow.webContents.on('devtools-opened', () => {
    activationWindow.webContents.closeDevTools();
  });
}

// --- عند جاهزية التطبيق ---
app.whenReady().then(async () => {
  if (isQuitting) return;

  const result = await verifyLicense();

  if (result.ok) {
    createWindow();
    await backendManager.StartBackend();
  } else {
    createActivationWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !isQuitting) {
      createWindow();
    }
  });
});

// --- عند إغلاق جميع النوافذ ---
app.on('window-all-closed', async () => {
  isQuitting = true;
  await backendManager.CleanupBackendProcess();
  app.quit();
});

// --- before quit ---
app.on('before-quit', async (event) => {
  if (isQuitting) return;

  isQuitting = true;
  event.preventDefault();

  await backendManager.CleanupBackendProcess();
  app.quit();
});

// --- will quit ---
app.on('will-quit', async () => {
  await backendManager.CleanupBackendProcess();
});

// --- IPC: معلومات التطبيق ---
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getPlatform', () => process.platform);

// --- Dialog ---
ipcMain.handle('dialog:showSaveDialog', async (_e, options) =>
  dialog.showSaveDialog(mainWindow, options)
);

ipcMain.handle('dialog:showOpenDialog', async (_e, options) =>
  dialog.showOpenDialog(mainWindow, options)
);

// --- File System ---
ipcMain.handle('file:saveFile', async (_e, filePath, data) => {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  return { success: true };
});

ipcMain.handle('file:readFile', async (_e, filePath) => {
  return await fs.readFile(filePath);
});

// --- التحكم في backend (يدوي فقط) ---
ipcMain.handle('backend:start', async () => {
  await backendManager.StartBackend();
  return { ok: true };
});

// --- إيقاف backend ---
ipcMain.handle('backend:stop', async () => {
  await backendManager.CleanupBackendProcess();
  return { ok: true };
});

// --- إعادة تشغيل backend ---
ipcMain.handle('backend:restart', async () => {
  await backendManager.CleanupBackendProcess();
  await backendManager.StartBackend();
  return { ok: true };
});

// --- فتح رابط خارجي ---
ipcMain.handle('shell:openExternal', async (_e, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// --- License IPC ---
ipcMain.handle('license:getMachineId', () => getMachineId());

ipcMain.handle('license:activateString', async (_e, licenseString) => {
  saveLicenseString(licenseString);
  return await verifyLicense();
});

ipcMain.handle('license:activateFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'اختيار ملف التفعيل',
    filters: [{ name: 'License File', extensions: ['lic'] }],
    properties: ['openFile'],
  });

  if (canceled || !filePaths.length) return { ok: false, reason: 'no_license_file' };

  const content = (await fs.readFile(filePaths[0], 'utf8')).trim();

  saveLicenseString(content);
  return await verifyLicense();
});

ipcMain.handle('license:closeActivation', async () => {
  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }

  createWindow();

  if (!backendManager.isRunning()) {
    await backendManager.StartBackend();
  }

  return { ok: true };
});

ipcMain.handle('license:closeActivationWindow', async () => {
  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }
});

// auto width of activationWindow
ipcMain.handle('window:auto-resize', async (_e, { width, height }) => {
  if (activationWindow) {
    const newWidth = Math.ceil(width) + 20; // إضافة بعض الحشو
    const newHeight = Math.ceil(height) + 20; // إضافة بعض الحشو

    activationWindow.setSize(newWidth, newHeight);
  }
});

// --- Auto Updater Actions ---
import { autoUpdater } from 'electron-updater';

// تنزيل التحديث
ipcMain.handle('update:download', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloading');
  }
  autoUpdater.downloadUpdate();
  return { ok: true };
});

// تثبيت التحديث
ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
});
