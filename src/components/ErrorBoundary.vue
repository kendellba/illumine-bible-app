<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary__container">
      <div class="error-boundary__icon">
        <svg
          class="w-16 h-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <div class="error-boundary__content">
        <h2 class="error-boundary__title">
          Something went wrong
        </h2>

        <p class="error-boundary__message">
          {{ userFriendlyMessage }}
        </p>

        <div v-if="showDetails" class="error-boundary__details">
          <h3 class="error-boundary__details-title">
            Technical Details
          </h3>
          <pre class="error-boundary__details-content">{{ errorDetails }}</pre>
        </div>

        <div class="error-boundary__actions">
          <button
            v-for="action in recoveryActions"
            :key="action.label"
            :class="[
              'error-boundary__action',
              action.primary ? 'error-boundary__action--primary' : 'error-boundary__action--secondary'
            ]"
            @click="action.action"
          >
            {{ action.label }}
          </button>

          <button
            v-if="!showDetails && isDevelopment"
            class="error-boundary__action error-boundary__action--secondary"
            @click="showDetails = true"
          >
            Show Details
          </button>
        </div>

        <div v-if="canReportError" class="error-boundary__report">
          <button
            class="error-boundary__report-button"
            @click="reportError"
            :disabled="isReporting"
          >
            <span v-if="isReporting">Reporting...</span>
            <span v-else>Report this error</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, onMounted } from 'vue'
import { useErrorHandler, type AppError, type ErrorRecoveryAction } from '@/composables/useErrorHandler'
import { useGlobalToast } from '@/composables/useToast'

interface Props {
  fallback?: boolean
  showReportButton?: boolean
  onError?: (error: AppError) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true,
  showReportButton: true
})

const emit = defineEmits<{
  error: [error: AppError]
  recovered: []
}>()

// Composables
const { handleError, getRecoveryActions, getUserFriendlyMessage } = useErrorHandler()
const toast = useGlobalToast()

// State
const hasError = ref(false)
const currentError = ref<AppError | null>(null)
const showDetails = ref(false)
const isReporting = ref(false)

// Computed
const isDevelopment = computed(() => import.meta.env.DEV)

const userFriendlyMessage = computed(() => {
  if (!currentError.value) return ''
  return getUserFriendlyMessage(currentError.value)
})

const errorDetails = computed(() => {
  if (!currentError.value) return ''

  return JSON.stringify({
    type: currentError.value.type,
    code: currentError.value.code,
    message: currentError.value.message,
    details: currentError.value.details,
    context: currentError.value.context,
    timestamp: currentError.value.timestamp
  }, null, 2)
})

const recoveryActions = computed((): ErrorRecoveryAction[] => {
  if (!currentError.value) return []

  const actions = getRecoveryActions(currentError.value)

  // Add default recovery actions
  actions.push({
    label: 'Reload Page',
    action: () => window.location.reload(),
    primary: !actions.some(a => a.primary)
  })

  return actions
})

const canReportError = computed(() => {
  return props.showReportButton && currentError.value && !isDevelopment.value
})

// Error handling
onErrorCaptured((error: Error, instance, info) => {
  console.error('Error captured by boundary:', error, info)

  const appError = handleError(error, `Component: ${info}`, {
    showNotification: false, // Don't show notification, we'll handle it here
    recoverable: true
  })

  handleErrorBoundary(appError)

  // Prevent the error from propagating further
  return false
})

// Handle unhandled promise rejections
onMounted(() => {
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason)

    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))

    const appError = handleError(error, 'Unhandled Promise Rejection', {
      showNotification: false,
      recoverable: true
    })

    handleErrorBoundary(appError)
  }

  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // Cleanup
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
})

/**
 * Handle error in boundary
 */
function handleErrorBoundary(error: AppError): void {
  hasError.value = true
  currentError.value = error

  // Emit error event
  emit('error', error)

  // Call custom error handler if provided
  if (props.onError) {
    props.onError(error)
  }

  // Show toast notification for non-critical errors
  if (error.recoverable) {
    toast.error('An error occurred', {
      title: 'Error',
      duration: 5000
    })
  }
}

/**
 * Recover from error
 */
function recover(): void {
  hasError.value = false
  currentError.value = null
  showDetails.value = false
  emit('recovered')
}

/**
 * Report error to external service
 */
async function reportError(): Promise<void> {
  if (!currentError.value || isReporting.value) return

  try {
    isReporting.value = true

    // In a real app, you would send this to an error reporting service
    // like Sentry, Bugsnag, or your own error tracking system
    console.log('Reporting error:', currentError.value)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success('Error reported successfully. Thank you for helping us improve!')

  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)
    toast.error('Failed to report error. Please try again later.')
  } finally {
    isReporting.value = false
  }
}

// Expose recovery function for parent components
defineExpose({
  recover,
  hasError,
  currentError
})
</script>

<style scoped>
.error-boundary {
  @apply min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900;
}

.error-boundary__container {
  @apply max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center;
}

.error-boundary__icon {
  @apply flex justify-center mb-4;
}

.error-boundary__content {
  @apply space-y-4;
}

.error-boundary__title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.error-boundary__message {
  @apply text-gray-600 dark:text-gray-300;
}

.error-boundary__details {
  @apply mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left;
}

.error-boundary__details-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.error-boundary__details-content {
  @apply text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32 whitespace-pre-wrap;
}

.error-boundary__actions {
  @apply flex flex-col sm:flex-row gap-2 justify-center;
}

.error-boundary__action {
  @apply px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.error-boundary__action--primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.error-boundary__action--secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500;
}

.error-boundary__report {
  @apply mt-4 pt-4 border-t border-gray-200 dark:border-gray-600;
}

.error-boundary__report-button {
  @apply text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
