<template>
  <div class="currency-settings">
    <!-- 🔹 شريط الأدوات العلوي -->
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">
          <v-icon class="me-2" color="primary">mdi-currency-usd</v-icon>
          إعدادات العملة
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          class="rounded-lg"
          :loading="settingsStore.isLoading"
          :disabled="!isFormValid"
          @click="saveCurrencySettings"
        >
          حفظ الإعدادات
        </v-btn>
      </div>
    </v-card>

    <v-card class="mb-4 pa-4">
      <v-form ref="formRef" v-model="isFormValid">
        <v-row>
          <!-- Default Currency -->
          <v-col cols="12" md="12">
            <v-select
              v-model="currencyData.defaultCurrency"
              label="العملة الافتراضية *"
              :items="currencies"
              :rules="[rules.required]"
              variant="outlined"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-currency-usd"
              required
            >
              <template v-slot:selection="{ item }">
                <v-chip :color="item.raw.color" class="ma-1">
                  <v-icon start>{{ item.raw.icon }}</v-icon>
                  {{ item.raw.text }}
                </v-chip>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :prepend-icon="item.raw.icon"
                  :title="item.raw.text"
                  :subtitle="item.raw.subtitle"
                ></v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- Exchange Rates Section -->
          <v-col cols="12">
            <v-divider class="my-4" />
            <h4 class="text-h6 mb-3 d-flex align-center">
              <v-icon class="me-2" color="info">mdi-swap-horizontal</v-icon>
              أسعار الصرف
            </h4>
          </v-col>

          <!-- USD Exchange Rate -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="currencyData.usdRate"
              label="سعر صرف الدولار (USD) *"
              :rules="[rules.required, rules.positiveNumber]"
              variant="outlined"
              type="number"
              prepend-inner-icon="mdi-currency-usd"
              suffix="IQD"
              hint="سعر الدولار مقابل الدينار العراقي"
              persistent-hint
              required
            />
          </v-col>

          <!-- IQD Exchange Rate -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="currencyData.iqdRate"
              label="سعر صرف الدينار (IQD) *"
              :rules="[rules.required, rules.positiveNumber]"
              variant="outlined"
              type="number"
              prepend-inner-icon="mdi-currency-ils"
              disabled
              hint="القيمة الافتراضية للدينار العراقي"
              persistent-hint
              required
            />
          </v-col>

          <!-- Info Card -->
          <v-col cols="12">
            <v-card variant="tonal" color="info" class="pa-4">
              <div class="d-flex align-center">
                <v-icon size="large" class="me-3">mdi-information</v-icon>
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold mb-1">معلومات مهمة</h4>
                  <p class="text-body-2 mb-0">
                    • العملة الافتراضية ستستخدم في جميع عمليات البيع الجديدة<br />
                    • يمكنك تغيير أسعار الصرف في أي وقت<br />
                    • التغييرات ستؤثر على العمليات الجديدة فقط
                  </p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';

// Stores
const settingsStore = useSettingsStore();

// Refs
const formRef = ref();
const isFormValid = ref(false);

// Currency options
const currencies = [
  {
    text: 'الدينار العراقي',
    value: 'IQD',
    icon: 'mdi-currency-ils',
    color: 'green',
    subtitle: 'العملة المحلية',
  },
  {
    text: 'الدولار الأمريكي',
    value: 'USD',
    icon: 'mdi-currency-usd',
    color: 'blue',
    subtitle: 'العملة الدولية',
  },
];

// Reactive data
const currencyData = ref({
  defaultCurrency: 'IQD',
  usdRate: 1500,
  iqdRate: 1,
});

// Validation rules
const rules = {
  required: (value) => !!value || 'هذا الحقل مطلوب',
  positiveNumber: (value) => (value && value > 0) || 'يجب أن تكون القيمة أكبر من صفر',
};

// Save currency settings
const saveCurrencySettings = async () => {
  if (!isFormValid.value) return;

  try {
    await settingsStore.saveCurrencySettings(currencyData.value);
  } catch (error) {
    console.error('Failed to save currency settings:', error);
  }
};

// Lifecycle
onMounted(async () => {
  try {
    const settings = await settingsStore.fetchCurrencySettings();
    if (settings) {
      currencyData.value = {
        defaultCurrency: settings.defaultCurrency || 'IQD',
        usdRate: settings.usdRate || 1500,
        iqdRate: settings.iqdRate || 1,
      };
    }
  } catch (error) {
    console.error('Failed to load currency settings:', error);
  }
});
</script>

<style scoped>
.currency-settings {
  width: 100%;
}
</style>
