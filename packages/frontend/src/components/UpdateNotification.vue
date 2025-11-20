<!-- filepath: packages/frontend/src/components/UpdateNotification.vue -->
<template>
  <v-snackbar
    v-model="show"
    :timeout="-1"
    color="primary"
    location="bottom"
    class="update-notification"
  >
    <div class="d-flex align-center ga-3" style="min-width: 340px">
      <!-- Icon -->
      <v-progress-circular
        v-if="stage === 'downloading'"
        :model-value="progress"
        :size="26"
        :width="3"
        color="white"
      />

      <v-icon v-else-if="stage === 'ready'">mdi-check-circle</v-icon>
      <v-icon v-else-if="stage === 'error'">mdi-alert-circle</v-icon>
      <v-icon v-else>mdi-download</v-icon>

      <!-- Text -->
      <div class="flex-grow-1">
        <div class="text-subtitle-2" style="font-weight: 600">
          {{ message }}
        </div>

        <div v-if="stage === 'downloading'" class="text-caption opacity-80 mt-1">
          {{ formatBytes(transferred) }} / {{ formatBytes(total) }} ({{ progress }}%)
        </div>

        <div v-if="stage === 'error'" class="text-caption opacity-80 mt-1">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Buttons -->
      <div class="d-flex ga-2">
        <!-- Start download -->
        <v-btn
          v-if="stage === 'available'"
          size="small"
          color="white"
          variant="flat"
          @click="startDownload"
        >
          تنزيل
        </v-btn>

        <!-- Retry on error -->
        <v-btn
          v-if="stage === 'error'"
          size="small"
          color="white"
          variant="flat"
          @click="startDownload"
        >
          إعادة المحاولة
        </v-btn>

        <!-- Install -->
        <v-btn
          v-if="stage === 'ready'"
          size="small"
          color="white"
          variant="flat"
          @click="installUpdate"
        >
          إعادة التشغيل
        </v-btn>
      </div>
    </div>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const show = ref(false);
const stage = ref('idle'); // available | downloading | ready | error
const progress = ref(0);
const transferred = ref(0);
const total = ref(0);
const message = ref('');
const errorMessage = ref('');

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/* Actions */
const startDownload = () => {
  window.electronAPI.invoke('update:download');
  stage.value = 'downloading';
  message.value = 'جاري تنزيل التحديث...';
};

const installUpdate = () => {
  window.electronAPI.invoke('update:install');
};

onMounted(() => {
  if (!window.electronAPI) return;

  // Update available
  window.electronAPI.onUpdateAvailable((data) => {
    show.value = true;
    stage.value = 'available';
    message.value = `تحديث متوفر: الإصدار ${data.version}`;
  });

  // Download starting
  window.electronAPI.onUpdateDownloading(() => {
    show.value = true;
    stage.value = 'downloading';
    progress.value = 0;
    message.value = 'جاري تنزيل التحديث...';
  });

  // Download progress
  window.electronAPI.onUpdateProgress((data) => {
    progress.value = Math.round(data.percent);
    transferred.value = data.transferred;
    total.value = data.total;
    message.value = `جاري تنزيل التحديث... ${progress.value}%`;
  });

  // Update ready to install
  window.electronAPI.onUpdateReady?.(() => {
    stage.value = 'ready';
    message.value = 'تم تنزيل التحديث — جاهز للتثبيت';
  });

  // Update error
  window.electronAPI.onUpdateError?.((msg) => {
    show.value = true;
    stage.value = 'error';
    errorMessage.value = msg;
    message.value = 'فشل تنزيل التحديث';
  });
});

onUnmounted(() => {
  window.electronAPI?.removeUpdateListeners?.();
});
</script>

<style scoped>
.update-notification :deep(.v-snackbar__content) {
  padding: 16px;
}
</style>
