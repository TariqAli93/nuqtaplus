<template>
  <div>
    <!-- Header -->
    <v-card class="mb-4">
      <div class="pa-4 d-flex align-center">
        <v-icon size="32" color="primary" class="ml-3">mdi-information</v-icon>
        <div>
          <div class="text-h5 font-weight-bold">حول البرنامج</div>
          <div class="text-subtitle-2 text-medium-emphasis">معلومات عن النظام والشركة المطورة</div>
        </div>
      </div>
    </v-card>

    <v-row>
      <!-- معلومات البرنامج -->
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center bg-primary">
            <v-icon class="ml-2">mdi-application</v-icon>
            معلومات البرنامج
          </v-card-title>
          <v-card-text class="pt-4">
            <v-list density="comfortable">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-alpha-c-box</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">اسم البرنامج</v-list-item-title>
                <v-list-item-subtitle class="mt-1">CodeLIMS</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-text-box</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">الوصف</v-list-item-title>
                <v-list-item-subtitle class="mt-1">
                  نظام إدارة محاسبة و نقاط البيع والأقساط
                </v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-tag</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">الإصدار</v-list-item-title>
                <v-list-item-subtitle class="mt-1">1.0.0</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-calendar</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">تاريخ الإصدار</v-list-item-title>
                <v-list-item-subtitle class="mt-1">2025</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- معلومات الشركة المطورة -->
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center bg-primary">
            <v-icon class="ml-2">mdi-domain</v-icon>
            الشركة المطورة
          </v-card-title>
          <v-card-text class="pt-4">
            <v-list density="comfortable">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-office-building</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">اسم الشركة</v-list-item-title>
                <v-list-item-subtitle class="mt-1">
                  شركة كــــــــــودل للحلول البرمجية
                </v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-account-tie</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">المدير التنفيذي</v-list-item-title>
                <v-list-item-subtitle class="mt-1">طارق علي محمد</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-map-marker</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">العنوان</v-list-item-title>
                <v-list-item-subtitle class="mt-1">العراق - بغداد - الدورة</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- معلومات التواصل -->
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center bg-primary">
            <v-icon class="ml-2">mdi-phone</v-icon>
            معلومات التواصل
          </v-card-title>
          <v-card-text class="pt-4">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" class="text-center pa-4">
                  <v-icon size="40" color="primary" class="mb-2">mdi-phone</v-icon>
                  <div class="text-subtitle-2 text-medium-emphasis mb-2">رقم الهاتف</div>
                  <div class="text-body-1 font-weight-bold text-center" dir="ltr">
                    <a
                      href="tel:+9647884841993"
                      class="text-decoration-none"
                      @click.prevent="openExternal('tel:+9647884841993')"
                      >+964 788 484 1993</a
                    >
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" class="text-center pa-4">
                  <v-icon size="40" color="success" class="mb-2">mdi-whatsapp</v-icon>
                  <div class="text-subtitle-2 text-medium-emphasis mb-2">واتساب</div>
                  <div class="text-body-1 font-weight-bold text-center" dir="ltr">
                    <a
                      target="_blank"
                      href="https://wa.me/9647884841993"
                      @click.prevent="openExternal('https://wa.me/9647884841993')"
                    >
                      +964 788 484 1993
                    </a>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" class="text-center pa-4">
                  <v-icon size="40" color="info" class="mb-2">mdi-email</v-icon>
                  <div class="text-subtitle-2 text-medium-emphasis mb-2">البريد الإلكتروني</div>
                  <div class="text-body-1 text-center font-weight-bold" dir="rtl">
                    <a
                      href="mailto:tariqali9300@gmail.com"
                      class="text-center"
                      style="font-size: 0.85rem"
                      @click.prevent="openExternal('mailto:tariqali9300@gmail.com')"
                    >
                      tariqali9300@gmail.com
                    </a>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" class="text-center pa-4">
                  <v-icon size="40" color="primary" class="mb-2">mdi-facebook</v-icon>
                  <div class="text-subtitle-2 text-medium-emphasis mb-2">فيسبوك</div>
                  <div class="text-body-1 font-weight-bold">
                    <a
                      href="https://facebook.com/TariqAli9300"
                      target="_blank"
                      class="text-decoration-none"
                      @click.prevent="openExternal('https://facebook.com/TariqAli9300')"
                    >
                      Tariq Ali
                    </a>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- الترخيص وحقوق النشر -->
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center pa-6">
            <v-icon size="60" color="primary" class="mb-4">mdi-shield-check</v-icon>
            <div class="text-h6 font-weight-bold mb-2">حقوق النشر والاستخدام</div>
            <div class="text-body-1 text-medium-emphasis mb-3">
              جميع الحقوق محفوظة © 2025 - شركة كــــــــــودل للحلول البرمجية
            </div>
            <div class="text-body-2 text-medium-emphasis">
              هذا البرنامج محمي بموجب قوانين حقوق الملكية الفكرية. يُمنع نسخ أو توزيع أو تعديل
              البرنامج دون الحصول على إذن كتابي من الشركة المطورة.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const openExternal = (url) => {
  window.electronAPI.openExternal(url);
};
</script>

<style scoped>
a {
  color: inherit;
}
a:hover {
  opacity: 0.7;
}
</style>
