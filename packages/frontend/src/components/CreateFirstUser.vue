<template>
  <v-dialog v-model="isFirstRunDialog" max-width="600" persistent>
    <v-card elevation="12" rounded="xl">
      <!-- Header -->
      <v-card-title class="text-center py-6">
        <v-icon color="primary" size="64" class="mb-2">mdi-party-popper</v-icon>
        <h2 class="text-h5 font-semibold text-primary mb-1">🎉 مرحباً بك في نظام CodeLIMS 🎉</h2>
        <p class="text-body-2 text-gray-600">تم إنشاء حساب المدير الافتراضي بنجاح!</p>
      </v-card-title>

      <v-divider />

      <!-- Body -->
      <v-card-text>
        <div class="space-y-4">
          <!-- بيانات الدخول -->
          <v-list density="comfortable" class="rounded-lg">
            <v-list-item>
              <v-text-field
                v-model="username"
                label="اسم المستخدم"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account"
                append-inner-icon="mdi-content-copy"
                hide-details
                @click:append-inner="copyToClipboard(username, 'اسم المستخدم')"
              />
            </v-list-item>

            <v-list-item>
              <v-text-field
                v-model="password"
                label="كلمة المرور"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-lock"
                append-inner-icon="mdi-content-copy"
                hide-details
                @click:append-inner="copyToClipboard(password, 'كلمة المرور')"
              />
            </v-list-item>
          </v-list>

          <!-- رسالة تأكيد -->
          <v-alert type="success" variant="tonal" border="start" class="mt-4">
            <div>النظام جاهز للاستخدام</div>
            <div>يمكنك الآن تسجيل الدخول باستخدام البيانات أعلاه والبدء في استخدام النظام.</div>
          </v-alert>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <v-card-actions class="justify-end px-4 py-3">
        <v-btn
          color="primary"
          size="large"
          variant="elevated"
          prepend-icon="mdi-login"
          @click="saveSetup"
        >
          فهمت، سأسجل دخولي الآن
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

// ✅ متجر المصادقة
const authStore = useAuthStore();

// 🔹 حالة ظهور نافذة الترحيب
const isFirstRunDialog = ref(false);

// 🔹 بيانات الدخول الافتراضية
const username = ref('admin');
const password = ref('Admin@123');

// 🔹 معلومات الإعداد الأولي
const setupInfo = ref(null);

// ✅ عند أول تحميل
onMounted(async () => {
  const firstRunDone = authStore.isFirstRun || localStorage.getItem('firstRunCompleted') === 'true';

  if (!firstRunDone) {
    try {
      const response = await authStore.fetchInitialSetupInfo();

      // check if isFirstRun is true
      if (response.isFirstRun) {
        // check if setupInfo is available
        setupInfo.value = response;

        // show dialog
        isFirstRunDialog.value = true;

        // populate username and password if available
        if (response.username) {
          username.value = response.username;
        }
        if (response.password) {
          password.value = response.password;
        }
      } else {
        // إذا لم يكن أول تشغيل، تعيين العلم في المتجر
        authStore.isFirstRun = false;
        localStorage.setItem('firstRunCompleted', 'true');
      }
    } catch (error) {
      console.error('خطأ في جلب معلومات الإعداد الأولي:', error);
    }
  }
});

// ✅ إغلاق النافذة وعدم عرضها مرة أخرى
function closeDialog() {
  isFirstRunDialog.value = false;
  localStorage.setItem('firstRunCompleted', 'true');
}

// ✅ نسخ النص إلى الحافظة
function copyToClipboard(value, label) {
  navigator.clipboard.writeText(value);
  alert(`تم نسخ ${label} إلى الحافظة`);
}

async function checkInitialSetup() {
  try {
    const response = await authStore.fetchInitialSetupInfo();

    if (response.isFirstRun) {
      setupInfo.value = response;
      isFirstRunDialog.value = true;
    }
  } catch (error) {
    console.error('خطأ في جلب معلومات الإعداد الأولي:', error);
  }
}

async function saveSetup() {
  try {
    await authStore.createFirstUser({
      username: username.value,
      password: password.value,
      fullName: 'مدير النظام',
      roleId: 1,
      phone: '0000000000',
    });

    closeDialog();
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم الأول:', error);
  }
}

onMounted(() => {
  // تأخير بسيط لضمان تحميل الصفحة
  setTimeout(() => {
    checkInitialSetup();
  }, 500);
});
</script>

<style scoped>
.text-center {
  text-align: center;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
