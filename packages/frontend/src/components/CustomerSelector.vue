<template>
  <div class="customer-selector">
    <!-- عرض العميل المحدد -->
    <v-card v-if="selectedCustomer && !showSelector" class="mb-4" elevation="0" variant="outlined">
      <v-card-text class="pa-2">
        <div class="d-flex justify-space-between align-center">
          <div class="customer-info">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="ml-2">mdi-account</v-icon>
              <span class="text-h6 font-weight-bold">{{ selectedCustomer.name }}</span>
            </div>
            <div v-if="selectedCustomer.phone" class="text-body-2 text-grey-7">
              <v-icon size="small" class="ml-1">mdi-phone</v-icon>
              {{ selectedCustomer.phone }}
            </div>
            <div v-if="selectedCustomer.city" class="text-body-2 text-grey-7">
              <v-icon size="small" class="ml-1">mdi-map-marker</v-icon>
              {{ selectedCustomer.city }}
            </div>
          </div>
          <div class="customer-actions">
            <v-btn size="small" color="primary" variant="outlined" @click="showSelector = true">
              تغيير العميل
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- واجهة اختيار العميل -->
    <v-card v-if="showSelector || !selectedCustomer" class="pa-0" elevation="0">
      <v-card-text class="pa-0 px-3">
        <v-autocomplete
          v-model="internalValue"
          v-model:search="searchQuery"
          :items="displayItems"
          :loading="searchLoading"
          item-title="name"
          item-value="id"
          label="ابحث عن عميل أو أضف عميل جديد"
          prepend-inner-icon="mdi-magnify"
          clearable
          no-data-text="لا توجد نتائج"
          @update:search="onSearchInput"
          @update:model-value="onItemSelect"
        >
          <template #item="{ props: itemProps, item }">
            <!-- خيار إضافة عميل جديد -->
            <v-list-item
              v-if="item.raw.isNewCustomer"
              v-bind="itemProps"
              class="add-new-customer-item"
            >
              <template #prepend>
                <v-icon color="primary">mdi-account-plus</v-icon>
              </template>
              <template #title>
                <div class="font-weight-bold text-primary">
                  إضافة عميل جديد: "{{ item.raw.searchText }}"
                </div>
              </template>
            </v-list-item>

            <!-- خيار العميل الافتراضي -->
            <v-list-item
              v-else-if="item.raw.isDefault"
              v-bind="itemProps"
              class="default-customer-item"
            >
              <template #prepend>
                <v-icon color="grey">mdi-account-outline</v-icon>
              </template>
              <template #title>
                <div class="font-weight-bold">{{ item.raw.name }}</div>
              </template>
              <template #subtitle>
                <div class="text-caption">عميل افتراضي - مبيعات عامة</div>
              </template>
            </v-list-item>

            <!-- عميل موجود -->
            <v-list-item v-else v-bind="itemProps">
              <template #prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <template #title>
                <div class="font-weight-bold">{{ item.raw.name }}</div>
              </template>
              <template #subtitle>
                <div class="text-caption">
                  <span v-if="item.raw.phone">{{ item.raw.phone }}</span>
                  <span v-if="item.raw.city"> • {{ item.raw.city }}</span>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <!-- نموذج تفاصيل العميل الجديد -->
        <v-expand-transition>
          <v-form v-if="showNewCustomerForm" ref="newCustomerForm" class="mt-4">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <v-icon class="ml-1">mdi-account-plus</v-icon>
                تفاصيل العميل الجديد
              </div>

              <v-text-field
                v-model="newCustomerData.name"
                label="اسم العميل *"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account"
                required
              />

              <v-text-field
                v-model="newCustomerData.phone"
                label="رقم الهاتف"
                prepend-inner-icon="mdi-phone"
                type="tel"
              />

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newCustomerData.city"
                    label="المدينة"
                    prepend-inner-icon="mdi-map-marker"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newCustomerData.address"
                    label="العنوان"
                    prepend-inner-icon="mdi-home"
                  />
                </v-col>
              </v-row>

              <v-textarea
                v-model="newCustomerData.notes"
                label="ملاحظات"
                rows="2"
                auto-grow
                prepend-inner-icon="mdi-note-text"
              />

              <div class="d-flex justify-space-between mt-2">
                <v-btn variant="outlined" @click="cancelNewCustomer"> إلغاء </v-btn>
                <v-btn color="primary" @click="createNewCustomer" :loading="creatingCustomer">
                  <v-icon class="ml-1">mdi-check</v-icon>
                  حفظ العميل
                </v-btn>
              </div>
            </v-card>
          </v-form>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <!-- إشعار العميل المحدد -->
    <v-snackbar v-model="showNotification" :color="notificationColor" timeout="3000">
      <v-icon class="ml-2">{{ notificationIcon }}</v-icon>
      {{ notificationMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCustomerStore } from '@/stores/customer';

const props = defineProps({
  modelValue: {
    type: [Number, Object],
    default: null,
  },
  required: {
    type: Boolean,
    default: false,
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'customer-selected']);

const customerStore = useCustomerStore();

// Reactive data
const showSelector = ref(!props.modelValue);
const searchQuery = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const internalValue = ref(props.modelValue);
const selectedCustomer = ref(null);
const showNewCustomerForm = ref(false);

// New customer form
const newCustomerForm = ref(null);
const creatingCustomer = ref(false);
const newCustomerData = ref({
  name: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
});

// Notifications
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationColor = ref('success');
const notificationIcon = computed(() => {
  return notificationColor.value === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle';
});

// Validation rules
const rules = {
  required: (v) => !!v || 'هذا الحقل مطلوب',
};

// Computed
const displayItems = computed(() => {
  const items = [...searchResults.value];

  // إضافة خيار "إضافة عميل جديد" إذا كان هناك نص بحث
  if (searchQuery.value && searchQuery.value.length >= 2) {
    const exactMatch = searchResults.value.some(
      (c) => c.name.toLowerCase() === searchQuery.value.toLowerCase()
    );

    if (!exactMatch) {
      items.unshift({
        id: 'new-customer',
        name: `إضافة: ${searchQuery.value}`,
        isNewCustomer: true,
        searchText: searchQuery.value,
      });
    }
  }

  return items;
});

// Methods
const onSearchInput = async (query) => {
  if (!query || query.length < 2) {
    // Load initial list
    try {
      const response = await customerStore.fetchCustomers({ limit: 50 });
      searchResults.value = response.data || [];
    } catch (error) {
      console.error('خطأ في تحميل قائمة العملاء:', error);
    }
    return;
  }

  searchLoading.value = true;
  try {
    const response = await customerStore.fetchCustomers({
      search: query,
      limit: 20,
    });
    searchResults.value = response.data || [];
  } catch (error) {
    console.error('خطأ في البحث:', error);
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
};

const onItemSelect = (value) => {
  if (value === 'new-customer') {
    // فتح نموذج إضافة عميل جديد
    newCustomerData.value.name = searchQuery.value;
    showNewCustomerForm.value = true;
    internalValue.value = null;
  } else if (value) {
    // اختيار عميل موجود
    const customer = searchResults.value.find((c) => c.id === value);
    if (customer) {
      setSelectedCustomer(customer);
    }
  }
};

const setSelectedCustomer = (customer) => {
  selectedCustomer.value = customer;
  internalValue.value = customer.id;
  showSelector.value = false;
  showNewCustomerForm.value = false;

  // Emit events
  emit('update:modelValue', customer.id);
  emit('customer-selected', customer);

  // Show notification
  showSuccessNotification(`تم اختيار العميل: ${customer.name}`);
};

const createNewCustomer = async () => {
  // Check if form ref exists
  if (!newCustomerForm.value) {
    console.error('Form reference is not available');
    showErrorNotification('حدث خطأ في النموذج');
    return;
  }

  // Validate form
  const { valid } = await newCustomerForm.value.validate();
  if (!valid) {
    console.warn('Form validation failed');
    return;
  }

  // Check if name is provided
  if (!newCustomerData.value.name || newCustomerData.value.name.trim() === '') {
    console.error('Customer name is required');
    showErrorNotification('اسم العميل مطلوب');
    return;
  }

  // Check if phone number already exists
  if (newCustomerData.value.phone && newCustomerData.value.phone.trim() !== '') {
    const phoneExists = searchResults.value.some(
      (customer) => customer.phone === newCustomerData.value.phone.trim()
    );

    if (phoneExists) {
      showErrorNotification('رقم الهاتف مستخدم بالفعل من قبل عميل آخر');
      return;
    }
  }

  creatingCustomer.value = true;

  try {
    const response = await customerStore.createCustomer(newCustomerData.value);

    // Check if response is valid
    if (!response || !response.data) {
      throw new Error('Invalid response from server');
    }

    const newCustomer = response.data;

    // Add to search results and select
    searchResults.value.unshift(newCustomer);
    setSelectedCustomer(newCustomer);

    // Reset form
    resetNewCustomerForm();

    showSuccessNotification(`تم إضافة العميل: ${newCustomer.name}`);
  } catch (error) {
    console.error('خطأ في إضافة العميل:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Handle specific error messages
    let errorMessage = 'فشل في إضافة العميل الجديد';

    if (error.response?.data?.message) {
      const serverMessage = error.response.data.message;

      // Check for duplicate phone number error
      if (
        serverMessage.includes('phone number already exists') ||
        serverMessage.includes('Customer with this phone')
      ) {
        errorMessage = 'رقم الهاتف مستخدم بالفعل من قبل عميل آخر';
      } else {
        errorMessage = serverMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    showErrorNotification(errorMessage);
  } finally {
    creatingCustomer.value = false;
  }
};

const cancelNewCustomer = () => {
  showNewCustomerForm.value = false;
  resetNewCustomerForm();
  searchQuery.value = '';
};

const resetNewCustomerForm = () => {
  newCustomerData.value = {
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  };
  showNewCustomerForm.value = false;
  newCustomerForm.value?.resetValidation();
  searchQuery.value = '';
};

const showSuccessNotification = (message) => {
  notificationMessage.value = message;
  notificationColor.value = 'success';
  showNotification.value = true;
};

const showErrorNotification = (message) => {
  notificationMessage.value = message;
  notificationColor.value = 'error';
  showNotification.value = true;
};

// Watch for prop changes
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal;
    if (newVal && !selectedCustomer.value) {
      // Load customer data if ID is provided but customer object is not loaded
      loadCustomerById(newVal);
    } else if (!newVal) {
      selectedCustomer.value = null;
      showSelector.value = true;
    }
  }
);

const loadCustomerById = async (customerId) => {
  try {
    const customer = await customerStore.fetchCustomer(customerId);
    selectedCustomer.value = customer;
    showSelector.value = false;
  } catch (error) {
    console.error('خطأ في تحميل بيانات العميل:', error);
  }
};

// Initialize
onMounted(async () => {
  if (props.modelValue) {
    await loadCustomerById(props.modelValue);
  }

  // Load initial customer list for search
  try {
    const response = await customerStore.fetchCustomers({ limit: 50 });
    searchResults.value = response.data || [];
  } catch (error) {
    console.error('خطأ في تحميل قائمة العملاء:', error);
  }
});

// Expose methods
defineExpose({
  resetSelection: () => {
    selectedCustomer.value = null;
    internalValue.value = null;
    showSelector.value = true;
    showNewCustomerForm.value = false;
    emit('update:modelValue', null);
  },
});
</script>

<style scoped>
.customer-selector {
  width: 100%;
}

.customer-selector-card {
  border: 1px solid #dee2e6;
}

.customer-info {
  flex: 1;
}

.customer-actions {
  display: flex;
  gap: 8px;
}

.add-new-customer-item {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-top: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.default-customer-item {
  background-color: rgba(0, 0, 0, 0.02);
}

@media (max-width: 600px) {
  .quick-options .v-btn-toggle {
    width: 100%;
  }

  .quick-options .v-btn {
    flex: 1;
    font-size: 0.75rem;
  }
}
</style>
