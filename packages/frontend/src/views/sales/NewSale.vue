<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">بطاقة بيع جديدة</div>
        <v-btn color="primary" @click="router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </div>
    </v-card>
    <v-card>
      <v-card-text>
        <v-form ref="form">
          <!-- 🧍 العميل والعملة -->
          <v-row>
            <v-col cols="12" md="6">
              <CustomerSelector v-model="sale.customerId" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="sale.currency"
                :items="['USD', 'IQD']"
                label="العملة"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- 🧾 المنتجات -->
          <h3 class="text-h6 mb-4">المنتجات</h3>
          <v-text-field
            v-model="barcode"
            label="قراءة الباركود"
            prepend-inner-icon="mdi-barcode-scan"
            clearable
            @keyup.enter="handleBarcodeScan"
            class="mb-4"
          />

          <v-row v-for="(item, index) in sale.items" :key="index" class="align-center mb-3">
            <v-col cols="12" md="5">
              <v-select
                v-model="item.productId"
                :items="products"
                item-title="name"
                item-value="id"
                label="المنتج"
                :rules="[rules.required]"
                @update:model-value="updateProductDetails(item)"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model.number="item.quantity"
                label="الكمية"
                type="number"
                min="1"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                :model-value="formatCurrency(item.unitPrice)"
                :suffix="sale.currency"
                label="السعر"
                readonly
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                :model-value="formatCurrency(item.quantity * item.unitPrice)"
                :suffix="sale.currency"
                label="المجموع"
                readonly
              />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
              <v-btn icon="mdi-delete" color="error" variant="text" @click="removeItem(index)" />
            </v-col>
          </v-row>

          <v-btn color="primary" prepend-icon="mdi-plus" @click="addItem" class="mb-4">
            إضافة منتج
          </v-btn>

          <v-divider class="my-4"></v-divider>

          <!-- 💳 نوع الدفع -->
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="sale.paymentType"
                :items="paymentTypes"
                item-title="label"
                item-value="value"
                label="نوع الدفع"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model.number="sale.discount" label="الخصم" type="number" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="sale.paidAmount"
                label="المبلغ المدفوع"
                type="number"
                :hint="sale.paymentType === 'installment' ? 'الدفعة الأولى' : 'المبلغ الكامل'"
                persistent-hint
              />
            </v-col>
          </v-row>

          <!-- 🧮 في حالة الدفع بالأقساط -->
          <v-expand-transition>
            <div v-if="sale.paymentType === 'installment'">
              <v-divider class="my-4"></v-divider>
              <h3 class="text-h6 mb-3">تفاصيل التقسيط</h3>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="sale.installmentCount"
                    label="عدد الأقساط"
                    type="number"
                    min="1"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="sale.interestRate"
                    label="نسبة الفائدة (%)"
                    type="number"
                    min="0"
                    max="100"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    :model-value="formatCurrency(interestValue)"
                    label="قيمة الفائدة المضافة"
                    readonly
                  />
                </v-col>
              </v-row>

              <v-card variant="tonal" color="info" class="pa-3 mt-3">
                <div class="d-flex justify-space-between">
                  <span>المبلغ بعد الفائدة:</span>
                  <span class="font-weight-bold">
                    {{ formatCurrency(totalWithInterest) }}
                  </span>
                </div>
                <div class="d-flex justify-space-between">
                  <span>قيمة القسط الواحد:</span>
                  <span class="font-weight-bold">
                    {{ formatCurrency(installmentAmount) }}
                  </span>
                </div>
                <div class="d-flex justify-space-between mt-2">
                  <span>المبلغ المتبقي:</span>
                  <span class="font-weight-bold text-error">
                    {{ formatCurrency(remainingAmount) }}
                  </span>
                </div>
              </v-card>
            </div>
          </v-expand-transition>

          <v-divider class="my-4"></v-divider>

          <!-- 💰 الملخص -->
          <v-card variant="outlined" class="pa-4 mb-4">
            <div
              v-for="summary in saleSummary"
              :key="summary.label"
              class="d-flex justify-space-between mb-1"
            >
              <span>{{ summary.label }}:</span>
              <span class="font-weight-bold">{{ summary.value }}</span>
            </div>
          </v-card>

          <!-- أزرار -->
          <div class="d-flex gap-2">
            <v-btn color="primary" :loading="loading" @click="submitSale"> حفظ البيع </v-btn>
            <v-btn variant="outlined" @click="$router.back()">إلغاء</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSaleStore, useProductStore, useNotificationStore, useSettingsStore } from '@/stores';
import CustomerSelector from '@/components/CustomerSelector.vue';

const router = useRouter();
const saleStore = useSaleStore();
const productStore = useProductStore();
const settingsStore = useSettingsStore();
const notify = useNotificationStore();

const form = ref(null);
const barcode = ref('');
const loading = ref(false);

const rules = {
  required: (value) => !!value || 'هذا الحقل مطلوب',
};

const sale = ref({
  customerId: null,
  currency: settingsStore.settings?.defaultCurrency || 'IQD',
  items: [],
  discount: 0,
  paymentType: 'cash',
  paidAmount: 0,
  installmentCount: 3,
  interestRate: 25,
});

const products = ref([]);
const currencySettings = ref({
  defaultCurrency: 'IQD',
  usdRate: 1500,
  iqdRate: 1,
});

// تحويل سعر بين عملتين بناءً على إعدادات الصرف
const convertPrice = (amount, from, to) => {
  if (!amount || from === to) return amount || 0;
  const usdRate = Number(currencySettings.value.usdRate) || 1500;
  // لدينا عملتان IQD و USD
  if (from === 'USD' && to === 'IQD') return amount * usdRate;
  if (from === 'IQD' && to === 'USD') return amount / usdRate;
  return amount; // fallback
};

// تطبيق تحويل العملة على كل عناصر السلة عند تغيير عملة البيع
const applySaleCurrencyToItems = () => {
  sale.value.items = sale.value.items.map((i) => {
    const original = i.unitPriceOriginal ?? i.unitPrice;
    const originalCur = i.originalCurrency ?? sale.value.currency;
    return {
      ...i,
      unitPrice: convertPrice(original, originalCur, sale.value.currency),
    };
  });
};

/* 💳 خيارات نوع الدفع */
const paymentTypes = [
  { label: 'نقدي', value: 'cash' },
  { label: 'تقسيط', value: 'installment' },
];

/* 🧮 حسابات البيع */
const subtotal = computed(() => sale.value.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
const total = computed(() => subtotal.value - (sale.value.discount || 0));

// ✅ الفائدة عند التقسيط
const interestValue = computed(() =>
  sale.value.paymentType === 'installment' ? total.value * (sale.value.interestRate / 100) : 0
);
const totalWithInterest = computed(() => total.value + interestValue.value);
const installmentAmount = computed(() =>
  sale.value.installmentCount > 0 ? totalWithInterest.value / sale.value.installmentCount : 0
);

// ✅ المبلغ المتبقي
const remainingAmount = computed(() => {
  const finalTotal =
    sale.value.paymentType === 'installment' ? totalWithInterest.value : total.value;
  return finalTotal - (sale.value.paidAmount || 0);
});

// ✅ تحديث المبلغ المدفوع تلقائياً عند تغيير نوع الدفع
watch(
  () => sale.value.paymentType,
  (newType) => {
    if (newType === 'cash') {
      // في حالة الدفع النقدي، المبلغ المدفوع = الإجمالي
      sale.value.paidAmount = total.value;
    } else {
      // في حالة التقسيط، المبلغ المدفوع = قيمة القسط الأول
      sale.value.paidAmount = installmentAmount.value;
    }
  }
);

// مراقبة تغيير العملة في نموذج البيع وتحديث أسعار المنتجات
watch(
  () => sale.value.currency,
  () => {
    applySaleCurrencyToItems();
  }
);

// ✅ تحديث المبلغ المدفوع عند تغيير الإجمالي
watch(
  () => [total.value, totalWithInterest.value, installmentAmount.value],
  () => {
    if (sale.value.paymentType === 'cash') {
      sale.value.paidAmount = total.value;
    } else {
      sale.value.paidAmount = installmentAmount.value;
    }
  }
);

/* 🧾 الملخص */
const saleSummary = computed(() => [
  { label: 'المجموع الفرعي', value: formatCurrency(subtotal.value) },
  { label: 'الخصم', value: formatCurrency(sale.value.discount) },
  { label: 'الإجمالي بعد الخصم', value: formatCurrency(total.value) },
  ...(sale.value.paymentType === 'installment'
    ? [
        { label: 'الفائدة المضافة', value: formatCurrency(interestValue.value) },
        { label: 'الإجمالي بعد الفائدة', value: formatCurrency(totalWithInterest.value) },
        { label: 'قيمة القسط', value: formatCurrency(installmentAmount.value) },
      ]
    : []),
  { label: 'المبلغ المدفوع', value: formatCurrency(sale.value.paidAmount) },
  { label: 'المبلغ المتبقي', value: formatCurrency(remainingAmount.value) },
]);

/* 📦 إدارة المنتجات */
const addItem = () => sale.value.items.push({ productId: null, quantity: 1, unitPrice: 0 });
const removeItem = (index) => sale.value.items.splice(index, 1);
const updateProductDetails = (item) => {
  const p = products.value.find((prod) => prod.id === item.productId);
  if (p.stock <= 0) {
    notify.error('❌ المنتج غير متوفر في المخزون');
    // إعادة تعيين المنتج المحدد
    item.productId = null;
    return;
  }
  if (p) {
    item.unitPriceOriginal = p.sellingPrice;
    item.originalCurrency = p.currency || 'USD';
    item.unitPrice = convertPrice(p.sellingPrice, item.originalCurrency, sale.value.currency);
  }
};

/* 🔍 قراءة الباركود */
const handleBarcodeScan = () => {
  const code = barcode.value.trim();
  if (!code) return;
  const product = products.value.find((p) => p.barcode === code);
  if (!product) return notify.error('❌ المنتج غير موجود');
  if (product.stock <= 0) return notify.error('❌ المنتج غير متوفر في المخزون');
  const existing = sale.value.items.find((i) => i.productId === product.id);
  existing
    ? existing.quantity++
    : sale.value.items.push({
        productId: product.id,
        quantity: 1,
        unitPriceOriginal: product.sellingPrice,
        originalCurrency: product.currency || 'USD',
        unitPrice: convertPrice(
          product.sellingPrice,
          product.currency || 'USD',
          sale.value.currency
        ),
      });

  barcode.value = '';
};

/* 💾 حفظ البيع */
const submitSale = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return notify.error('يرجى تعبئة جميع الحقول');

  if (!sale.value.items.length) return notify.error('يجب إضافة منتج واحد على الأقل');

  loading.value = true;
  try {
    const saleResponse = await saleStore.createSale(sale.value);
    notify.success('تم حفظ البيع بنجاح ✅');

    router.push({ name: 'SaleDetails', params: { id: saleResponse.data.id } });

    console.log('بيانات البيع المرسلة للحفظ:', sale.value);
  } catch (error) {
    console.error('خطأ أثناء حفظ البيع:', error);
    notify.error('حدث خطأ أثناء حفظ البيع. يرجى المحاولة مرة أخرى.');
  } finally {
    loading.value = false;
  }
};

/* ⚙️ تحميل البيانات */
onMounted(async () => {
  // تحميل المنتجات
  const p = await productStore.fetchProducts({ limit: 1000 });
  products.value = p.data;

  // تحميل إعدادات العملة
  try {
    const settings = await settingsStore.fetchCurrencySettings();
    if (settings) {
      currencySettings.value = settings;
      sale.value.currency = settings.defaultCurrency || 'IQD';
    }
  } catch (error) {
    console.error('فشل تحميل إعدادات العملة:', error);
    // استخدام القيم الافتراضية
  }
});

/* 💱 تنسيق العملة */
const formatCurrency = (amount) =>
  new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: sale.value.currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
</script>
