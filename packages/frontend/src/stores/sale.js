import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import { useNotificationStore } from '@/stores/notification';

export const useSaleStore = defineStore('sale', {
  state: () => ({
    sales: [],
    currentSale: null,
    loading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  }),

  actions: {
    /**
     * Fetch all sales with optional filters
     * @param {Object} params - Query parameters for filtering
     */
    async fetchSales(params = {}) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/sales', { params });

        if (!response.data) {
          throw new Error('Invalid response from server');
        }

        this.sales = response.data;
        this.pagination = response.meta || this.pagination;

        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'فشل تحميل المبيعات';
        notificationStore.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch single sale by ID
     * @param {number} id - Sale ID
     */
    async fetchSale(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        if (!id) {
          throw new Error('Sale ID is required');
        }

        const response = await api.get(`/sales/${id}`);

        if (!response.data) {
          throw new Error('Invalid response from server');
        }

        this.currentSale = response.data;
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'فشل تحميل بيانات المبيعة';
        notificationStore.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Create new sale
     * @param {Object} saleData - Sale data including items and payment info
     */
    async createSale(saleData) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        // Validate sale data
        if (!saleData.items || saleData.items.length === 0) {
          throw new Error('Sale must have at least one item');
        }

        const response = await api.post('/sales', saleData);

        if (response.data) {
          this.sales.unshift(response.data);
        }

        notificationStore.success('تم إضافة المبيعة بنجاح');
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'فشل إضافة المبيعة';
        notificationStore.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Cancel a sale
     * @param {number} id - Sale ID to cancel
     */
    async cancelSale(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        if (!id) {
          throw new Error('Sale ID is required');
        }

        const response = await api.post(`/sales/${id}/cancel`);

        // Update sale status in the list
        const index = this.sales.findIndex((s) => s.id === id);
        if (index !== -1) {
          this.sales[index] = { ...this.sales[index], status: 'cancelled' };
        }

        // Update current sale if it's the one being cancelled
        if (this.currentSale?.id === id) {
          this.currentSale = { ...this.currentSale, status: 'cancelled' };
        }

        notificationStore.success('تم إلغاء المبيعة بنجاح');
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'فشل إلغاء المبيعة';
        notificationStore.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Get sales report with filters
     * @param {Object} queryParams - Report query parameters
     */
    async getSalesReport(queryParams = {}) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.get('/sales/report', { params: queryParams });

        if (!response.data) {
          throw new Error('Invalid response from server');
        }

        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'فشل تحميل تقرير المبيعات';
        notificationStore.error(errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addPayment(paymentData) {
      if (!this.currentSale) {
        throw new Error('No current sale selected');
      }

      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post(`/sales/${this.currentSale.id}/payment`, paymentData);
        // Update the current sale with the new payment
        this.currentSale = response.data;
        notificationStore.success('تم إضافة الدفعة بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل إضافة الدفعة');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removePaymentFromCurrentSale(paymentId) {
      if (!this.currentSale) {
        throw new Error('No current sale selected');
      }

      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        await api.delete(`/sales/${this.currentSale.id}/payments/${paymentId}`);
        // Update the current sale by removing the payment
        this.currentSale.payments = this.currentSale.payments.filter((p) => p.id !== paymentId);
        notificationStore.success('تم حذف الدفعة بنجاح');
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل حذف الدفعة');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteSale(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        await api.delete(`/sales/${id}`);
        this.sales = this.sales.filter((s) => s.id !== id);
        notificationStore.success('تم حذف المبيعة بنجاح');
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل حذف المبيعة');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async restoreSale(id) {
      this.loading = true;
      const notificationStore = useNotificationStore();
      try {
        const response = await api.post(`/sales/${id}/restore`);
        const index = this.sales.findIndex((s) => s.id === id);
        if (index !== -1) {
          this.sales[index].status = 'completed';
        }
        notificationStore.success('تم استعادة المبيعة بنجاح');
        return response;
      } catch (error) {
        notificationStore.error(error.response?.data?.message || 'فشل استعادة المبيعة');
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
