<template>
  <v-app>
    <!-- شريط التقدم أعلى الصفحة -->
    <UpdateNotification />
    <LoadingProgressBar />

    <router-view />
    <AppSnackbar />
    <AppErrorDialog />
    <CreateFirstUser />

    <!-- مكون التحميل المركزي -->
    <LoadingSpinner />
  </v-app>
</template>
<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import AppSnackbar from './components/AppSnackbar.vue';
import AppErrorDialog from './components/AppErrorDialog.vue';
import CreateFirstUser from './components/CreateFirstUser.vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import LoadingProgressBar from './components/LoadingProgressBar.vue';
import UpdateNotification from '@/components/UpdateNotification.vue';

const authStore = useAuthStore();

onMounted(async () => {
  // Check if user is logged in
  await authStore.checkAuth();
});
</script>

<style>
@import './styles/tailwind.css';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
