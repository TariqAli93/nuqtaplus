<template>
  <div class="company-info-form">
    <!-- 🔹 شريط الأدوات العلوي -->
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">
          <v-icon class="me-2" color="primary">mdi-domain</v-icon>
          معلومات الشركة
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          class="rounded-lg"
          :loading="settingsStore.isLoading"
          :disabled="!isFormValid"
          @click="saveCompanyInfo"
        >
          حفظ المعلومات
        </v-btn>
      </div>
    </v-card>

    <v-card class="mb-4 pa-4">
      <v-form ref="formRef" v-model="isFormValid">
        <v-row>
          <!-- Company Name -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="companyData.name"
              label="اسم الشركة *"
              :rules="[rules.required, rules.maxLength(255)]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-domain"
              required
            />
          </v-col>

          <!-- Invoice Type -->
          <v-col cols="12" md="6">
            <v-select
              v-model="companyData.invoiceType"
              label="نوع الفاتورة"
              :items="invoiceTypes"
              variant="outlined"
              density="comfortable"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-receipt"
            />
          </v-col>

          <!-- Address Section -->
          <v-col cols="12">
            <v-divider class="my-4" />
            <h4 class="text-h6 mb-3 d-flex align-center">
              <v-icon class="me-2" color="info">mdi-map-marker</v-icon>
              العنوان
            </h4>
          </v-col>

          <!-- City -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="companyData.city"
              label="المدينة"
              :rules="[rules.maxLength(100), rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-city"
            />
          </v-col>

          <!-- Area -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="companyData.area"
              label="المنطقة"
              :rules="[rules.maxLength(100), rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-map-outline"
            />
          </v-col>

          <!-- Street -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="companyData.street"
              label="الشارع"
              :rules="[rules.maxLength(200), rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-road"
            />
          </v-col>

          <!-- Contact Information -->
          <v-col cols="12">
            <v-divider class="my-4" />
            <h4 class="text-h6 mb-3 d-flex align-center">
              <v-icon class="me-2" color="info">mdi-phone</v-icon>
              معلومات الاتصال
            </h4>
          </v-col>

          <!-- Phone Numbers -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="companyData.phone"
              :rules="[rules.validPhone, rules.required]"
              variant="outlined"
              prepend-inner-icon="mdi-phone"
              density="comfortable"
              label="رقم الهاتف"
            >
            </v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="companyData.phone2"
              :rules="[rules.validPhone]"
              variant="outlined"
              prepend-inner-icon="mdi-phone"
              density="comfortable"
              label="رقم هاتف إضافي"
            >
            </v-text-field>
          </v-col>
        </v-row>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';

// Stores
const settingsStore = useSettingsStore();

// Refs
const formRef = ref();
const isFormValid = ref(false);
const settings = ref(settingsStore.settings || {});

// Invoice types
const invoiceTypes = [
  { text: 'إيصال صغير', value: 'roll' },
  { text: 'فاتورة A4', value: 'a4' },
];

// Reactive data
const companyData = ref({
  name: '',
  city: '',
  area: '',
  street: '',
  phone: '',
  phone2: '',
  logoUrl: '',
  invoiceType: invoiceTypes[0].value,
});

// Validation rules
const rules = {
  required: (value) => !!value || 'هذا الحقل مطلوب',
  maxLength: (max) => (value) => !value || value.length <= max || `يجب ألا يتجاوز ${max} حرف`,
  validPhone: async (value) => {
    if (!value) return true;
    // regex validation for phone number (07884841993 like this one)
    const isValid = RegExp('^\\d{11}$').test(value);

    return isValid || 'رقم الهاتف غير صحيح';
  },
};

const saveCompanyInfo = async () => {
  if (!isFormValid.value) return;

  try {
    await settingsStore.saveCompanyInfo(companyData.value);
  } catch (error) {
    console.error('Failed to save company info:', error);
  }
};

// Watch for store changes
watch(
  () => settingsStore.companyInfo,
  (newValue) => {
    Object.assign(companyData.value, newValue);
  },
  { deep: true, immediate: true }
);

// Lifecycle
onMounted(async () => {
  await settingsStore.fetchAllSettings();
  settings.value = settingsStore.settings || {};
  companyData.value = {
    name: settings.value.company?.name || '',
    city: settings.value.company?.city || '',
    area: settings.value.company?.area || '',
    street: settings.value.company?.street || '',
    phone: settings.value.company?.phone || '',
    phone2: settings.value.company?.phone2 || '',
    invoiceType: settings.value.company?.invoiceType || invoiceTypes[0],
  };
});
</script>
