import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { spawn } from 'child_process';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = !app.isPackaged;
let mainWindow;
let backendProcess = null;
let isQuitting = false;

// Single Instance Lock - منع تشغيل أكثر من نسخة واحدة
const gotTheLock = app.requestSingleInstanceLock();

// تنظيف العملية الفرعية للخادم
function cleanupBackendProcess() {
  if (backendProcess && !backendProcess.killed) {
    logger.info('Cleaning up backend process...');
    try {
      backendProcess.kill('SIGTERM');

      // إذا لم تتوقف العملية خلال 5 ثوان، استخدم SIGKILL
      setTimeout(() => {
        if (backendProcess && !backendProcess.killed) {
          logger.warn('Backend process did not terminate gracefully, force killing...');
          backendProcess.kill('SIGKILL');
        }
      }, 5000);
    } catch (error) {
      logger.error('Error cleaning up backend process:', error);
    }
    backendProcess = null;
  }
}

if (!gotTheLock) {
  logger.info('Another instance is already running. Exiting...');
  app.quit();
} else {
  // Handle second instance attempt
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    logger.info('Second instance detected. Focusing main window...');
    // إذا كان هناك نافذة مفتوحة، ركز عليها
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Start Backend Server
async function startBackendServer() {
  // تأكد من عدم وجود عملية خادم قيد التشغيل بالفعل
  if (backendProcess && !backendProcess.killed) {
    logger.warn('Backend server is already running');
    return;
  }

  const backendDir = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../../../backend');

  const nodePath = path.join(backendDir, 'bin', process.platform === 'win32' ? 'node.exe' : 'node');

  // test if binary exists
  const serverScript = app.isPackaged
    ? path.join(backendDir, 'start.js')
    : path.join(backendDir, 'src/server.js');

  // Verify required files exist
  const fs = await import('fs');

  if (!fs.existsSync(nodePath)) {
    logger.error(`Node.js binary not found at: ${nodePath}`);
    throw new Error(`Node.js binary not found at: ${nodePath}`);
  }

  if (!fs.existsSync(serverScript)) {
    logger.error(`Server script not found at: ${serverScript}`);
    throw new Error(`Server script not found at: ${serverScript}`);
  }

  if (!fs.existsSync(backendDir)) {
    logger.error(`Backend directory not found at: ${backendDir}`);
    throw new Error(`Backend directory not found at: ${backendDir}`);
  }

  logger.info(`Backend directory found: ${backendDir}`);
  logger.info(`Node.js binary found: ${nodePath}`);
  logger.info(`Server script found: ${serverScript}`);

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '3050',
    HOST: process.env.HOST || '127.0.0.1',
    DATABASE_PATH: path.join(backendDir, 'data', 'codelims.db'),
    NODE_PATH: path.join(backendDir, 'node_modules'),
  };

  // تشغيل الـ backend باستخدام node.exe المرفق
  backendProcess = spawn(nodePath, [serverScript], {
    cwd: backendDir,
    env,
    stdio: 'pipe',
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      logger.info(`[Backend]:`, { output });
      console.log(`[Backend]:`, { output });
    }
  });

  backendProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      logger.error(`[Backend Error]:`, { error });
      console.error(`[Backend Error]:`, { error });
    }
  });

  backendProcess.on('close', (code) => {
    logger.info(`Backend process exited with code`, { code });
    console.log(`Backend process exited with code`, { code });
  });

  backendProcess.on('error', (error) => {
    logger.error(`Backend process error:`, { message: error.message });
    console.error(`Backend process error:`, { message: error.message });
  });
}

function createWindow() {
  // تأكد من عدم وجود نافذة مفتوحة بالفعل
  if (mainWindow) {
    logger.warn('Main window already exists. Focusing existing window...');
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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
    autoHideMenuBar: true,
    icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
    show: false, // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    logger.info('Main window ready to show');
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, 'dist-electron', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    logger.info('Main window closed');
    mainWindow = null;
    // Kill backend process when window is closed
    cleanupBackendProcess();
  });
}

app.whenReady().then(async () => {
  // تأكد من عدم وجود نسخة أخرى قيد التشغيل
  if (isQuitting) {
    logger.info('Application is quitting, aborting startup...');
    return;
  }

  try {
    // Start backend server first
    logger.info('Starting backend server...');
    await startBackendServer();
    logger.info('Backend server started successfully');

    // Wait a moment for the server to fully start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    logger.error('Failed to start backend server:', error);
    // Continue anyway - let the user know in the UI
  }

  // Then create the window
  createWindow();

  app.on('activate', () => {
    // في macOS، أنشئ نافذة جديدة إذا لم تكن موجودة عند النقر على أيقونة التطبيق
    if (BrowserWindow.getAllWindows().length === 0 && !isQuitting) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
  isQuitting = true;

  // تنظيف العملية الفرعية عند إغلاق جميع النوافذ
  cleanupBackendProcess();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit
app.on('before-quit', (event) => {
  logger.info('Application is about to quit');
  isQuitting = true;

  // إذا كانت العملية الفرعية ما زالت قيد التشغيل، انتظر تنظيفها
  if (backendProcess && !backendProcess.killed) {
    event.preventDefault();
    cleanupBackendProcess();

    // انتظار قصير للتأكد من إنهاء العملية، ثم إغلاق التطبيق
    setTimeout(() => {
      app.quit();
    }, 1000);
  }
});

// إضافة معالج إضافي للتأكد من التنظيف عند إغلاق النظام
app.on('will-quit', () => {
  logger.info('Application will quit');
  cleanupBackendProcess();
});

// IPC Handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});
