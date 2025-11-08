<template>
  <div>
    <v-card class="mb-4">
      <div class="flex justify-space-between items-center pa-3">
        <div class="text-h6 font-semibold text-primary">
          {{ isEdit ? 'تعديل منتج' : 'منتج جديد' }}
        </div>
        <v-btn color="primary" @click="router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </div>
    </v-card>

    <v-card>
      <v-card-text>
        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="اسم المنتج"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.sku"
                label="رمز المنتج"
                :append-inner-icon="'mdi-refresh'"
                @click:append-inner="regenerateSKU"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.categoryId"
                :items="categories"
                item-title="name"
                item-value="id"
                label="التصنيف"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.barcode"
                label="قراءة الباركود"
                prepend-inner-icon="mdi-barcode-scan"
                autofocus
                clearable
                class="mb-4"
                @keyup.enter="handleBarcodeScan"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.costPrice"
                label="سعر التكلفة"
                type="number"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.sellingPrice"
                label="سعر البيع"
                type="number"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="formData.currency"
                :items="['USD', 'IQD']"
                label="العملة"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="formData.stock"
                label="المخزون"
                type="number"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="formData.minStock"
                label="الحد الأدنى للمخزون"
                type="number"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="formData.status"
                :items="statusOptions"
                label="الحالة"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="formData.description" label="الوصف" rows="3"></v-textarea>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex gap-2">
            <v-btn type="submit" color="primary" :loading="loading">حفظ</v-btn>
            <v-btn @click="$router.back()">إلغاء</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProductStore } from '@/stores/product';
import { useCategoryStore } from '@/stores/category';

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

const form = ref(null);
const loading = ref(false);
const categories = ref([]);
const formData = ref({
  name: '',
  sku: '',
  barcode: '',
  categoryId: null,
  description: '',
  costPrice: 0,
  sellingPrice: 0,
  currency: 'USD',
  stock: 0,
  minStock: 0,
  status: 'available',
});

const statusOptions = [
  { title: 'متاح', value: 'available' },
  { title: 'نفذ', value: 'out_of_stock' },
  { title: 'متوقف', value: 'discontinued' },
];

const isEdit = computed(() => !!route.params.id);

const rules = {
  required: (v) => !!v || 'هذا الحقل مطلوب',
};

// دالة لتحويل النص العربي إلى SKU
const generateSKU = (name) => {
  if (!name) return '';

  // خريطة تحويل الأحرف العربية إلى إنجليزية
  const arabicToEnglish = {
    ا: 'a',
    أ: 'a',
    إ: 'a',
    آ: 'a',
    ب: 'b',
    ت: 't',
    ث: 'th',
    ج: 'j',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'dh',
    ر: 'r',
    ز: 'z',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'd',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ك: 'k',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ه: 'h',
    و: 'w',
    ي: 'y',
    ى: 'y',
    ة: 'h',
    ء: 'a',
  };

  let sku = name
    .toLowerCase()
    .trim()
    // تحويل الأحرف العربية
    .split('')
    .map((char) => arabicToEnglish[char] || char)
    .join('')
    // إزالة المسافات والرموز وتحويلها إلى شرطات
    .replace(/[^a-z0-9]/g, '-')
    // إزالة الشرطات المتتالية
    .replace(/-+/g, '-')
    // إزالة الشرطات من البداية والنهاية
    .replace(/^-|-$/g, '');

  return sku.toUpperCase();
};

// دالة تجديد SKU يدوياً
const regenerateSKU = () => {
  if (formData.value.name) {
    formData.value.sku = generateSKU(formData.value.name);
  }
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    if (isEdit.value) {
      await productStore.updateProduct(route.params.id, formData.value);
    } else {
      await productStore.createProduct(formData.value);
    }
    router.push({ name: 'Products' });
  } catch (error) {
    console.error('Error saving product:', error);
  } finally {
    loading.value = false;
  }
};

const handleBarcodeScan = () => {
  const code = formData.value?.barcode?.trim();
  if (!code) return;
};

// مراقبة تغيير اسم المنتج وتوليد SKU تلقائياً
watch(
  () => formData.value.name,
  (newName) => {
    if (newName && !isEdit.value) {
      // فقط للمنتجات الجديدة
      formData.value.sku = generateSKU(newName);
    }
  }
);

onMounted(async () => {
  const response = await categoryStore.fetchCategories();
  categories.value = response.data;

  if (isEdit.value) {
    loading.value = true;
    try {
      await productStore.fetchProduct(route.params.id);
      formData.value = { ...productStore.currentProduct };
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      loading.value = false;
    }
  }
});
</script>
