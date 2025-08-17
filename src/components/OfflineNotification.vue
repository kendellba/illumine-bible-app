<template>
  <Transition
    name="slide-down"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div
      v-if="shouldShowNotification"
      class="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white px-4 py-3 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center space-x-3">
          <!-- Offline Icon -->
          <svg
            v-if="!isOnline"
            class="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.366zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- Sync Icon -->
          <svg
            v-else-if="hasPendingSync"
            class="w-5 h-5 flex-shrink-0 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>

          <!-- Success Icon -->
          <svg
            v-else-if="showSyncSuccess"
            class="w-5 h-5 flex-shrink-0 text-green-300"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- Message -->
          <div class="flex-1">
            <p class="text-sm font-medium">
              {{ notificationMessage }}
            </p>
            <p v-if="notificationSubtext" class="text-xs opacity-90 mt-1">
              {{ notificationSubtext }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2 ml-4">
          <!-- Retry Button -->
          <button
            v-if="showRetryButton"
            @click="handleRetry"
            class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            :disabled="isRetrying"
          >
            <span v-if="isRetrying" class="flex items-center space-x-1">
              <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retrying...</span>
            </span>
            <span v-else>Retry Sync</span>
          </button>

          <!-- Dismiss Button -->
          <button
            v-if="isDismissible"
            @click="dismiss"
            class="text-white/80 hover:text-white p-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Dismiss notification"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { backgroundSyncService } from '@/services/backgroundSyncService'
import { syncService } from '@/services/syncService'

// Props
interface Props {
  autoHide?: boolean
  autoHideDelay?: number
  showSyncStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoHide: true,
  autoHideDelay: 5000,
  showSyncStatus: true
})

// Store
const appStore = useAppStore()

// Local state
const isDismissed = ref(false)
const showSyncSuccess = ref(false)
const isRetrying = ref(false)
const hasPendingSync = ref(false)
const syncStats = ref({
  pendingOperations: 0,
  failedOperations: 0
})

// Auto-hide timer
let autoHideTimer: NodeJS.Timeout | null = null

// Computed properties
const isOnline = computed(() => appStore.isOnline)

const shouldShowNotification = computed(() => {
  if (isDismissed.value) return false

  return !isOnline.value ||
         (props.showSyncStatus && (hasPendingSync.value || showSyncSuccess.value)) ||
         syncStats.value.failedOperations > 0
})

const notificationMessage = computed(() => {
  if (!isOnline.value) {
    return 'You are currently offline'
  }

  if (syncStats.value.failedOperations > 0) {
    return `${syncStats.value.failedOperations} sync operation${syncStats.value.failedOperations > 1 ? 's' : ''} failed`
  }

  if (hasPendingSync.value) {
    return 'Syncing your data...'
  }

  if (showSyncSuccess.value) {
    return 'All data synced successfully'
  }

  return ''
})

const notificationSubtext = computed(() => {
  if (!isOnline.value) {
    return 'Your changes will be saved locally and synced when you reconnect'
  }

  if (syncStats.value.failedOperations > 0) {
    return 'Tap "Retry Sync" to try again'
  }

  if (hasPendingSync.value && syncStats.value.pendingOperations > 0) {
    return `${syncStats.value.pendingOperations} operation${syncStats.value.pendingOperations > 1 ? 's' : ''} remaining`
  }

  return ''
})

const showRetryButton = computed(() => {
  return isOnline.value && syncStats.value.failedOperations > 0
})

const isDismissible = computed(() => {
  return isOnline.value && !hasPendingSync.value
})

// Methods
async function handleRetry(): Promise<void> {
  if (isRetrying.value) return

  try {
    isRetrying.value = true

    // Retry failed sync operations
    await backgroundSyncService.retryFailedOperations()

    // Also retry regular sync operations
    await syncService.retryFailedOperations()

    // Update stats
    await updateSyncStats()

  } catch (error) {
    console.error('Failed to retry sync operations:', error)
    appStore.addNotification('error', 'Failed to retry sync operations')
  } finally {
    isRetrying.value = false
  }
}

function dismiss(): void {
  isDismissed.value = true
  clearAutoHideTimer()
}

function clearAutoHideTimer(): void {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
}

function startAutoHideTimer(): void {
  if (!props.autoHide) return

  clearAutoHideTimer()
  autoHideTimer = setTimeout(() => {
    if (isDismissible.value) {
      dismiss()
    }
  }, props.autoHideDelay)
}

async function updateSyncStats(): Promise<void> {
  try {
    const [bgStats, regularPending, regularFailed] = await Promise.all([
      backgroundSyncService.getSyncStats(),
      syncService.getPendingOperations(),
      syncService.getFailedOperations()
    ])

    syncStats.value = {
      pendingOperations: bgStats.pendingOperations + regularPending.length,
      failedOperations: bgStats.failedOperations + regularFailed.length
    }

    hasPendingSync.value = syncStats.value.pendingOperations > 0

  } catch (error) {
    console.error('Failed to update sync stats:', error)
  }
}

function showSuccessMessage(): void {
  showSyncSuccess.value = true
  startAutoHideTimer()

  // Hide success message after a delay
  setTimeout(() => {
    showSyncSuccess.value = false
  }, 3000)
}

// Watchers
watch(isOnline, (newValue, oldValue) => {
  if (!oldValue && newValue) {
    // Just came back online
    isDismissed.value = false
    updateSyncStats()
  } else if (oldValue && !newValue) {
    // Just went offline
    isDismissed.value = false
    clearAutoHideTimer()
  }
})

watch(shouldShowNotification, (newValue) => {
  if (newValue && isDismissible.value) {
    startAutoHideTimer()
  } else {
    clearAutoHideTimer()
  }
})

watch(() => syncStats.value.pendingOperations, (newValue, oldValue) => {
  // Show success message when pending operations go to zero
  if (oldValue > 0 && newValue === 0 && syncStats.value.failedOperations === 0) {
    showSuccessMessage()
  }
})

// Lifecycle
let statsUpdateInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  // Initial sync stats update
  await updateSyncStats()

  // Set up periodic sync stats updates
  statsUpdateInterval = setInterval(updateSyncStats, 10000) // Every 10 seconds
})

onUnmounted(() => {
  if (statsUpdateInterval) {
    clearInterval(statsUpdateInterval)
  }
  clearAutoHideTimer()
})
</script>

<style scoped>
/* Additional styles for better visual feedback */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
