import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import { useNotificationStore } from '@/stores/notification';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    isFirstRun: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role || null,

    /**
     * Check if user has a specific permission
     * @param {string|Array} permission - Permission name or array of permissions
     * @returns {boolean} True if user has the permission
     */
    hasPermission: (state) => (permission) => {
      const perms = state.user?.permissions;
      if (!Array.isArray(perms)) return false;

      const permissionList = Array.isArray(permission) ? permission : [permission];

      return permissionList.some((perm) => {
        // Direct permission match
        if (perms.includes(perm)) return true;

        // Check for manage:<resource> permission
        const parts = perm.split(':');
        if (parts.length === 2 && perms.includes(`manage:${parts[1]}`)) return true;

        // Check for super admin permission (manage:*)
        if (perms.includes('manage:*')) return true;

        return false;
      });
    },

    /**
     * Check if user has any of the provided permissions
     */
    hasAnyPermission:
      (state) =>
      (permissions = []) => {
        if (!Array.isArray(state.user?.permissions)) return false;
        return permissions.some((perm) => state.user.permissions.includes(perm));
      },

    /**
     * Check if user has all of the provided permissions
     */
    hasAllPermissions:
      (state) =>
      (permissions = []) => {
        if (!Array.isArray(state.user?.permissions)) return false;
        return permissions.every((perm) => state.user.permissions.includes(perm));
      },
  },

  actions: {
    /**
     * Login user with credentials
     * @param {Object} credentials - Username and password
     */
    async login(credentials) {
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post('/auth/login', credentials);

        if (!response.data?.token || !response.data?.user) {
          throw new Error('Invalid response from server');
        }

        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Update axios default headers with new token
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

        notificationStore.success('تم تسجيل الدخول بنجاح');
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'فشل تسجيل الدخول';
        notificationStore.error(errorMessage);
        throw error;
      }
    },

    /**
     * Check authentication status on app load
     */
    async checkAuth() {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          this.token = token;
          this.user = JSON.parse(user);
          this.isAuthenticated = true;

          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Verify token is still valid by fetching profile
          await this.getProfile();
        } catch {
          // Token is invalid, logout
          this.logout();
        }
      }
    },

    /**
     * Get current user profile
     */
    async getProfile() {
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/auth/profile');

        if (response.data) {
          this.user = response.data;
          localStorage.setItem('user', JSON.stringify(response.data));
        }

        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'فشل تحميل بيانات المستخدم';
        notificationStore.error(errorMessage);
        throw error;
      }
    },

    /**
     * Logout user and clear session
     */
    logout() {
      const notificationStore = useNotificationStore();

      this.user = null;
      this.token = null;
      this.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];

      notificationStore.info('تم تسجيل الخروج بنجاح');
    },

    /**
     * Register new user
     */
    async register(userData) {
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post('/auth/register', userData);
        notificationStore.success('تم تسجيل المستخدم بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل تسجيل المستخدم');
        throw error;
      }
    },

    async createFirstUser(userData) {
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post('/auth/create-first-user', userData);
        notificationStore.success('تم إنشاء المستخدم الأول بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل إنشاء المستخدم الأول');
        throw error;
      }
    },

    async fetchInitialSetupInfo() {
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/auth/initial-setup-info');
        this.isFirstRun = response.data.isFirstRun;
        return response.data;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل جلب معلومات الإعداد الأولي');
        throw error;
      }
    },
  },
});
