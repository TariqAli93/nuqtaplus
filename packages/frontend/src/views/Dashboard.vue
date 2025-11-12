<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">لوحة التحكم</h1>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Total Sales Card -->
      <div
        class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90 mb-1">إجمالي المبيعات</p>
            <h3 class="text-4xl font-bold">{{ countSales }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <v-icon size="40" color="blue">mdi-cash-multiple</v-icon>
          </div>
        </div>
      </div>

      <!-- Total Customers Card -->
      <div
        class="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90 mb-1">العملاء</p>
            <h3 class="text-4xl font-bold">{{ stats.totalCustomers }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <v-icon size="40" color="green">mdi-account-group</v-icon>
          </div>
        </div>
      </div>

      <!-- Total Products Card -->
      <div
        class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90 mb-1">المنتجات</p>
            <h3 class="text-4xl font-bold">{{ stats.totalProducts }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <v-icon size="40" color="purple">mdi-package-variant</v-icon>
          </div>
        </div>
      </div>

      <!-- Low Stock Card -->
      <div
        class="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90 mb-1">منتجات قليلة المخزون</p>
            <h3 class="text-4xl font-bold">{{ stats.lowStock }}</h3>
          </div>
          <div class="bg-white bg-opacity-20 rounded-full p-4">
            <v-icon size="40" color="orange">mdi-alert-circle</v-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Quick Actions -->
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-xl font-bold">إجراءات سريعة</h2>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <v-card
        v-for="(action, idx) in quickActions"
        :key="action.title"
        :to="action.to"
        color="sureface"
        :disabled="authStore.hasPermission(action.permission) === false"
        class="group relative block rounded-2xl border border-gray-200 p-5 translate transition-all hover:scale-102 hover:shadow-2xl dark:border-gray-700 overflow-hidden"
      >
        <!-- Animated background gradient -->
        <div
          class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
        ></div>

        <!-- Animated glow effect -->
        <div
          :class="[
            'pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-all duration-700 group-hover:opacity-100 group-hover:scale-150 opacity-0',
            idx % 6 === 0 && 'bg-sky-500/20',
            idx % 6 === 1 && 'bg-emerald-500/20',
            idx % 6 === 2 && 'bg-indigo-500/20',
            idx % 6 === 3 && 'bg-rose-500/20',
            idx % 6 === 4 && 'bg-amber-500/20',
            idx % 6 === 5 && 'bg-fuchsia-500/20',
          ]"
        ></div>
        <div
          :class="[
            'pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full blur-3xl transition-all duration-700 delay-100 group-hover:opacity-100 group-hover:scale-150 opacity-0',
            idx % 6 === 0 && 'bg-cyan-500/20',
            idx % 6 === 1 && 'bg-lime-500/20',
            idx % 6 === 2 && 'bg-violet-500/20',
            idx % 6 === 3 && 'bg-pink-500/20',
            idx % 6 === 4 && 'bg-orange-500/20',
            idx % 6 === 5 && 'bg-purple-500/20',
          ]"
        ></div>

        <div class="flex items-center gap-4 relative z-10">
          <div
            :class="[
              'rounded-xl p-3 text-white shadow-md bg-gradient-to-br transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl',
              idx % 6 === 0 && 'from-sky-500 to-sky-700',
              idx % 6 === 1 && 'from-emerald-500 to-emerald-700',
              idx % 6 === 2 && 'from-indigo-500 to-indigo-700',
              idx % 6 === 3 && 'from-rose-500 to-rose-700',
              idx % 6 === 4 && 'from-amber-500 to-amber-700',
              idx % 6 === 5 && 'from-fuchsia-500 to-fuchsia-700',
            ]"
          >
            <v-icon
              size="28"
              color="white"
              class="transition-transform duration-300 group-hover:scale-110"
            >
              {{ action.icon }}
            </v-icon>
          </div>

          <div class="flex-1">
            <h3
              :class="[
                'text-base font-semibold transition-colors duration-300',
                idx % 6 === 0 && 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
                idx % 6 === 1 && 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
                idx % 6 === 2 && 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                idx % 6 === 3 && 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
                idx % 6 === 4 && 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
                idx % 6 === 5 && 'group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400',
              ]"
            >
              {{ action.title }}
            </h3>
            <p
              class="mt-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            >
              ابدأ الآن
            </p>
          </div>

          <div
            :class="[
              'text-gray-400 transition-all duration-300 group-hover:-translate-x-2 group-hover:scale-125',
              idx % 6 === 0 && 'group-hover:text-sky-600',
              idx % 6 === 1 && 'group-hover:text-emerald-600',
              idx % 6 === 2 && 'group-hover:text-indigo-600',
              idx % 6 === 3 && 'group-hover:text-rose-600',
              idx % 6 === 4 && 'group-hover:text-amber-600',
              idx % 6 === 5 && 'group-hover:text-fuchsia-600',
            ]"
            aria-hidden="true"
          >
            <v-icon size="22">mdi-chevron-left</v-icon>
          </div>
        </div>

        <!-- Animated border ring -->
        <div
          :class="[
            'pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-black/0 transition-all duration-300',
            idx % 6 === 0 && 'group-hover:ring-sky-500/30 dark:group-hover:ring-sky-400/30',
            idx % 6 === 1 && 'group-hover:ring-emerald-500/30 dark:group-hover:ring-emerald-400/30',
            idx % 6 === 2 && 'group-hover:ring-indigo-500/30 dark:group-hover:ring-indigo-400/30',
            idx % 6 === 3 && 'group-hover:ring-rose-500/30 dark:group-hover:ring-rose-400/30',
            idx % 6 === 4 && 'group-hover:ring-amber-500/30 dark:group-hover:ring-amber-400/30',
            idx % 6 === 5 && 'group-hover:ring-fuchsia-500/30 dark:group-hover:ring-fuchsia-400/30',
          ]"
        ></div>

        <!-- Shimmer effect -->
        <div
          class="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
          style="
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          "
        ></div>
      </v-card>
    </div>

    <!-- Recent Sales -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>أحدث المبيعات</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>العميل</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center pa-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </td>
                </tr>
                <tr v-else-if="recentSales.length === 0">
                  <td colspan="5" class="text-center pa-4 text-grey">لا توجد مبيعات حديثة</td>
                </tr>
                <template v-else>
                  <tr v-for="sale in recentSales" :key="sale.id">
                    <td>{{ sale.invoiceNumber }}</td>
                    <td>{{ sale.customer || 'زبون نقدي' }}</td>
                    <td>{{ formatCurrency(sale.total, sale.currency) }}</td>
                    <td>
                      <v-chip :color="getStatusColor(sale.status)" size="small">
                        {{ getStatusText(sale.status) }}
                      </v-chip>
                    </td>
                    <td>{{ formatDate(sale.createdAt) }}</td>
                  </tr>
                </template>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect, onUnmounted } from 'vue';
import { useSaleStore } from '@/stores/sale';
import { useProductStore } from '@/stores/product';
import { useCustomerStore } from '@/stores/customer';
import { useAuthStore } from '@/stores/auth';
import { useLoading } from '@/composables/useLoading';

const saleStore = useSaleStore();
const productStore = useProductStore();
const customerStore = useCustomerStore();
const authStore = useAuthStore();
const { useAsyncData } = useLoading();

const loading = ref(false);
const stats = ref({
  totalSales: 0,
  totalCustomers: 0,
  totalProducts: 0,
  lowStock: 0,
});
const recentSales = ref([]);

const countSales = ref(0);

const quickActions = [
  { title: 'بيع جديد', icon: 'mdi-plus-circle', to: '/sales/new', permission: 'create:sales' },
  {
    title: 'عميل جديد',
    icon: 'mdi-account-plus',
    to: '/customers/new',
    permission: 'create:customers',
  },
  {
    title: 'منتج جديد',
    icon: 'mdi-package-variant-plus',
    to: '/products/new',
    permission: 'create:products',
  },
  { title: 'التقارير', icon: 'mdi-chart-box', to: '/reports', permission: 'read:reports' },
];

const formatCurrency = (amount, curr) => {
  const symbol = curr === 'USD' ? '$' : 'IQD';
  return `${symbol} ${parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  });
};

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    pending: 'warning',
    cancelled: 'error',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status) => {
  const texts = {
    completed: 'مكتمل',
    pending: 'قيد الانتظار',
    cancelled: 'ملغي',
  };
  return texts[status] || status;
};

// استخدام نظام التحميل المتقدم للبيانات
const dashboardData = useAsyncData(async () => {
  // Fetch sales stats completed || pending
  const salesResponse = await saleStore.fetchSales();

  const filteredSales =
    salesResponse.data.filter((sale) => sale.status === 'completed' || sale.status === 'pending') ||
    [];

  // Fetch low stock products
  const lowStockProducts = await productStore.fetchLowStock({ lowStock: true });

  const products = await productStore.fetchProducts();

  // Fetch customers
  const customers = await customerStore.fetchCustomers();

  return {
    recentSales: filteredSales,
    stats: {
      totalSales: salesResponse.length || 0,
      totalCustomers: customers.data.length || 0,
      totalProducts: products.data.length || 0,
      lowStock: lowStockProducts?.length || 0,
    },
  };
});

// تحديث البيانات المحلية عند تحميل البيانات
onMounted(() => {
  // مراقبة تغيير البيانات
  const unwatch = watchEffect(() => {
    if (dashboardData.data.value) {
      recentSales.value = dashboardData.data.value.recentSales;
      stats.value = dashboardData.data.value.stats;
      countSales.value = dashboardData.data.value.recentSales.length;
    }
    loading.value = dashboardData.isLoading.value;
  });

  // تنظيف المراقب عند إلغاء تركيب المكون
  onUnmounted(() => {
    unwatch();
  });
});
</script>

<style scoped>
.opacity-50 {
  opacity: 0.5;
}

@media (prefers-color-scheme: light) {
  .light\:text-gray-900 {
    color: #1a202c;
  }
}
</style>
