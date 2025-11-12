import path from 'path';
import { app } from 'electron';
import { spawn } from 'child_process';
import logger from './logger.js';

export default class BackendManager {
  constructor() {
    this.backendProcess = null;
  }

  async StartBackend() {
    if (this.backendProcess && !this.backendProcess.killed) {
      logger.warn('Backend server is already running');
      return;
    }

    const backendDir = app.isPackaged
      ? path.join(process.resourcesPath, 'backend')
      : path.join(__dirname, '../../../backend');

    const nodePath = path.join(
      backendDir,
      'bin',
      process.platform === 'win32' ? 'node.exe' : 'node'
    );

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
    this.backendProcess = spawn(nodePath, [serverScript], {
      cwd: backendDir,
      env,
      stdio: 'pipe',
    });

    this.backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        logger.info(`[Backend]:`, { output });
      }
    });

    this.backendProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        logger.error(`[Backend Error]:`, { error });
      }
    });

    this.backendProcess.on('close', (code) => {
      logger.info(`Backend process exited with code`, { code });
    });

    this.backendProcess.on('error', (error) => {
      logger.error(`Backend process error:`, { message: error.message });
    });
  }

  StopBackend() {
    // Logic to stop the backend process
  }

  async ShutDownBackendGracefully() {
    try {
      logger.info('Requesting backend shutdown via HTTP...');
      await fetch('http://127.0.0.1:3050/__shutdown__', { method: 'POST', timeout: 3000 });
    } catch {
      logger.warn('Backend did not respond to HTTP shutdown, sending SIGKILL...');
      if (this.backendProcess && !this.backendProcess.killed) this.backendProcess.kill('SIGKILL');
    }
  }

  async CleanupBackendProcess() {
    if (this.backendProcess && !this.backendProcess.killed) {
      logger.info('Cleaning up backend process...');
      await this.ShutDownBackendGracefully();

      // Wait 3s max before force killing
      setTimeout(() => {
        if (this.backendProcess && !this.backendProcess.killed) {
          logger.warn('Backend still alive, force killing...');
          this.backendProcess.kill('SIGKILL');
        }
      }, 3000);
    }
    this.backendProcess = null;
  }
}
