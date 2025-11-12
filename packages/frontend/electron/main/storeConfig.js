import os from 'os';
import crypto from 'crypto';

/**
 * توليد مفتاح تشفير فريد بناءً على معلومات الجهاز
 * هذا المفتاح يُستخدم لتشفير ملف electron-store
 * @returns {string} مفتاح تشفير 32 حرف
 */
export function generateEncryptionKey() {
  const networkInterfaces = os.networkInterfaces();
  const macAddress =
    Object.values(networkInterfaces)
      .flat()
      .find((i) => !i.internal && i.mac !== '00:00:00:00:00:00')?.mac || 'unknown';

  const cpuInfo = os.cpus()[0]?.model || 'unknown';
  const hostname = os.hostname();
  const uniqueString = `${macAddress}-${cpuInfo}-${hostname}`;

  // إنشاء hash واستخدام أول 32 حرف كمفتاح تشفير
  const deviceId = crypto.createHash('sha256').update(uniqueString).digest('hex');
  return deviceId.substring(0, 32);
}

/**
 * الحصول على إعدادات electron-store المشتركة
 * @returns {Object} إعدادات Store
 */
export function getStoreConfig() {
  return {
    encryptionKey: generateEncryptionKey(),
  };
}
