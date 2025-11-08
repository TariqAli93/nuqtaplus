import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useLoadingStore } from '@/stores/loading';
import router from '@/router';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3050/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // بدء تتبع الطلب في نظام التحميل
    const loadingStore = useLoadingStore();
    loadingStore.startRequest();

    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // في حالة خطأ في الطلب، إنهاء تتبع التحميل
    const loadingStore = useLoadingStore();
    loadingStore.endRequest();

    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // إنهاء تتبع الطلب في حالة النجاح
    const loadingStore = useLoadingStore();
    loadingStore.endRequest();

    return response.data;
  },
  (error) => {
    // إنهاء تتبع الطلب في حالة الخطأ
    const loadingStore = useLoadingStore();
    loadingStore.endRequest();

    const notificationStore = useNotificationStore();

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      router.push({ name: 'Login' });
      notificationStore.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
      return Promise.reject(error.response?.data || error.message);
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 40;
      notificationStore.warning(`تم تجاوز حد الطلبات. حاول مرة أخرى بعد ${retryAfter} ثانية`, 6000);
      return Promise.reject(error.response?.data || error.message);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      notificationStore.error('ليس لديك صلاحية للوصول إلى هذا المورد');
      return Promise.reject(error.response?.data || error.message);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      notificationStore.error('المورد المطلوب غير موجود');
      return Promise.reject(error.response?.data || error.message);
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      notificationStore.error('خطأ في الخادم. يرجى المحاولة لاحقاً');
      return Promise.reject(error.response?.data || error.message);
    }

    // Handle Network Error
    if (error.message === 'Network Error') {
      notificationStore.error('فشل الاتصال بالخادم. تحقق من اتصال الإنترنت');
      return Promise.reject(error);
    }

    // Handle Timeout
    if (error.code === 'ECONNABORTED') {
      notificationStore.error('انتهت مهلة الطلب. يرجى المحاولة مرة أخرى');
      return Promise.reject(error);
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
