<template>
  <div>
    <!-- Header -->
    <!-- 🔹 شريط الأدوات العلوي -->
    <v-card class="mb-4 d-flex justify-space-between align-center">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">الاعدادات</div>
      </div>

      <v-tabs v-model="activeTab" align-tabs="start">
        <v-tab value="company">
          <v-icon start>mdi-domain</v-icon>
          معلومات الشركة
        </v-tab>
        <v-tab value="currency">
          <v-icon start>mdi-currency-usd</v-icon>
          إعدادات العملة
        </v-tab>
        <v-tab value="backup">
          <v-icon start>mdi-backup-restore</v-icon>
          النسخ الاحتياطي
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Error Alert -->
    <v-alert
      v-if="settingsStore.error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="settingsStore.clearError"
    >
      {{ settingsStore.error }}
    </v-alert>

    <!-- Settings Tabs -->
    <v-card class="mb-4"> </v-card>

    <v-window v-model="activeTab">
      <!-- Company Information Tab -->
      <v-window-item value="company" class="pa-0">
        <CompanyInfoForm :data="settingsStore.companyInfo" />
      </v-window-item>

      <!-- Currency Settings Tab -->
      <v-window-item value="currency" class="pa-0">
        <CurrencySettings />
      </v-window-item>

      <!-- Backup Tab -->
      <v-window-item value="backup">
        <BackupSettings />
      </v-window-item>
    </v-window>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccessMessage" color="success" timeout="3000" location="top">
      <v-icon start>mdi-check-circle</v-icon>
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '../stores/settings';
import CompanyInfoForm from '../components/settings/CompanyInfoForm.vue';
import CurrencySettings from '../components/settings/CurrencySettings.vue';
import BackupSettings from '../components/settings/BackupSettings.vue';

// Stores
const settingsStore = useSettingsStore();

// State
const activeTab = ref('company');
const showSuccessMessage = ref(false);
const successMessage = ref('');
</script>
