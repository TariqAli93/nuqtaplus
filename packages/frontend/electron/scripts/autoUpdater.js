import { autoUpdater } from 'electron-updater';
import { app } from 'electron';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// إعدادات auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;
let updateCheckTimer = null;
let hasPendingUpdate = false;
let isDownloading = false;
let promptedVersions = new Set();

function setupAutoUpdater(window) {
  mainWindow = window;

  setupUpdateListeners();

  // في Dev Mode - نأخر الفحص 10 ثواني
  const delay = app.isPackaged ? 60000 : 10000;
  setTimeout(() => {
    checkForUpdates();
  }, delay);

  // في Production: فحص كل 4 ساعات
  if (app.isPackaged) {
    const interval = 4 * 60 * 60 * 1000;
    updateCheckTimer = setInterval(() => {
      checkForUpdates();
    }, interval);
  }
}

function checkForUpdates() {
  if (hasPendingUpdate || isDownloading) return;

  autoUpdater
    .checkForUpdates()
    .then((result) => {
      if (result && promptedVersions.has(result.updateInfo.version)) {
        return;
      }
    })
    .catch(() => {});
}

function setupUpdateListeners() {
  // عند توفر تحديث
  autoUpdater.on('update-available', (info) => {
    if (hasPendingUpdate || isDownloading) return;
    if (promptedVersions.has(info.version)) return;

    promptedVersions.add(info.version);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes || 'تحسينات وإصلاحات جديدة',
      });
    }
  });

  // بدء تنزيل التحديث – مهم جدًا
  autoUpdater.on('update-downloading', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloading');
    }
  });

  // تقدم التنزيل
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-progress', {
        percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    }
  });

  // اكتمال التنزيل – لازم نرسل update-ready
  autoUpdater.on('update-downloaded', () => {
    isDownloading = false;
    hasPendingUpdate = true;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-ready');
    }
  });

  // عند حدوث خطأ
  autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });
}

// فحص يدوي
function checkForUpdatesManually() {
  checkForUpdates();
}

function cleanup() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
}

export { setupAutoUpdater, checkForUpdatesManually, cleanup };
