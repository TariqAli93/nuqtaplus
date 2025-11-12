import db, { saveDatabase } from '../db.js';
import { settings } from '../models/index.js';
import { eq, like } from 'drizzle-orm';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Enhanced Settings Service
 * Handles comprehensive application settings management
 */
export class SettingsService {
  /**
   * Get all settings with optional filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 50)
   * @param {string} options.search - Search term for key or description
   * @returns {Promise<Object>} Settings list with pagination
   */
  async list({ page = 1, limit = 50, search } = {}) {
    const offset = (page - 1) * limit;
    let where;

    if (search) {
      where = like(settings.key, `%${search}%`);
    }

    const data = await db.select().from(settings).where(where).limit(limit).offset(offset);

    return { data, page, limit };
  }

  /**
   * Get all settings as key-value pairs
   * @returns {Promise<Object>} Settings object
   */
  async getAllAsObject() {
    const allSettings = await db.select().from(settings);

    return allSettings;
  }

  /**
   * Get setting by key
   * @param {string} key - Setting key
   * @returns {Promise<Object>} Setting record
   */
  async getByKey(key) {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

    if (!setting) {
      throw new NotFoundError(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  /**
   * Get setting by key (alias for backward compatibility)
   * @param {string} key - Setting key
   * @returns {Promise<Object>} Setting record
   */
  async getSetting(key) {
    return await this.getByKey(key);
  }

  /**
   * Get setting value by key
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if setting doesn't exist
   * @returns {Promise<*>} Setting value
   */
  async getValue(key, defaultValue = null) {
    try {
      const setting = await this.getByKey(key);
      // Try to parse JSON values, fallback to string
      try {
        return JSON.parse(setting.value);
      } catch {
        return setting.value;
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Create a new setting
   * @param {Object} data - Setting data
   * @param {string} data.key - Setting key (unique)
   * @param {*} data.value - Setting value
   * @param {string} data.description - Setting description
   * @param {number} userId - User ID creating the setting
   * @returns {Promise<Object>} Created setting
   */
  async create(data, userId) {
    const { key, value, description } = data;

    // Check if setting already exists
    const existingSetting = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

    if (existingSetting.length > 0) {
      throw new ConflictError(`Setting with key '${key}' already exists`);
    }

    const settingData = {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      description,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    const [newSetting] = await db.insert(settings).values(settingData).returning();

    await saveDatabase();
    return newSetting;
  }

  /**
   * Update setting by key
   * @param {string} key - Setting key
   * @param {Object} data - Updated setting data
   * @param {*} data.value - New setting value
   * @param {string} data.description - New setting description
   * @param {number} userId - User ID updating the setting
   * @returns {Promise<Object>} Updated setting
   */
  async update(key, data, userId) {
    // Verify setting exists
    await this.getByKey(key);

    const updateData = {
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    if (data.value !== undefined) {
      updateData.value = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const [updatedSetting] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.key, key))
      .returning();

    await saveDatabase();
    return updatedSetting;
  }

  /**
   * Set setting value (create or update)
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @param {string} description - Setting description
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Setting record
   */
  async setValue(key, value, description = null, userId) {
    try {
      // Try to update existing setting
      return await this.update(key, { value, description }, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Create new setting if it doesn't exist
        return await this.create({ key, value, description }, userId);
      }
      throw error;
    }
  }

  /**
   * Delete setting by key
   * @param {string} key - Setting key
   * @param {number} userId - User ID deleting the setting
   * @returns {Promise<Object>} Deleted setting
   */
  async delete(key) {
    const existingSetting = await this.getByKey(key);

    await db.delete(settings).where(eq(settings.key, key));

    await saveDatabase();
    return existingSetting;
  }

  /**
   * Bulk update multiple settings
   * @param {Object} settingsData - Object with key-value pairs
   * @param {number} userId - User ID updating the settings
   * @returns {Promise<Array>} Updated settings
   */
  async bulkUpdate(settingsData, userId) {
    const updatedSettings = [];

    for (const [key, value] of Object.entries(settingsData)) {
      try {
        const setting = await this.setValue(key, value, null, userId);
        updatedSettings.push(setting);
      } catch (error) {
        // Log error but continue with other settings
        console.error(`Failed to update setting ${key}:`, error);
      }
    }

    await saveDatabase();
    return updatedSettings;
  }

  /**
   * Get settings by key prefix
   * @param {string} prefix - Key prefix to filter by
   * @returns {Promise<Array>} Filtered settings
   */
  async getByPrefix(prefix) {
    return await db
      .select()
      .from(settings)
      .where(like(settings.key, `${prefix}%`));
  }

  /**
   * Initialize default settings if they don't exist
   * @param {Object} defaultSettings - Default settings object
   * @param {number} userId - User ID initializing settings
   * @returns {Promise<Array>} Created settings
   */
  async initializeDefaults(defaultSettings, userId) {
    const createdSettings = [];

    for (const [key, config] of Object.entries(defaultSettings)) {
      try {
        // Check if setting exists
        await this.getByKey(key);
      } catch (error) {
        if (error instanceof NotFoundError) {
          // Create default setting
          const setting = await this.create(
            {
              key,
              value: config.value,
              description: config.description,
            },
            userId
          );
          createdSettings.push(setting);
        }
      }
    }

    return createdSettings;
  }

  /**
   * DANGER ZONE: Reset entire application
   * @param {number} userId - User ID performing the reset
   * @returns {Promise<Object>} Reset operation result
   */
  // async resetApplication() {
  //   try {
  //     // In a real implementation, you would:
  //     // 1. Backup current data
  //     // 2. Clear all tables (except users and essential system data)
  //     // 3. Reset auto-increment counters
  //     // 4. Reinitialize with defaults

  //     // For now, we'll simulate the reset
  //     await new Promise((resolve) => setTimeout(resolve, 2000));

  //     await saveDatabase();

  //     return {
  //       success: true,
  //       message: 'Application reset completed successfully',
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid phone number
   */
  validatePhone(phone) {
    // Iraqi phone number patterns
    const patterns = [
      /^(\+964|0964|964)?[0-9]{10}$/, // Standard format
      /^07[3-9][0-9]{8}$/, // Mobile format
      /^01[0-9]{8}$/, // Baghdad landline
    ];

    return patterns.some((pattern) => pattern.test(phone.replace(/\s|-/g, '')));
  }

  /**
   * Save company information with enhanced validation
   * @param {Object} companyData - Company information
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Updated settings
   */
  async saveCompanyInfo(companyData, userId) {
    const { name, city, area, street, phone, phone2, logoUrl, invoiceType } = companyData;

    // Validate invoice type
    const validInvoiceTypes = ['roll', 'a4'];
    if (invoiceType && !validInvoiceTypes.includes(invoiceType)) {
      throw new Error(`Invalid invoice type: ${invoiceType}`);
    }

    const settingsData = {
      'company.name': name || '',
      'company.city': city || '',
      'company.area': area || '',
      'company.street': street || '',
      'company.phone': phone || '',
      'company.phone2': phone2 || '',
      'company.logoUrl': logoUrl || '',
      'company.invoiceType': invoiceType || 'roll',
    };

    await this.bulkUpdate(settingsData, userId);

    return await this.getByPrefix('company.');
  }

  /**
   * Get currency settings
   * @returns {Promise<Object>} Currency settings
   */
  async getCurrencySettings() {
    const defaultCurrency = await this.getValue('currency.default', 'IQD');
    const usdRate = await this.getValue('currency.usd_rate', '1500');
    const iqdRate = await this.getValue('currency.iqd_rate', '1');

    return {
      defaultCurrency,
      usdRate: parseFloat(usdRate),
      iqdRate: parseFloat(iqdRate),
    };
  }

  /**
   * Save currency settings
   * @param {Object} currencyData - Currency settings
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated currency settings
   */
  async saveCurrencySettings(currencyData, userId) {
    const { defaultCurrency, usdRate, iqdRate } = currencyData;

    // Validate default currency
    const validCurrencies = ['USD', 'IQD'];
    if (defaultCurrency && !validCurrencies.includes(defaultCurrency)) {
      throw new Error('Invalid currency. Must be either USD or IQD');
    }

    // Validate exchange rates
    if (usdRate && (isNaN(usdRate) || usdRate <= 0)) {
      throw new Error('Invalid USD exchange rate');
    }

    if (iqdRate && (isNaN(iqdRate) || iqdRate <= 0)) {
      throw new Error('Invalid IQD exchange rate');
    }

    const settingsData = {
      'currency.default': defaultCurrency || 'IQD',
      'currency.usd_rate': String(usdRate || 1500),
      'currency.iqd_rate': String(iqdRate || 1),
    };

    await this.bulkUpdate(settingsData, userId);

    return await this.getCurrencySettings();
  }
}

export default new SettingsService();
