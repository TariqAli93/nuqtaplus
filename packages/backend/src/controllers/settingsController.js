import settingsService from '../services/settingsService.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

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
}

export default new SettingsController();
