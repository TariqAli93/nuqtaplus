import settingsService from '../services/settingsService.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import { resolveFromEnv } from '../plugins/ensureDatabase.js';

const createSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.any(),
  description: z.string().optional(),
});

const updateSettingSchema = z.object({
  value: z.any().optional(),
  description: z.string().optional(),
});

const companyInfoSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  street: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  phone2: z.string().max(20).optional(),
  logoUrl: z.string().optional(),
  invoiceType: z.enum(['roll', 'a4']).optional(),
});

export class SettingsController {
  // Get all settings
  async list(request, reply) {
    try {
      const { page = 1, limit = 50, search } = request.query;

      const settings = await settingsService.list({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
      });

      return reply.send({
        success: true,
        data: settings,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message,
      });
    }
  }

  // Get all settings as key-value object
  async getAll(request, reply) {
    try {
      const settings = await settingsService.getAllAsObject();

      return reply.send({
        success: true,
        data: settings,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message,
      });
    }
  }

  // Get setting by key
  async getByKey(request, reply) {
    try {
      const { key } = request.params;
      const setting = await settingsService.getByKey(key);

      return reply.send({
        success: true,
        data: setting,
      });
    } catch (error) {
      const status = error.name === 'NotFoundError' ? 404 : 500;
      return reply.status(status).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Create new setting
  async create(request, reply) {
    try {
      const validatedData = createSettingSchema.parse(request.body);
      const setting = await settingsService.create(validatedData, request.user.id);

      return reply.status(201).send({
        success: true,
        message: 'Setting created successfully',
        data: setting,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      const status = error.name === 'ConflictError' ? 409 : 500;
      return reply.status(status).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Update setting
  async update(request, reply) {
    try {
      const { key } = request.params;
      const validatedData = updateSettingSchema.parse(request.body);

      const setting = await settingsService.update(key, validatedData, request.user.id);

      return reply.send({
        success: true,
        message: 'Setting updated successfully',
        data: setting,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      const status = error.name === 'NotFoundError' ? 404 : 500;
      return reply.status(status).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete setting
  async delete(request, reply) {
    try {
      const { key } = request.params;
      await settingsService.delete(key, request.user.id);

      return reply.send({
        success: true,
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      const status = error.name === 'NotFoundError' ? 404 : 500;
      return reply.status(status).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Bulk update settings
  async bulkUpdate(request, reply) {
    try {
      const settingsData = request.body;

      if (!settingsData || typeof settingsData !== 'object') {
        return reply.status(400).send({
          success: false,
          message: 'Invalid settings data provided',
        });
      }

      const settings = await settingsService.bulkUpdate(settingsData, request.user.id);

      return reply.send({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to update settings',
        error: error.message,
      });
    }
  }

  // Save company information with enhanced validation
  async saveCompanyInfo(request, reply) {
    try {
      const validatedData = companyInfoSchema.parse(request.body);
      const settings = await settingsService.saveCompanyInfo(validatedData, request.user.id);

      return reply.send({
        success: true,
        message: 'Company information updated successfully',
        data: settings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  // Get company information
  async getCompanyInfo(request, reply) {
    try {
      const settings = await settingsService.getByPrefix('company.');
      const companyInfo = {};

      for (const setting of settings) {
        const key = setting.key.replace('company.', '');
        try {
          companyInfo[key] = JSON.parse(setting.value);
        } catch {
          companyInfo[key] = setting.value;
        }
      }

      return reply.send({
        success: true,
        data: companyInfo,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch company information',
        error: error.message,
      });
    }
  }

  // Upload logo
  async uploadLogo(request, reply) {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        });
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const buffer = await data.toBuffer();

      if (buffer.length > maxSize) {
        return reply.status(400).send({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
        });
      }

      // Generate filename
      const ext = path.extname(data.filename);
      const filename = `logo-${Date.now()}${ext}`;
      const filePath = path.join(process.cwd(), 'data', 'uploads', filename);

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(filePath);
      await fs.mkdir(uploadsDir, { recursive: true });

      // Save file
      await fs.writeFile(filePath, buffer);

      // Update logo setting
      const logoUrl = `/uploads/${filename}`;
      await settingsService.setValue(
        'company.logoUrl',
        logoUrl,
        'Company logo URL',
        request.user.id
      );

      return reply.send({
        success: true,
        message: 'Logo uploaded successfully',
        data: { logoUrl },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to upload logo',
        error: error.message,
      });
    }
  }

  // DANGER ZONE: Reset Application
  async resetApplication(request, reply) {
    try {
      // Check if user has admin role
      if (request.user.role !== 'admin') {
        return reply.status(403).send({
          success: false,
          message: 'Access denied. Admin role required.',
        });
      }

      // Additional confirmation check
      const { confirmationToken } = request.body;
      if (confirmationToken !== 'RESET_CODELIMS_APPLICATION') {
        return reply.status(400).send({
          success: false,
          message: 'Invalid confirmation token',
        });
      }

      const result = await settingsService.resetApplication(request.user.id);

      return reply.send({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to reset application',
        error: error.message,
      });
    }
  }

  // Validate phone number
  async validatePhone(request, reply) {
    try {
      const { phone } = request.body;

      if (!phone) {
        return reply.status(400).send({
          success: false,
          message: 'Phone number is required',
        });
      }

      const isValid = settingsService.validatePhone(phone);

      return reply.send({
        success: true,
        data: { isValid, phone },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to validate phone number',
        error: error.message,
      });
    }
  }

  // Get currency settings
  async getCurrencySettings(request, reply) {
    try {
      const currencySettings = await settingsService.getCurrencySettings();

      return reply.send({
        success: true,
        data: currencySettings,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch currency settings',
        error: error.message,
      });
    }
  }

  // Save currency settings
  async saveCurrencySettings(request, reply) {
    try {
      const currencySchema = z.object({
        defaultCurrency: z.enum(['USD', 'IQD']),
        usdRate: z.number().positive(),
        iqdRate: z.number().positive(),
      });

      const validatedData = currencySchema.parse(request.body);
      const currencySettings = await settingsService.saveCurrencySettings(
        validatedData,
        request.user.id
      );

      return reply.send({
        success: true,
        message: 'Currency settings saved successfully',
        data: currencySettings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Failed to save currency settings',
        error: error.message,
      });
    }
  }

  async createBackup(request, reply) {
    try {
      // find database path
      const defaultFile = path.resolve(process.cwd(), 'data', 'codelims.db');
      const envSource = process.env.DATABASE_URL || process.env.DB_FILE || process.env.SQLITE_FILE;
      const resolved = resolveFromEnv(envSource) || defaultFile;

      // ensure database file exists
      if (resolved === ':memory:') {
        request.log.error('Cannot backup in-memory database');
        throw new Error('Cannot backup in-memory database');
      }

      const dbFile = resolved;
      const dir = path.dirname(dbFile);
      if (!fs.stat(dir)) {
        request.log.error('Database directory does not exist');
        throw new Error('Database directory does not exist');
      }
      if (!fs.stat(dbFile)) {
        request.log.error('Database file does not exist');
        throw new Error('Database file does not exist');
      }

      // read database file and create buffer to save as backup
      const data = await fs.readFile(dbFile);
      const backupId = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup-${backupId}.db`;
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(path.join(backupDir, backupFilename), data);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to create backup',
        error: error.message,
      });
    }
  }

  async listBackups(request, reply) {
    /** دالة مساعدة لتحويل الحجم إلى صيغة مقروءة */
    function formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    try {
      const backupDir = path.join(process.cwd(), 'data', 'backups');

      // تحقق أن المجلد موجود
      try {
        await fs.access(backupDir);
      } catch {
        await fs.mkdir(backupDir, { recursive: true });
      }

      const files = await fs.readdir(backupDir);

      // فقط الملفات التي تبدأ بـ backup- وتنتهي بـ .db
      const backupFiles = files.filter(
        (file) => file.startsWith('backup-') && file.endsWith('.db')
      );

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);

          return {
            id: file.replace('backup-', '').replace('.db', ''),
            filename: file,
            sizeBytes: stats.size,
            sizeReadable: formatBytes(stats.size),
            createdAt: stats.birthtime, // تاريخ الإنشاء الحقيقي
            modifiedAt: stats.mtime, // آخر تعديل
          };
        })
      );

      // الترتيب من الأحدث إلى الأقدم
      backups.sort((a, b) => b.createdAt - a.createdAt);

      return reply.send({
        success: true,
        data: backups,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error?.message || 'Failed to list backups',
        error: error.message,
      });
    }
  }

  async deleteBackup(request, reply) {
    try {
      const { id } = request.params;
      const backupFilename = id;
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      const backupPath = path.join(backupDir, backupFilename);
      await fs.unlink(backupPath);

      return reply.send({
        success: true,
        message: 'Backup deleted successfully',
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete backup',
        error: error,
      });
    }
  }

  async restoreBackup(request, reply) {
    const T = Date.now();
    try {
      // 1) حدد مسار القاعدة
      const defaultFile = path.resolve(process.cwd(), 'data', 'codelims.db');
      const envSource = process.env.DATABASE_URL || process.env.DB_FILE || process.env.SQLITE_FILE;
      const resolved = typeof resolveFromEnv === 'function' ? resolveFromEnv(envSource) : envSource;
      const dbFile = resolved || defaultFile;

      if (!dbFile || dbFile === ':memory:') {
        return reply
          .status(400)
          .send({ success: false, message: 'Cannot restore in-memory database' });
      }

      // تأكد أن مجلد القاعدة موجود
      const dbDir = path.dirname(dbFile);
      try {
        await fs.access(dbDir);
      } catch {
        await fs.mkdir(dbDir, { recursive: true });
      }

      // 2) حدد ملف النسخة
      const { id } = request.params;
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      const candidates = [
        path.join(backupDir, id),
        path.join(backupDir, `${id}.db`),
        path.join(backupDir, `backup-${id}`),
        path.join(backupDir, `backup-${id}.db`),
      ];
      let backupPath = null;
      for (const p of candidates) {
        try {
          await fs.access(p);
          backupPath = p;
          break;
        } catch {}
      }
      if (!backupPath) {
        return reply.status(404).send({ success: false, message: 'Backup file not found' });
      }

      // مهلة قصيرة لتحرير القفل في بعض الأنظمة
      await new Promise((r) => setTimeout(r, 300));

      // 4) أنشئ ملفًا جديدًا من النسخة داخل نفس المجلد (لضمان ذرّية rename)
      const newPath = `${dbFile}.new-${T}.db`;
      await fs.copyFile(backupPath, newPath);

      // 5) لو هناك قاعدة قديمة، أعد تسميتها إلى .old للاحتفاظ بها مؤقتًا
      const hadOld = await fs
        .access(dbFile)
        .then(() => true)
        .catch(() => false);
      const oldPath = `${dbFile}.old-${T}.db`;
      if (hadOld) {
        // على ويندوز: تأكد من عدم وجود عمليات مفتوحة على الملف
        await fs.rename(dbFile, oldPath);
      }

      // 6) بدل الأسماء ذرّيًا: new → dbFile
      await fs.rename(newPath, dbFile);

      // 7) نظّف القديمة بعد نجاح الاستبدال
      if (hadOld) {
        try {
          await fs.unlink(oldPath);
        } catch {} // تجاهل لو قُفل مؤقتًا
      }

      return reply.send({
        success: true,
        message: '✅ Backup restored successfully',
        source: path.basename(backupPath),
        target: dbFile,
      });
    } catch (error) {
      request.log?.error?.(error);

      // محاولة تراجع: إن بقي ملف .new ولم يتم الاستبدال، امسحه
      try {
        const newGlob = `${path.resolve(process.cwd(), 'data', 'codelims.db')}.new-${T}.db`;
        await fs.unlink(newGlob);
      } catch {}

      // إن كان هناك .old ولم نكمل الاستبدال، حاول إرجاعه إلى اسم القاعدة
      try {
        const oldGlob = `${path.resolve(process.cwd(), 'data', 'codelims.db')}.old-${T}.db`;
        const dbFile = path.resolve(process.cwd(), 'data', 'codelims.db');
        const existsOld = await fs
          .access(oldGlob)
          .then(() => true)
          .catch(() => false);
        if (existsOld) {
          // إن كان dbFile غير موجود (فشلنا بإنشائه) نرجعه فورًا
          const dbExists = await fs
            .access(dbFile)
            .then(() => true)
            .catch(() => false);
          if (!dbExists) await fs.rename(oldGlob, dbFile);
        }
      } catch {}

      return reply.status(500).send({
        success: false,
        message: 'Failed to restore backup',
        error: error?.message || String(error),
      });
    }
  }

  async downloadBackup(request, reply) {
    try {
      const { filename } = request.params;
      // find database path
      const defaultFile = path.resolve(process.cwd(), 'data', 'backups', filename);
      const envSource = process.env.DATABASE_URL || process.env.DB_FILE || process.env.SQLITE_FILE;
      const resolved = resolveFromEnv(envSource) || defaultFile;

      // ensure database file exists
      if (resolved === ':memory:') {
        request.log.error('Cannot backup in-memory database');
        throw new Error('Cannot backup in-memory database');
      }

      const dbFile = resolved;
      const dir = path.dirname(dbFile);
      if (!fs.stat(dir)) {
        request.log.error('Database directory does not exist');
        throw new Error('Database directory does not exist');
      }
      if (!fs.stat(dbFile)) {
        request.log.error('Database file does not exist');
        throw new Error('Database file does not exist');
      }

      // تحقق أن الملف موجود
      try {
        await fs.access(dbFile);
      } catch {
        return reply.status(404).send({
          success: false,
          message: 'Backup file not found.',
        });
      }

      // إعداد الهيدر الصحيح للتحميل
      reply.header('Content-Type', 'application/octet-stream');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);

      const fileStream = await fs.readFile(dbFile);
      return reply.send(fileStream);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to download backup',
        error: error.message,
      });
    }
  }
}

export default new SettingsController();
