<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">إدارة المبيعات</div>
        <v-btn color="primary" prepend-icon="mdi-plus" to="/sales/new"> بيع جديد </v-btn>
      </div>
    </v-card>

    <v-card class="mb-4">
      <div class="flex justify-lg-space-between items-center pa-3 gap-4">
        <v-select
          v-model="filters.status"
          :items="statusOptions"
          label="الحالة"
          clearable
          hide-details
          density="comfortable"
          @update:model-value="handleFilter"
        ></v-select>

        <!-- العميل -->
        <v-autocomplete
          v-model="filters.customer"
          :items="customers"
          item-title="name"
          item-value="id"
          label="العميل"
          hide-details
          density="comfortable"
          clearable
          @update:model-value="handleFilter"
          :custom-filter="customFilter"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:title>
                {{ item.raw.name }}
              </template>
              <template v-slot:subtitle>
                {{ item.raw.phone }}
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item }">
            {{ item.raw.name }} - {{ item.raw.phone }}
          </template>
        </v-autocomplete>

        <v-text-field
          v-model="filters.startDate"
          label="من تاريخ"
          type="date"
          hide-details
          density="comfortable"
          @change="handleFilter"
        ></v-text-field>

        <v-text-field
          v-model="filters.endDate"
          label="إلى تاريخ"
          type="date"
          hide-details
          density="comfortable"
          @change="handleFilter"
        ></v-text-field>
      </div>
    </v-card>

    <v-card class="mb-4">
      <v-data-table
        :headers="headers"
        :items="saleStore.sales"
        :loading="saleStore.loading"
        @click:row="viewSale"
        class="cursor-pointer"
      >
        <template v-slot:[`item.total`]="{ item }">
          {{ formatCurrency(item.total, item.currency) }}
        </template>
        <template v-slot:[`item.status`]="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template v-slot:[`item.createdAt`]="{ item }">
          {{ toYmd(item.createdAt) }}
        </template>

        <template v-slot:[`item.paymentType`]="{ item }">
          {{ getPaymentTypeText(item.paymentType) }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="elevated"
            color="error"
            v-if="item.status !== 'cancelled'"
            icon
            @click.stop="deleteSale(item.id)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>

          <v-btn
            size="small"
            variant="elevated"
            color="success"
            v-if="item.status === 'cancelled'"
            icon
            @click.stop="restoreSale(item.id)"
          >
            <v-icon>mdi-restore</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSaleStore } from '@/stores/sale';
import { useCustomerStore } from '@/stores/customer';

const router = useRouter();
const saleStore = useSaleStore();
const customerStore = useCustomerStore();

const filters = ref({
  status: null,
  startDate: null,
  endDate: null,
  customer: '',
});

const customers = ref([]);

const statusOptions = [
  { title: 'مكتمل', value: 'completed' },
  { title: 'قيد الانتظار', value: 'pending' },
  { title: 'ملغي', value: 'cancelled' },
];

const headers = [
  { title: 'رقم الفاتورة', key: 'invoiceNumber' },
  { title: 'العميل', key: 'customer' },
  { title: 'رقم الهاتف', key: 'customerPhone' },
  { title: 'المبلغ الإجمالي', key: 'total' },
  { title: 'نوع الدفع', key: 'paymentType' },
  { title: 'الحالة', key: 'status' },
  { title: 'التاريخ', key: 'createdAt' },
  { title: 'بواسطة', key: 'createdBy', sortable: false },
  { title: 'الاجرائات', key: 'actions', sortable: false },
];

const formatCurrency = (amount, currency) => {
  const symbol = currency === 'USD' ? '$' : 'IQD';
  return `${symbol} ${parseFloat(amount).toLocaleString()}`;
};

const toYmd = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPaymentTypeText = (type) => {
  const types = { cash: 'نقدي', installment: 'تقسيط', mixed: 'مختلط' };
  return types[type] || type;
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

const handleFilter = () => {
  saleStore.fetchSales(filters.value);
  console.log('Filters applied:', filters.value);
};

const viewSale = (event, { item }) => {
  router.push({ name: 'SaleDetails', params: { id: item.id } });
};

const deleteSale = async (id) => {
  if (confirm('هل أنت متأكد من رغبتك في إلغاء هذه المبيعات؟')) {
    await saleStore.cancelSale(id);
    handleFilter();
  }
};

const restoreSale = async (id) => {
  if (confirm('هل أنت متأكد من رغبتك في استعادة هذه المبيعات؟')) {
    await saleStore.restoreSale(id);
    handleFilter();
  }
};

// دالة البحث المخصصة: البحث بالاسم أو رقم الهاتف
const customFilter = (itemText, queryText, item) => {
  const query = queryText.toLowerCase();
  const name = item.raw.name?.toLowerCase() || '';
  const phone = item.raw.phone?.toLowerCase() || '';
  return name.includes(query) || phone.includes(query);
};

onMounted(() => {
  saleStore.fetchSales();
  customerStore.fetchCustomers().then(() => {
    customers.value = customerStore.customers;
  });
});
</script>
