import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/plugins/axios';
import { useNotificationStore } from './notification';

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref({});
  const companyInfo = ref({
    name: '',
    city: '',
    area: '',
    street: '',
    phone: '',
    phone2: '',
    logoUrl: '',
    invoiceType: '',
  });
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const getSettingValue = computed(() => (key, defaultValue = null) => {
    return settings.value[key] ?? defaultValue;
  });

  const companyAddress = computed(() => {
    const parts = [];
    if (companyInfo.value.street) parts.push(companyInfo.value.street);
    if (companyInfo.value.area) parts.push(companyInfo.value.area);
    if (companyInfo.value.city) parts.push(companyInfo.value.city);
    return parts.join(', ');
  });

  // Actions
  const fetchAllSettings = async () => {
    isLoading.value = true;
    error.value = null;

    const parseSettings = (settingsArray) => {
      const settings = {};
      settingsArray.forEach(({ key, value }) => {
        const keys = key.split('.'); // مثل ['company', 'name']
        let current = settings;

        // بناء الكائن المتداخل
        keys.forEach((k, i) => {
          if (i === keys.length - 1) {
            current[k] = value;
          } else {
            current[k] = current[k] || {};
            current = current[k];
          }
        });
      });
      return settings;
    };

    try {
      const { data } = await api.get('/settings');
      settings.value = parseSettings(data.data || []);
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCompanyInfo = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get('/settings/company');

      if (response.data.success) {
        const data = response.data;
        companyInfo.value = {
          name: data.name || '',
          city: data.city || '',
          area: data.area || '',
          street: data.street || '',
          phone: data.phone || '',
          phone2: data.phone2 || '',
          logoUrl: data.logoUrl || '',
          invoiceType: data.invoiceType,
        };
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const saveCompanyInfo = async (data) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.put('/settings/company', data);
      const notificationStore = useNotificationStore();
      if (response.data) {
        notificationStore.success('تم حفظ معلومات الشركة بنجاح');
        companyInfo.value = { ...companyInfo.value, ...data };
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      console.error('Save company info error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const uploadLogo = async (file) => {
    isLoading.value = true;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        companyInfo.value.logoUrl = response.data.logoUrl;
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to upload logo');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const validatePhone = async (phone) => {
    try {
      const response = await api.post('/settings/validate/phone', { phone });
      return response.data.isValid;
    } catch (err) {
      console.error('Phone validation error:', err);
      return false;
    }
  };

  const setSetting = async (key, value, description = null) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/settings/${key}`, {
        value,
        description,
      });

      if (response.data.success) {
        settings.value[key] = value;
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update setting');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const bulkUpdateSettings = async (settingsData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.put('/settings/bulk', settingsData);

      if (response.data.success) {
        Object.assign(settings.value, settingsData);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update settings');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteSetting = async (key) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.delete(`/settings/${key}`);

      if (response.data.success) {
        delete settings.value[key];
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete setting');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // DANGER ZONE: System Reset
  const resetApplication = async (confirmationToken) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post('/settings/danger/reset', {
        confirmationToken,
      });

      if (response.data.success) {
        // Reset local state
        settings.value = {};
        companyInfo.value = {
          name: '',
          city: '',
          area: '',
          street: '',
          phone: '',
          phone2: '',
          logoUrl: '',
          invoiceType: '',
        };
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to reset application');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Utility functions
  const clearError = () => {
    error.value = null;
  };

  const resetCompanyInfo = () => {
    companyInfo.value = {
      name: '',
      city: '',
      area: '',
      street: '',
      logoUrl: '',
      invoiceType: '',
    };
  };

  // Currency Settings Actions
  const fetchCurrencySettings = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get('/settings/currency');

      if (response.success) {
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const saveCurrencySettings = async (currencyData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.put('/settings/currency', currencyData);
      const notificationStore = useNotificationStore();

      if (response.success) {
        notificationStore.success('تم حفظ إعدادات العملة بنجاح');
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      const notificationStore = useNotificationStore();
      notificationStore.error('فشل حفظ إعدادات العملة');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize store
  const initialize = async () => {
    try {
      await Promise.all([fetchAllSettings(), fetchCompanyInfo()]);
    } catch (err) {
      console.error('Settings store initialization failed:', err);
    }
  };

  return {
    // State
    settings,
    companyInfo,
    isLoading,
    error,

    // Getters
    getSettingValue,
    companyAddress,

    // Actions
    fetchAllSettings,
    fetchCompanyInfo,
    saveCompanyInfo,
    uploadLogo,
    validatePhone,
    setSetting,
    bulkUpdateSettings,
    deleteSetting,
    resetApplication,
    clearError,
    resetCompanyInfo,
    fetchCurrencySettings,
    saveCurrencySettings,
    initialize,
  };
});
