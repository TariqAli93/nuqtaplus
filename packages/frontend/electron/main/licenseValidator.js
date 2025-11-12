import os from 'os';
import crypto from 'crypto';
import Store from 'electron-store';
import { getStoreConfig } from './storeConfig.js';

export default class LicenseValidator {
  constructor() {
    // استخدام نفس إعدادات التشفير في جميع أنحاء التطبيق
    this.store = new Store(getStoreConfig());
  }

  // توليد Device ID فريد بناءً على معلومات الجهاز
  generateDeviceId() {
    const networkInterfaces = os.networkInterfaces();

    // الحصول على MAC Address
    const macAddress =
      Object.values(networkInterfaces)
        .flat()
        .find((i) => !i.internal && i.mac !== '00:00:00:00:00:00')?.mac || 'unknown';

    const cpuInfo = os.cpus()[0]?.model || 'unknown';
    const hostname = os.hostname();

    const uniqueString = `${macAddress}-${cpuInfo}-${hostname}`;

    // إنشاء hash من المعلومات
    return crypto.createHash('sha256').update(uniqueString).digest('hex');
  }

  // التحقق من كود التفعيل
  async validateLicense(licenseKey) {
    const deviceId = this.generateDeviceId();

    try {
      const response = await fetch('http://217.71.207.252:3000/api/licenses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: licenseKey,
          deviceId: deviceId,
          deviceName: os.hostname(),
          os: `${os.type()} ${os.release()}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'خطأ في التحقق من الكود',
        };
      }

      const result = await response.json();

      if (result.status === 'success' && result.data.valid) {
        // إنشاء توقيع للبيانات المحفوظة لمنع التلاعب
        const deviceId = this.generateDeviceId();
        const timestamp = Date.now();
        const signature = crypto
          .createHmac('sha256', deviceId)
          .update(licenseKey + timestamp)
          .digest('hex');

        // حفظ الكود والوقت الحالي مع التوقيع
        this.store.set('licenseKey', licenseKey);
        this.store.set('lastValidation', {
          timestamp: timestamp,
          valid: true,
          signature: signature,
        });

        return {
          success: true,
          message: 'تم التحقق بنجاح',
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || 'كود التفعيل غير صحيح',
        };
      }
    } catch (error) {
      console.error('خطأ في الاتصال:', error);

      // في حالة عدم الاتصال، استخدام التحقق المحفوظ
      const savedLicenseKey = this.store.get('licenseKey');
      const lastValidation = this.store.get('lastValidation');

      // التحقق من صحة البيانات المحفوظة قبل استخدامها
      const isDataValid = this.verifyStoredData(savedLicenseKey, lastValidation);

      if (!isDataValid) {
        // البيانات تم التلاعب بها
        this.store.delete('licenseKey');
        this.store.delete('lastValidation');

        return {
          success: false,
          message: 'فشل الاتصال بخادم التفعيل ولا توجد بيانات صحيحة محفوظة',
        };
      }

      if (lastValidation && lastValidation.valid) {
        // إذا كان آخر تحقق منذ أقل من 7 أيام
        const daysSinceLastCheck = (Date.now() - lastValidation.timestamp) / (1000 * 60 * 60 * 24);

        if (daysSinceLastCheck < 7) {
          return {
            success: true,
            message: 'استخدام التحقق المحفوظ (غير متصل)',
            cached: true,
          };
        }
      }

      return {
        success: false,
        message: 'فشل الاتصال بخادم التفعيل',
      };
    }
  }

  // التحقق من صحة التوقيع المحفوظ
  // هذه الدالة تمنع التلاعب اليدوي في ملف config.json
  verifyStoredData(licenseKey, lastValidation) {
    if (!licenseKey || !lastValidation) {
      return false;
    }

    // التحقق من وجود التوقيع (الملفات القديمة قد لا تحتوي عليه)
    if (!lastValidation.signature) {
      return false;
    }

    // إنشاء توقيع من الكود والـ Device ID
    const deviceId = this.generateDeviceId();
    const expectedSignature = crypto
      .createHmac('sha256', deviceId)
      .update(licenseKey + lastValidation.timestamp)
      .digest('hex');

    // التحقق من التوقيع المحفوظ
    // إذا لم يتطابق، يعني الملف تم تعديله يدوياً
    return lastValidation.signature === expectedSignature;
  }

  // التحقق عند بدء التطبيق
  async checkLicenseOnStartup() {
    const savedLicenseKey = this.store.get('licenseKey');
    const lastValidation = this.store.get('lastValidation');

    // إذا لم يكن هناك كود محفوظ
    if (!savedLicenseKey) {
      return {
        needsActivation: true,
        message: 'لا يوجد كود تفعيل محفوظ',
      };
    }

    // التحقق من صحة البيانات المحفوظة (حماية من التلاعب اليدوي)
    const isDataValid = this.verifyStoredData(savedLicenseKey, lastValidation);

    if (!isDataValid) {
      // البيانات المحفوظة تم التلاعب بها - حذف البيانات المزيفة
      this.store.delete('licenseKey');
      this.store.delete('lastValidation');

      return {
        needsActivation: true,
        message: 'تم اكتشاف تلاعب في ملف التفعيل. يرجى إدخال كود صحيح.',
      };
    }

    // التحقق كل 24 ساعة
    if (lastValidation) {
      const hoursSinceLastCheck = (Date.now() - lastValidation.timestamp) / (1000 * 60 * 60);

      // استخدام البيانات المحفوظة فقط إذا كانت حديثة وصحيحة
      if (hoursSinceLastCheck < 24 && lastValidation.valid) {
        return {
          needsActivation: false,
          message: 'تم استخدام التحقق المحفوظ',
        };
      }
    }

    // إجراء تحقق جديد من السيرفر
    const result = await this.validateLicense(savedLicenseKey);

    return {
      needsActivation: !result.success,
      ...result,
    };
  }
}
