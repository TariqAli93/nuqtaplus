<script setup>
import { ref, onMounted } from 'vue';
import api from '@/plugins/axios';
import { useRouter } from 'vue-router';
import { useSimpleLoading } from '@/composables/useLoading';

const router = useRouter();

const backups = ref([]);
const { isLoading, startLoading, stopLoading } = useSimpleLoading();
const snackbar = ref(false);
const snackbarMsg = ref('');
const snackbarColor = ref('primary');

const createBackup = async () => {
  startLoading();
  try {
    await api.post('/settings/backups', {});
    snackbarMsg.value = 'تم إنشاء النسخة الاحتياطية بنجاح.';
    snackbar.value = true;
    snackbarColor.value = 'success';
    await load();
  } catch (error) {
    snackbarMsg.value = 'فشل في إنشاء النسخة الاحتياطية.';
    snackbar.value = true;
    snackbarColor.value = 'error';
  } finally {
    stopLoading();
  }
};

const load = async () => {
  startLoading();
  try {
    const response = await api.get('/settings/backups');
    backups.value = response.data;
  } catch (error) {
    snackbarMsg.value = 'فشل في تحميل قائمة النسخ الاحتياطية.';
    snackbar.value = true;
  } finally {
    stopLoading();
  }
};

const deleteBackup = async (filename) => {
  startLoading();
  try {
    await api.delete(`/settings/backups/${filename}`);
    snackbarMsg.value = 'تم حذف النسخة الاحتياطية بنجاح.';
    snackbar.value = true;
    snackbarColor.value = 'success';
    await load();
  } catch (error) {
    snackbarMsg.value = 'فشل في حذف النسخة الاحتياطية.';
    snackbar.value = true;
    snackbarColor.value = 'error';
  } finally {
    stopLoading();
  }
};

const restoreBackup = async (id) => {
  startLoading();
  try {
    await window.electronAPI.stopBackend();
    await api.get(`/settings/backups/${id}/restore`);
    snackbarMsg.value = 'تم استعادة النسخة الاحتياطية بنجاح.';
    snackbar.value = true;
    snackbarColor.value = 'success';
    await window.electronAPI.startBackend();

    // إعادة تحميل التطبيق بعد الاستعادة
    setTimeout(() => {
      window.location.reload();
      router.push('/');
    }, 2000);
  } catch (error) {
    snackbarMsg.value = 'فشل في استعادة النسخة الاحتياطية.';
    snackbar.value = true;
    snackbarColor.value = 'error';
  } finally {
    stopLoading();
  }
};

const toYmd = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const headers = [
  { title: 'اسم الملف', value: 'filename' },
  { title: 'الحجم', value: 'sizeReadable' },
  { title: 'تاريخ الإنشاء', value: 'createdAt' },
  { title: 'الإجراء', value: 'actions', sortable: false },
];

onMounted(async () => {
  await load();
});
</script>

<template>
  <v-card elevation="0">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="text-h6 font-weight-bold">📦 إدارة نسخ قاعدة البيانات الاحتياطية</div>
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-database-export-outline"
        @click="createBackup"
      >
        إنشاء نسخة احتياطية
      </v-btn>
    </v-card-title>

    <v-divider class="my-3"></v-divider>

    <v-card-text>
      <v-skeleton-loader v-if="isLoading" type="table" class="mx-auto" />

      <v-alert v-else-if="backups.length === 0" type="info" variant="tonal" class="text-center">
        لا توجد نسخ احتياطية حتى الآن.
      </v-alert>

      <v-data-table v-else :headers="headers" :items="backups">
        <template #item.createdAt="{ item }">
          {{ toYmd(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon small color="error" variant="text" @click="deleteBackup(item.filename)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>

          <v-btn icon small color="error" variant="text" @click="restoreBackup(item.filename)">
            <v-icon>mdi-restore</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>

    <v-divider class="my-3"></v-divider>

    <v-card-actions>
      <v-btn variant="outlined" prepend-icon="mdi-refresh" color="primary" @click="load">
        تحديث القائمة
      </v-btn>
    </v-card-actions>
  </v-card>

  <!-- Snackbar -->
  <v-snackbar v-model="snackbar" :timeout="4000" location="top" :color="snackbarColor">
    {{ snackbarMsg }}
    <template #actions>
      <v-btn color="white" variant="text" @click="snackbar = false">إغلاق</v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped></style>
