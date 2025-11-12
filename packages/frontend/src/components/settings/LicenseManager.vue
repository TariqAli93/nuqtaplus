<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start color="primary">mdi-key-variant</v-icon>
      إدارة التفعيل
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- معلومات التفعيل الحالي -->
      <v-card variant="tonal" color="info" class="mb-4" v-if="licenseInfo">
        <v-card-text>
          <div class="d-flex align-center mb-3">
            <v-icon size="40" color="success">mdi-check-decagram</v-icon>
            <div class="mr-3">
              <div class="text-h6">البرنامج مُفعّل</div>
              <div class="text-caption">التفعيل ساري المفعول</div>
            </div>
          </div>

          <v-divider class="my-3" />

          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">كود التفعيل:</span>
            <span class="font-weight-bold">{{ maskLicenseKey(licenseInfo.licenseKey) }}</span>
          </div>

          <div class="d-flex justify-space-between mb-2" v-if="licenseInfo.lastValidation">
            <span class="text-body-2">آخر تحقق:</span>
            <span class="font-weight-bold">{{
              formatDate(licenseInfo.lastValidation.timestamp)
            }}</span>
          </div>

          <div class="d-flex justify-space-between">
            <span class="text-body-2">حالة التحقق:</span>
            <v-chip color="success" size="small">
              <v-icon start size="small">mdi-check-circle</v-icon>
              صالح
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- عدم وجود تفعيل -->
      <v-alert v-else type="warning" variant="tonal" class="mb-4">
        <v-icon start>mdi-alert</v-icon>
        البرنامج غير مُفعّل. يرجى إدخال كود التفعيل.
      </v-alert>

      <!-- إلغاء التفعيل -->
      <v-card variant="outlined" color="error" v-if="licenseInfo">
        <v-card-title class="text-subtitle-1">
          <v-icon start>mdi-delete-alert</v-icon>
          إلغاء التفعيل
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-alert type="warning" variant="text" density="compact" class="mb-3">
            سيتم إلغاء تفعيل البرنامج وستحتاج إلى إدخال كود جديد لاستخدامه مرة أخرى.
          </v-alert>

          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            :loading="deactivateLoading"
            @click="showDeactivateDialog = true"
          >
            إلغاء التفعيل
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- معلومات إضافية -->
      <v-card variant="tonal" color="grey-lighten-4" class="mt-4">
        <v-card-text>
          <div class="text-subtitle-2 mb-2">
            <v-icon start size="small">mdi-information</v-icon>
            ملاحظات هامة
          </div>
          <ul class="text-body-2 pr-4">
            <li>كود التفعيل مرتبط بجهازك الحالي</li>
            <li>يتم التحقق من صحة التفعيل كل 24 ساعة</li>
            <li>في حالة عدم الاتصال بالإنترنت، يعمل التفعيل لمدة 7 أيام</li>
            <li>لتغيير الجهاز، يرجى التواصل مع الدعم الفني</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-card-text>

    <!-- Dialog تأكيد إلغاء التفعيل -->
    <v-dialog v-model="showDeactivateDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon start>mdi-alert</v-icon>
          تأكيد إلغاء التفعيل
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert type="error" variant="tonal" class="mb-3">
            هل أنت متأكد من رغبتك في إلغاء تفعيل البرنامج؟
          </v-alert>

          <p class="text-body-2">
            سيتم إلغاء التفعيل نهائياً من هذا الجهاز. ستحتاج إلى إدخال كود تفعيل جديد لاستخدام
            البرنامج مرة أخرى.
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeactivateDialog = false" :disabled="deactivateLoading">
            إلغاء
          </v-btn>
          <v-btn
            color="error"
            @click="deactivateLicense"
            :loading="deactivateLoading"
            prepend-icon="mdi-delete"
          >
            تأكيد الإلغاء
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar للنجاح -->
    <v-snackbar v-model="showSuccess" color="success" timeout="4000" location="top">
      <v-icon start>mdi-check-circle</v-icon>
      {{ successMessage }}
    </v-snackbar>

    <!-- Snackbar للخطأ -->
    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      <v-icon start>mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State
const licenseInfo = ref(null);
const deactivateLoading = ref(false);
const showDeactivateDialog = ref(false);
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Load license info
async function loadLicenseInfo() {
  try {
    const result = await window.electronAPI.getLicenseInfo();
    if (result.licenseKey) {
      licenseInfo.value = result;
    }
  } catch (error) {
    console.error('Failed to load license info:', error);
  }
}

// Mask license key (show only first and last 4 characters)
function maskLicenseKey(key) {
  if (!key || key.length < 8) return key;
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}${'*'.repeat(key.length - 8)}${end}`;
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  });
}

// Deactivate license
async function deactivateLicense() {
  deactivateLoading.value = true;
  try {
    const result = await window.electronAPI.deactivateLicense();

    if (result.success) {
      successMessage.value = 'تم إلغاء التفعيل بنجاح. جاري التحويل لشاشة التفعيل...';
      showSuccess.value = true;
      showDeactivateDialog.value = false;
      licenseInfo.value = null;

      // النافذة ستُغلق وتُفتح نافذة التفعيل تلقائياً من main.js
    } else {
      errorMessage.value = result.message || 'فشل إلغاء التفعيل';
      showError.value = true;
    }
  } catch (error) {
    errorMessage.value = 'حدث خطأ أثناء إلغاء التفعيل';
    showError.value = true;
    console.error('Deactivation error:', error);
  } finally {
    deactivateLoading.value = false;
  }
}

// Load on mount
onMounted(() => {
  loadLicenseInfo();
});
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
