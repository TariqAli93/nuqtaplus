import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { promises as fs } from 'fs';
import logger from './logger.js';
import BackendManager from './backendManager.js';
import LicenseValidator from './licenseValidator.js';
import Store from 'electron-store';
import { getStoreConfig } from './storeConfig.js';

// --- المتغيرات العامة ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow;
let isQuitting = false;

// استخدام نفس إعدادات التشفير في جميع أنحاء التطبيق
const store = new Store(getStoreConfig());
const licenseValidator = new LicenseValidator();
const backendManager = new BackendManager();

// --- منع تشغيل أكثر من نسخة ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.info('Another instance is already running. Exiting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    logger.info('Second instance detected. Focusing main window...');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// --- نافذة البرنامج الرئيسية ---
function createWindow() {
  if (mainWindow) {
    logger.warn('Main window already exists. Focusing...');
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  logger.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 150,
    minHeight: 700,
    autoHideMenuBar: true,
    show: false,
    icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: isDev
        ? join(__dirname, '../preload/preload.mjs')
        : join(__dirname, '../preload/preload.mjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    logger.info('Main window ready to show');
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // في production، الملفات موجودة في app.asar
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
  const activationWindow = new BrowserWindow({
    width: 400,
    height: 400,
    autoHideMenuBar: true,
    frame: false,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: isDev
        ? join(__dirname, '../preload/preload.mjs')
        : join(__dirname, '../preload/preload.mjs'),
    },
  });

  activationWindow.loadFile(
    isDev
      ? path.join(__dirname, '../../activation.html')
      : path.join(__dirname, '../dist/activation.html')
  );

  // عند إغلاق نافذة التفعيل، إنهاء البرنامج بالكامل
  activationWindow.on('closed', async () => {
    logger.info('Activation window closed. Quitting application...');
    isQuitting = true;
    await backendManager.CleanupBackendProcess();
    app.quit();
  });

  return activationWindow;
}

// --- عند جاهزية التطبيق ---
app.whenReady().then(async () => {
  if (isQuitting) {
    logger.info('Application is quitting, aborting startup...');
    return;
  }

  try {
    logger.info('Starting backend server...');
    await backendManager.StartBackend();
    logger.info('Backend server started successfully');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    logger.error('Failed to start backend server:', error);
  }

  const licenseCheck = await licenseValidator.checkLicenseOnStartup();

  if (licenseCheck.needsActivation) {
    const activationWindow = createActivationWindow();

    ipcMain.handle('activate-license', async (_event, licenseKey) => {
      const result = await licenseValidator.validateLicense(licenseKey);
      if (result.success) {
        activationWindow.close();

        setTimeout(() => {
          createWindow();
        }, 1000);
      }
      return result;
    });
  } else {
    createWindow();
  }

  // --- إعادة التفعيل من داخل التطبيق ---
  ipcMain.handle('reactivate-license', async (_event, licenseKey) =>
    licenseValidator.validateLicense(licenseKey)
  );

  // --- الحصول على معلومات الترخيص ---
  ipcMain.handle('get-license-info', async () => ({
    licenseKey: store.get('licenseKey'),
    lastValidation: store.get('lastValidation'),
  }));

  // --- إلغاء التفعيل ---
  ipcMain.handle('deactivate-license', async () => {
    try {
      // حذف بيانات التفعيل
      store.delete('licenseKey');
      store.delete('lastValidation');

      // إغلاق النافذة الرئيسية
      if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
      }

      // فتح نافذة التفعيل
      createActivationWindow();

      return { success: true };
    } catch (error) {
      logger.error('Error during deactivation:', error);
      return { success: false, message: 'فشل إلغاء التفعيل' };
    }
  });

  // macOS: إنشاء نافذة جديدة عند إعادة فتح التطبيق
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !isQuitting) {
      createWindow();
    }
  });
});

// --- عند إغلاق جميع النوافذ ---
app.on('window-all-closed', async () => {
  logger.info('All windows closed');
  isQuitting = true;
  await backendManager.CleanupBackendProcess();
  // إغلاق التطبيق بغض النظر عن النظام (حتى macOS)
  app.quit();
});

// --- تنظيف قبل الإغلاق ---
app.on('before-quit', async (event) => {
  if (isQuitting) {
    logger.info('Application is already quitting, allowing quit');
    return;
  }

  logger.info('Application is about to quit');
  isQuitting = true;
  event.preventDefault();

  await backendManager.CleanupBackendProcess();

  // الآن نسمح بالإغلاق
  app.quit();
});

app.on('will-quit', async () => {
  logger.info('Application will quit');
  await backendManager.CleanupBackendProcess();
});

// --- معلومات التطبيق ---
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getPlatform', () => process.platform);

// --- Dialog ---
ipcMain.handle('dialog:showSaveDialog', async (_e, options) =>
  dialog.showSaveDialog(mainWindow, options)
);
ipcMain.handle('dialog:showOpenDialog', async (_e, options) =>
  dialog.showOpenDialog(mainWindow, options)
);

// --- File Handlers ---
ipcMain.handle('file:saveFile', async (_e, filePath, data) => {
  try {
    if (!filePath) throw new Error('❌ filePath is undefined');
    if (!data) throw new Error('❌ data is undefined');
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await fs.writeFile(filePath, buffer);
    return { success: true };
  } catch (error) {
    logger.error('Error saving file:', error);
    throw error;
  }
});

ipcMain.handle('file:readFile', async (_e, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    logger.error('Error reading file:', error);
    throw error;
  }
});

// --- Backend التحكم في الخادم ---
ipcMain.handle('backend:restart', async () => {
  logger.info('Restarting backend server...');
  await backendManager.CleanupBackendProcess();
  await backendManager.StartBackend();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  logger.info('Backend server restarted successfully');
});

ipcMain.handle('backend:stop', async () => {
  logger.info('Stopping backend server...');
  await backendManager.CleanupBackendProcess();
  logger.info('Backend server stopped successfully');
});

ipcMain.handle('backend:start', async () => {
  logger.info('Starting backend server...');
  await backendManager.StartBackend();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  logger.info('Backend server started successfully');
});

// --- فتح متصفح خارجي ---
ipcMain.handle('shell:openExternal', async (_e, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    logger.error('Error opening external URL:', error);
    return { success: false, message: error.message };
  }
});
