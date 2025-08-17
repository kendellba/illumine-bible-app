<template>
  <div
    v-if="visible"
    :class="[
      'loading-indicator',
      `loading-indicator--${variant}`,
      {
        'loading-indicator--overlay': overlay,
        'loading-indicator--fullscreen': fullscreen
      }
    ]"
  >
    <div class="loading-indicator__content">
      <!-- Spinner -->
      <div
        v-if="showSpinner"
        :class="[
          'loading-indicator__spinner',
          `loading-indicator__spinner--${size}`
        ]"
      >
        <svg
          class="loading-indicator__spinner-svg"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            class="loading-indicator__spinner-track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
          />
          <circle
            class="loading-indicator__spinner-progress"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            :stroke-dasharray="progress !== undefined ? `${progress * 0.628} 62.8` : undefined"
          />
        </svg>
      </div>

      <!-- Progress Bar -->
      <div
        v-if="showProgressBar && progress !== undefined"
        class="loading-indicator__progress-bar"
      >
        <div class="loading-indicator__progress-bar-track">
          <div
            class="loading-indicator__progress-bar-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="loading-indicator__progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>

      <!-- Message -->
      <div
        v-if="message"
        class="loading-indicator__message"
      >
        {{ message }}
      </div>

      <!-- Cancel Button -->
      <button
        v-if="cancellable && onCancel"
        class="loading-indicator__cancel"
        @click="handleCancel"
        :disabled="cancelling"
      >
        <span v-if="cancelling">Cancelling...</span>
        <span v-else>Cancel</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  visible?: boolean
  message?: string
  progress?: number
  variant?: 'default' | 'minimal' | 'detailed'
  size?: 'small' | 'medium' | 'large'
  overlay?: boolean
  fullscreen?: boolean
  cancellable?: boolean
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  variant: 'default',
  size: 'medium',
  overlay: false,
  fullscreen: false,
  cancellable: false
})

const emit = defineEmits<{
  cancel: []
}>()

// State
const cancelling = ref(false)

// Computed
const showSpinner = computed(() => {
  return props.variant !== 'minimal' || props.progress === undefined
})

const showProgressBar = computed(() => {
  return props.variant === 'detailed' && props.progress !== undefined
})

// Methods
async function handleCancel(): Promise<void> {
  if (cancelling.value) return

  try {
    cancelling.value = true

    if (props.onCancel) {
      await props.onCancel()
    }

    emit('cancel')
  } catch (error) {
    console.error('Error during cancellation:', error)
  } finally {
    cancelling.value = false
  }
}
</script>

<style scoped>
.loading-indicator {
  @apply flex items-center justify-center;
}

.loading-indicator--overlay {
  @apply absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50;
}

.loading-indicator--fullscreen {
  @apply fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50;
}

.loading-indicator__content {
  @apply flex flex-col items-center space-y-4 p-6;
}

.loading-indicator--minimal .loading-indicator__content {
  @apply p-2 space-y-2;
}

/* Spinner Styles */
.loading-indicator__spinner {
  @apply relative;
}

.loading-indicator__spinner--small {
  @apply w-6 h-6;
}

.loading-indicator__spinner--medium {
  @apply w-8 h-8;
}

.loading-indicator__spinner--large {
  @apply w-12 h-12;
}

.loading-indicator__spinner-svg {
  @apply w-full h-full;
}

.loading-indicator__spinner-track {
  @apply text-gray-200 dark:text-gray-700;
}

.loading-indicator__spinner-progress {
  @apply text-blue-600 dark:text-blue-400;
  animation: spin 1s linear infinite;
  transform-origin: center;
  stroke-dasharray: 31.4 31.4;
  stroke-dashoffset: 31.4;
}

/* Progress Bar Styles */
.loading-indicator__progress-bar {
  @apply w-full max-w-xs space-y-2;
}

.loading-indicator__progress-bar-track {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.loading-indicator__progress-bar-fill {
  @apply h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out;
}

.loading-indicator__progress-text {
  @apply text-sm text-center text-gray-600 dark:text-gray-400 font-medium;
}

/* Message Styles */
.loading-indicator__message {
  @apply text-center text-gray-700 dark:text-gray-300 font-medium;
}

.loading-indicator--minimal .loading-indicator__message {
  @apply text-sm;
}

.loading-indicator--detailed .loading-indicator__message {
  @apply text-lg;
}

/* Cancel Button Styles */
.loading-indicator__cancel {
  @apply px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
         hover:text-gray-800 dark:hover:text-gray-200
         border border-gray-300 dark:border-gray-600
         rounded-md hover:bg-gray-50 dark:hover:bg-gray-700
         transition-colors duration-200
         disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Animations */
@keyframes spin {
  from {
    stroke-dashoffset: 31.4;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-indicator__spinner-progress {
    animation: none;
  }

  .loading-indicator__progress-bar-fill {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .loading-indicator__spinner-track {
    @apply text-gray-400;
  }

  .loading-indicator__spinner-progress {
    @apply text-blue-800;
  }

  .loading-indicator__progress-bar-track {
    @apply bg-gray-400;
  }

  .loading-indicator__progress-bar-fill {
    @apply bg-blue-800;
  }
}
</style>
