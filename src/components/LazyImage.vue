<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLazyImage } from '@/composables/useLazyLoading'

interface Props {
  src: string
  alt: string
  placeholder?: string
  fallback?: string
  width?: number | string
  height?: number | string
  class?: string
  loading?: 'lazy' | 'eager'
  rootMargin?: string
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  fallback: '',
  loading: 'lazy',
  rootMargin: '50px',
  threshold: 0.1
})

const imageRef = ref<HTMLElement>()

const {
  isLoading,
  isLoaded,
  hasError,
  currentSrc,
  observe,
  retry
} = useLazyImage(props.src, {
  rootMargin: props.rootMargin,
  threshold: props.threshold,
  once: true
})

onMounted(() => {
  if (imageRef.value) {
    observe(imageRef.value)
  }
})

const imageStyles = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))
</script>

<template>
  <div
    ref="imageRef"
    class="lazy-image-container relative overflow-hidden"
    :class="props.class"
    :style="imageStyles"
  >
    <!-- Loading placeholder -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
      :style="imageStyles"
    >
      <div class="animate-pulse">
        <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>

    <!-- Placeholder image -->
    <img
      v-if="placeholder && !isLoaded && !isLoading"
      :src="placeholder"
      :alt="alt"
      class="w-full h-full object-cover"
      :style="imageStyles"
    />

    <!-- Main image -->
    <img
      v-if="currentSrc && isLoaded && !hasError"
      :src="currentSrc"
      :alt="alt"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="{ 'opacity-100': isLoaded, 'opacity-0': !isLoaded }"
      :style="imageStyles"
      :loading="loading"
    />

    <!-- Error state with fallback -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
      :style="imageStyles"
    >
      <template v-if="fallback">
        <img
          :src="fallback"
          :alt="alt"
          class="w-full h-full object-cover"
          :style="imageStyles"
        />
      </template>
      <template v-else>
        <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-xs text-center">Failed to load image</span>
        <button
          @click="retry"
          class="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.lazy-image-container {
  background-color: theme('colors.gray.100');
}

.dark .lazy-image-container {
  background-color: theme('colors.gray.800');
}

/* Smooth loading animation */
.lazy-image-container img {
  transition: opacity 0.3s ease-in-out;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .lazy-image-container img {
    transition: none;
  }

  .animate-pulse {
    animation: none;
  }
}
</style>
