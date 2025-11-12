<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-center items-center">
        <div class="flex items-center pa-3">
          <div class="text-h6 font-semibold text-primary">تفاصيل الفاتورة</div>
        </div>

        <v-spacer />

        <v-btn color="primary" prepend-icon="mdi-printer" @click="handlePrint"
          >طباعة الفاتورة</v-btn
        >
        <v-btn variant="text" @click="$router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </div>
    </v-card>

    <v-card v-if="sale" class="mb-4">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <div class="text-h5">فاتورة رقم: {{ sale.invoiceNumber }}</div>
          <div class="text-caption text-grey">{{ toYmd(sale.createdAt) }}</div>
        </div>
        <v-chip :color="getStatusColor(sale.status)" size="large">
          {{ getStatusText(sale.status) }}
        </v-chip>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <div class="mb-2">
              <v-icon color="primary" class="ml-2">mdi-account</v-icon>
              <strong>معلومات العميل</strong>
            </div>
            <div class="text-body-2 mr-8">
              <p class="mb-1"><strong>الاسم: </strong> {{ sale.customerName || 'زبون نقدي' }}</p>
              <p v-if="sale.customer && sale.customer.phone" class="mb-1">
                <strong>الهاتف: </strong> {{ sale.customer.phone }}
              </p>
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <div class="mb-2">
              <v-icon color="primary" class="ml-2">mdi-cash-multiple</v-icon>
              <strong>معلومات الدفع</strong>
            </div>
            <div class="text-body-2 mr-8">
              <p class="mb-1">
                <strong>نوع الدفع: </strong> {{ getPaymentTypeText(sale.paymentType) }}
              </p>
              <p class="mb-1"><strong>العملة:</strong> {{ sale.currency }}</p>
              <p class="mb-1">
                <strong>المدفوع: </strong>
                <span class="text-success">{{
                  formatCurrency(sale.paidAmount, sale.currency)
                }}</span>
              </p>
              <p class="mb-0">
                <strong>المتبقي: </strong>
                <span :class="sale.remainingAmount > 0 ? 'text-error' : 'text-success'">
                  {{ formatCurrency(sale.remainingAmount, sale.currency) }}
                </span>
              </p>
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <div class="mb-2">
              <v-icon color="primary" class="ml-2">mdi-chart-box</v-icon>
              <strong>الملخص المالي</strong>
            </div>
            <div class="text-body-2 mr-8">
              <!-- عرض المجموع الأساسي -->
              <p v-if="sale.paymentType === 'installment' && sale.interestAmount > 0" class="mb-1">
                <strong>إجمالي المنتجات: </strong>
                <span class="text-primary">{{
                  formatCurrency(sale.total - (sale.interestAmount || 0), sale.currency)
                }}</span>
              </p>
              <!-- معلومات الفائدة -->
              <p v-if="sale.paymentType === 'installment' && sale.interestRate > 0" class="mb-1">
                <strong>نسبة الفائدة: </strong>
                <span class="text-warning font-weight-bold">{{ sale.interestRate }}%</span>
              </p>
              <p v-if="sale.paymentType === 'installment' && sale.interestAmount > 0" class="mb-1">
                <strong>قيمة الفائدة: </strong>
                <span class="text-warning font-weight-bold">{{
                  formatCurrency(sale.interestAmount, sale.currency)
                }}</span>
              </p>
              <!-- عدد الأقساط للمبيعات التقسيطية -->
              <p v-if="sale.paymentType === 'installment' && hasInstallments" class="mb-1">
                <strong>عدد الأقساط: </strong>
                <span class="text-info">{{ sale.installments.length }} قسط</span>
              </p>
              <p v-if="sale.paymentType === 'installment' && hasInstallments" class="mb-1">
                <strong>قيمة القسط: </strong>
                <span class="text-info">{{
                  formatCurrency(sale.total / sale.installments.length, sale.currency)
                }}</span>
              </p>
              <!-- الإجمالي النهائي -->
              <v-divider
                v-if="sale.paymentType === 'installment' && sale.interestAmount > 0"
                class="my-2"
              ></v-divider>
              <p class="mb-0">
                <strong>الإجمالي النهائي: </strong>
                <span class="text-h6 text-primary font-weight-bold">{{
                  formatCurrency(sale.total, sale.currency)
                }}</span>
              </p>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Interest Information Card for Installment Sales -->
    <v-card
      v-if="sale && sale.paymentType === 'installment' && sale.interestAmount > 0"
      class="mb-4 border-warning"
    >
      <v-card-title class="bg-warning-lighten-4 text-warning-darken-2">
        <v-icon class="ml-2">mdi-calculator</v-icon>
        تفاصيل حساب الفائدة
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <div class="text-center">
              <div class="text-caption text-grey">إجمالي المنتجات</div>
              <div class="text-h6 text-primary">
                {{ formatCurrency(sale.total - sale.interestAmount, sale.currency) }}
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="1" class="d-flex align-center justify-center">
            <v-icon color="warning">mdi-plus</v-icon>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-center">
              <div class="text-caption text-grey">الفائدة ({{ sale.interestRate }}%)</div>
              <div class="text-h6 text-warning">
                {{ formatCurrency(sale.interestAmount, sale.currency) }}
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="1" class="d-flex align-center justify-center">
            <v-icon color="success">mdi-equal</v-icon>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-center">
              <div class="text-caption text-grey">الإجمالي النهائي</div>
              <div class="text-h5 text-success font-weight-bold">
                {{ formatCurrency(sale.total, sale.currency) }}
              </div>
              <div class="text-caption text-grey mt-1">
                {{ sale.installments.length }} أقساط ×
                {{ formatCurrency(sale.total / sale.installments.length, sale.currency) }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Products Table -->
    <v-card v-if="sale && sale.items" class="mb-4">
      <v-card-title>
        <v-icon class="ml-2">mdi-package-variant</v-icon>
        تفاصيل المنتجات
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th class="text-right">#</th>
              <th class="text-right">المنتج</th>
              <th class="text-center">الكمية</th>
              <th class="text-center">سعر الوحدة</th>
              <th class="text-center">المجموع</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in sale.items" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.productName }}</td>
              <td class="text-center">{{ item.quantity }}</td>
              <td class="text-center">{{ formatCurrency(item.unitPrice, sale.currency) }}</td>
              <td class="text-center font-weight-bold">
                {{ formatCurrency(item.subtotal, sale.currency) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <!-- عرض المجموع الفرعي للمنتجات -->
            <tr v-if="sale.paymentType === 'installment' && sale.interestAmount > 0">
              <td colspan="4" class="text-left"><strong>المجموع الفرعي:</strong></td>
              <td class="text-center">
                <strong class="text-primary">{{
                  formatCurrency(sale.total - (sale.interestAmount || 0), sale.currency)
                }}</strong>
              </td>
            </tr>
            <!-- عرض الفائدة إذا كانت موجودة -->
            <tr
              v-if="sale.paymentType === 'installment' && sale.interestAmount > 0"
              class="bg-warning-lighten-4"
            >
              <td colspan="4" class="text-left">
                <strong>الفائدة ({{ sale.interestRate }}%):</strong>
              </td>
              <td class="text-center">
                <strong class="text-warning">{{
                  formatCurrency(sale.interestAmount, sale.currency)
                }}</strong>
              </td>
            </tr>
            <!-- المجموع النهائي -->
            <tr class="bg-primary-lighten-5">
              <td colspan="4" class="text-left">
                <strong class="text-h6">الإجمالي النهائي:</strong>
              </td>
              <td class="text-center">
                <strong class="text-h6 text-primary">{{
                  formatCurrency(sale.total, sale.currency)
                }}</strong>
              </td>
            </tr>
          </tfoot>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Installments Table -->
    <v-card v-if="sale && sale.installments && sale.installments.length > 0" class="mb-4">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <v-icon class="ml-2">mdi-calendar-clock</v-icon>
          جدول الأقساط
          <span
            v-if="sale.paymentType === 'installment' && sale.interestAmount > 0"
            class="text-caption text-warning d-block"
          >
            * الأقساط تشمل فائدة بنسبة {{ sale.interestRate }}%
          </span>
        </div>
        <v-chip :color="getInstallmentStatusColor()" size="small">
          {{ getInstallmentStatusText() }}
        </v-chip>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th class="text-center">رقم القسط</th>
              <th class="text-center">المبلغ المستحق</th>
              <th class="text-center">المبلغ المدفوع</th>
              <th class="text-center">المبلغ المتبقي</th>
              <th class="text-center">تاريخ الاستحقاق</th>
              <th class="text-center">تاريخ الدفع</th>
              <th class="text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="installment in sale.installments"
              :key="installment.id"
              :class="getInstallmentRowClass(installment)"
            >
              <td class="text-center font-weight-bold">{{ installment.installmentNumber }}</td>
              <td class="text-center">
                {{ formatCurrency(installment.dueAmount, sale.currency) }}
              </td>
              <td class="text-center text-success">
                {{ formatCurrency(installment.paidAmount, sale.currency) }}
              </td>
              <td class="text-center" :class="installment.remainingAmount > 0 ? 'text-error' : ''">
                {{ formatCurrency(installment.remainingAmount, sale.currency) }}
              </td>
              <td class="text-center">{{ toYmd(installment.dueDate) }}</td>
              <td class="text-center">
                {{ installment.paidDate ? toYmd(installment.paidDate) : '-' }}
              </td>
              <td class="text-center">
                <v-chip :color="getInstallmentColor(installment)" size="small">
                  {{ getInstallmentStatusLabel(installment) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Payments Table -->
    <v-card v-if="sale && sale.payments && sale.payments.length > 0" class="mb-4">
      <v-card-title>
        <v-icon class="ml-2">mdi-cash-register</v-icon>
        سجل الدفعات
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th class="text-center">المبلغ</th>
              <th class="text-center">طريقة الدفع</th>
              <th class="text-center">التاريخ</th>
              <th class="text-center">العملة</th>
              <th class="text-center">بواسطة</th>
              <th class="text-right">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(payment, index) in sale.payments" :key="payment.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td class="text-center font-weight-bold text-success">
                {{ formatCurrency(payment.amount, payment.currency) }}
              </td>
              <td class="text-center">{{ getPaymentMethodText(payment.paymentMethod) }}</td>
              <td class="text-center">{{ toYmd(payment.createdAt) }}</td>
              <td class="text-center">{{ payment.currency }}</td>
              <td class="text-center">{{ payment.createdBy || '-' }}</td>
              <td>{{ payment.notes || '-' }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Add Payment Form -->
    <v-card v-if="sale && sale.status === 'pending' && sale.remainingAmount > 0" class="mb-4">
      <v-card-title class="bg-warning-lighten-4">
        <v-icon class="ml-2">mdi-cash-plus</v-icon>
        إضافة دفعة جديدة
      </v-card-title>
      <v-card-text class="pt-4">
        <v-form @submit.prevent="addPayment">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="paymentData.amount"
                label="المبلغ"
                type="number"
                step="0.01"
                min="0.01"
                :hint="`المتبقي: ${formatCurrency(sale.remainingAmount, sale.currency)}`"
                persistent-hint
                :rules="[
                  (v) => !!v || 'المبلغ مطلوب',
                  (v) => v > 0 || 'المبلغ يجب أن يكون أكبر من صفر',
                  (v) => v <= sale.remainingAmount || 'المبلغ أكبر من المتبقي',
                ]"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="paymentData.paymentMethod"
                :items="paymentMethods"
                label="طريقة الدفع"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="paymentData.notes" label="ملاحظات (اختياري)"></v-text-field>
            </v-col>
          </v-row>
          <v-btn type="submit" color="primary" :loading="loadingPayment">
            <v-icon class="ml-2">mdi-check</v-icon>
            إضافة الدفعة
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <div id="invoiceComponent" ref="invoiceComponent">
      <sale-details-invoice v-if="sale" :sale="saleForPrint" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSaleStore } from '@/stores/sale';
import { useNotificationStore } from '@/stores/notification';
import SaleDetailsInvoice from '@/components/SaleDetailsInvoice.vue';
import { useVueToPrint } from 'vue-to-print';

const route = useRoute();
const saleStore = useSaleStore();
const notificationStore = useNotificationStore();
const sale = ref(null);
const loadingPayment = ref(false);
const invoiceComponent = ref(null);

const paymentData = ref({
  amount: null,
  paymentMethod: 'cash',
  currency: 'USD',
  notes: '',
});

const toYmd = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const paymentMethods = [
  { title: 'نقدي', value: 'cash' },
  { title: 'بطاقة', value: 'card' },
  { title: 'تحويل بنكي', value: 'bank_transfer' },
];

const hasInstallments = computed(() => {
  return sale.value?.installments && sale.value.installments.length > 0;
});

const formatCurrency = (amount, currency) =>
  new Intl.NumberFormat('ar', {
    style: 'currency',
    currency: currency || 'IQD',
    maximumFractionDigits: (currency || 'IQD') === 'USD' ? 2 : 0,
  }).format(amount || 0);

const getStatusColor = (status) => {
  const colors = { completed: 'success', pending: 'warning', cancelled: 'error' };
  return colors[status] || 'grey';
};

const getStatusText = (status) => {
  const texts = { completed: 'مكتمل', pending: 'قيد الانتظار', cancelled: 'ملغي' };
  return texts[status] || status;
};

const getPaymentTypeText = (type) => {
  const types = { cash: 'نقدي', installment: 'تقسيط', mixed: 'مختلط' };
  return types[type] || type;
};

const getPaymentMethodText = (method) => {
  const methods = { cash: 'نقدي', card: 'بطاقة', bank_transfer: 'تحويل بنكي' };
  return methods[method] || method;
};

const getInstallmentColor = (installment) => {
  if (installment.status === 'paid') return 'success';
  if (installment.status === 'cancelled') return 'error';
  const dueDate = new Date(installment.dueDate);
  const today = new Date();
  if (dueDate < today && installment.remainingAmount > 0) return 'error';
  return 'warning';
};

const getInstallmentStatusLabel = (installment) => {
  if (installment.status === 'paid') return 'مدفوع';
  if (installment.status === 'cancelled') return 'ملغي';
  const dueDate = new Date(installment.dueDate);
  const today = new Date();
  if (dueDate < today && installment.remainingAmount > 0) return 'متأخر';
  return 'معلق';
};

const getInstallmentRowClass = (installment) => {
  if (installment.status === 'paid') return 'bg-success-lighten-5';
  const dueDate = new Date(installment.dueDate);
  const today = new Date();
  if (dueDate < today && installment.remainingAmount > 0) return 'bg-error-lighten-5';
  return '';
};

const getInstallmentStatusColor = () => {
  if (!hasInstallments.value) return 'grey';
  const allPaid = sale.value.installments.every((inst) => inst.status === 'paid');
  if (allPaid) return 'success';
  const hasOverdue = sale.value.installments.some((inst) => {
    const dueDate = new Date(inst.dueDate);
    const today = new Date();
    return dueDate < today && inst.remainingAmount > 0;
  });
  if (hasOverdue) return 'error';
  return 'warning';
};

const getInstallmentStatusText = () => {
  if (!hasInstallments.value) return '';
  const paid = sale.value.installments.filter((inst) => inst.status === 'paid').length;
  const total = sale.value.installments.length;
  return `${paid} من ${total} مدفوع`;
};

const addPayment = async () => {
  try {
    loadingPayment.value = true;

    // Validate amount
    if (!paymentData.value.amount || paymentData.value.amount <= 0) {
      notificationStore.error('يجب إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (paymentData.value.amount > sale.value.remainingAmount) {
      notificationStore.error('المبلغ المدخل أكبر من المبلغ المتبقي');
      return;
    }

    paymentData.value.currency = sale.value.currency;
    await saleStore.addPayment(paymentData.value);
    notificationStore.success('تم إضافة الدفعة بنجاح');
    const response = await saleStore.fetchSale(route.params.id);
    sale.value = response.data;
    paymentData.value = {
      amount: null,
      paymentMethod: 'cash',
      currency: sale.value.currency,
      notes: '',
    };
  } catch (error) {
    notificationStore.error('فشل في إضافة الدفعة');
    console.error('Error adding payment:', error);
  } finally {
    loadingPayment.value = false;
  }
};

// for printing purposes
const saleForPrint = computed(() => {
  if (!sale.value) return null;

  const saleCopy = { ...sale.value };

  // If paymentType is installment, adjust items to include interest
  if (saleCopy.paymentType === 'installment' && saleCopy.interestRate > 0) {
    saleCopy.items = saleCopy.items.map((item) => {
      const interestAmount = item.subtotal * (saleCopy.interestRate / 100);
      return {
        ...item,
        subtotal: item.subtotal + interestAmount,
        unitPrice: item.unitPrice + interestAmount / item.quantity,
      };
    });
  }

  return saleCopy;
});

const { handlePrint } = useVueToPrint({
  content: invoiceComponent,
  documentTitle: () => {
    if (sale.value) {
      return `فاتورة-${sale.value.invoiceNumber}`;
    }
    return 'فاتورة';
  },
});

onMounted(async () => {
  try {
    const response = await saleStore.fetchSale(route.params.id);
    sale.value = response.data;
    if (sale.value) {
      paymentData.value.currency = sale.value.currency;
    }
  } catch {
    notificationStore.showNotification('فشل في تحميل تفاصيل المبيع', 'error');
  }
});
</script>

<style scoped>
#invoiceComponent {
  display: none !important;
}

@media print {
  .v-btn {
    display: none !important;
  }

  #invoiceComponent {
    display: block !important;
  }
}
</style>

<style scoped>
@media print {
  .v-btn {
    display: none !important;
  }
}
</style>
