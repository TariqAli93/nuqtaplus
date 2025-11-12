<template>
  <div class="pa-4">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">📊 التقارير والتحليلات</h1>
        <p class="text-body-2 text-grey-darken-1">نظرة شاملة على أداء المبيعات للفترة المحددة</p>
      </div>

      <div class="d-flex gap-2">
        <v-btn
          color="error"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          :disabled="!report"
          @click="exportToPDF"
        >
          PDF
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card class="pa-4 mb-8">
      <v-row density="comfortable">
        <v-col cols="12" md="4">
          <v-menu
            v-model="menus.start"
            :close-on-content-click="true"
            transition="scale-transition"
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="formattedStartDate"
                label="من تاريخ"
                readonly
                prepend-inner-icon="mdi-calendar"
                v-bind="props"
                density="comfortable"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="filters.startDate"
              color="primary"
              elevation="4"
              @change="
                () => {
                  menuStart = false;
                }
              "
            ></v-date-picker>
          </v-menu>
        </v-col>

        <v-col cols="12" md="4">
          <v-menu
            v-model="menus.end"
            :close-on-content-click="true"
            transition="scale-transition"
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="formattedEndDate"
                label="إلى تاريخ"
                readonly
                prepend-inner-icon="mdi-calendar"
                v-bind="props"
                density="comfortable"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="filters.endDate"
              color="primary"
              elevation="4"
              @change="
                () => {
                  menuEnd = false;
                }
              "
            ></v-date-picker>
          </v-menu>
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="filters.currency"
            :items="currencyOptions"
            label="العملة"
            density="comfortable"
          />
        </v-col>
      </v-row>
      <v-btn color="primary" :loading="loading" @click="fetchReport">
        <v-icon start>mdi-magnify</v-icon> عرض التقرير
      </v-btn>
    </v-card>

    <!-- Main Stats -->
    <v-row v-if="report" density="comfortable">
      <!-- عدد المبيعات -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h5 font-weight-bold text-primary">{{ report.count || 0 }}</div>
              <div class="text-body-2 text-grey">عدد المبيعات</div>
            </div>
            <v-icon size="42" color="primary">mdi-counter</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- مبيعات مكتملة -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-success">
                {{ report.completedSales || 0 }}
              </div>
              <div class="text-body-2 text-grey">مبيعات مكتملة</div>
            </div>
            <v-icon size="42" color="success">mdi-check-circle</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- مبيعات معلقة -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-warning">
                {{ report.pendingSales || 0 }}
              </div>
              <div class="text-body-2 text-grey">مبيعات معلقة</div>
            </div>
            <v-icon size="42" color="warning">mdi-clock-outline</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- إجمالي المبيعات USD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-success">
                {{ formatUSD(report.salesUSD || 0) }}
              </div>
              <div class="text-body-2 text-grey">إجمالي المبيعات (USD)</div>
            </div>
            <v-icon size="42" color="success">mdi-cash</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- المدفوع USD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-info">
                {{ formatUSD(report.paidUSD || 0) }}
              </div>
              <div class="text-body-2 text-grey">المدفوع (USD)</div>
            </div>
            <v-icon size="42" color="info">mdi-cash-check</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- إجمالي المبيعات IQD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-teal-darken-2">
                {{ formatIQD(report.salesIQD || 0) }}
              </div>
              <div class="text-body-2 text-grey">إجمالي المبيعات (IQD)</div>
            </div>
            <v-icon size="42" color="teal-darken-2">mdi-cash-multiple</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- المدفوع IQD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-blue-grey-darken-1">
                {{ formatIQD(report.paidIQD || 0) }}
              </div>
              <div class="text-body-2 text-grey">المدفوع (IQD)</div>
            </div>
            <v-icon size="42" color="blue-grey-darken-1">mdi-cash-check</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- متوسط البيع USD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-purple">
                {{ formatUSD(report.avgSaleUSD || 0) }}
              </div>
              <div class="text-body-2 text-grey">متوسط البيع (USD)</div>
            </div>
            <v-icon size="42" color="purple">mdi-finance</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- الربح USD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-pink-darken-2">
                {{ formatUSD(report.profitUSD || 0) }}
              </div>
              <div class="text-body-2 text-grey">الربح (USD)</div>
            </div>
            <v-icon size="42" color="pink-darken-2">mdi-cash-plus</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- متوسط البيع IQD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-deep-purple-darken-2">
                {{ formatIQD(report.avgSaleIQD || 0) }}
              </div>
              <div class="text-body-2 text-grey">متوسط البيع (IQD)</div>
            </div>
            <v-icon size="42" color="deep-purple-darken-2">mdi-finance</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- الربح IQD -->
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-pink-darken-4">
                {{ formatIQD(report.profitIQD || 0) }}
              </div>
              <div class="text-body-2 text-grey">الربح (IQD)</div>
            </div>
            <v-icon size="42" color="pink-darken-4">mdi-cash-plus</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSaleStore } from '@/stores/sale';
import { useNotificationStore } from '@/stores/notification';

const saleStore = useSaleStore();
const notificationStore = useNotificationStore();
const loading = ref(false);
const report = ref(null);
const menus = ref({
  start: false,
  end: false,
});
const filters = ref({
  startDate: null,
  endDate: null,
  currency: null,
});

const currencyOptions = [
  { title: 'جميع العملات', value: null },
  { title: 'دولار (USD)', value: 'USD' },
  { title: 'دينار عراقي (IQD)', value: 'IQD' },
];

const toYmd = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🔹 Formatting helpers
const formatUSD = (amount) =>
  `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const formatIQD = (amount) =>
  `${parseFloat(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD`;

const formattedStartDate = computed({
  get: () => toYmd(filters.value.startDate),
  set: (val) => (filters.value.startDate = val ? new Date(val) : null) + 1,
});

const formattedEndDate = computed({
  get: () => toYmd(filters.value.endDate),
  set: (val) => (filters.value.endDate = val ? new Date(val) : null) + 1,
});

// 🔹 Fetch report
const fetchReport = async () => {
  loading.value = true;

  try {
    report.value = await saleStore.getSalesReport({
      startDate: toYmd(filters.value.startDate),
      endDate: toYmd(filters.value.endDate),
      currency: filters.value.currency,
    });
  } catch {
    notificationStore.error('حدث خطأ أثناء تحميل التقرير');
  } finally {
    loading.value = false;
  }
};

// 🔹 Export to PDF (تصميم احترافي للطباعة)
const exportToPDF = () => {
  if (!report.value) return;

  const win = window.open('', '', 'height=800,width=1000');

  win.document.write(`
    <html dir="rtl">
      <head>
        <title>تقرير المبيعات</title>
        <style>
          body {
            font-family: "Cairo", Arial, sans-serif;
            padding: 30px;
            direction: rtl;
            background: #f9fafb;
            color: #333;
          }

          h1 {
            text-align: center;
            color: white;
            margin-bottom: 10px;
          }

          .subtitle {
            text-align: center;
            color: #555;
            font-size: 14px;
            margin-bottom: 30px;
          }

          .info-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background: #e3f2fd;
            border-radius: 8px;
            padding: 12px 20px;
          }

          .info-box div {
            font-size: 14px;
            color: #333;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            border-radius: 8px;
            overflow: hidden;
          }

          th {
            background-color: #1976d2;
            color: #fff;
            padding: 12px;
            font-size: 15px;
          }

          td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
            background: #fff;
          }

          tr:nth-child(even) td {
            background: #f2f6fc;
          }

          tr:hover td {
            background: #e1f5fe;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }

          .currency-label {
            font-weight: bold;
            color: #1976d2;
          }
        </style>
      </head>

      <body>
        <h1>📊 تقرير المبيعات</h1>
        <div class="subtitle">نظرة شاملة على الأداء المالي للفترة المحددة</div>

        <div class="info-box">
          <div><strong>من:</strong> ${filters.value.startDate || '---'}</div>
          <div><strong>إلى:</strong> ${filters.value.endDate || '---'}</div>
        </div>

        <table>
          <tr>
            <th>المقياس</th>
            <th><span class="currency-label">USD</span></th>
            <th><span class="currency-label">IQD</span></th>
          </tr>

          <tr>
            <td>إجمالي المبيعات</td>
            <td>${formatUSD(report.value.salesUSD || 0)}</td>
            <td>${formatIQD(report.value.salesIQD || 0)}</td>
          </tr>

          <tr>
            <td>المدفوع</td>
            <td>${formatUSD(report.value.paidUSD || 0)}</td>
            <td>${formatIQD(report.value.paidIQD || 0)}</td>
          </tr>

          <tr>
            <td>متوسط البيع</td>
            <td>${formatUSD(report.value.avgSaleUSD || 0)}</td>
            <td>${formatIQD(report.value.avgSaleIQD || 0)}</td>
          </tr>

          <tr>
            <td>إجمالي الربح</td>
            <td>${formatUSD(report.value.profitUSD || 0)}</td>
            <td>${formatIQD(report.value.profitIQD || 0)}</td>
          </tr>

          <tr>
            <td>عدد المبيعات</td>
            <td colspan="2">${report.value.salesCount || 0}</td>
          </tr>

          <tr>
            <td>مبيعات مكتملة</td>
            <td colspan="2">${report.value.completedSales || 0}</td>
          </tr>

          <tr>
            <td>مبيعات معلقة</td>
            <td colspan="2">${report.value.pendingSales || 0}</td>
          </tr>

          <tr>
            <td>أقساط متأخرة</td>
            <td colspan="2">${report.value.overdueInstallments || 0}</td>
          </tr>
        </table>

        <div class="footer">
          <p>تم إنشاء هذا التقرير تلقائيًا بتاريخ ${new Date().toLocaleDateString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            numberingSystem: 'latn',
          })}</p>
        </div>
      </body>
    </html>
  `);

  win.document.close();
  win.print();

  notificationStore.success('📄 تم تجهيز تقرير PDF للطباعة');
};

onMounted(() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  filters.value.startDate = start.toISOString().split('T')[0];
  filters.value.endDate = end.toISOString().split('T')[0];
  fetchReport();
});
</script>
