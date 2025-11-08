<template>
  <div class="backup-settings">
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4 d-flex align-center">
          <v-icon class="me-2" color="primary">mdi-backup-restore</v-icon>
          إدارة النسخ الاحتياطي
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <!-- Backup Actions -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="bg-success text-white">
            <v-icon start>mdi-content-save</v-icon>
            إنشاء نسخة احتياطية
          </v-card-title>
          <v-card-text class="pa-4">
            <p class="text-body-1 mb-4">إنشاء نسخة احتياطية من قاعدة البيانات والملفات المرفقة</p>

            <v-text-field
              v-model="backupName"
              label="اسم النسخة الاحتياطية (اختياري)"
              variant="outlined"
              prepend-inner-icon="mdi-tag"
              placeholder="نسخة احتياطية يدوية"
              class="mb-4"
            />

            <v-btn
              color="success"
              variant="elevated"
              block
              :loading="isCreatingBackup"
              @click="createBackup"
            >
              <v-icon start>mdi-plus</v-icon>
              إنشاء نسخة احتياطية
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Restore Actions -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="bg-warning text-white">
            <v-icon start>mdi-restore</v-icon>
            استعادة من نسخة احتياطية
          </v-card-title>
          <v-card-text class="pa-4">
            <p class="text-body-1 mb-4">رفع واستعادة نسخة احتياطية من ملف</p>

            <v-file-input
              v-model="restoreFile"
              label="اختر ملف النسخة الاحتياطية"
              variant="outlined"
              accept=".sql,.db,.backup"
              prepend-inner-icon="mdi-file-upload"
              show-size
              class="mb-4"
            />

            <v-btn
              color="warning"
              variant="elevated"
              block
              :disabled="!restoreFile?.length"
              :loading="isRestoring"
              @click="showRestoreDialog = true"
            >
              <v-icon start>mdi-restore</v-icon>
              استعادة النسخة الاحتياطية
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Backup History -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="bg-info text-white">
            <v-icon start>mdi-history</v-icon>
            سجل النسخ الاحتياطي
            <v-spacer />
            <v-btn color="white" variant="text" size="small" @click="loadBackupHistory">
              <v-icon start>mdi-refresh</v-icon>
              تحديث
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="backupHeaders"
            :items="backupHistory"
            :loading="isLoadingHistory"
            class="elevation-0"
            no-data-text="لا توجد نسخ احتياطية"
          >
            <template v-slot:[`item.size`]="{ item }">
              {{ formatFileSize(item.size) }}
            </template>

            <template v-slot:[`item.createdAt`]="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template v-slot:[`item.actions`]="{ item }">
              <v-btn color="primary" variant="text" size="small" @click="downloadBackup(item)">
                <v-icon>mdi-download</v-icon>
              </v-btn>
              <v-btn color="error" variant="text" size="small" @click="deleteBackup(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Auto Backup Settings -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="bg-purple text-white">
            <v-icon start>mdi-cog</v-icon>
            إعدادات النسخ الاحتياطي التلقائي
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="autoBackupSettings.enabled"
                  label="تفعيل النسخ الاحتياطي التلقائي"
                  color="purple"
                  @change="saveAutoBackupSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="autoBackupSettings.frequency"
                  label="تكرار النسخ الاحتياطي"
                  :items="backupFrequencies"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  :disabled="!autoBackupSettings.enabled"
                  @update:model-value="saveAutoBackupSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="autoBackupSettings.maxFiles"
                  label="الحد الأقصى للملفات المحفوظة"
                  type="number"
                  min="1"
                  max="50"
                  variant="outlined"
                  :disabled="!autoBackupSettings.enabled"
                  @blur="saveAutoBackupSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-body-2 text-medium-emphasis">
                  <v-icon start size="small">mdi-information</v-icon>
                  النسخة التالية: {{ nextBackupTime }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Restore Confirmation Dialog -->
    <v-dialog v-model="showRestoreDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon start>mdi-alert</v-icon>
          تأكيد استعادة النسخة الاحتياطية
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert type="warning" variant="tonal" class="mb-4">
            <strong>تحذير:</strong>
            ستؤدي هذه العملية إلى استبدال جميع البيانات الحالية. تأكد من إنشاء نسخة احتياطية قبل
            المتابعة.
          </v-alert>

          <p class="text-body-1">هل أنت متأكد من أنك تريد استعادة البيانات من الملف المحدد؟</p>

          <v-text-field
            v-model="restoreConfirmation"
            label="اكتب 'استعادة' للتأكيد"
            variant="outlined"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="showRestoreDialog = false"> إلغاء </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :disabled="restoreConfirmation !== 'استعادة'"
            :loading="isRestoring"
            @click="restoreBackup"
          >
            استعادة
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Snackbars -->
    <v-snackbar v-model="showSuccessMessage" color="success" timeout="3000" location="top">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showErrorMessage" color="error" timeout="5000" location="top">
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// State
const backupName = ref('');
const restoreFile = ref([]);
const restoreConfirmation = ref('');
const backupHistory = ref([]);
const showRestoreDialog = ref(false);
const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Loading states
const isCreatingBackup = ref(false);
const isRestoring = ref(false);
const isLoadingHistory = ref(false);

// Auto backup settings
const autoBackupSettings = ref({
  enabled: true,
  frequency: 'daily',
  maxFiles: 10,
});

// Table headers
const backupHeaders = [
  { title: 'اسم الملف', key: 'name', sortable: true },
  { title: 'الحجم', key: 'size', sortable: true },
  { title: 'تاريخ الإنشاء', key: 'createdAt', sortable: true },
  { title: 'النوع', key: 'type', sortable: true },
  { title: 'الإجراءات', key: 'actions', sortable: false },
];

// Backup frequencies
const backupFrequencies = [
  { text: 'يومياً', value: 'daily' },
  { text: 'أسبوعياً', value: 'weekly' },
  { text: 'شهرياً', value: 'monthly' },
];

// Computed
const nextBackupTime = computed(() => {
  if (!autoBackupSettings.value.enabled) return 'معطل';

  const now = new Date();
  let next = new Date(now);

  switch (autoBackupSettings.value.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next.toLocaleDateString('ar-IQ');
});

// Methods
const createBackup = async () => {
  isCreatingBackup.value = true;

  try {
    const response = await axios.post('/api/backup/create', {
      name: backupName.value || 'نسخة احتياطية يدوية',
    });

    if (response.data.success) {
      successMessage.value = 'تم إنشاء النسخة الاحتياطية بنجاح';
      showSuccessMessage.value = true;
      backupName.value = '';
      await loadBackupHistory();
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'فشل في إنشاء النسخة الاحتياطية';
    showErrorMessage.value = true;
  } finally {
    isCreatingBackup.value = false;
  }
};

const restoreBackup = async () => {
  if (!restoreFile.value?.length || restoreConfirmation.value !== 'استعادة') {
    return;
  }

  isRestoring.value = true;

  try {
    const formData = new FormData();
    formData.append('backup', restoreFile.value[0]);

    const response = await axios.post('/api/backup/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      successMessage.value = 'تم استعادة النسخة الاحتياطية بنجاح';
      showSuccessMessage.value = true;
      showRestoreDialog.value = false;
      restoreFile.value = [];
      restoreConfirmation.value = '';
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'فشل في استعادة النسخة الاحتياطية';
    showErrorMessage.value = true;
  } finally {
    isRestoring.value = false;
  }
};

const loadBackupHistory = async () => {
  isLoadingHistory.value = true;

  try {
    const response = await axios.get('/api/backup/list');

    if (response.data.success) {
      backupHistory.value = response.data.data;
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'فشل في تحميل سجل النسخ الاحتياطي';
    showErrorMessage.value = true;
  } finally {
    isLoadingHistory.value = false;
  }
};

const downloadBackup = async (backup) => {
  try {
    const response = await axios.get(`/api/backup/download/${backup.id}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', backup.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    errorMessage.value = 'فشل في تحميل النسخة الاحتياطية';
    showErrorMessage.value = true;
  }
};

const deleteBackup = async (backup) => {
  if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
    return;
  }

  try {
    const response = await axios.delete(`/api/backup/${backup.id}`);

    if (response.data.success) {
      successMessage.value = 'تم حذف النسخة الاحتياطية بنجاح';
      showSuccessMessage.value = true;
      await loadBackupHistory();
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'فشل في حذف النسخة الاحتياطية';
    showErrorMessage.value = true;
  }
};

const saveAutoBackupSettings = async () => {
  try {
    await axios.put('/api/settings/bulk', {
      'backup.autoEnabled': autoBackupSettings.value.enabled,
      'backup.frequency': autoBackupSettings.value.frequency,
      'backup.maxFiles': autoBackupSettings.value.maxFiles,
    });
  } catch (err) {
    console.error('Failed to save auto backup settings:', err);
  }
};

// Utility functions
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Lifecycle
onMounted(() => {
  loadBackupHistory();
});
</script>

<style scoped>
.backup-settings {
  max-width: 100%;
}

.v-card-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.h-100 {
  height: 100%;
}
</style>
