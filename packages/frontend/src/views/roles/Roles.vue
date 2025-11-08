<template>
  <div>
    <!-- 🔹 شريط العنوان -->
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">إدارة الأدوار</div>
        <v-btn color="primary" prepend-icon="mdi-plus" variant="flat" @click="openForm()">
          دور جديد
        </v-btn>
      </div>
    </v-card>

    <!-- 🔹 جدول الأدوار -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="store.list"
        :loading="store.loading"
        density="comfortable"
      >
        <template #loading>
          <v-skeleton-loader type="table"></v-skeleton-loader>
        </template>

        <template #item.actions="{ item }">
          <div class="flex gap-2">
            <v-btn
              icon="mdi-pencil"
              size="small"
              color="primary"
              variant="text"
              @click="openForm(item)"
            />
            <v-btn
              icon="mdi-shield-check"
              size="small"
              color="secondary"
              variant="text"
              @click="openAssign(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              color="error"
              variant="text"
              @click="remove(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 🔹 نافذة إضافة / تعديل الدور -->
    <v-dialog v-model="showForm" max-width="500">
      <v-card elevation="10" rounded="lg">
        <v-card-title class="bg-secondary text-white">{{
          form.id ? 'تعديل دور' : 'دور جديد'
        }}</v-card-title>
        <v-card-text class="py-4">
          <v-text-field
            v-model="form.name"
            label="اسم الدور"
            variant="outlined"
            density="comfortable"
          />
          <v-textarea
            v-model="form.description"
            label="الوصف (اختياري)"
            variant="outlined"
            rows="2"
            density="comfortable"
          />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="justify-end">
          <v-btn color="primary" variant="elevated" :loading="saving" @click="save">حفظ</v-btn>
          <v-spacer />
          <v-btn variant="text" color="grey" @click="showForm = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 نافذة تعيين الصلاحيات -->
    <v-dialog v-model="showAssign" max-width="900">
      <v-card>
        <v-card-title class="bg-secondary text-white">
          <v-icon start>mdi-shield-check</v-icon>
          تعيين الصلاحيات: {{ activeRole?.name }}
        </v-card-title>

        <v-card-text>
          <!-- 🔸 مربع بحث داخلي -->
          <v-text-field
            v-model="search"
            label="بحث في الصلاحيات"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="mb-4"
          />

          <v-alert v-if="loadingPerms" type="info" variant="tonal">جاري تحميل الصلاحيات...</v-alert>

          <v-row v-else>
            <!-- 🔸 الصلاحيات المتاحة -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-primary text-h6">
                  <v-icon start>mdi-shield-plus-outline</v-icon> الصلاحيات المتاحة
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <v-expansion-panels multiple>
                    <v-expansion-panel
                      v-for="(group, resource) in filteredGroupedPermissions"
                      :key="resource"
                    >
                      <v-expansion-panel-title>
                        <v-icon start color="primary">mdi-folder-shield</v-icon>
                        {{ translateResource(resource) }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div class="flex flex-wrap gap-2">
                          <v-list>
                            <v-list-item v-for="perm in group" :key="perm.id">
                              <v-checkbox
                                v-model="selectedPermIds"
                                :value="perm.id"
                                :label="translatePermission(perm.name)"
                              />
                            </v-list-item>
                          </v-list>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 🔸 صلاحيات الدور الحالية -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-primary text-h6">
                  <v-icon start>mdi-shield-outline</v-icon> الصلاحيات الحالية
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <v-expansion-panels multiple>
                    <v-expansion-panel
                      v-for="(group, resource) in groupedRolePermissions"
                      :key="resource"
                    >
                      <v-expansion-panel-title>
                        <v-icon start color="primary">mdi-folder-shield</v-icon>
                        {{ translateResource(resource) }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-list>
                          <v-list-item v-for="perm in group" :key="perm.id">
                            <v-chip :color="getActionColor(perm.name)">
                              {{ translatePermission(perm.name) }}
                            </v-chip>
                          </v-list-item>
                        </v-list>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="justify-end">
          <v-btn color="primary" variant="elevated" :loading="assigning" @click="assign"
            >تعيين</v-btn
          >
          <v-spacer />
          <v-btn variant="text" color="grey" @click="showAssign = false">إلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRolesStore } from '@/stores/roles';
import { usePermissionsStore } from '@/stores/permissions';

const store = useRolesStore();
const permStore = usePermissionsStore();

// حالات التحكم
const showForm = ref(false);
const showAssign = ref(false);
const saving = ref(false);
const assigning = ref(false);
const loadingPerms = ref(false);
const activeRole = ref(null);
const search = ref('');
const snackbar = reactive({ show: false, text: '', color: 'success' });

// نموذج الدور
const form = reactive({ id: null, name: '', description: '' });

// الصلاحيات
const permissions = ref([]);
const rolePermissions = ref([]);
const selectedPermIds = ref([]);

const headers = [
  { title: 'المعرف', key: 'id', align: 'center' },
  { title: 'الاسم', key: 'name' },
  { title: 'الوصف', key: 'description' },
  { title: 'خيارات', key: 'actions', align: 'center', sortable: false },
];

// 🧠 دوال CRUD
function openForm(item) {
  if (item) Object.assign(form, item);
  else Object.assign(form, { id: null, name: '', description: '' });
  showForm.value = true;
}

async function save() {
  try {
    saving.value = true;
    if (form.id) await store.update(form.id, form);
    else await store.create(form);
    snackbar.text = 'تم حفظ الدور بنجاح ✅';
    snackbar.color = 'success';
    snackbar.show = true;
    showForm.value = false;
    await store.fetch();
  } catch {
    snackbar.text = 'حدث خطأ أثناء الحفظ ❌';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    saving.value = false;
  }
}

async function remove(item) {
  if (!confirm(`هل أنت متأكد من حذف ${item.name}؟`)) return;
  await store.remove(item.id);
  snackbar.text = 'تم الحذف بنجاح ✅';
  snackbar.color = 'success';
  snackbar.show = true;
  await store.fetch();
}

// 🧩 الصلاحيات
async function openAssign(role) {
  activeRole.value = role;
  showAssign.value = true;
  loadingPerms.value = true;
  await permStore.fetch();
  permissions.value = permStore.list;
  rolePermissions.value = await store.getPermissions(role.id);
  selectedPermIds.value = rolePermissions.value.map((p) => p.id);
  loadingPerms.value = false;
}

async function assign() {
  assigning.value = true;
  await store.assignPermissions(activeRole.value.id, selectedPermIds.value);
  rolePermissions.value = await store.getPermissions(activeRole.value.id);
  snackbar.text = 'تم تحديث صلاحيات الدور ✅';
  snackbar.color = 'success';
  snackbar.show = true;
  assigning.value = false;
}

// 🔹 ترجمة وتهيئة الصلاحيات
function translatePermission(name) {
  if (!name) return '';
  const [res, act] = name.split(':');
  const actions = {
    create: 'إنشاء',
    read: 'عرض',
    update: 'تعديل',
    delete: 'حذف',
    manage: 'إدارة',
  };
  return `${actions[act] || act} ${translateResource(res)}`;
}

function translateResource(res) {
  const map = {
    users: 'المستخدمين',
    roles: 'الأدوار',
    permissions: 'الصلاحيات',
    customers: 'العملاء',
    products: 'المنتجات',
    sales: 'المبيعات',
    categories: 'الفئات',
  };
  return map[res] || res;
}

function getActionColor(name) {
  const action = name.split(':')[1];
  return (
    {
      create: 'success',
      read: 'info',
      update: 'warning',
      delete: 'error',
      manage: 'secondary',
    }[action] || 'grey'
  );
}

// 🔹 Grouping Permissions
const groupedPermissions = computed(() => {
  const grouped = {};
  for (const perm of permissions.value) {
    const [resource] = perm.name.split(':');
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push(perm);
  }
  return grouped;
});

const filteredGroupedPermissions = computed(() => {
  if (!search.value) return groupedPermissions.value;
  const term = search.value.toLowerCase();
  const filtered = {};
  for (const [resource, perms] of Object.entries(groupedPermissions.value)) {
    const matches = perms.filter((p) => translatePermission(p.name).toLowerCase().includes(term));
    if (matches.length) filtered[resource] = matches;
  }
  return filtered;
});

const groupedRolePermissions = computed(() => {
  const grouped = {};
  for (const perm of rolePermissions.value) {
    const [resource] = perm.name.split(':');
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push(perm);
  }
  return grouped;
});

onMounted(async () => {
  await store.fetch();
});
</script>
