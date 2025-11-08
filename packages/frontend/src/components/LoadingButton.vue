<template>
  <v-btn
    :disabled="isLoading || disabled"
    :loading="isLoading"
    v-bind="$attrs"
    @click="handleClick"
    :class="['loading-btn', { 'loading-btn--loading': isLoading }]"
  >
    <!-- محتوى الزر العادي -->
    <template v-if="!isLoading">
      <v-icon v-if="prependIcon" :icon="prependIcon" class="me-2" />
      <slot>{{ text }}</slot>
      <v-icon v-if="appendIcon" :icon="appendIcon" class="ms-2" />
    </template>

    <!-- محتوى التحميل -->
    <template v-else>
      <v-progress-circular :size="20" :width="2" indeterminate class="me-2" />
      <span>{{ loadingText }}</span>
    </template>
  </v-btn>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLoading } from '@/composables/useLoading';

// Props
const props = defineProps({
  // النص العادي للزر
  text: {
    type: String,
    default: '',
  },

  // نص التحميل
  loadingText: {
    type: String,
    default: 'جاري التحميل...',
  },

  // أيقونة البداية
  prependIcon: {
    type: String,
    default: null,
  },

  // أيقونة النهاية
  appendIcon: {
    type: String,
    default: null,
  },

  // تعطيل الزر
  disabled: {
    type: Boolean,
    default: false,
  },

  // دالة غير متزامنة للتنفيذ عند النقر
  asyncAction: {
    type: Function,
    default: null,
  },

  // إظهار التحميل تلقائياً عند التنفيذ
  autoLoading: {
    type: Boolean,
    default: true,
  },

  // الحد الأدنى لمدة التحميل
  minLoadingDuration: {
    type: Number,
    default: 300,
  },
});

// Events
const emit = defineEmits(['click', 'loading-start', 'loading-end', 'error']);

// State
const { withLoading } = useLoading();
const localLoading = ref(false);

// Computed
const isLoading = computed(() => localLoading.value);

/**
 * معالج النقر على الزر
 */
const handleClick = async (event) => {
  // إرسال حدث النقر العادي
  emit('click', event);

  // إذا كان هناك عمل غير متزامن
  if (props.asyncAction && typeof props.asyncAction === 'function') {
    if (props.autoLoading) {
      emit('loading-start');

      try {
        await withLoading(() => props.asyncAction(event), {
          showManual: false, // نستخدم التحميل المحلي
          minDuration: props.minLoadingDuration,
          onError: (error) => {
            emit('error', error);
          },
        });
      } catch (error) {
        // الخطأ تم التعامل معه في withLoading
        console.error('خطأ في تنفيذ العمل:', error);
      } finally {
        localLoading.value = false;
        emit('loading-end');
      }
    } else {
      // تنفيذ بدون تحميل تلقائي
      try {
        await props.asyncAction(event);
      } catch (error) {
        emit('error', error);
      }
    }
  }
};

/**
 * بدء التحميل يدوياً
 */
const startLoading = () => {
  localLoading.value = true;
  emit('loading-start');
};

/**
 * إيقاف التحميل يدوياً
 */
const stopLoading = () => {
  localLoading.value = false;
  emit('loading-end');
};

// تصدير الدوال للوصول إليها من المرجع
defineExpose({
  startLoading,
  stopLoading,
  isLoading,
});
</script>

<style scoped>
.loading-btn {
  transition: all 0.3s ease;
  position: relative;
}

.loading-btn--loading {
  pointer-events: none;
}

/* تأثير نبضة أثناء التحميل */
.loading-btn--loading::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid transparent;
  border-radius: inherit;
  background: linear-gradient(45deg, #1976d2, #42a5f5, #1976d2);
  background-size: 200% 200%;
  animation: loading-border 2s linear infinite;
  z-index: -1;
  opacity: 0.6;
}

@keyframes loading-border {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
