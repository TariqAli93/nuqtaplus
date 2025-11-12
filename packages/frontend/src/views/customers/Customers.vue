<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">إدارة العملاء</div>
        <v-btn color="primary" prepend-icon="mdi-plus" to="/customers/new"> عميل جديد </v-btn>
      </div>
    </v-card>

    <v-card>
      <div class="pa-4 flex justify-lg-space-between items-center gap-4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="البحث عن عميل"
          single-line
          hide-details
          @input="handleSearch"
          density="comfortable"
        ></v-text-field>
      </div>
    </v-card>

    <v-card class="mt-4">
      <v-data-table
        :headers="headers"
        :items="customerStore.customers"
        :loading="customerStore.loading"
        :items-per-page="10"
      >
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            :to="`/customers/${item.id}/edit`"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-secondary text-white">تأكيد الحذف</v-card-title>
        <v-card-text> هل أنت متأكد من حذف العميل {{ selectedCustomer?.name }}؟ </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn color="error" variant="elevated" @click="handleDelete" :loading="deleting"
            >حذف</v-btn
          >
          <v-spacer />
          <v-btn @click="deleteDialog = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCustomerStore } from '@/stores/customer';

const customerStore = useCustomerStore();

const search = ref('');
const deleteDialog = ref(false);
const selectedCustomer = ref(null);
const deleting = ref(false);

const headers = [
  { title: 'الاسم', key: 'name' },
  { title: 'الهاتف', key: 'phone' },
  { title: 'المدينة', key: 'city' },
  { title: 'إجراءات', key: 'actions', sortable: false },
];

const handleSearch = () => {
  customerStore.fetchCustomers({ search: search.value });
};

const confirmDelete = (customer) => {
  selectedCustomer.value = customer;
  deleteDialog.value = true;
};

const handleDelete = async () => {
  deleting.value = true;
  try {
    await customerStore.deleteCustomer(selectedCustomer.value.id);
    deleteDialog.value = false;
  } catch (error) {
    console.error('Error deleting customer:', error);
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  customerStore.fetchCustomers();
});
</script>
